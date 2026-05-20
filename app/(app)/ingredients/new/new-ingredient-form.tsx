"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertIngredient } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function NewIngredientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitType, setUnitType] = useState<"per_100g" | "per_unit">("per_100g");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await upsertIngredient({
        name_pt: fd.get("name_pt") as string,
        category: (fd.get("category") as string) || null,
        state: (fd.get("state") as string) || null,
        unit_type: unitType,
        kcal_per_100g:
          unitType === "per_100g" && fd.get("kcal")
            ? parseFloat(fd.get("kcal") as string)
            : null,
        protein_g:
          unitType === "per_100g" && fd.get("protein")
            ? parseFloat(fd.get("protein") as string)
            : null,
        fat_g:
          unitType === "per_100g" && fd.get("fat")
            ? parseFloat(fd.get("fat") as string)
            : null,
        kcal_per_unit:
          unitType === "per_unit" && fd.get("kcal")
            ? parseFloat(fd.get("kcal") as string)
            : null,
        protein_per_unit:
          unitType === "per_unit" && fd.get("protein")
            ? parseFloat(fd.get("protein") as string)
            : null,
        fat_per_unit:
          unitType === "per_unit" && fd.get("fat")
            ? parseFloat(fd.get("fat") as string)
            : null,
        aliases: ((fd.get("aliases") as string) || "")
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        is_estimated: fd.get("is_estimated") === "on",
      });
      router.push("/ingredients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_pt">Nome (PT) *</Label>
            <Input id="name_pt" name="name_pt" required placeholder="Ex: Peito de frango grelhado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" placeholder="Ex: Proteínas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" name="state" placeholder="cru / cozinhado" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de unidade *</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="unit_type"
                  value="per_100g"
                  checked={unitType === "per_100g"}
                  onChange={() => setUnitType("per_100g")}
                />
                Por 100g
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="unit_type"
                  value="per_unit"
                  checked={unitType === "per_unit"}
                  onChange={() => setUnitType("per_unit")}
                />
                Por unidade
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kcal">
                kcal {unitType === "per_100g" ? "/100g" : "/un"} *
              </Label>
              <Input id="kcal" name="kcal" type="number" step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input id="protein" name="protein" type="number" step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Gordura (g)</Label>
              <Input id="fat" name="fat" type="number" step="0.1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliases">Aliases (separados por vírgula)</Label>
            <Input
              id="aliases"
              name="aliases"
              placeholder="frango grelhado, frango cozinhado"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_estimated"
              className="h-4 w-4"
            />
            Valores estimados (não confirmados pela tabela oficial)
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "A guardar…" : "Criar ingrediente"}
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
