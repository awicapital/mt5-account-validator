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

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const path = usePathname() || "";
  const hideLayout = path === "/login" || path === "/register";

  return (
    <div className={cn("relative flex min-h-[100dvh] flex-col bg-background")}>
      {!hideLayout && <MobileHeader />}

      <main
        className={cn(
          "flex-1 px-4 md:px-8 py-6",
          // reserva: header fixo (72px) + bottom-nav fixa (64px) + safe-area
          !hideLayout && "pt-[72px] pb-[calc(env(safe-area-inset-bottom)+64px)]"
        )}
      >
        {children}
      </main>

      {!hideLayout && <MobileNav />}

      <Toaster richColors position="top-center" />
    </div>
  );
}
