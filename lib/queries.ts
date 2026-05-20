import { pool } from "./db";
import { MEAL_TYPE_LABELS } from "./schema";

export type MealSummary = {
  meal_type: string;
  meal_type_label: string;
  kcal: number;
  protein_g: number;
  fat_g: number;
  target_kcal: number;
  meal_id: number | null;
};

export type DaySummary = {
  date: string;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  daily_target: number;
  meals: MealSummary[];
};

export type WeekDay = {
  date: string;
  kcal: number;
  target: number;
};

export type MealListItem = {
  id: number;
  meal_date: string;
  meal_type: string;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  item_count: number;
  notes: string | null;
};

export type MealDetail = {
  id: number;
  meal_date: string;
  meal_type: string;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  notes: string | null;
  items: MealItemDetail[];
};

export type MealItemDetail = {
  id: number;
  meal_id: number;
  ingredient_id: number | null;
  ingredient_name: string;
  is_estimated: boolean;
  quantity_g: number | null;
  quantity_units: number | null;
  cooking_method: string | null;
  kcal: number;
  protein_g: number;
  fat_g: number;
  notes: string | null;
};

export type IngredientRow = {
  id: number;
  name_pt: string;
  category: string | null;
  state: string | null;
  kcal_per_100g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  unit_type: string;
  kcal_per_unit: number | null;
  protein_per_unit: number | null;
  fat_per_unit: number | null;
  source_page: number | null;
  aliases: string[] | null;
  is_estimated: boolean;
};

const INGREDIENT_COLUMNS = `id, name_pt, category, state,
       kcal_per_100g::float, protein_g::float, fat_g::float,
       unit_type,
       kcal_per_unit::float, protein_per_unit::float, fat_per_unit::float,
       source_page, aliases, is_estimated`;

export async function getTodaySummary(date: string): Promise<DaySummary> {
  const client = await pool.connect();
  try {
    const { rows: mealRows } = await client.query<{
      meal_type: string;
      meal_id: string | null;
      kcal: string;
      protein_g: string;
      fat_g: string;
      target_kcal: string;
    }>(
      `
      WITH meal_types AS (
        SELECT unnest(ARRAY['pequeno_almoco','almoco','lanche','jantar']) AS meal_type
      ),
      day_meals AS (
        SELECT meal_type, id, total_kcal, total_protein_g, total_fat_g
        FROM nutri.meals
        WHERE date = $1
      ),
      goals AS (
        SELECT meal_type, target_kcal FROM nutri.meal_goals
      )
      SELECT
        mt.meal_type,
        dm.id AS meal_id,
        COALESCE(dm.total_kcal, 0)::text AS kcal,
        COALESCE(dm.total_protein_g, 0)::text AS protein_g,
        COALESCE(dm.total_fat_g, 0)::text AS fat_g,
        COALESCE(g.target_kcal, 0)::text AS target_kcal
      FROM meal_types mt
      LEFT JOIN day_meals dm USING (meal_type)
      LEFT JOIN goals g USING (meal_type)
      ORDER BY ARRAY_POSITION(ARRAY['pequeno_almoco','almoco','lanche','jantar'], mt.meal_type)
      `,
      [date]
    );

    const meals: MealSummary[] = mealRows.map((r) => ({
      meal_type: r.meal_type,
      meal_type_label: MEAL_TYPE_LABELS[r.meal_type] ?? r.meal_type,
      kcal: parseFloat(r.kcal),
      protein_g: parseFloat(r.protein_g),
      fat_g: parseFloat(r.fat_g),
      target_kcal: parseFloat(r.target_kcal),
      meal_id: r.meal_id ? parseInt(r.meal_id) : null,
    }));

    const total_kcal = meals.reduce((s, m) => s + m.kcal, 0);
    const total_protein_g = meals.reduce((s, m) => s + m.protein_g, 0);
    const total_fat_g = meals.reduce((s, m) => s + m.fat_g, 0);
    const daily_target = meals.reduce((s, m) => s + m.target_kcal, 0);

    return { date, total_kcal, total_protein_g, total_fat_g, daily_target, meals };
  } finally {
    client.release();
  }
}

