"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSmartBack(fallbackHref = "/dashboard") {
  const router = useRouter();

  return useCallback(() => {
    const lastPath = sessionStorage.getItem("lastPath");

    if (lastPath && lastPath !== window.location.pathname) {
      router.push(lastPath);
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);
}
