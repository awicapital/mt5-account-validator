"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackHeaderProps {
  backHref: string;
  title?: string;
  rightSlot?: ReactNode; // ícones/botões no canto direito
  className?: string;
  sticky?: boolean; // opcional: deixa colado no topo
  withBorder?: boolean; // opcional: mostra/oculta a borda inferior
}

export function BackHeader({
  backHref,
  title,
  rightSlot,
  className,
  sticky = true,
  withBorder = true,
}: BackHeaderProps) {
  return (
    <header
      className={cn(
        // layout + superfície premium (blur + translucidez)
        "w-full bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur",
        sticky && "sticky top-0 z-40",
        withBorder && "border-b border-border",
	withBorder && "mb-4",
        className
      )}
      role="banner"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex h-14 items-center justify-between">
          {/* Botão de voltar - icon only */}
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="rounded-xl hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Voltar"
          >
            <Link
  href={backHref}
  aria-label="Voltar"
  className="flex items-center justify-center h-6 w-6 text-muted-foreground hover:text-foreground transition-colors"
>
  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
</Link>

          </Button>

          {/* Título central com truncamento elegante */}
          {title ? (
            <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-base font-semibold tracking-tight text-foreground sm:text-lg">
              <span className="line-clamp-1">{title}</span>
            </h1>
          ) : null}

          {/* Ações à direita */}
          <div className="flex items-center gap-2">{rightSlot}</div>
        </div>
      </div>
    </header>
  );
}
