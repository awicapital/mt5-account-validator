// src/components/ui/pill.tsx
"use client";

import * as React from "react";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  dotColor?: string; // ex: "bg-emerald-400"
}

export function Pill({
  children,
  dotColor = "bg-emerald-400",
  className = "",
  ...props
}: PillProps) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ${className}`}
      {...props}
    >
      <span
        className={`inline-flex h-2 w-2 rounded-full ${dotColor} shadow-[0_0_0_3px_rgba(16,185,129,0.15)]`}
      />
      {children}
    </span>
  );
}
