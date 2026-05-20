export const dynamic = "force-dynamic";

import { pool } from "@/lib/db";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { StackedBar } from "./stacked-bar";
import { TopIngredients } from "./top-ingredients";

async function getMonthlyData(endDate: string) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      WITH dates AS (
        SELECT generate_series($1::date - interval '29 days', $1::date, interval '1 day')::date AS day
      )
      SELECT
        d.day::text,
        COALESCE(SUM(m.total_kcal), 0)::float AS kcal,
        COALESCE((SELECT SUM(target_kcal) FROM nutri.meal_goals), 2000)::float AS target
      FROM dates d
      LEFT JOIN nutri.meals m ON m.date = d.day
      GROUP BY d.day
      ORDER BY d.day
      `,
      [endDate]
    );
    return rows as { day: string; kcal: number; target: number }[];
  } finally {
    client.release();
  }
}

async function getStackedData(endDate: string) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      WITH dates AS (
        SELECT generate_series($1::date - interval '29 days', $1::date, interval '1 day')::date AS day
      )
      SELECT
        d.day::text,
        COALESCE(SUM(CASE WHEN m.meal_type='pequeno_almoco' THEN m.total_kcal END), 0)::float AS pequeno_almoco,
        COALESCE(SUM(CASE WHEN m.meal_type='almoco' THEN m.total_kcal END), 0)::float AS almoco,
        COALESCE(SUM(CASE WHEN m.meal_type='lanche' THEN m.total_kcal END), 0)::float AS lanche,
        COALESCE(SUM(CASE WHEN m.meal_type='jantar' THEN m.total_kcal END), 0)::float AS jantar,
        COALESCE(SUM(CASE WHEN m.meal_type='extra' THEN m.total_kcal END), 0)::float AS extra
      FROM dates d
      LEFT JOIN nutri.meals m ON m.date = d.day
      GROUP BY d.day
      ORDER BY d.day
      `,
      [endDate]
    );
    return rows as {
      day: string;
      pequeno_almoco: number;
      almoco: number;
      lanche: number;
      jantar: number;
      extra: number;
    }[];
  } finally {
    client.release();
  }
}

async function getTopIngredients(endDate: string) {
  const client = await pool.connect();
  try {
    const { rows: byFreq } = await client.query(
      `
      SELECT COALESCE(i.name_pt, 'Desconhecido') AS ingredient_name,
             COUNT(*)::int AS uses, SUM(mi.kcal)::float AS total_kcal
      FROM nutri.meal_items mi
      JOIN nutri.meals m ON m.id = mi.meal_id
      LEFT JOIN nutri.ingredients i ON i.id = mi.ingredient_id
      WHERE m.date BETWEEN $1::date - interval '29 days' AND $1::date
      GROUP BY COALESCE(i.name_pt, 'Desconhecido')
      ORDER BY uses DESC
      LIMIT 10
      `,
      [endDate]
    );
    const { rows: byKcal } = await client.query(
      `
      SELECT COALESCE(i.name_pt, 'Desconhecido') AS ingredient_name,
             COUNT(*)::int AS uses, SUM(mi.kcal)::float AS total_kcal
      FROM nutri.meal_items mi
      JOIN nutri.meals m ON m.id = mi.meal_id
      LEFT JOIN nutri.ingredients i ON i.id = mi.ingredient_id
      WHERE m.date BETWEEN $1::date - interval '29 days' AND $1::date
      GROUP BY COALESCE(i.name_pt, 'Desconhecido')
      ORDER BY total_kcal DESC
      LIMIT 10
      `,
      [endDate]
    );
    return {
      byFreq: byFreq as { ingredient_name: string; uses: number; total_kcal: number }[],
      byKcal: byKcal as { ingredient_name: string; uses: number; total_kcal: number }[],
    };
  } finally {
    client.release();
  }
}

export default async function AnalyticsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [monthly, stacked, top] = await Promise.all([
    getMonthlyData(today),
    getStackedData(today),
    getTopIngredients(today),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análises</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">kcal vs. alvo — últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyHeatmap data={monthly} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Contribuição por refeição — últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StackedBar data={stacked} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 por frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <TopIngredients data={top.byFreq} metric="uses" label="usos" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 por kcal total</CardTitle>
          </CardHeader>
          <CardContent>
            <TopIngredients
              data={top.byKcal}
              metric="total_kcal"
              label="kcal"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
