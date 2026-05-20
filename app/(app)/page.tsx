export const dynamic = "force-dynamic";

import { getTodaySummary, getWeekSummary, getStreak } from "@/lib/queries";
import { MEAL_TYPE_LABELS } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { WeekChart } from "@/components/week-chart";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Flame, TrendingUp, Beef, Droplets } from "lucide-react";

function toPercent(val: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((val / target) * 100));
}

export default async function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [summary, weekData, streak] = await Promise.all([
    getTodaySummary(today),
    getWeekSummary(today),
    getStreak(today),
  ]);

  const dayPercent = toPercent(summary.total_kcal, summary.daily_target);
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: pt });
  const weekAvg =
    weekData.length > 0
      ? Math.round(weekData.reduce((s, d) => s + d.kcal, 0) / weekData.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Date heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">{todayLabel}</h1>
          <p className="text-muted-foreground text-sm">Resumo de hoje</p>
        </div>
        {streak > 0 && (
          <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
            <Flame className="h-4 w-4 text-orange-500" />
            {streak} {streak === 1 ? "dia" : "dias"} no alvo
          </Badge>
        )}
      </div>

      {/* Hero kcal card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold">
              {Math.round(summary.total_kcal)}
            </span>
            <span className="text-muted-foreground text-lg mb-1">
              / {Math.round(summary.daily_target)} kcal
            </span>
          </div>
          <Progress value={dayPercent} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{dayPercent}% do alvo diário</span>
            <span>
              {summary.daily_target - summary.total_kcal > 0
                ? `faltam ${Math.round(summary.daily_target - summary.total_kcal)} kcal`
                : `+${Math.round(summary.total_kcal - summary.daily_target)} kcal acima`}
            </span>
          </div>
          {/* Macros row */}
          <div className="flex gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1.5 text-sm">
              <Beef className="h-4 w-4 text-red-400" />
              <span className="font-medium">
                {Math.round(summary.total_protein_g)}g
              </span>
              <span className="text-muted-foreground">proteína</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Droplets className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">
                {Math.round(summary.total_fat_g)}g
              </span>
              <span className="text-muted-foreground">gordura</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-meal cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.meals.map((meal) => {
          const pct = toPercent(meal.kcal, meal.target_kcal);
          return (
            <Card key={meal.meal_type} className="overflow-hidden">
              <CardHeader className="py-3 px-4 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {meal.meal_type_label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-xl font-bold">
                  {Math.round(meal.kcal)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {Math.round(meal.target_kcal)}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Últimos 7 dias
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              média {weekAvg} kcal/dia
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <WeekChart data={weekData} />
        </CardContent>
      </Card>
    </div>
  );
}
