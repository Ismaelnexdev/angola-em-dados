import type { Series } from "./types";

const BASE_URL = "https://api.worldbank.org/v2";
const FIRST_YEAR = 1990;
const REVALIDATE_SECONDS = 60 * 60 * 24; // 24 horas
const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 600;

const COUNTRY_CODE = /^[A-Za-z]{3}$/;
const INDICATOR_CODE = /^[A-Za-z0-9._]+$/;

export class WorldBankError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WorldBankError";
  }
}

export interface FetchOptions {
  /** Permite substituir o `fetch` (útil nos testes). */
  fetchImpl?: typeof fetch;
  /** Pausa base entre tentativas, em milissegundos. */
  retryDelayMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const shouldRetry = (status: number) => status === 429 || status >= 500;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Transforma a resposta da API em séries, uma por país.
 * A API devolve `[meta, linhas]`; sem dados, `linhas` vem a `null`;
 * com um pedido inválido, `meta` traz uma `message`.
 */
export function parseResponse(payload: unknown, indicatorId: string): Series[] {
  if (!Array.isArray(payload)) {
    throw new WorldBankError("Resposta inesperada do Banco Mundial.");
  }

  const [meta, rows] = payload;

  if (isRecord(meta) && "message" in meta) {
    throw new WorldBankError(
      "O Banco Mundial rejeitou o pedido (indicador ou país inválido).",
    );
  }
  if (rows === null || rows === undefined) return [];
  if (!Array.isArray(rows)) {
    throw new WorldBankError("Resposta inesperada do Banco Mundial.");
  }

  const byCountry = new Map<string, Series>();

  for (const row of rows) {
    if (!isRecord(row) || !isRecord(row.country)) continue;

    const year = Number(row.date);
    if (!Number.isInteger(year)) continue;

    const code = String(row.countryiso3code || row.country.id);
    const value =
      typeof row.value === "number" && Number.isFinite(row.value)
        ? row.value
        : null;

    let series = byCountry.get(code);
    if (!series) {
      series = {
        indicatorId,
        countryCode: code,
        countryName: String(row.country.value),
        points: [],
      };
      byCountry.set(code, series);
    }
    series.points.push({ year, value });
  }

  const result = [...byCountry.values()];
  for (const series of result) {
    series.points.sort((a, b) => a.year - b.year);
  }
  return result;
}

/**
 * Faz o pedido com novas tentativas para falhas de ligação,
 * tempo esgotado, limite de pedidos (429) e erros do servidor (5xx).
 */
async function requestWithRetry(
  url: string,
  { fetchImpl = fetch, retryDelayMs = DEFAULT_RETRY_DELAY_MS }: FetchOptions,
): Promise<Response> {
  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetchImpl(url, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!shouldRetry(response.status)) return response;
      lastResponse = response;
      lastError = undefined;
    } catch (error) {
      lastError = error;
      lastResponse = undefined;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs * attempt);
  }

  if (lastResponse) return lastResponse;
  throw new WorldBankError("Não foi possível contactar o Banco Mundial.", {
    cause: lastError,
  });
}

/** Vai buscar um indicador para um ou mais países (por defeito, Angola). */
export async function fetchIndicator(
  indicatorId: string,
  countryCodes: readonly string[] = ["AGO"],
  options: FetchOptions = {},
): Promise<Series[]> {
  if (!INDICATOR_CODE.test(indicatorId)) {
    throw new WorldBankError(`Indicador inválido: ${indicatorId}`);
  }
  if (
    countryCodes.length === 0 ||
    !countryCodes.every((code) => COUNTRY_CODE.test(code))
  ) {
    throw new WorldBankError("Código de país inválido.");
  }

  const countries = countryCodes.map((code) => code.toUpperCase()).join(";");
  const lastYear = new Date().getFullYear();
  const url =
    `${BASE_URL}/country/${countries}/indicator/${indicatorId}` +
    `?format=json&per_page=2000&date=${FIRST_YEAR}:${lastYear}`;

  const response = await requestWithRetry(url, options);

  if (!response.ok) {
    throw new WorldBankError(
      `O Banco Mundial respondeu com o estado ${response.status}.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new WorldBankError("Resposta inválida do Banco Mundial.", {
      cause: error,
    });
  }

  return parseResponse(payload, indicatorId);
}