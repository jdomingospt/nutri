"use client";

import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface DayData {
  day: string;
  kcal: number;
  target: number;
}

interface Props {
  data: DayData[];
}

function getColor(kcal: number, target: number): string {
  if (kcal === 0) return "bg-muted";
  const ratio = kcal / target;
  if (ratio < 0.7) return "bg-blue-200 dark:bg-blue-900";
  if (ratio < 0.9) return "bg-green-200 dark:bg-green-800";
  if (ratio <= 1.1) return "bg-green-400 dark:bg-green-600";
  if (ratio <= 1.3) return "bg-amber-300 dark:bg-amber-700";
  return "bg-red-400 dark:bg-red-700";
}

export function MonthlyHeatmap({ data }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {data.map((d) => (
          <div
            key={d.day}
            title={`${format(parseISO(d.day), "d MMM", { locale: pt })}: ${Math.round(d.kcal)} kcal (alvo ${Math.round(d.target)})`}
            className={`w-8 h-8 rounded-md flex items-center justify-center cursor-default ${getColor(d.kcal, d.target)}`}
          >
            <span className="text-[9px] font-medium leading-none">
              {format(parseISO(d.day), "d")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-muted inline-block" />
          Sem dados
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900 inline-block" />
          &lt;70%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 inline-block" />
          70–90%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600 inline-block" />
          90–110% ✓
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-300 dark:bg-amber-700 inline-block" />
          110–130%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-700 inline-block" />
          &gt;130%
        </span>
      </div>
    </div>
  );
}
