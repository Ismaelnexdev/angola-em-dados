import { describe, expect, it, vi } from "vitest";
import { fetchIndicator, parseResponse, WorldBankError } from "./client";

const INDICATOR = "SP.POP.TOTL";
const META = { page: 1, pages: 1, per_page: 2000, total: 3 };

/** Uma linha no formato real da API do Banco Mundial. */
function row(code: string, name: string, year: number, value: unknown) {
  return {
    indicator: { id: INDICATOR, value: "População" },
    country: { id: code.slice(0, 2), value: name },
    countryiso3code: code,
    date: String(year),
    value,
  };
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("parseResponse", () => {
  it("ordena os pontos do mais antigo para o mais recente", () => {
    const payload = [
      META,
      [
        row("AGO", "Angola", 2024, 3),
        row("AGO", "Angola", 2022, 1),
        row("AGO", "Angola", 2023, 2),
      ],
    ];
    const [series] = parseResponse(payload, INDICATOR);

    expect(series.points.map((p) => p.year)).toEqual([2022, 2023, 2024]);
    expect(series.indicatorId).toBe(INDICATOR);
    expect(series.countryName).toBe("Angola");
  });

  it("mantém os anos sem dados como null", () => {
    const payload = [
      META,
      [row("AGO", "Angola", 2025, null), row("AGO", "Angola", 2024, 40.7)],
    ];
    const [series] = parseResponse(payload, INDICATOR);

    expect(series.points).toEqual([
      { year: 2024, value: 40.7 },
      { year: 2025, value: null },
    ]);
  });

  it("separa os países", () => {
    const payload = [
      META,
      [
        row("AGO", "Angola", 2024, 1),
        row("NGA", "Nigéria", 2024, 2),
        row("AGO", "Angola", 2023, 3),
      ],
    ];
    const result = parseResponse(payload, INDICATOR);

    expect(result.map((s) => s.countryCode)).toEqual(["AGO", "NGA"]);
    expect(result[0].points).toHaveLength(2);
    expect(result[1].points).toHaveLength(1);
  });

  it("devolve uma lista vazia quando o Banco Mundial não tem dados", () => {
    expect(parseResponse([META, null], INDICATOR)).toEqual([]);
  });

  it("rejeita pedidos inválidos", () => {
    const invalid = [
      { message: [{ id: "120", key: "Invalid value", value: "inválido" }] },
    ];
    expect(() => parseResponse(invalid, INDICATOR)).toThrow(WorldBankError);
  });

  it("rejeita formatos inesperados", () => {
    expect(() => parseResponse("olá", INDICATOR)).toThrow(WorldBankError);
    expect(() => parseResponse({}, INDICATOR)).toThrow(WorldBankError);
    expect(() => parseResponse([META, "lixo"], INDICATOR)).toThrow(
      WorldBankError,
    );
  });

  it("ignora linhas mal formadas", () => {
    const payload = [
      META,
      [
        null,
        "texto",
        { date: "2020" },
        { ...row("AGO", "Angola", 2020, 1), date: "abc" },
        row("AGO", "Angola", 2021, 5),
      ],
    ];
    const result = parseResponse(payload, INDICATOR);

    expect(result).toHaveLength(1);
    expect(result[0].points).toEqual([{ year: 2021, value: 5 }]);
  });

  it("trata valores que não são números como sem dados", () => {
    const payload = [
      META,
      [
        row("AGO", "Angola", 2023, "abc"),
        row("AGO", "Angola", 2022, Number.NaN),
      ],
    ];
    const [series] = parseResponse(payload, INDICATOR);

    expect(series.points).toEqual([
      { year: 2022, value: null },
      { year: 2023, value: null },
    ]);
  });
});

describe("fetchIndicator", () => {
  const okBody = [META, [row("AGO", "Angola", 2024, 39_000_000)]];
  const options = (fetchImpl: typeof fetch) => ({
    fetchImpl,
    retryDelayMs: 0,
  });

  it("rejeita indicadores inválidos sem chamar a rede", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      fetchIndicator("../x?y=1", ["AGO"], options(fetchImpl)),
    ).rejects.toThrow(WorldBankError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejeita códigos de país inválidos sem chamar a rede", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    for (const countries of [[], ["AG"], ["AGO;NGA"], ["../.."]]) {
      await expect(
        fetchIndicator(INDICATOR, countries, options(fetchImpl)),
      ).rejects.toThrow(WorldBankError);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("monta o endereço com os países em maiúsculas, separados por ;", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(okBody));

    const result = await fetchIndicator(
      INDICATOR,
      ["ago", "nga"],
      options(fetchImpl),
    );

    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      `/country/AGO;NGA/indicator/${INDICATOR}?format=json`,
    );
    expect(result[0].points[0].value).toBe(39_000_000);
  });

  it("tenta de novo depois de uma falha de rede", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(okBody));

    const result = await fetchIndicator(INDICATOR, ["AGO"], options(fetchImpl));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it("tenta de novo depois de um erro do servidor (503)", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("indisponível", { status: 503 }))
      .mockResolvedValueOnce(jsonResponse(okBody));

    const result = await fetchIndicator(INDICATOR, ["AGO"], options(fetchImpl));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it("desiste ao fim de 3 tentativas", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      fetchIndicator(INDICATOR, ["AGO"], options(fetchImpl)),
    ).rejects.toThrow(WorldBankError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("não repete pedidos que o servidor rejeitou (404)", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({}, 404));

    await expect(
      fetchIndicator(INDICATOR, ["AGO"], options(fetchImpl)),
    ).rejects.toThrow(/404/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejeita uma resposta que não é JSON", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("<html>erro</html>", { status: 200 }));

    await expect(
      fetchIndicator(INDICATOR, ["AGO"], options(fetchImpl)),
    ).rejects.toThrow(WorldBankError);
  });
});