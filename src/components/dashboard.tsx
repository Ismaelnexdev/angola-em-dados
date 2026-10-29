"use client";

import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import { useRef, useState } from "react";
import { CountryPicker } from "@/components/country-picker";
import { IndicatorChart, type ChartLine } from "@/components/indicator-chart";
import { LatestBars } from "@/components/latest-bars";
import { Sparkline } from "@/components/sparkline";
import {
  buildChartRows,
  COUNTRY_NAMES,
  latestValues,
  NEIGHBOR_STYLES,
  rankOf,
  toggleCountry,
} from "@/lib/compare";
import { formatParts, formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { COMPARISON_COUNTRIES, HOME_COUNTRY } from "@/lib/worldbank/countries";
import type { IndicatorData } from "@/lib/worldbank/load";
import { latestPoint, valuedPoints } from "@/lib/worldbank/series";
import type { Series, ValuedPoint } from "@/lib/worldbank/types";

type Period = "10" | "20" | "all";

const PERIODS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: "10", label: "10 anos" },
  { value: "20", label: "20 anos" },
  { value: "all", label: "Tudo" },
];

interface Entry {
  item: IndicatorData;
  angola: Series | null;
  latest: ValuedPoint | null;
}

function toEntry(item: IndicatorData): Entry {
  const angola =
    item.status === "ok"
      ? (item.series.find((s) => s.countryCode === HOME_COUNTRY.code) ?? null)
      : null;
  return { item, angola, latest: angola ? latestPoint(angola) : null };
}

function rankText(position: number, total: number): string {
  if (position === 1) return "Angola tem o valor mais alto";
  if (position === total) return "Angola tem o valor mais baixo";
  return `Angola tem o ${position}.º valor mais alto`;
}

interface DetailProps {
  entry: Entry;
  period: Period;
  onPeriodChange: (period: Period) => void;
  compared: readonly string[];
  onToggleCountry: (code: string) => void;
}

