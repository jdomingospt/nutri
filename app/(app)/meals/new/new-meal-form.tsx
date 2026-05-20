"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMeal } from "@/lib/actions";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  defaultDate: string;
}

export function NewMealForm({ defaultDate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const result = await createMeal(fd);
      router.push(`/meals/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar refeição");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal_date">Data</Label>
            <Input
              id="meal_date"
              name="meal_date"
              type="date"
              defaultValue={defaultDate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal_type">Tipo</Label>
            <select
              id="meal_type"
              name="meal_type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              required
            >
              {[...MEAL_TYPES, "outro" as const].map((t) => (
                <option key={t} value={t}>
                  {MEAL_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Ex: refeição pós-treino" />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "A criar…" : "Criar refeição"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