export async function getWeekSummary(endDate: string): Promise<WeekDay[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{
      day: string;
      kcal: string;
      target: string;
    }>(
      `
      WITH dates AS (
        SELECT generate_series(
          $1::date - interval '6 days',
          $1::date,
          interval '1 day'
        )::date AS day
      ),
      daily_kcal AS (
        SELECT date, SUM(total_kcal) AS kcal
        FROM nutri.meals
        WHERE date BETWEEN $1::date - interval '6 days' AND $1::date
        GROUP BY date
      ),
      daily_target AS (
        SELECT
          d.day,
          COALESCE(
            (
              SELECT SUM(h.target_kcal)
              FROM nutri.meal_goals_history h
              WHERE h.effective_from <= (d.day + interval '1 day')
                AND h.meal_type IN ('pequeno_almoco','almoco','lanche','jantar')
                AND h.id = (
                  SELECT id FROM nutri.meal_goals_history h2
                  WHERE h2.meal_type = h.meal_type
                    AND h2.effective_from <= (d.day + interval '1 day')
                  ORDER BY h2.effective_from DESC LIMIT 1
                )
            ),
            (SELECT SUM(target_kcal) FROM nutri.meal_goals)
          ) AS target
        FROM dates d
      )
      SELECT
        d.day::text,
        COALESCE(dk.kcal, 0)::text AS kcal,
        COALESCE(dt.target, 0)::text AS target
      FROM dates d
      LEFT JOIN daily_kcal dk ON dk.date = d.day
      LEFT JOIN daily_target dt ON dt.day = d.day
      ORDER BY d.day
      `,
      [endDate]
    );

    return rows.map((r) => ({
      date: r.day,
      kcal: parseFloat(r.kcal),
      target: parseFloat(r.target),
    }));
  } finally {
    client.release();
  }
}

export async function getStreak(endDate: string): Promise<number> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ day: string; kcal: string; target: string }>(
      `
      WITH dates AS (
        SELECT generate_series(
          $1::date - interval '89 days',
          $1::date,
          interval '1 day'
        )::date AS day
      ),
      daily_kcal AS (
        SELECT date, SUM(total_kcal) AS kcal
        FROM nutri.meals
        WHERE date BETWEEN $1::date - interval '89 days' AND $1::date
        GROUP BY date
      )
      SELECT
        d.day::text,
        COALESCE(dk.kcal, 0)::text AS kcal,
        (SELECT SUM(target_kcal) FROM nutri.meal_goals)::text AS target
      FROM dates d
      LEFT JOIN daily_kcal dk ON dk.date = d.day
      ORDER BY d.day DESC
      `,
      [endDate]
    );

    let streak = 0;
    for (const row of rows) {
      const kcal = parseFloat(row.kcal);
      const target = parseFloat(row.target);
      if (target === 0) break;
      const ratio = kcal / target;
      if (ratio >= 0.9 && ratio <= 1.1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } finally {
    client.release();
  }
}

export async function listMeals(params: {
  from: string;
  to: string;
  mealType?: string;
}): Promise<MealListItem[]> {
  const client = await pool.connect();
  try {
    const conditions = ["m.date BETWEEN $1 AND $2"];
    const values: unknown[] = [params.from, params.to];
    if (params.mealType) {
      conditions.push(`m.meal_type = $${values.length + 1}`);
      values.push(params.mealType);
    }
    const { rows } = await client.query<MealListItem>(
      `
      SELECT
        m.id,
        m.date::text AS meal_date,
        m.meal_type,
        COALESCE(m.total_kcal, 0)::float AS total_kcal,
        COALESCE(m.total_protein_g, 0)::float AS total_protein_g,
        COALESCE(m.total_fat_g, 0)::float AS total_fat_g,
        COUNT(mi.id)::int AS item_count,
        m.notes
      FROM nutri.meals m
      LEFT JOIN nutri.meal_items mi ON mi.meal_id = m.id
      WHERE ${conditions.join(" AND ")}
      GROUP BY m.id
      ORDER BY m.date DESC, ARRAY_POSITION(ARRAY['pequeno_almoco','almoco','lanche','jantar','outro'], m.meal_type)
      `,
      values
    );
    return rows;
  } finally {
    client.release();
  }
}

