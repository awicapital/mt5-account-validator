"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function HistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const prev = sessionStorage.getItem("currentPath");
    if (prev) sessionStorage.setItem("lastPath", prev);
    sessionStorage.setItem("currentPath", pathname);
  }, [pathname]);

  return null;
}
