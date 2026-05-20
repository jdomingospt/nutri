"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import { Search } from "lucide-react";

export function IngredientsSearch({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(q: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      router.push(`${pathname}?${sp.toString()}`);
    }, 350);
  }

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-8"
        defaultValue={initialQ}
        placeholder="Pesquisar ingredientes…"
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
