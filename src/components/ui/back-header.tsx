"use client";

import Link from "next/link";
import { ReactNode, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface BackHeaderProps {
  backHref?: string;          // opcional: se informado, força navegar para esse href
  fallbackHref?: string;      // para quando não há origem; padrão: /dashboard
  title?: string;
  rightSlot?: ReactNode;      // ícones/botões no canto direito
  className?: string;
  sticky?: boolean;           // opcional: deixa colado no topo
  withBorder?: boolean;       // opcional: mostra/oculta a borda inferior
}

export function BackHeader({
  backHref,
  fallbackHref = "/dashboard",
  title,
  rightSlot,
  className,
  sticky = true,
  withBorder = true,
}: BackHeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();

      // Se um backHref explícito foi passado, usa ele sempre
      if (backHref) {
        router.push(backHref);
        return;
      }

      // Tenta voltar se houver histórico de navegação
      const hasHistory = typeof window !== "undefined" && window.history.length > 1;
      const sameOriginReferrer =
        typeof document !== "undefined" &&
        !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin;

      if (hasHistory && sameOriginReferrer) {
        router.back();
        return;
      }

      // Fallback: vai para a home do dashboard
      router.push(fallbackHref);
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
        <div className="relative flex h-14 items-center justify-between">
          {/* Botão de voltar */}
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Voltar"
            onClick={handleBack}
          >
            {/* Usa <Link> apenas se houver backHref explícito (melhor para SEO/hover) */}
            {backHref ? (
              <Link
                href={backHref}
                aria-label="Voltar"
                className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  handleBack(e);
                }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <ArrowLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
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
