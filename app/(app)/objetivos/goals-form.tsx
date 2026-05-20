"use client";

import { useState, useTransition } from "react";
import { setGoals } from "@/lib/actions";
import { MEAL_TYPE_LABELS } from "@/lib/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  goals: Record<string, number>;
}

const MEAL_TYPES = ["pequeno_almoco", "almoco", "lanche", "jantar"] as const;

export function GoalsForm({ goals }: Props) {
  const [values, setValues] = useState<Record<string, string>>({
    pequeno_almoco: String(goals.pequeno_almoco ?? 400),
    almoco: String(goals.almoco ?? 600),
    lanche: String(goals.lanche ?? 300),
    jantar: String(goals.jantar ?? 700),
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = MEAL_TYPES.reduce(
    (s, t) => s + (parseFloat(values[t]) || 0),
    0
  );

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await setGoals({
          pequeno_almoco: parseFloat(values.pequeno_almoco) || 0,
          almoco: parseFloat(values.almoco) || 0,
          lanche: parseFloat(values.lanche) || 0,
          jantar: parseFloat(values.jantar) || 0,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao guardar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {MEAL_TYPES.map((mt) => (
          <div key={mt} className="space-y-1.5">
            <Label htmlFor={mt}>{MEAL_TYPE_LABELS[mt]}</Label>
            <div className="relative">
              <Input
                id={mt}
                type="number"
                step="10"
                min="0"
                value={values[mt]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [mt]: e.target.value }))
                }
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                kcal
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">
          Total diário:{" "}
          <span className="font-semibold text-foreground">
            {Math.round(total)} kcal
          </span>
        </span>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </span>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? "A guardar…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
