"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  ReferenceLine,
} from "recharts";

export interface AccountCardProps {
  account: {
    account_number: string;
    ea_name?: string;
    balance: number;
    pnl_total?: number;
    is_active: boolean;
    sparkline?: number[];
  };
  className?: string;
  /** Reexecuta a animação do gráfico a cada N ms (default: 15000 = 15s) */
  refreshMs?: number;
  /** Duração da animação do traço (ms) */
  animDurationMs?: number;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AccountCard({
  account,
  className = "",
  refreshMs = 15000,
  animDurationMs = 1200,
}: AccountCardProps) {
  const pnl = account.pnl_total ?? null;
  const pnlSign = pnl != null && pnl > 0 ? "+" : "";
  const pnlColor =
    pnl == null
      ? "text-muted-foreground"
      : pnl > 0
      ? "text-emerald-400"
      : pnl < 0
      ? "text-red-500"
      : "text-foreground";

  const series: number[] = account.sparkline ?? [];

  // ---- Animação periódica ----
  const [animKey, setAnimKey] = useState(0);
  const seriesSignature = useMemo(() => series.join("|"), [series]);

  useEffect(() => {
    setAnimKey((k) => k + 1); // reanima quando dados mudam
  }, [seriesSignature]);

  useEffect(() => {
    if (!series.length) return;
    const id = setInterval(() => setAnimKey((k) => k + 1), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, series.length]);

  // === Fallback sem dados ===
  if (series.length === 0) {
    return (
      <Card className={`rounded-xl border border-[#1e3a56] bg-[#1e293b] px-4 py-2.5 ${className}`}>
        <div className="grid grid-cols-[minmax(72px,auto)_1fr_minmax(90px,auto)] items-center gap-y-1 text-[10px] leading-[1.25] text-white">
          {/* Linha 1: Títulos */}
          <span className="text-muted-foreground">Account</span>
          <div />
          <span className="text-muted-foreground text-right">Resume</span>

          {/* Linha 2: número / gráfico / balance */}
          <span>{account.account_number}</span>
          <div className="row-span-2 flex items-center justify-center px-3 text-xs text-muted-foreground">
            Sem dados para exibir
          </div>
          <span className="text-right">{usd.format(account.balance)}</span>

          {/* Linha 3: EA / (gráfico já ocupa) / PnL */}
          <span className="font-semibold">{account.ea_name || "—"}</span>
          <span className={`font-semibold text-right ${pnlColor}`}>
            {pnl == null ? "—" : `${pnlSign}${num2.format(Math.abs(pnl))}`}
          </span>
        </div>
      </Card>
    );
  }

  // === Com dados ===
  const data = useMemo(() => series.map((v, i) => ({ i, v })), [series]);
  const avg = useMemo(
    () => (data.length ? data.reduce((s, p) => s + p.v, 0) / data.length : 0),
    [data]
  );

  return (
    <Card className={`rounded-xl border border-[#1e3a56] bg-[#1e293b] px-4 py-2.5 ${className}`}>
      <div className="grid grid-cols-[minmax(72px,auto)_1fr_minmax(90px,auto)] items-center gap-y-1 text-[10px] leading-[1.25] text-white">
        {/* Linha 1: Títulos */}
        <span className="text-muted-foreground">Account</span>
        <div />
        <span className="text-muted-foreground text-right">Resume</span>

        {/* Linha 2: número / gráfico / balance */}
        <span>{account.account_number}</span>

        {/* Gráfico ocupa duas linhas para ficar centralizado */}
        <div className="row-span-2 flex justify-center px-3">
          <motion.div
            key={animKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="h-10 w-28 sm:w-32 pointer-events-none"
            aria-hidden
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                key={`chart-${animKey}`}
                data={data}
                margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
              >
                <ReferenceLine y={avg} stroke="#10b981" strokeOpacity={0.25} strokeDasharray="2 4" />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line
                  key={`line-${animKey}`}
                  type="monotone"
                  dataKey="v"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={animDurationMs}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <span className="text-right">{usd.format(account.balance)}</span>

        {/* Linha 3: EA / (gráfico já ocupa) / PnL */}
        <span className="font-semibold">{account.ea_name || "—"}</span>
        <span className={`font-semibold text-right ${pnlColor}`}>
          {pnl == null ? "—" : `${pnlSign}${num2.format(Math.abs(pnl))}`}
        </span>
      </div>
    </Card>
  );
}
