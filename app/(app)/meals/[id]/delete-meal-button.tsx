"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMeal } from "@/lib/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function DeleteMealButton({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteMeal(id);
    router.push("/meals");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Apagar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apagar refeição?</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. Todos os itens serão apagados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "A apagar…" : "Apagar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
