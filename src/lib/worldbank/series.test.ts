import { describe, expect, it } from "vitest";
import { latestPoint, valuedPoints } from "./series";
import type { Series } from "./types";

const series = (points: Series["points"]): Series => ({
  indicatorId: "IT.NET.USER.ZS",
  countryCode: "AGO",
  countryName: "Angola",
  points,
});

describe("valuedPoints", () => {
  it("remove os anos sem valor", () => {
    const s = series([
      { year: 2023, value: 37.9 },
      { year: 2024, value: null },
      { year: 2025, value: 40.7 },
    ]);

    expect(valuedPoints(s)).toEqual([
      { year: 2023, value: 37.9 },
      { year: 2025, value: 40.7 },
    ]);
  });
});

describe("latestPoint", () => {
  it("devolve o ano mais recente que tem valor", () => {
    const s = series([
      { year: 2023, value: 37.9 },
      { year: 2024, value: 40.7 },
      { year: 2025, value: null },
    ]);

    expect(latestPoint(s)).toEqual({ year: 2024, value: 40.7 });
  });

  it("devolve null quando não há nenhum valor", () => {
    expect(latestPoint(series([{ year: 2025, value: null }]))).toBeNull();
    expect(latestPoint(series([]))).toBeNull();
  });
});
