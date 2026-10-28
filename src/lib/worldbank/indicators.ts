export type ValueFormat = "usd" | "percent" | "number" | "years";

export interface IndicatorConfig {
  /** Código do indicador no Banco Mundial. */
  id: string;
  /** Nome curto, para endereços e identificadores. */
  slug: string;
  label: string;
  description: string;
  format: ValueFormat;
  /** Se um valor mais alto é melhor ("up"), pior ("down") ou se não se aplica. */
  betterWhen: "up" | "down" | "neutral";
}

export const INDICATORS: readonly IndicatorConfig[] = [
  {
    id: "NY.GDP.MKTP.CD",
    slug: "pib",
    label: "PIB",
    description: "Valor de tudo o que o país produz num ano, em dólares correntes.",
    format: "usd",
    betterWhen: "up",
  },
  {
    id: "NY.GDP.MKTP.KD.ZG",
    slug: "crescimento-pib",
    label: "Crescimento do PIB",
    description: "Variação anual do PIB, em termos reais.",
    format: "percent",
    betterWhen: "up",
  },
  {
    id: "NY.GDP.PCAP.CD",
    slug: "pib-per-capita",
    label: "PIB per capita",
    description: "PIB a dividir pela população, em dólares correntes.",
    format: "usd",
    betterWhen: "up",
  },
  {
    id: "FP.CPI.TOTL.ZG",
    slug: "inflacao",
    label: "Inflação",
    description: "Variação anual dos preços no consumidor.",
    format: "percent",
    betterWhen: "down",
  },
  {
    id: "SP.POP.TOTL",
    slug: "populacao",
    label: "População",
    description: "Número total de habitantes.",
    format: "number",
    betterWhen: "neutral",
  },
  {
    id: "SP.DYN.LE00.IN",
    slug: "esperanca-de-vida",
    label: "Esperança de vida",
    description: "Anos que, em média, uma pessoa vive ao nascer.",
    format: "years",
    betterWhen: "up",
  },
  {
    id: "SL.UEM.TOTL.ZS",
    slug: "desemprego",
    label: "Desemprego",
    description: "Percentagem da população ativa sem trabalho (estimativa da OIT).",
    format: "percent",
    betterWhen: "down",
  },
  {
    id: "EG.ELC.ACCS.ZS",
    slug: "eletricidade",
    label: "Acesso à eletricidade",
    description: "Percentagem da população com acesso à eletricidade.",
    format: "percent",
    betterWhen: "up",
  },
  {
    id: "IT.NET.USER.ZS",
    slug: "internet",
    label: "Utilizadores de internet",
    description: "Percentagem da população que usa a internet.",
    format: "percent",
    betterWhen: "up",
  },
];