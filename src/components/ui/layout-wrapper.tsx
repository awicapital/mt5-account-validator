"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import MobileHeader from "./mobile-header";
import MobileNav from "./mobile-nav";
import { Toaster } from "./sonner";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const path = usePathname() || "";
  const hideLayout = path === "/login" || path === "/register";

  return (
    <>
      {!hideLayout && <MobileHeader />}
      <main className="pt-[72px] px-4 md:px-8 py-6">{children}</main>
      {!hideLayout && <MobileNav />}
      <Toaster richColors position="top-center" />
    </>
  );
}
