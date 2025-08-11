"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, YAxis, ReferenceLine } from "recharts";

export interface AccountCardProps {
  account: {
    account_number: string;
    ea_name?: string;
    balance: number;
    pnl_total?: number | null; // aceita null
    is_active: boolean;
    sparkline?: number[];
  };
  className?: string;
  refreshMs?: number;
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
  signDisplay: "exceptZero", // + para positivos, − para negativos, nada para zero
});

function AccountCardBase({
  account,
  className = "",
  refreshMs = 15000,
  animDurationMs = 1200,
}: AccountCardProps) {
  const pnl = account.pnl_total ?? null;

  const pnlColor =
    pnl == null
      ? "text-muted-foreground"
      : pnl > 0
      ? "text-emerald-400"
      : pnl < 0
      ? "text-red-500"
      : "text-foreground";

  // series memoizada
  const series: number[] = useMemo(() => account.sparkline ?? [], [account.sparkline]);

  // animação periódica
  const [animKey, setAnimKey] = useState(0);
  const seriesSignature = useMemo(() => series.join("|"), [series]);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [seriesSignature]);

  useEffect(() => {
    if (!series.length) return;
    const id = setInterval(() => setAnimKey((k) => k + 1), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, series.length]);

  const data = useMemo(() => series.map((v, i) => ({ i, v })), [series]);
  const avg = useMemo(
    () => (data.length ? data.reduce((s, p) => s + p.v, 0) / data.length : 0),
    [data]
  );

  // === Fallback sem dados ===
  if (series.length === 0) {
    return (
      <Card
        className={`rounded-xl border border-[#1e3a56] bg-[#1e293b] px-4 py-2.5 ${className}`}
        role="group"
        aria-label={`Account ${account.account_number}`}
      >
        <div className="grid grid-cols-[minmax(72px,auto)_1fr_minmax(96px,auto)] items-center gap-x-3 gap-y-0 text-[10px] leading-tight text-white">
          <span className="text-muted-foreground">Account</span>
          <div />
          <span className="text-muted-foreground text-right">Resume</span>

          <span>{account.account_number}</span>

          <div className="row-span-2 flex items-center justify-center px-2 h-10 sm:h-11 md:h-12 lg:h-14 text-xs text-muted-foreground">
            Sem dados para exibir
          </div>

          <span className="text-right">{usd.format(account.balance)}</span>

          <span className="font-semibold">{account.ea_name || "—"}</span>
          <span className={`font-semibold text-right ${pnlColor}`}>
            {pnl == null ? "—" : num2.format(pnl)}
          </span>
        </div>
      </Card>
    );
  }

  // === Com dados ===
  return (
    <Card
      className={`rounded-xl border border-[#1e3a56] bg-[#1e293b] px-4 py-2.5 ${className}`}
      role="group"
      aria-label={`Account ${account.account_number}`}
    >
      <div className="grid grid-cols-[minmax(72px,auto)_1fr_minmax(96px,auto)] items-center gap-x-3 gap-y-0 text-[10px] leading-tight text-white">
        <span className="text-muted-foreground">Account</span>
        <div />
        <span className="text-muted-foreground text-right">Resume</span>

        <span>{account.account_number}</span>

        {/* MEIO — gráfico ocupa todo o 1fr, responsivo */}
        <div className="row-span-2 flex items-center justify-center px-2">
          <motion.div
            key={animKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="h-10 sm:h-11 md:h-12 lg:h-14 w-full pointer-events-none"
            aria-hidden
            aria-label="Mini gráfico de desempenho da conta"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <ReferenceLine y={avg} stroke="#10b981" strokeOpacity={0.25} strokeDasharray="2 4" />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line
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

        <span className="font-semibold">{account.ea_name || "—"}</span>
        <span className={`font-semibold text-right ${pnlColor}`}>
          {pnl == null ? "—" : num2.format(pnl)}
        </span>
      </div>
    </Card>
  );
}

export const AccountCard = memo(AccountCardBase);
export type { AccountCardProps as TAccountCardProps };