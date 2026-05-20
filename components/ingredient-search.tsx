"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { IngredientRow } from "@/lib/queries";
import { EstimatedBadge } from "@/components/estimated-badge";

interface Props {
  value: string;
  onSelect: (ing: IngredientRow) => void;
  onChange: (v: string) => void;
}

export function IngredientSearch({ value, onSelect, onChange }: Props) {
  const [results, setResults] = useState<IngredientRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleChange(q: string) {
    onChange(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-[160px]">
      <Input
        className="h-7 text-sm"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => value.length >= 2 && setOpen(true)}
        placeholder="Ingrediente…"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
          {results.map((ing) => (
            <button
              key={ing.id}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(ing);
                setOpen(false);
              }}
            >
              <span className="flex-1 font-medium">
                {ing.name_pt}
                <EstimatedBadge show={ing.is_estimated} />
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {ing.unit_type === "per_100g"
                  ? `${ing.kcal_per_100g} kcal/100g`
                  : `${ing.kcal_per_unit} kcal/un`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
