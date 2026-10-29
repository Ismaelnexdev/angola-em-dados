import { fetchIndicator } from "./client";
import { COMPARISON_COUNTRIES, HOME_COUNTRY } from "./countries";
import { INDICATORS, type IndicatorConfig } from "./indicators";
import type { Series } from "./types";

/** O que a interface recebe para cada indicador. */
export type IndicatorData =
  | { status: "ok"; indicator: IndicatorConfig; series: Series[] }
  | { status: "error"; indicator: IndicatorConfig };

const hasHomeCountry = (series: Series[]) =>
  series.some((s) => s.countryCode === HOME_COUNTRY.code);

/**
 * Carrega Angola e os países de comparação num só pedido.
 * Se esse pedido falhar, tenta só Angola, para o painel continuar útil.
 */
export async function loadIndicator(
  indicator: IndicatorConfig,
): Promise<IndicatorData> {
  const everyone = [
    HOME_COUNTRY.code,
    ...COMPARISON_COUNTRIES.map((country) => country.code),
  ];

  for (const codes of [everyone, [HOME_COUNTRY.code]]) {
    try {
      const series = await fetchIndicator(indicator.id, codes);
      if (hasHomeCountry(series)) return { status: "ok", indicator, series };
    } catch {
      // tenta a alternativa seguinte
    }
  }
  return { status: "error", indicator };
}

export function loadDashboardData(): Promise<IndicatorData[]> {
  return Promise.all(INDICATORS.map(loadIndicator));
}