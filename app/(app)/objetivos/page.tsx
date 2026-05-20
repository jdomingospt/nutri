export const dynamic = "force-dynamic";

import { getGoals, getGoalsHistory } from "@/lib/queries";
import { MEAL_TYPE_LABELS } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GoalsForm } from "./goals-form";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function ObjetivosPage() {
  const [goals, history] = await Promise.all([getGoals(), getGoalsHistory()]);

  const goalsByType = Object.fromEntries(
    goals.map((g) => [g.meal_type, g.target_kcal])
  );

  const historyByType: Record<string, typeof history> = {};
  for (const h of history) {
    if (!historyByType[h.meal_type]) historyByType[h.meal_type] = [];
    historyByType[h.meal_type].push(h);
  }

  const dailyTotal = goals.reduce((s, g) => s + g.target_kcal, 0);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Objetivos</h1>
        <p className="text-sm text-muted-foreground">
          Alvo diário total: {Math.round(dailyTotal)} kcal
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alvos por refeição</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalsForm goals={goalsByType} />
        </CardContent>
      </Card>

      {/* History timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico de alterações</h2>
        {["pequeno_almoco", "almoco", "lanche", "jantar"].map((mealType) => {
          const entries = historyByType[mealType] ?? [];
          if (entries.length === 0) return null;
          return (
            <Card key={mealType}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {MEAL_TYPE_LABELS[mealType]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.slice(0, 10).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(h.effective_from), "d MMM yyyy HH:mm", {
                          locale: pt,
                        })}
                      </span>
                      <span className="font-medium tabular-nums">
                        {Math.round(h.target_kcal)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
