"use client";

import { Line, LineChart, ReferenceDot, XAxis, YAxis } from "recharts";
import { valuedPoints } from "@/lib/worldbank/series";
import type { Series } from "@/lib/worldbank/types";

const WIDTH = 104;
const HEIGHT = 36;
const YEARS_SHOWN = 15;

interface SparklineProps {
  series: Series;
}

/** Mini-linha da evolução recente. É decorativa: o valor já está escrito ao lado. */
export function Sparkline({ series }: SparklineProps) {
  const data = valuedPoints(series).slice(-YEARS_SHOWN);
  if (data.length < 2) return null;

  const last = data[data.length - 1];

  return (
    <span aria-hidden className="block shrink-0">
      <LineChart
        width={WIDTH}
        height={HEIGHT}
        data={data}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        accessibilityLayer={false}
      >
        <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} hide />
        <YAxis domain={["dataMin", "dataMax"]} hide />
        <Line
          type="linear"
          dataKey="value"
          stroke="var(--angola)"
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
        />
        <ReferenceDot
          x={last.year}
          y={last.value}
          r={3}
          fill="var(--ocre)"
          stroke="none"
        />
      </LineChart>
    </span>
  );
}