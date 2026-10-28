/** Um valor de um indicador num ano. `null` quando o Banco Mundial ainda não tem o dado. */
export interface DataPoint {
  year: number;
  value: number | null;
}

/** A evolução de um indicador num país. */
export interface Series {
  indicatorId: string;
  countryCode: string;
  countryName: string;
  /** Do ano mais antigo para o mais recente. */
  points: DataPoint[];
}

/** Um ponto que tem mesmo valor. */
export interface ValuedPoint {
  year: number;
  value: number;
}