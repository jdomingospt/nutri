"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/schema";
import { useState } from "react";

interface Props {
  from: string;
  to: string;
  mealType?: string;
}

export function MealsFilters({ from, to, mealType }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);
  const [typeVal, setTypeVal] = useState(mealType ?? "");

  function apply() {
    const sp = new URLSearchParams();
    sp.set("from", fromVal);
    sp.set("to", toVal);
    if (typeVal) sp.set("meal_type", typeVal);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          De
        </Label>
        <Input
          id="from"
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="w-36"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          Até
        </Label>
        <Input
          id="to"
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="w-36"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="meal_type" className="text-xs">
          Tipo
        </Label>
        <select
          id="meal_type"
          value={typeVal}
          onChange={(e) => setTypeVal(e.target.value)}
          className="flex h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos</option>
          {MEAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEAL_TYPE_LABELS[t]}
            </option>
          ))}
          <option value="outro">Outro</option>
        </select>
      </div>
      <Button onClick={apply} size="sm">
        Filtrar
      </Button>
    </div>
  );
}
