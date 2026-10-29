"use client";

import { m, useReducedMotion } from "motion/react";
import { barBoxes, type LatestEntry } from "@/lib/compare";
import { formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ValueFormat } from "@/lib/worldbank/indicators";

interface LatestBarsProps {
  entries: readonly LatestEntry[];
  homeCode: string;
  format: ValueFormat;
}

/** Uma barra por país com o valor mais recente. As barras crescem a partir do zero. */
export function LatestBars({ entries, homeCode, format }: LatestBarsProps) {
  const reduceMotion = useReducedMotion();
  const boxes = barBoxes(entries.map((entry) => entry.value));

  return (
    <ul className="grid gap-4">
      {entries.map((entry, index) => {
        const isHome = entry.code === homeCode;
        const box = boxes[index];

        return (
          <li key={entry.code}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn("font-medium", isHome && "text-angola")}>
                {entry.name}
              </span>
              <span className="text-right tabular-nums">
                <span className={cn(isHome && "font-semibold")}>
                  {formatValue(entry.value, format)}
                </span>{" "}
                <span className="text-sm text-muted-foreground">
                  em {entry.year}
                </span>
              </span>
            </div>
            <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
              <m.div
                className={cn(
                  "absolute inset-y-0 rounded-full",
                  isHome ? "bg-angola" : "bg-vizinhos",
                )}
                initial={{ left: `${box.origin}%`, width: "0%" }}
                animate={{ left: `${box.left}%`, width: `${box.width}%` }}
                transition={{
                  duration: reduceMotion ? 0 : 0.5,
                  ease: "easeOut",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
