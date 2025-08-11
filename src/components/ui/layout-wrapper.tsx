"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import MobileHeader from "./mobile-header";
import MobileNav from "./mobile-nav";
import { Toaster } from "./sonner";
import { cn } from "@/lib/utils";

interface LayoutWrapperProps {
  children: ReactNode;
}

/**
 * Estrutura:
 * [Header fixo 72px]  -> compensa no <main> com pt
 * [Main scrollável]   -> overflow-y-auto
 * [Nav fixa 64px]     -> compensa no <main> com pb
 * Safe areas iOS: top/bottom via env()
 */
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const path = usePathname() || "";
  const hideLayout = path === "/login" || path === "/register";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* HEADER FIXO */}
      {!hideLayout && (
        <header className="fixed inset-x-0 top-0 z-50 h-[72px] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* padding-top para safe area (notch) */}
          <div className="h-full pt-[env(safe-area-inset-top)]">
            <div className="h-full">
              <MobileHeader />
            </div>
          </div>
        </header>
      )}

      {/* CONTEÚDO SCROLLÁVEL */}
      <main
        className={cn(
          "flex-1 overflow-y-auto px-4 md:px-8 py-6",
          !hideLayout && [
            "pt-[calc(env(safe-area-inset-top)+72px)]",
            "pb-[calc(env(safe-area-inset-bottom)+64px)]",
          ]
        )}
      >
        {children}
      </main>

      {/* NAV FIXA */}
      {!hideLayout && (
        <nav className="fixed inset-x-0 bottom-0 z-50 h-[64px] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="pb-[env(safe-area-inset-bottom)] h-full">
            <MobileNav />
          </div>
        </nav>
      )}

      <Toaster richColors position="top-center" />
    </div>
  );
}
