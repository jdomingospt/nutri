"use client";

import { useState, useTransition } from "react";
import type { MealItemDetail } from "@/lib/queries";
import { upsertMealItem, deleteMealItem } from "@/lib/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, X } from "lucide-react";
import { IngredientSearch } from "@/components/ingredient-search";
import { EstimatedBadge } from "@/components/estimated-badge";

interface Props {
  mealId: number;
  items: MealItemDetail[];
}

type EditingItem = Partial<MealItemDetail> & {
  isNew?: boolean;
  ingredient_id?: number | null;
  ingredient_name?: string;
  quantity_g?: number | null;
  quantity_units?: number | null;
  cooking_method?: string | null;
};

export function MealItemsTable({ mealId, items }: Props) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [editData, setEditData] = useState<EditingItem>({});
  const [isPending, startTransition] = useTransition();

  function startEdit(item: MealItemDetail) {
    setEditingId(item.id);
    setEditData({ ...item });
  }

  function startNew() {
    setEditingId("new");
    setEditData({ isNew: true, ingredient_name: "", quantity_g: null });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  function saveItem() {
    startTransition(async () => {
      await upsertMealItem({
        meal_id: mealId,
        id: editingId !== "new" ? (editingId as number) : undefined,
        ingredient_id: editData.ingredient_id ?? null,
        ingredient_name: editData.ingredient_name ?? "",
        quantity_g: editData.quantity_g ?? null,
        quantity_units: editData.quantity_units ?? null,
        cooking_method: editData.cooking_method ?? null,
        notes: editData.notes ?? null,
      });
      setEditingId(null);
      setEditData({});
    });
  }

  function removeItem(itemId: number) {
    startTransition(async () => {
      await deleteMealItem(itemId, mealId);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Itens</CardTitle>
        <Button size="sm" onClick={startNew} disabled={editingId !== null}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar item
        </Button>
      </CardHeader>
      <CardContent className={`p-0 ${editingId !== null ? "min-h-64" : ""}`}>
        <Table containerClassName={editingId !== null ? "overflow-visible" : undefined}>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead className="text-right">Qtd (g)</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Un
              </TableHead>
              <TableHead className="hidden md:table-cell">Método</TableHead>
              <TableHead className="text-right">kcal</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                P
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                G
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingId === "new" && (
              <EditRow
                data={editData}
                onChange={setEditData}
                onSave={saveItem}
                onCancel={cancelEdit}
                isPending={isPending}
              />
            )}
            {items.map((item) =>
              editingId === item.id ? (
                <EditRow
                  key={item.id}
                  data={editData}
                  onChange={setEditData}
                  onSave={saveItem}
                  onCancel={cancelEdit}
                  isPending={isPending}
                />
              ) : (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => editingId === null && startEdit(item)}
                >
                  <TableCell className="font-medium">
                    {item.ingredient_name}
                    <EstimatedBadge show={item.is_estimated} />
                    {item.cooking_method && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.cooking_method})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity_g ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {item.quantity_units ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {item.cooking_method ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Math.round(item.kcal)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {Math.round(item.protein_g)}g
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {Math.round(item.fat_g)}g
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
            {items.length === 0 && editingId !== "new" && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  Sem itens. Clica em &quot;Adicionar item&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EditRow({
  data,
  onChange,
  onSave,
  onCancel,
  isPending,
}: {
  data: EditingItem;
  onChange: (d: EditingItem) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell>
        <IngredientSearch
          value={data.ingredient_name ?? ""}
          onSelect={(ing) =>
            onChange({
              ...data,
              ingredient_id: ing.id,
              ingredient_name: ing.name_pt,
            })
          }
          onChange={(v) => onChange({ ...data, ingredient_name: v, ingredient_id: null })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.1"
          className="w-20 h-7 text-sm"
          placeholder="g"
          value={data.quantity_g ?? ""}
          onChange={(e) =>
            onChange({
              ...data,
              quantity_g: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
        />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Input
          type="number"
          step="0.5"
          className="w-16 h-7 text-sm"
          placeholder="un"
          value={data.quantity_units ?? ""}
          onChange={(e) =>
            onChange({
              ...data,
              quantity_units: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
        />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Input
          className="w-24 h-7 text-sm"
          placeholder="método"
          value={data.cooking_method ?? ""}
          onChange={(e) =>
            onChange({ ...data, cooking_method: e.target.value || null })
          }
        />
      </TableCell>
      <TableCell colSpan={3} className="text-muted-foreground text-xs">
        calculado ao guardar
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onSave} disabled={isPending || !data.ingredient_name}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
