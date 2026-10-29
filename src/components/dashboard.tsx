"use client";

import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import { useRef, useState } from "react";
import { IndicatorChart } from "@/components/indicator-chart";
import { Sparkline } from "@/components/sparkline";
import { formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HOME_COUNTRY } from "@/lib/worldbank/countries";
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

interface DetailProps {
  entry: Entry;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

function Detail({ entry, period, onPeriodChange }: DetailProps) {
  const { indicator } = entry.item;
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
  const visible =
    period === "all"
      ? points
      : points.filter((point) => point.year > lastYear - Number(period));
  const first = visible[0];
  const last = visible[visible.length - 1];

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

      <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-heading text-4xl font-semibold tabular-nums sm:text-5xl">
          {formatValue(last.value, indicator.format)}
        </span>
        <span className="tabular-nums text-muted-foreground">em {last.year}</span>
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

      <div className="mt-4">
        <IndicatorChart points={visible} indicator={indicator} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
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
                      <span className="block font-medium">
                        {indicator.label}
                      </span>
                      {latest ? (
                        <span className="block tabular-nums">
                          <span className="text-lg font-semibold">
                            {formatValue(latest.value, indicator.format)}
                          </span>{" "}
                          <span className="text-sm text-muted-foreground">
                            em {latest.year}
                          </span>
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