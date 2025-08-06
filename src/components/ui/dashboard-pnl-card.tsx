import { Eye, EyeOff, Plus } from "lucide-react";
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
        "bg-[#1d2a44] text-white rounded-xl border border-blue-500",
        "transition-colors duration-300",
        className
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Título branco puro */}
        <p className="text-sm text-white font-medium">Total Balance</p>

        {/* Linha: valor + olho + botão grande */}
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
          {/* Botão + grande e azul */}
          <div className="w-12 h-12 rounded-full bg-[#268bff] flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Indicador de crescimento */}
        <div
          className={cn(
            "text-sm w-fit px-3 py-1 rounded-full flex items-center gap-1 font-semibold",
            growthPositive
              ? "bg-green-600/20 text-green-300"
              : "bg-red-600/20 text-red-300"
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
