"use client";

import { MAX_COMPARED, NEIGHBOR_STYLES } from "@/lib/compare";
import type { CountryOption } from "@/lib/worldbank/countries";
import { cn } from "@/lib/utils";

interface CountryPickerProps {
  options: readonly CountryOption[];
  /** Códigos dos países escolhidos, pela ordem em que foram escolhidos. */
  selected: readonly string[];
  onToggle: (code: string) => void;
}

export function CountryPicker({ options, selected, onToggle }: CountryPickerProps) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-2 text-sm text-muted-foreground">
        Comparar Angola com (até {MAX_COMPARED} países)
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const index = selected.indexOf(option.code);
          const checked = index >= 0;
          const disabled = !checked && selected.length >= MAX_COMPARED;
          const style = checked ? NEIGHBOR_STYLES[index] : null;

          return (
            <label
              key={option.code}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium",
                "has-[:checked]:border-angola has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.code)}
              />
              <svg aria-hidden width="22" height="8" viewBox="0 0 22 8">
                <line
                  x1="0"
                  y1="4"
                  x2="22"
                  y2="4"
                  stroke={style ? style.color : "var(--input)"}
                  strokeWidth="2"
                  strokeDasharray={style ? style.dash : undefined}
                />
              </svg>
              {option.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
