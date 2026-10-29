import type { ValueFormat } from "@/lib/worldbank/indicators";

const NBSP = "\u00A0";

/** Formato fixo (igual no servidor e no navegador): 1234.5 → "1 234,5". */
function decimal(value: number, digits: number): string {
  const text = Math.abs(value).toFixed(digits);
  const [integer, fraction] = text.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const sign = value < 0 && Number(text) !== 0 ? "−" : "";
  return `${sign}${grouped}${fraction ? `,${fraction}` : ""}`;
}

/** Sem casas decimais quando o número é inteiro, com uma quando não é. */
function trimmed(value: number): string {
  return decimal(value, Math.abs(value % 1) < 1e-9 ? 0 : 1);
}

/** Um valor dividido em número e unidade, para se poderem desenhar de forma diferente. */
export interface ValueParts {
  amount: string;
  /** Vazio quando o valor não tem unidade. */
  unit: string;
}

/**
 * Divide um valor em número e unidade, em português.
 * Dentro da unidade os espaços são inseparáveis, menos antes de "de",
 * para o texto poder passar à linha seguinte sem cortar "mil milhões".
 */
export function formatParts(value: number, format: ValueFormat): ValueParts {
  const abs = Math.abs(value);

  switch (format) {
    case "percent":
      return { amount: decimal(value, 1), unit: "%" };
    case "years":
      return { amount: decimal(value, 1), unit: "anos" };
    case "usd":
      if (abs >= 1e12) {
        return { amount: decimal(value / 1e12, 2), unit: `biliões de${NBSP}US$` };
      }
      if (abs >= 1e9) {
        return {
          amount: decimal(value / 1e9, 1),
          unit: `mil${NBSP}milhões de${NBSP}US$`,
        };
      }
      if (abs >= 1e6) {
        return { amount: decimal(value / 1e6, 1), unit: `milhões de${NBSP}US$` };
      }
      return { amount: decimal(value, 0), unit: "US$" };
    case "number":
      return abs >= 1e6
        ? { amount: decimal(value / 1e6, 1), unit: "milhões" }
        : { amount: decimal(value, 0), unit: "" };
  }
}

/** Escreve um valor de acordo com o tipo de indicador, em português. */
export function formatValue(value: number, format: ValueFormat): string {
  const { amount, unit } = formatParts(value, format);
  return unit ? `${amount}${NBSP}${unit}` : amount;
}

/** Versão curta, para os números dos eixos dos gráficos. */
export function formatAxisTick(value: number, format: ValueFormat): string {
  const abs = Math.abs(value);

  switch (format) {
    case "percent":
      return `${trimmed(value)}${NBSP}%`;
    case "years":
      return trimmed(value);
    case "usd":
      if (abs >= 1e12) return `${trimmed(value / 1e12)}${NBSP}bi`;
      if (abs >= 1e9) return `${trimmed(value / 1e9)}${NBSP}mil${NBSP}M`;
      if (abs >= 1e6) return `${trimmed(value / 1e6)}${NBSP}M`;
      return trimmed(value);
    case "number":
      if (abs >= 1e6) return `${trimmed(value / 1e6)}${NBSP}M`;
      if (abs >= 1e3) return `${trimmed(value / 1e3)}${NBSP}mil`;
      return trimmed(value);
  }
}