export async function getMeal(id: number): Promise<MealDetail | null> {
  const client = await pool.connect();
  try {
    const { rows: mealRows } = await client.query(
      `SELECT id, date::text AS meal_date, meal_type, COALESCE(total_kcal,0)::float AS total_kcal, COALESCE(total_protein_g,0)::float AS total_protein_g, COALESCE(total_fat_g,0)::float AS total_fat_g, notes
       FROM nutri.meals WHERE id = $1`,
      [id]
    );
    if (!mealRows.length) return null;
    const meal = mealRows[0];

    const { rows: itemRows } = await client.query<MealItemDetail>(
      `SELECT mi.id, mi.meal_id, mi.ingredient_id,
              COALESCE(i.name_pt, '') AS ingredient_name,
              COALESCE(i.is_estimated, false) AS is_estimated,
              CASE WHEN i.unit_type = 'per_100g' THEN mi.quantity::float ELSE NULL END AS quantity_g,
              CASE WHEN i.unit_type = 'per_unit'  THEN mi.quantity::float ELSE NULL END AS quantity_units,
              mi.cooking_method,
              COALESCE(mi.kcal,0)::float AS kcal,
              COALESCE(mi.protein_g,0)::float AS protein_g,
              COALESCE(mi.fat_g,0)::float AS fat_g,
              mi.notes
       FROM nutri.meal_items mi
       LEFT JOIN nutri.ingredients i ON i.id = mi.ingredient_id
       WHERE mi.meal_id = $1 ORDER BY mi.id`,
      [id]
    );

    return { ...meal, items: itemRows };
  } finally {
    client.release();
  }
}

export async function searchIngredients(
  q: string,
  limit = 20
): Promise<IngredientRow[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<IngredientRow>(
      `
      SELECT ${INGREDIENT_COLUMNS}
      FROM nutri.ingredients
      WHERE name_pt ILIKE $1
         OR EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE $1)
         OR similarity(name_pt, $2) > 0.2
      ORDER BY similarity(name_pt, $2) DESC, name_pt
      LIMIT $3
      `,
      [`%${q}%`, q, limit]
    );
    return rows;
  } finally {
    client.release();
  }
}

export async function listIngredients(params: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: IngredientRow[]; total: number }> {
  const client = await pool.connect();
  try {
    const where = params.q
      ? `WHERE name_pt ILIKE $1 OR EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE $1)`
      : "";
    const values = params.q ? [`%${params.q}%`] : [];
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS total FROM nutri.ingredients ${where}`,
      values
    );
    const total = countRows[0].total;

    const { rows } = await client.query<IngredientRow>(
      `SELECT ${INGREDIENT_COLUMNS}
       FROM nutri.ingredients
       ${where}
       ORDER BY name_pt
       LIMIT ${limit} OFFSET ${offset}`,
      values
    );
    return { rows, total };
  } finally {
    client.release();
  }
}

export async function getGoals() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT meal_type, target_kcal::float FROM nutri.meal_goals ORDER BY ARRAY_POSITION(ARRAY['pequeno_almoco','almoco','lanche','jantar'], meal_type)`
    );
    return rows as { meal_type: string; target_kcal: number }[];
  } finally {
    client.release();
  }
}

export async function getGoalsHistory() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT meal_type, target_kcal::float, effective_from
       FROM nutri.meal_goals_history
       ORDER BY effective_from DESC
       LIMIT 100`
    );
    return rows as {
      meal_type: string;
      target_kcal: number;
      effective_from: Date;
    }[];
  } finally {
    client.release();
  }
}
