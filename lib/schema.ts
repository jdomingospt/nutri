import {
  pgSchema,
  serial,
  text,
  numeric,
  integer,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const nutriSchema = pgSchema("nutri");

export const ingredients = nutriSchema.table("ingredients", {
  id: serial("id").primaryKey(),
  name_pt: text("name_pt").notNull(),
  category: text("category"),
  state: text("state"),
  kcal_per_100g: numeric("kcal_per_100g"),
  protein_g: numeric("protein_g"),
  fat_g: numeric("fat_g"),
  unit_type: text("unit_type").$type<"per_100g" | "per_unit">().notNull(),
  kcal_per_unit: numeric("kcal_per_unit"),
  protein_per_unit: numeric("protein_per_unit"),
  fat_per_unit: numeric("fat_per_unit"),
  source_page: integer("source_page"),
  aliases: text("aliases").array(),
  is_estimated: boolean("is_estimated").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const meals = nutriSchema.table("meals", {
  id: serial("id").primaryKey(),
  chat_id: integer("chat_id"),
  meal_date: date("date").notNull(),
  meal_type: text("meal_type")
    .$type<
      "pequeno_almoco" | "almoco" | "lanche" | "jantar" | "outro"
    >()
    .notNull(),
  total_kcal: numeric("total_kcal").default("0"),
  total_protein_g: numeric("total_protein_g").default("0"),
  total_fat_g: numeric("total_fat_g").default("0"),
  raw_text: text("raw_text"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const mealItems = nutriSchema.table("meal_items", {
  id: serial("id").primaryKey(),
  meal_id: integer("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  ingredient_id: integer("ingredient_id").references(() => ingredients.id),
  quantity: numeric("quantity"),
  quantity_unit: text("quantity_unit"),
  cooking_method: text("cooking_method"),
  kcal: numeric("kcal").default("0"),
  protein_g: numeric("protein_g").default("0"),
  fat_g: numeric("fat_g").default("0"),
  notes: text("notes"),
});

export const mealGoals = nutriSchema.table("meal_goals", {
  meal_type: text("meal_type")
    .$type<"pequeno_almoco" | "almoco" | "lanche" | "jantar">()
    .notNull()
    .unique(),
  target_kcal: numeric("target_kcal").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const mealGoalsHistory = nutriSchema.table("meal_goals_history", {
  id: serial("id").primaryKey(),
  meal_type: text("meal_type")
    .$type<"pequeno_almoco" | "almoco" | "lanche" | "jantar">()
    .notNull(),
  target_kcal: numeric("target_kcal").notNull(),
  effective_from: timestamp("effective_from", {
    withTimezone: true,
  }).defaultNow(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type MealItem = typeof mealItems.$inferSelect;
export type NewMealItem = typeof mealItems.$inferInsert;
export type MealGoal = typeof mealGoals.$inferSelect;
export type MealGoalsHistory = typeof mealGoalsHistory.$inferSelect;

export type MealType =
  | "pequeno_almoco"
  | "almoco"
  | "lanche"
  | "jantar"
  | "outro";

export const MEAL_TYPES: MealType[] = [
  "pequeno_almoco",
  "almoco",
  "lanche",
  "jantar",
];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  pequeno_almoco: "Pequeno-almoço",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  outro: "Outro",
};
