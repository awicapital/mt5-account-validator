"use client";

import { ReactNode, MouseEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSmartBack } from "@/lib/useSmartBack";

interface BackHeaderProps {
  backHref?: string;
  backLabel?: string;
  fallbackHref?: string;
  title?: string;
  rightSlot?: ReactNode;
  className?: string;
  sticky?: boolean;
  withBorder?: boolean;
}

export function BackHeader({
  backHref,
  backLabel,
  fallbackHref = "/dashboard",
  title,
  rightSlot,
  className,
  sticky = true,
  withBorder = true,
}: BackHeaderProps) {
  const smartBack = useSmartBack(fallbackHref);

  const handleBack = (e?: MouseEvent) => {
    e?.preventDefault();

    // Prioriza `backHref`, se definido
    if (backHref) {
      window.location.href = backHref;
      return;
    }

    smartBack();
  };

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
        <div className="relative flex h-14 items-center justify-center overflow-visible">
          <Button
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

          {title && (
            <h1 className="pointer-events-none select-none text-base font-semibold tracking-tight text-foreground sm:text-lg">
              <span className="line-clamp-1">{title}</span>
            </h1>
          )}

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
