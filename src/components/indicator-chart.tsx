"use client";

import { useReducedMotion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "@/lib/compare";
import { formatAxisTick, formatValue } from "@/lib/format";
import type { IndicatorConfig, ValueFormat } from "@/lib/worldbank/indicators";
import type { ValuedPoint } from "@/lib/worldbank/types";

/** Uma linha do gráfico: um país. */
export interface ChartLine {
  code: string;
  name: string;
  color: string;
  dash?: string;
  /** Angola: a linha em destaque. */
  home: boolean;
}

interface ChartTipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>;
  label?: string | number;
  format: ValueFormat;
  lines: readonly ChartLine[];
}

function ChartTip({ active, payload, label, format, lines }: ChartTipProps) {
  if (!active || !payload) return null;

  const rows = lines.flatMap((line) => {
    const item = payload.find((entry) => entry.dataKey === line.code);
    return item && typeof item.value === "number"
      ? [{ line, value: item.value }]
      : [];
  });
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="tabular-nums text-muted-foreground">{label}</p>
      <ul className="mt-1 grid gap-1">
        {rows.map(({ line, value }) => (
          <li key={line.code} className="flex items-center gap-2">
            <svg aria-hidden width="18" height="6" viewBox="0 0 18 6">
              <line
                x1="0"
                y1="3"
                x2="18"
                y2="3"
                stroke={line.color}
                strokeWidth="2"
                strokeDasharray={line.dash}
              />
            </svg>
            <span>{line.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">
              {formatValue(value, format)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

interface IndicatorChartProps {
  rows: ChartRow[];
  lines: readonly ChartLine[];
  indicator: IndicatorConfig;
  /** O último valor de Angola, marcado com um ponto. */
  homeLast: ValuedPoint;
}

export function IndicatorChart({
  rows,
  lines,
  indicator,
  homeLast,
}: IndicatorChartProps) {
  const reduceMotion = useReducedMotion();
  if (rows.length === 0) return null;

  // Angola desenha-se por último, para ficar por cima dos vizinhos.
  const drawOrder = [...lines].reverse();

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: 320 }}
      >
        <LineChart data={rows} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="year"
            type="number"
            domain={["dataMin", "dataMax"]}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={tick}
            tickMargin={8}
          />
          <YAxis
            width={68}
            domain={["auto", "auto"]}
            tickLine={false}
            axisLine={false}
            tick={tick}
            tickFormatter={(value: number) =>
              formatAxisTick(value, indicator.format)
            }
          />
          <Tooltip
            content={
              <ChartTip format={indicator.format} lines={lines} />
            }
            cursor={{ stroke: "var(--ocre)", strokeWidth: 1.5 }}
          />
          {drawOrder.map((line) => (
            <Line
              key={line.code}
              type="linear"
              dataKey={line.code}
              stroke={line.color}
              strokeWidth={line.home ? 2.75 : 2}
              strokeDasharray={line.dash}
              dot={false}
              activeDot={
                line.home
                  ? {
                      r: 5,
                      fill: "var(--ocre)",
                      stroke: "var(--angola)",
                      strokeWidth: 2,
                    }
                  : { r: 4, fill: line.color, stroke: "none" }
              }
              isAnimationActive={!reduceMotion}
            />
          ))}
          <ReferenceDot
            x={homeLast.year}
            y={homeLast.value}
            r={5}
            fill="var(--ocre)"
            stroke="var(--angola)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
