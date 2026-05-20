"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Carrot,
  Target,
  BarChart2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Hoje", icon: LayoutDashboard },
  { href: "/meals", label: "Refeições", icon: UtensilsCrossed },
  { href: "/ingredients", label: "Ingredientes", icon: Carrot },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/analytics", label: "Análises", icon: BarChart2 },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center gap-1 px-4">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <span className="text-xl">🥗</span>
          <span className="font-semibold text-sm hidden sm:block">Nutri</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                pathname === href ||
                  (href !== "/" && pathname.startsWith(href))
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-1.5 hidden sm:block">Sair</span>
        </Button>
      </div>
    </header>
  );
}
