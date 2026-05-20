export const dynamic = "force-dynamic";

import { listMeals } from "@/lib/queries";
import { MEAL_TYPE_LABELS } from "@/lib/schema";
import { format, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { MealsFilters } from "./meals-filters";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; meal_type?: string }>;
}

const MEAL_TYPE_COLORS: Record<string, string> = {
  pequeno_almoco: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  almoco: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lanche: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  jantar: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  outro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default async function MealsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultFrom = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const from = sp.from ?? defaultFrom;
  const to = sp.to ?? today;
  const mealType = sp.meal_type;

  const meals = await listMeals({ from, to, mealType });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refeições</h1>
          <p className="text-sm text-muted-foreground">
            {meals.length} refeição{meals.length !== 1 ? "s" : ""} encontrada
            {meals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/meals/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-1" />
          Nova refeição
        </Link>
      </div>

      <MealsFilters from={from} to={to} mealType={mealType} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">kcal</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Proteína
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Gordura
                </TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  Itens
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {meals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-10"
                  >
                    Nenhuma refeição encontrada para este período.
                  </TableCell>
                </TableRow>
              ) : (
                meals.map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell className="font-medium">
                      {format(new Date(meal.meal_date + "T12:00:00"), "d MMM", {
                        locale: pt,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          MEAL_TYPE_COLORS[meal.meal_type] ??
                          MEAL_TYPE_COLORS.outro
                        }`}
                      >
                        {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(meal.total_kcal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell">
                      {Math.round(meal.total_protein_g)}g
                    </TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell">
                      {Math.round(meal.total_fat_g)}g
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                      {meal.item_count}
                    </TableCell>
                    <TableCell>
                      <Link href={`/meals/${meal.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
