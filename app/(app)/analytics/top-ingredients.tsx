"use client";

interface Item {
  ingredient_name: string;
  uses: number;
  total_kcal: number;
}

interface Props {
  data: Item[];
  metric: "uses" | "total_kcal";
  label: string;
}

export function TopIngredients({ data, metric, label }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Sem dados suficientes.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d[metric]));

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const value = item[metric];
        const pct = max > 0 ? (value / max) * 100 : 0;
        return (
          <div key={item.ingredient_name} className="space-y-0.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground w-4 text-right">
                  {i + 1}
                </span>
                <span className="font-medium truncate max-w-[160px]">
                  {item.ingredient_name}
                </span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {metric === "total_kcal"
                  ? `${Math.round(value)} ${label}`
                  : `${value} ${label}`}
              </span>
            </div>
            <div className="ml-6 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
