"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: {
    day: string;
    pequeno_almoco: number;
    almoco: number;
    lanche: number;
    jantar: number;
    extra: number;
  }[];
}

const MEAL_KEYS = ["pequeno_almoco", "almoco", "lanche", "jantar", "extra"] as const;
type MealKey = (typeof MEAL_KEYS)[number];

const COLORS: Record<MealKey, string> = {
  pequeno_almoco: "hsl(43, 96%, 56%)",
  almoco: "hsl(142, 69%, 45%)",
  lanche: "hsl(217, 91%, 60%)",
  jantar: "hsl(270, 67%, 55%)",
  extra: "hsl(0, 72%, 60%)",
};

const LABELS: Record<MealKey, string> = {
  pequeno_almoco: "P. almoço",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  extra: "Extra",
};

const LAST_KEY: MealKey = "extra";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const nonZero = payload.filter((p) => p.value > 0);

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--popover))",
        color: "hsl(var(--popover-foreground))",
        padding: "8px 12px",
        fontSize: 12,
        minWidth: 140,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        {label} — {Math.round(total)} kcal
      </p>
      {nonZero.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: p.color }}>
            {LABELS[p.name as MealKey] ?? p.name}
          </span>
          <span>{Math.round(p.value)} kcal</span>
        </div>
      ))}
    </div>
  );
}

export function StackedBar({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    day: format(parseISO(d.day), "d/M", { locale: ptBR }),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => LABELS[value as MealKey] ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
        {MEAL_KEYS.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={COLORS[key]}
            radius={key === LAST_KEY ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
