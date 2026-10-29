import { COMPARISON_COUNTRIES, HOME_COUNTRY } from "./worldbank/countries";
import { latestPoint, valuedPoints } from "./worldbank/series";
import type { Series } from "./worldbank/types";

/** Nomes dos países em português, pelo código do Banco Mundial. */
export const COUNTRY_NAMES: Readonly<Record<string, string>> =
  Object.fromEntries(
    [HOME_COUNTRY, ...COMPARISON_COUNTRIES].map((c) => [c.code, c.name]),
  );

/** Quantos países se podem juntar a Angola no gráfico. */
export const MAX_COMPARED = 3;

/** Estilos das linhas dos vizinhos. O traço diferente ajuda quem não distingue cores. */
export const NEIGHBOR_STYLES = [
  { color: "#5D7790", dash: "8 4" },
  { color: "#75828F", dash: "2 4" },
  { color: "#4F6072", dash: "10 4 2 4" },
] as const;

/** Uma linha por ano, com uma coluna por país (o código do país é a chave). */
export interface ChartRow {
  year: number;
  [countryCode: string]: number | undefined;
}

export function buildChartRows(
  seriesList: readonly Series[],
  fromYear: number,
): ChartRow[] {
  const byYear = new Map<number, ChartRow>();

  for (const series of seriesList) {
    for (const point of valuedPoints(series)) {
      if (point.year < fromYear) continue;
      let row = byYear.get(point.year);
      if (!row) {
        row = { year: point.year };
        byYear.set(point.year, row);
      }
      row[series.countryCode] = point.value;
    }
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export interface LatestEntry {
  code: string;
  name: string;
  year: number;
  value: number;
}

/** O valor mais recente de cada país (cada um pode ser de um ano diferente). */
export function latestValues(seriesList: readonly Series[]): LatestEntry[] {
  return seriesList.flatMap((series) => {
    const latest = latestPoint(series);
    return latest
      ? [
          {
            code: series.countryCode,
            name: COUNTRY_NAMES[series.countryCode] ?? series.countryName,
            year: latest.year,
            value: latest.value,
          },
        ]
      : [];
  });
}

/** Posição de um país (1 = valor mais alto) entre os que têm dados. */
export function rankOf(
  code: string,
  entries: readonly LatestEntry[],
): { position: number; total: number } | null {
  const mine = entries.find((entry) => entry.code === code);
  if (!mine) return null;
  const position = entries.filter((entry) => entry.value > mine.value).length + 1;
  return { position, total: entries.length };
}

/** Posição e tamanho de cada barra, em percentagem, com a linha do zero. */
export interface BarBox {
  /** Onde a barra começa. */
  left: number;
  width: number;
  /** Onde está o zero, para a barra crescer a partir dele. */
  origin: number;
}

export function barBoxes(values: readonly number[]): BarBox[] {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min;
  if (range === 0) return values.map(() => ({ left: 0, width: 0, origin: 0 }));

  // (0 - min) em vez de -min, para não dar -0 quando min é 0
  const origin = ((0 - min) / range) * 100;
  return values.map((value) => {
    const width = (Math.abs(value) / range) * 100;
    return { left: value >= 0 ? origin : origin - width, width, origin };
  });
}

/** Junta ou tira um país da comparação, respeitando o máximo. */
export function toggleCountry(
  selected: readonly string[],
  code: string,
): string[] {
  if (selected.includes(code)) return selected.filter((c) => c !== code);
  return selected.length >= MAX_COMPARED ? [...selected] : [...selected, code];
}
