import { Badge } from "@/components/ui/badge";

export function EstimatedBadge({ show }: { show: boolean | null | undefined }) {
  if (!show) return null;
  return (
    <Badge
      variant="outline"
      className="ml-1.5 h-4 px-1 text-[10px] font-normal text-amber-600 border-amber-400/60 bg-amber-50/40 dark:text-amber-400 dark:bg-amber-900/20"
      title="Valores estimados pelo modelo (não são da tabela oficial)"
    >
      estimado
    </Badge>
  );
}
