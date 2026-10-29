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
import { formatAxisTick, formatValue } from "@/lib/format";
import type { IndicatorConfig, ValueFormat } from "@/lib/worldbank/indicators";
import type { ValuedPoint } from "@/lib/worldbank/types";

interface ChartTipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: string | number;
  format: ValueFormat;
}

function ChartTip({ active, payload, label, format }: ChartTipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  if (typeof value !== "number") return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="tabular-nums text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{formatValue(value, format)}</p>
    </div>
  );
}

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

interface IndicatorChartProps {
  points: ValuedPoint[];
  indicator: IndicatorConfig;
}

export function IndicatorChart({ points, indicator }: IndicatorChartProps) {
  const reduceMotion = useReducedMotion();
  if (points.length === 0) return null;

  const last = points[points.length - 1];

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 640, height: 320 }}
      >
        <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
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
            content={<ChartTip format={indicator.format} />}
            cursor={{ stroke: "var(--ocre)", strokeWidth: 1.5 }}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--angola)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--ocre)",
              stroke: "var(--angola)",
              strokeWidth: 2,
            }}
            isAnimationActive={!reduceMotion}
          />
          <ReferenceDot
            x={last.year}
            y={last.value}
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