// components/ui/toggle-group.tsx
"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export const ToggleGroup = ToggleGroupPrimitive.Root;

export const ToggleGroupItem = ({
  className,
  ...props
}: ToggleGroupPrimitive.ToggleGroupItemProps) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white transition-colors hover:bg-white/20 data-[state=on]:bg-white/30 data-[state=on]:text-white",
      className
    )}
    {...props}
  />
);
