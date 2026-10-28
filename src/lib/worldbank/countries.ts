export interface CountryOption {
  /** Código ISO de 3 letras, o que o Banco Mundial usa. */
  code: string;
  name: string;
}

export const HOME_COUNTRY: CountryOption = { code: "AGO", name: "Angola" };

/** Países com que Angola pode ser comparada. */
export const COMPARISON_COUNTRIES: readonly CountryOption[] = [
  { code: "NGA", name: "Nigéria" },
  { code: "ZAF", name: "África do Sul" },
  { code: "MOZ", name: "Moçambique" },
  { code: "NAM", name: "Namíbia" },
  { code: "ZMB", name: "Zâmbia" },
  { code: "COD", name: "RD Congo" },
];