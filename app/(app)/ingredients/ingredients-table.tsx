"use client";

import { useState, useTransition } from "react";
import type { IngredientRow } from "@/lib/queries";
import { upsertIngredient, deleteIngredient } from "@/lib/actions";
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
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { EstimatedBadge } from "@/components/estimated-badge";

interface Props {
  rows: IngredientRow[];
}

type EditState = {
  id: number;
  name_pt: string;
  category: string;
  state: string;
  unit_type: "per_100g" | "per_unit";
  kcal_per_100g: string;
  protein_g: string;
  fat_g: string;
  kcal_per_unit: string;
  protein_per_unit: string;
  fat_per_unit: string;
  aliases: string;
};

function rowToEdit(r: IngredientRow): EditState {
  return {
    id: r.id,
    name_pt: r.name_pt,
    category: r.category ?? "",
    state: r.state ?? "",
    unit_type: r.unit_type as "per_100g" | "per_unit",
    kcal_per_100g: r.kcal_per_100g != null ? String(r.kcal_per_100g) : "",
    protein_g: r.protein_g != null ? String(r.protein_g) : "",
    fat_g: r.fat_g != null ? String(r.fat_g) : "",
    kcal_per_unit: r.kcal_per_unit != null ? String(r.kcal_per_unit) : "",
    protein_per_unit: r.protein_per_unit != null ? String(r.protein_per_unit) : "",
    fat_per_unit: r.fat_per_unit != null ? String(r.fat_per_unit) : "",
    aliases: (r.aliases ?? []).join(", "),
  };
}

export function IngredientsTable({ rows }: Props) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(row: IngredientRow) {
    setEditId(row.id);
    setEditData(rowToEdit(row));
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditData(null);
    setError(null);
  }

  function save() {
    if (!editData) return;
    startTransition(async () => {
      try {
        await upsertIngredient({
          id: editData.id,
          name_pt: editData.name_pt,
          category: editData.category || null,
          state: editData.state || null,
          unit_type: editData.unit_type,
          kcal_per_100g: editData.kcal_per_100g ? parseFloat(editData.kcal_per_100g) : null,
          protein_g: editData.protein_g ? parseFloat(editData.protein_g) : null,
          fat_g: editData.fat_g ? parseFloat(editData.fat_g) : null,
          kcal_per_unit: editData.kcal_per_unit ? parseFloat(editData.kcal_per_unit) : null,
          protein_per_unit: editData.protein_per_unit
            ? parseFloat(editData.protein_per_unit)
            : null,
          fat_per_unit: editData.fat_per_unit ? parseFloat(editData.fat_per_unit) : null,
          aliases: editData.aliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        });
        setEditId(null);
        setEditData(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao guardar");
      }
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      try {
        await deleteIngredient(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao apagar");
      }
    });
  }

  function field(key: keyof EditState, placeholder?: string) {
    return (
      <Input
        className="h-7 text-sm w-full min-w-[70px]"
        placeholder={placeholder}
        value={(editData as EditState)[key]}
        onChange={(e) =>
          setEditData((d) => d && { ...d, [key]: e.target.value })
        }
      />
    );
  }

  return (
    <>
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-b">
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="hidden lg:table-cell">Estado</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">kcal</TableHead>
            <TableHead className="text-right hidden sm:table-cell">P</TableHead>
            <TableHead className="text-right hidden sm:table-cell">G</TableHead>
            <TableHead className="hidden xl:table-cell">Aliases</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) =>
            editId === row.id && editData ? (
              <TableRow key={row.id} className="bg-muted/30">
                <TableCell>{field("name_pt", "Nome")}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {field("category", "Categoria")}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {field("state", "Estado")}
                </TableCell>
                <TableCell>
                  <select
                    className="h-7 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={editData.unit_type}
                    onChange={(e) =>
                      setEditData((d) =>
                        d && { ...d, unit_type: e.target.value as "per_100g" | "per_unit" }
                      )
                    }
                  >
                    <option value="per_100g">por 100g</option>
                    <option value="per_unit">por un</option>
                  </select>
                </TableCell>
                <TableCell>
                  {editData.unit_type === "per_100g"
                    ? field("kcal_per_100g", "kcal")
                    : field("kcal_per_unit", "kcal")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {editData.unit_type === "per_100g"
                    ? field("protein_g", "P")
                    : field("protein_per_unit", "P")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {editData.unit_type === "per_100g"
                    ? field("fat_g", "G")
                    : field("fat_per_unit", "G")}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {field("aliases", "a, b, c")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={save}
                      disabled={isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.name_pt}
                  <EstimatedBadge show={row.is_estimated} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {row.category ?? "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {row.state ?? "—"}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {row.unit_type === "per_100g" ? "100g" : "un"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.unit_type === "per_100g"
                    ? row.kcal_per_100g ?? "—"
                    : row.kcal_per_unit ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  {row.unit_type === "per_100g"
                    ? (row.protein_g ?? "—")
                    : (row.protein_per_unit ?? "—")}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  {row.unit_type === "per_100g"
                    ? (row.fat_g ?? "—")
                    : (row.fat_per_unit ?? "—")}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {(row.aliases ?? []).slice(0, 3).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(row)}
                      disabled={editId !== null}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(row.id)}
                      disabled={isPending || editId !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          )}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground py-10"
              >
                Nenhum ingrediente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
