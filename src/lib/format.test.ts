import { describe, expect, it } from "vitest";
import { formatAxisTick, formatValue } from "./format";

/** Troca os espaços inseparáveis por espaços normais, para o teste ser legível. */
const plain = (text: string) => text.replace(/\u00A0/g, " ");

describe("formatValue", () => {
  it("escreve percentagens com uma casa decimal", () => {
    expect(plain(formatValue(20.162, "percent"))).toBe("20,2 %");
    expect(plain(formatValue(3.134, "percent"))).toBe("3,1 %");
  });

  it("escreve a esperança de vida em anos", () => {
    expect(plain(formatValue(64.805, "years"))).toBe("64,8 anos");
  });

  it("usa mil milhões e biliões como em português europeu", () => {
    expect(plain(formatValue(122_174_889_423, "usd"))).toBe(
      "122,2 mil milhões de US$",
    );
    expect(plain(formatValue(2.5e12, "usd"))).toBe("2,50 biliões de US$");
  });

  it("escreve valores em dólares mais pequenos", () => {
    expect(plain(formatValue(4_500_000, "usd"))).toBe("4,5 milhões de US$");
    expect(plain(formatValue(3129.477, "usd"))).toBe("3 129 US$");
  });

  it("escreve a população em milhões", () => {
    expect(plain(formatValue(39_040_039, "number"))).toBe("39,0 milhões");
    expect(plain(formatValue(850_000, "number"))).toBe("850 000");
  });

  it("usa o sinal de menos tipográfico e evita -0", () => {
    expect(plain(formatValue(-2.4, "percent"))).toBe("−2,4 %");
    expect(plain(formatValue(-0.04, "percent"))).toBe("0,0 %");
  });
});

describe("formatAxisTick", () => {
  it("encurta os números dos eixos", () => {
    expect(plain(formatAxisTick(100_000_000_000, "usd"))).toBe("100 mil M");
    expect(plain(formatAxisTick(2_500_000, "usd"))).toBe("2,5 M");
    expect(plain(formatAxisTick(30_000_000, "number"))).toBe("30 M");
    expect(plain(formatAxisTick(15_000, "number"))).toBe("15 mil");
    expect(plain(formatAxisTick(12.5, "percent"))).toBe("12,5 %");
    expect(plain(formatAxisTick(60, "years"))).toBe("60");
  });
});