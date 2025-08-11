import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BackHeaderProps {
  backHref: string;
  backLabel?: string;
  title?: string;
  rightSlot?: ReactNode; // para ícones ou botões no canto direito
  className?: string;
}

export function BackHeader({
  backHref,
  backLabel = "Voltar",
  title,
  rightSlot,
  className,
}: BackHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between py-3 border-b border-border bg-background mb-4", // removi px-4
        className
      )}
    >
      {/* Botão de voltar */}
      <Link
        href={backHref}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{backLabel}</span>
      </Link>

      {/* Slot direito (opcional) */}
      <div className="flex items-center gap-2">{rightSlot}</div>
    </header>
  );
}
