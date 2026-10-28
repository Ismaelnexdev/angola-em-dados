import type { Series, ValuedPoint } from "./types";

/** Só os pontos que têm valor. */
export function valuedPoints(series: Series): ValuedPoint[] {
  return series.points.flatMap((point) =>
    point.value === null ? [] : [{ year: point.year, value: point.value }],
  );
}

/** O ponto mais recente com valor (os últimos anos costumam vir vazios). */
export function latestPoint(series: Series): ValuedPoint | null {
  const points = valuedPoints(series);
  return points.length > 0 ? points[points.length - 1] : null;
}