export const dynamic = "force-dynamic";

import { getMeal } from "@/lib/queries";
import { MEAL_TYPE_LABELS } from "@/lib/schema";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MealItemsTable } from "./meal-items-table";
import { DeleteMealButton } from "./delete-meal-button";
import { Beef, Droplets, Flame } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const meal = await getMeal(parseInt(id));
  if (!meal) notFound();

  const dateLabel = format(new Date(meal.meal_date + "T12:00:00"), "EEEE, d 'de' MMMM yyyy", {
    locale: pt,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold capitalize">
            {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
          </h1>
          <p className="text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        <DeleteMealButton id={meal.id} />
      </div>

      {/* Totals row */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="font-bold">{Math.round(meal.total_kcal)}</span>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Beef className="h-4 w-4 text-red-400" />
              <span className="font-bold">{Math.round(meal.total_protein_g)}g</span>
              <span className="text-sm text-muted-foreground">proteína</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-yellow-400" />
              <span className="font-bold">{Math.round(meal.total_fat_g)}g</span>
              <span className="text-sm text-muted-foreground">gordura</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <MealItemsTable mealId={meal.id} items={meal.items} />
    </div>
  );
}
