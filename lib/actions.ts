"use server";

import { pool } from "./db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MEAL_TYPE_LABELS } from "./schema";

// ─── Meal actions ──────────────────────────────────────────────────────────────

const NewMealSchema = z.object({
  meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(["pequeno_almoco", "almoco", "lanche", "jantar", "outro"]),
  notes: z.string().optional(),
});

export async function createMeal(formData: FormData) {
  const raw = {
    meal_date: formData.get("meal_date"),
    meal_type: formData.get("meal_type"),
    notes: formData.get("notes") || undefined,
  };
  const parsed = NewMealSchema.parse(raw);

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO nutri.meals (date, meal_type, notes)
       VALUES ($1, $2, $3) RETURNING id`,
      [parsed.meal_date, parsed.meal_type, parsed.notes ?? null]
    );
    revalidatePath("/meals");
    revalidatePath("/");
    return { id: rows[0].id as number };
  } finally {
    client.release();
  }
}

export async function deleteMeal(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM nutri.meals WHERE id = $1`, [id]);
    revalidatePath("/meals");
    revalidatePath("/");
  } finally {
    client.release();
  }
}

// ─── Meal item actions ─────────────────────────────────────────────────────────

const UpsertItemSchema = z.object({
  meal_id: z.number(),
  id: z.number().optional(),
  ingredient_id: z.number().nullable().optional(),
  ingredient_name: z.string().min(1),
  quantity_g: z.number().nullable().optional(),
  quantity_units: z.number().nullable().optional(),
  cooking_method: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function recomputeMealTotals(client: import("pg").PoolClient, mealId: number) {
  await client.query(
    `UPDATE nutri.meals m
     SET total_kcal = COALESCE(sub.total_kcal, 0),
         total_protein_g = COALESCE(sub.total_protein_g, 0),
         total_fat_g = COALESCE(sub.total_fat_g, 0)
     FROM (
       SELECT meal_id,
              SUM(kcal)::numeric AS total_kcal,
              SUM(protein_g)::numeric AS total_protein_g,
              SUM(fat_g)::numeric AS total_fat_g
       FROM nutri.meal_items
       WHERE meal_id = $1
       GROUP BY meal_id
     ) sub
     WHERE m.id = $1 AND sub.meal_id = m.id`,
    [mealId]
  );
}

type UpsertItemInput = z.infer<typeof UpsertItemSchema>;

export async function upsertMealItem(input: UpsertItemInput) {
  const data = UpsertItemSchema.parse(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Resolve kcal/protein/fat from ingredient if possible
    let kcal = 0, protein = 0, fat = 0;
    if (data.ingredient_id) {
      const { rows } = await client.query(
        `SELECT unit_type, kcal_per_100g, protein_g, fat_g, kcal_per_unit, protein_per_unit, fat_per_unit
         FROM nutri.ingredients WHERE id = $1`,
        [data.ingredient_id]
      );
      if (rows.length) {
        const ing = rows[0];
        if (ing.unit_type === "per_100g" && data.quantity_g) {
          const q = data.quantity_g / 100;
          kcal = (parseFloat(ing.kcal_per_100g) || 0) * q;
          protein = (parseFloat(ing.protein_g) || 0) * q;
          fat = (parseFloat(ing.fat_g) || 0) * q;
        } else if (ing.unit_type === "per_unit" && data.quantity_units) {
          const q = data.quantity_units;
          kcal = (parseFloat(ing.kcal_per_unit) || 0) * q;
          protein = (parseFloat(ing.protein_per_unit) || 0) * q;
          fat = (parseFloat(ing.fat_per_unit) || 0) * q;
        }
      }
    }

    const quantity = data.quantity_g ?? data.quantity_units ?? null;
    const quantityUnit = data.quantity_g != null ? "g" : data.quantity_units != null ? "unit" : null;

    if (data.id) {
      await client.query(
        `UPDATE nutri.meal_items SET
          ingredient_id=$1, quantity=$2, quantity_unit=$3,
          cooking_method=$4, kcal=$5, protein_g=$6, fat_g=$7, notes=$8
         WHERE id=$9 AND meal_id=$10`,
        [
          data.ingredient_id ?? null,
          quantity,
          quantityUnit,
          data.cooking_method ?? null,
          kcal,
          protein,
          fat,
          data.notes ?? null,
          data.id,
          data.meal_id,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO nutri.meal_items
          (meal_id, ingredient_id, quantity, quantity_unit, cooking_method, kcal, protein_g, fat_g, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          data.meal_id,
          data.ingredient_id ?? null,
          quantity,
          quantityUnit,
          data.cooking_method ?? null,
          kcal,
          protein,
          fat,
          data.notes ?? null,
        ]
      );
    }

    await recomputeMealTotals(client, data.meal_id);
    await client.query("COMMIT");
    revalidatePath(`/meals/${data.meal_id}`);
    revalidatePath("/meals");
    revalidatePath("/");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteMealItem(itemId: number, mealId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM nutri.meal_items WHERE id = $1 AND meal_id = $2`, [
      itemId,
      mealId,
    ]);
    await recomputeMealTotals(client, mealId);
    await client.query("COMMIT");
    revalidatePath(`/meals/${mealId}`);
    revalidatePath("/meals");
    revalidatePath("/");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ─── Ingredient actions ────────────────────────────────────────────────────────

const IngredientSchema = z
  .object({
    id: z.number().optional(),
    name_pt: z.string().min(1),
    category: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    unit_type: z.enum(["per_100g", "per_unit"]),
    kcal_per_100g: z.number().nullable().optional(),
    protein_g: z.number().nullable().optional(),
    fat_g: z.number().nullable().optional(),
    kcal_per_unit: z.number().nullable().optional(),
    protein_per_unit: z.number().nullable().optional(),
    fat_per_unit: z.number().nullable().optional(),
    aliases: z.array(z.string()).optional(),
    is_estimated: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.unit_type === "per_100g"
        ? d.kcal_per_100g != null
        : d.kcal_per_unit != null,
    { message: "Valor calórico é obrigatório" }
  );

type IngredientInput = z.infer<typeof IngredientSchema>;

export async function upsertIngredient(input: IngredientInput) {
  const data = IngredientSchema.parse(input);
  const client = await pool.connect();
  try {
    if (data.id) {
      await client.query(
        `UPDATE nutri.ingredients SET
          name_pt=$1, category=$2, state=$3, unit_type=$4,
          kcal_per_100g=$5, protein_g=$6, fat_g=$7,
          kcal_per_unit=$8, protein_per_unit=$9, fat_per_unit=$10,
          aliases=$11, is_estimated=$12
         WHERE id=$13`,
        [
          data.name_pt,
          data.category ?? null,
          data.state ?? null,
          data.unit_type,
          data.kcal_per_100g ?? null,
          data.protein_g ?? null,
          data.fat_g ?? null,
          data.kcal_per_unit ?? null,
          data.protein_per_unit ?? null,
          data.fat_per_unit ?? null,
          data.aliases ?? [],
          data.is_estimated ?? false,
          data.id,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO nutri.ingredients
          (name_pt, category, state, unit_type, kcal_per_100g, protein_g, fat_g,
           kcal_per_unit, protein_per_unit, fat_per_unit, aliases, is_estimated)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          data.name_pt,
          data.category ?? null,
          data.state ?? null,
          data.unit_type,
          data.kcal_per_100g ?? null,
          data.protein_g ?? null,
          data.fat_g ?? null,
          data.kcal_per_unit ?? null,
          data.protein_per_unit ?? null,
          data.fat_per_unit ?? null,
          data.aliases ?? [],
          data.is_estimated ?? false,
        ]
      );
    }
    revalidatePath("/ingredients");
  } finally {
    client.release();
  }
}

export async function deleteIngredient(id: number) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT COUNT(*) AS cnt FROM nutri.meal_items WHERE ingredient_id = $1`,
      [id]
    );
    const cnt = parseInt(rows[0].cnt);
    if (cnt > 0) {
      throw new Error(
        `Este ingrediente é usado em ${cnt} ${cnt === 1 ? "item de refeição" : "itens de refeição"}. Edita em vez de apagar.`
      );
    }
    await client.query(`DELETE FROM nutri.ingredients WHERE id = $1`, [id]);
    revalidatePath("/ingredients");
  } finally {
    client.release();
  }
}

// ─── Goals actions ─────────────────────────────────────────────────────────────

const GoalsSchema = z.object({
  pequeno_almoco: z.number().min(0),
  almoco: z.number().min(0),
  lanche: z.number().min(0),
  jantar: z.number().min(0),
});

export async function setGoals(input: z.infer<typeof GoalsSchema>) {
  const data = GoalsSchema.parse(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [mealType, kcal] of Object.entries(data)) {
      await client.query(
        `INSERT INTO nutri.meal_goals (meal_type, target_kcal)
         VALUES ($1, $2)
         ON CONFLICT (meal_type) DO UPDATE SET target_kcal=$2, updated_at=now()`,
        [mealType, kcal]
      );
      await client.query(
        `INSERT INTO nutri.meal_goals_history (meal_type, target_kcal, effective_from)
         VALUES ($1, $2, now())`,
        [mealType, kcal]
      );
    }
    await client.query("COMMIT");
    revalidatePath("/objetivos");
    revalidatePath("/");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
