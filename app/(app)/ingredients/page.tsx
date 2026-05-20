export const dynamic = "force-dynamic";

import { listIngredients } from "@/lib/queries";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { IngredientsTable } from "./ingredients-table";
import { IngredientsSearch } from "./ingredients-search";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function IngredientsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = parseInt(sp.page ?? "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const { rows, total } = await listIngredients({ q, limit, offset });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingredientes</h1>
          <p className="text-sm text-muted-foreground">
            {total} ingrediente{total !== 1 ? "s" : ""}
            {q ? ` para "${q}"` : ""}
          </p>
        </div>
        <Link href="/ingredients/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Link>
      </div>

      <IngredientsSearch initialQ={q} />

      <Card>
        <CardContent className="p-0">
          <IngredientsTable rows={rows} />
        </CardContent>
      </Card>

      {total > limit && (
        <div className="flex gap-2 justify-center">
          {page > 1 && (
            <Link
              href={`/ingredients?${new URLSearchParams({ q, page: String(page - 1) })}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ← Anterior
            </Link>
          )}
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {page} / {Math.ceil(total / limit)}
          </span>
          {page < Math.ceil(total / limit) && (
            <Link
              href={`/ingredients?${new URLSearchParams({ q, page: String(page + 1) })}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Seguinte →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
