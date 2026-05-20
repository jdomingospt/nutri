"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { WeekDay } from "@/lib/queries";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeekChartProps {
  data: WeekDay[];
}

export function WeekChart({ data }: WeekChartProps) {
  const chartData = data.map((d) => ({
    day: format(parseISO(d.date), "EEE d/M", { locale: ptBR }),
    kcal: Math.round(d.kcal),
    target: Math.round(d.target),
  }));

  const avgTarget =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.target, 0) / data.length)
      : 0;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          formatter={(value, name) => [
            `${Math.round(Number(value))} kcal`,
            name === "kcal" ? "Ingerido" : "Alvo",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "#ffffff",
            color: "#000000",
          }}
          itemStyle={{ color: "#000000" }}
          labelStyle={{ color: "#000000", fontWeight: 600 }}
        />
        <ReferenceLine
          y={avgTarget}
          stroke="hsl(var(--destructive))"
          strokeDasharray="4 3"
          label={(props) => {
            const { viewBox } = props as { viewBox: { x: number; y: number; width: number } };
            const text = `alvo ${avgTarget}`;
            const px = 6;
            const py = 3;
            const textWidth = text.length * 6.5;
            const x = viewBox.x + viewBox.width - textWidth - px * 2 - 4;
            const y = viewBox.y - 11;
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={textWidth + px * 2}
                  height={16 + py}
                  rx={4}
                  fill="hsl(var(--destructive))"
                  opacity={0.15}
                />
                <text
                  x={x + px}
                  y={y + 12}
                  fontSize={11}
                  fill="hsl(var(--destructive))"
                  fontWeight={600}
                >
                  {text}
                </text>
              </g>
            );
          }}
        />
        <Bar
          dataKey="kcal"
          name="kcal"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
