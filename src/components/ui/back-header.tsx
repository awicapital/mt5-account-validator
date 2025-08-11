"use client";

import { ReactNode, useCallback, MouseEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface BackHeaderProps {
  backHref?: string;          // (compat) se informado, sempre navega para esse href
  backLabel?: string;         // (compat) ignorado visualmente; usamos só o ícone
  fallbackHref?: string;      // fallback quando não houver histórico (padrão: /dashboard)
  title?: string;
  rightSlot?: ReactNode;      // ícones/botões no canto direito
  className?: string;
  sticky?: boolean;           // deixa colado no topo
  withBorder?: boolean;       // borda inferior opcional
}

export function BackHeader({
  backHref,
  backLabel, // mantido apenas por compatibilidade
  fallbackHref = "/dashboard",
  title,
  rightSlot,
  className,
  sticky = true,
  withBorder = true,
}: BackHeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();

      // compat: se o dev passou backHref, priorizamos ele
      if (backHref) {
        router.push(backHref);
        return;
      }

      const canGoBack =
        typeof window !== "undefined" && window.history.length > 1;

      if (canGoBack) router.back();
      else router.push(fallbackHref);
    },
    [backHref, fallbackHref, router]
  );

  return (
    <header
      className={cn(
        "w-full bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur",
        sticky && "sticky top-0 z-40",
        withBorder && "border-b border-border",
        withBorder && "mb-4",
        className
      )}
      role="banner"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Linha do header */}
        <div className="relative flex h-14 items-center justify-center overflow-visible">
          {/* Botão de voltar colado na borda (respeita safe area) */}
          <Button
            // não usar size="icon" para não centralizar o ícone
            variant="ghost"
            onClick={handleBack}
            aria-label={backLabel ?? "Voltar"}
            className={cn(
              "absolute left-0 top-0 h-14 w-12 px-0",
              "rounded-none justify-start",
              "hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
            )}
            style={{ paddingLeft: "max(env(safe-area-inset-left), 0px)" }}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Button>

          {/* Título central (opcional) */}
          {title ? (
            <h1 className="pointer-events-none select-none text-base font-semibold tracking-tight text-foreground sm:text-lg">
              <span className="line-clamp-1">{title}</span>
            </h1>
          ) : null}

          {/* Ações à direita (espelha safe area) */}
          <div
            className="absolute right-0 top-0 flex h-14 items-center gap-2 pr-0"
            style={{ paddingRight: "max(env(safe-area-inset-right), 0px)" }}
          >
            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  );
}
