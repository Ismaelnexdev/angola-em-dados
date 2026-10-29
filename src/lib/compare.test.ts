import { describe, expect, it } from "vitest";
import {
  barBoxes,
  buildChartRows,
  latestValues,
  MAX_COMPARED,
  rankOf,
  toggleCountry,
} from "./compare";
import type { Series } from "./worldbank/types";

const series = (
  countryCode: string,
  points: Series["points"],
  countryName = countryCode,
): Series => ({ indicatorId: "X", countryCode, countryName, points });

describe("buildChartRows", () => {
  it("junta os países por ano, ordenado", () => {
    const rows = buildChartRows(
      [
        series("AGO", [
          { year: 2023, value: 2 },
          { year: 2022, value: 1 },
        ]),
        series("NGA", [{ year: 2023, value: 20 }]),
      ],
      0,
    );

    expect(rows).toEqual([
      { year: 2022, AGO: 1 },
      { year: 2023, AGO: 2, NGA: 20 },
    ]);
  });

  it("ignora anos sem valor e anos antes do início", () => {
    const rows = buildChartRows(
      [
        series("AGO", [
          { year: 2010, value: 5 },
          { year: 2020, value: null },
          { year: 2021, value: 7 },
        ]),
      ],
      2015,
    );

    expect(rows).toEqual([{ year: 2021, AGO: 7 }]);
  });

  it("devolve uma lista vazia sem séries", () => {
    expect(buildChartRows([], 0)).toEqual([]);
  });
});

describe("latestValues", () => {
  it("usa o último ano com valor de cada país e os nomes em português", () => {
    const entries = latestValues([
      series("AGO", [
        { year: 2024, value: 40.7 },
        { year: 2025, value: null },
      ]),
      series("NGA", [{ year: 2025, value: 45 }], "Nigeria"),
      series("ZAF", [{ year: 2025, value: null }]),
    ]);

    expect(entries).toEqual([
      { code: "AGO", name: "Angola", year: 2024, value: 40.7 },
      { code: "NGA", name: "Nigéria", year: 2025, value: 45 },
    ]);
  });
});

describe("rankOf", () => {
  const entries = [
    { code: "AGO", name: "Angola", year: 2024, value: 30 },
    { code: "NGA", name: "Nigéria", year: 2024, value: 50 },
    { code: "ZAF", name: "África do Sul", year: 2024, value: 10 },
  ];

  it("dá a posição pelo valor mais alto", () => {
    expect(rankOf("NGA", entries)).toEqual({ position: 1, total: 3 });
    expect(rankOf("AGO", entries)).toEqual({ position: 2, total: 3 });
    expect(rankOf("ZAF", entries)).toEqual({ position: 3, total: 3 });
  });

  it("devolve null para um país sem dados", () => {
    expect(rankOf("MOZ", entries)).toBeNull();
  });

  it("dá a mesma posição a valores iguais", () => {
    const tied = [
      { code: "A", name: "A", year: 1, value: 5 },
      { code: "B", name: "B", year: 1, value: 5 },
    ];
    expect(rankOf("A", tied)?.position).toBe(1);
    expect(rankOf("B", tied)?.position).toBe(1);
  });
});

describe("barBoxes", () => {
  it("começa no zero quando todos os valores são positivos", () => {
    const [a, b] = barBoxes([50, 100]);
    expect(a).toEqual({ left: 0, width: 50, origin: 0 });
    expect(b).toEqual({ left: 0, width: 100, origin: 0 });
  });

  it("põe os valores negativos à esquerda do zero", () => {
    const [positive, negative] = barBoxes([3, -2]);
    expect(positive).toEqual({ left: 40, width: 60, origin: 40 });
    expect(negative).toEqual({ left: 0, width: 40, origin: 40 });
  });

  it("não parte quando tudo é zero ou não há valores", () => {
    expect(barBoxes([0, 0])).toEqual([
      { left: 0, width: 0, origin: 0 },
      { left: 0, width: 0, origin: 0 },
    ]);
    expect(barBoxes([])).toEqual([]);
  });
});

describe("toggleCountry", () => {
  it("junta e tira países", () => {
    expect(toggleCountry([], "NGA")).toEqual(["NGA"]);
    expect(toggleCountry(["NGA", "ZAF"], "NGA")).toEqual(["ZAF"]);
  });

  it("não passa do máximo", () => {
    const full = ["NGA", "ZAF", "MOZ"];
    expect(full).toHaveLength(MAX_COMPARED);
    expect(toggleCountry(full, "NAM")).toEqual(full);
  });
});
