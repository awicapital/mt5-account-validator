import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface DashboardPnLCardProps {
  balance: number;
  growthPercent: number;
  growthPositive?: boolean;
  className?: string;
}

export function DashboardPnLCard({
  balance,
  growthPercent,
  growthPositive = true,
  className,
}: DashboardPnLCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <Card
      className={cn(
        // === VISUAL PREMIUM ===
        "rounded-2xl border border-white/10 bg-[#0f1b2d]/80",
        "bg-[radial-gradient(100%_100%_at_0%_0%,rgba(38,139,255,0.12),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.06),transparent_50%)]",
        "backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]",
        // === INTERAÇÕES ===
        "transition-colors hover:border-white/20 focus-within:ring-2 focus-within:ring-[#268bff]/50",
        "text-white",
        className
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Título */}
        <p className="text-sm font-medium text-white">Total Balance</p>

        {/* Linha: Valor + olho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {showBalance
                ? `$${balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`
                : "********"}
            </h2>
            <button onClick={() => setShowBalance((prev) => !prev)}>
              {showBalance ? (
                <Eye className="w-5 h-5 text-white/80" />
              ) : (
                <EyeOff className="w-5 h-5 text-white/80" />
              )}
            </button>
          </div>
        </div>

        {/* Indicador de crescimento */}
        <div
          className={cn(
            "text-sm w-fit px-3 py-1 rounded-full flex items-center gap-1 font-semibold",
            growthPositive
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-rose-500/20 text-rose-300"
          )}
        >
          <span>{growthPositive ? "▲" : "▼"}</span>
          <span>{growthPercent}%</span>
          <span className="text-white/80">in this past month</span>
        </div>
      </CardContent>
    </Card>
  );
}