function Detail({
  entry,
  period,
  onPeriodChange,
  compared,
  onToggleCountry,
}: DetailProps) {
  const { indicator } = entry.item;
  const allSeries = entry.item.status === "ok" ? entry.item.series : [];
  const points = entry.angola ? valuedPoints(entry.angola) : [];

  if (points.length === 0) {
    return (
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-angola">
          {indicator.label}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {entry.item.status === "error"
            ? "Não foi possível carregar este indicador. Recarrega a página para tentar de novo."
            : "O Banco Mundial ainda não publicou dados deste indicador para Angola."}
        </p>
      </div>
    );
  }

  const lastYear = points[points.length - 1].year;
  const fromYear =
    period === "all"
      ? Number.NEGATIVE_INFINITY
      : lastYear - Number(period) + 1;
  const visible = points.filter((point) => point.year >= fromYear);
  const first = visible[0];
  const last = visible[visible.length - 1];
  const parts = formatParts(last.value, indicator.format);

  // As linhas do gráfico: Angola e os países escolhidos, pela ordem da escolha.
  const lines: ChartLine[] = [
    {
      code: HOME_COUNTRY.code,
      name: HOME_COUNTRY.name,
      color: "var(--angola)",
      home: true,
    },
    ...compared.flatMap((code, index) =>
      allSeries.some((s) => s.countryCode === code)
        ? [
            {
              code,
              name: COUNTRY_NAMES[code] ?? code,
              color: NEIGHBOR_STYLES[index].color,
              dash: NEIGHBOR_STYLES[index].dash,
              home: false,
            },
          ]
        : [],
    ),
  ];
  const chartSeries = lines.flatMap((line) => {
    const series = allSeries.find((s) => s.countryCode === line.code);
    return series ? [series] : [];
  });
  const rows = buildChartRows(chartSeries, fromYear);

  const neighborOptions = COMPARISON_COUNTRIES.filter((country) =>
    allSeries.some((s) => s.countryCode === country.code),
  );

  const latest = latestValues(allSeries);
  const rank = rankOf(HOME_COUNTRY.code, latest);
  const latestSorted = [...latest].sort((a, b) =>
    a.code === HOME_COUNTRY.code
      ? -1
      : b.code === HOME_COUNTRY.code
        ? 1
        : b.value - a.value,
  );

  return (
    <m.div
      key={indicator.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-angola sm:text-4xl">
        {indicator.label}
      </h2>
      <p className="mt-1 max-w-prose text-muted-foreground">
        {indicator.description}
      </p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-5xl font-semibold tabular-nums sm:text-6xl">
          {parts.amount}
        </span>
        {parts.unit ? (
          <span className="text-xl font-medium text-muted-foreground">
            {parts.unit}
          </span>
        ) : null}
        <span className="ml-1 tabular-nums text-muted-foreground">
          em {last.year}
        </span>
      </p>
      {first.year !== last.year ? (
        <p className="mt-2 max-w-prose tabular-nums text-muted-foreground">
          Entre {first.year} e {last.year}, passou de{" "}
          {formatValue(first.value, indicator.format)} para{" "}
          {formatValue(last.value, indicator.format)}.
        </p>
      ) : null}

      <fieldset className="mt-6 flex w-fit gap-1 rounded-lg bg-secondary p-1">
        <legend className="sr-only">Período mostrado no gráfico</legend>
        {PERIODS.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium has-[:checked]:bg-angola has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
          >
            <input
              type="radio"
              name="periodo"
              value={option.value}
              checked={period === option.value}
              onChange={() => onPeriodChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {neighborOptions.length > 0 ? (
        <CountryPicker
          options={neighborOptions}
          selected={compared}
          onToggle={onToggleCountry}
        />
      ) : null}

      <div className="mt-4">
        <IndicatorChart
          rows={rows}
          lines={lines}
          indicator={indicator}
          homeLast={last}
        />
      </div>

      {latest.length > 1 ? (
        <section className="mt-10" aria-labelledby={`barras-${indicator.slug}`}>
          <h3
            id={`barras-${indicator.slug}`}
            className="font-heading text-xl font-bold text-angola"
          >
            Como Angola se compara
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Último valor disponível de cada país.
            {rank
              ? ` ${rankText(rank.position, rank.total)} entre ${rank.total} países.`
              : ""}
          </p>
          <div className="mt-5">
            <LatestBars
              entries={latestSorted}
              homeCode={HOME_COUNTRY.code}
              format={indicator.format}
            />
          </div>
        </section>
      ) : null}

      <p className="mt-8 text-sm text-muted-foreground">
        Fonte: Banco Mundial, indicador {indicator.id}.
      </p>
    </m.div>
  );
}

interface DashboardProps {
  data: IndicatorData[];
}

export function Dashboard({ data }: DashboardProps) {
  const reduceMotion = useReducedMotion();
  const detailRef = useRef<HTMLDivElement>(null);

  const entries = data.map(toEntry);
  const firstAvailable = entries.find((entry) => entry.latest) ?? entries[0];

  const [selectedId, setSelectedId] = useState(
    firstAvailable?.item.indicator.id ?? "",
  );
  const [period, setPeriod] = useState<Period>("20");
  const [compared, setCompared] = useState<string[]>([]);

  const selected =
    entries.find((entry) => entry.item.indicator.id === selectedId) ??
    firstAvailable;
  if (!selected) return null;

  function select(id: string) {
    setSelectedId(id);
    // No telemóvel o gráfico fica por cima da lista: leva a pessoa até ele.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
          <div
            ref={detailRef}
            className="scroll-mt-4 lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1 lg:self-start"
          >
            <Detail
              entry={selected}
              period={period}
              onPeriodChange={setPeriod}
              compared={compared}
              onToggleCountry={(code) =>
                setCompared((current) => toggleCountry(current, code))
              }
            />
          </div>

          <ul className="border-t-2 border-angola lg:col-start-1 lg:row-start-1">
            {entries.map(({ item, angola, latest }) => {
              const { indicator } = item;
              const isSelected =
                indicator.id === selected.item.indicator.id;

              return (
                <li key={indicator.id} className="border-b border-border">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => select(indicator.id)}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-l-4 py-3 pr-2 pl-3 text-left focus-visible:outline-2 focus-visible:outline-ring",
                      isSelected
                        ? "border-l-ocre bg-card"
                        : "border-l-transparent hover:bg-card/60",
                    )}
                  >
                    <span>
                      <span className="flex items-baseline gap-2">
                        <span className="font-medium">{indicator.label}</span>
                        {latest ? (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            em {latest.year}
                          </span>
                        ) : null}
                      </span>
                      {latest ? (
                        <span className="block break-words text-lg font-semibold tabular-nums">
                          {formatValue(latest.value, indicator.format)}
                        </span>
                      ) : (
                        <span className="block text-sm text-muted-foreground">
                          {item.status === "error"
                            ? "Não foi possível carregar."
                            : "Sem dados publicados."}
                        </span>
                      )}
                    </span>
                    {angola ? <Sparkline series={angola} /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
