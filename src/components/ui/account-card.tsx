"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

export interface AccountCardProps {
  account: {
    account_number: string;
    ea_name?: string;
    balance: number;
    pnl_total?: number | null;
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
  signDisplay: "exceptZero",
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
      ? "text-white/60"
      : pnl > 0
      ? "text-emerald-400"
      : pnl < 0
      ? "text-rose-400"
      : "text-white";

  const series: number[] = useMemo(() => account.sparkline ?? [], [account.sparkline]);

  const [animKey, setAnimKey] = useState(0);
  const seriesSignature = useMemo(() => series.join("|"), [series]);

  useEffect(() => setAnimKey((k) => k + 1), [seriesSignature]);

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

  const BaseCard = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <Card
      className={[
        // surface premium
        "rounded-2xl border border-white/10 bg-[#0f1b2d]/80",
        "bg-[radial-gradient(100%_100%_at_0%_0%,rgba(38,139,255,0.12),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.06),transparent_50%)]",
        "backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]",
        // interactive
        "transition-colors",
        "hover:border-white/20",
        "focus-within:ring-2 focus-within:ring-[#268bff]/50",
        "px-5 py-4",
        className,
      ].join(" ")}
      role="group"
      aria-label={`Account ${account.account_number}`}
    >
      {children}
    </Card>
  );

  // === Fallback sem dados ===
  if (series.length === 0) {
    return (
      <BaseCard>
        <div className="grid grid-cols-[minmax(90px,auto)_1fr_minmax(120px,auto)] items-center gap-x-4 text-white">
          {/* Cabeçalho */}
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">
            Account
          </span>
          <div />
          <span className="text-[11px] font-medium uppercase tracking-wide text-right text-white/60">
            Resume
          </span>

          {/* Conteúdo */}
          <div className="text-sm sm:text-base font-semibold">{account.account_number}</div>

          <div className="row-span-2 flex h-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs sm:text-sm text-white/70">
            Sem dados para exibir
          </div>

          <div className="text-right text-sm sm:text-base font-semibold">
            {usd.format(account.balance)}
          </div>

          <div className="text-xs sm:text-sm font-medium text-white/80">
            {account.ea_name || "—"}
          </div>
          <div className={`text-right text-xs sm:text-sm font-semibold ${pnlColor}`}>
            {pnl == null ? "—" : num2.format(pnl)}
          </div>
        </div>
      </BaseCard>
    );
  }

  // === Com dados ===
  return (
    <BaseCard>
      <div className="grid grid-cols-[minmax(90px,auto)_1fr_minmax(120px,auto)] items-center gap-x-4 text-white">
        {/* Cabeçalho */}
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">
          Account
        </span>
        <div />
        <span className="text-[11px] font-medium uppercase tracking-wide text-right text-white/60">
          Resume
        </span>

        {/* Coluna 1 */}
        <div className="text-sm sm:text-base font-semibold">
          {account.account_number}
        </div>

        {/* Coluna 2 — gráfico */}
        <div className="row-span-2 flex items-center justify-center px-1 sm:px-2">
          <motion.div
            key={animKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none h-12 sm:h-14 md:h-16 w-full"
            aria-hidden
            aria-label="Mini gráfico de desempenho da conta"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <ReferenceLine
                  y={avg}
                  stroke="#93c5fd"
                  strokeOpacity={0.25}
                  strokeDasharray="3 5"
                />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "rgba(15,27,45,0.9)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "#fff",
                    padding: "6px 8px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => num2.format(v)}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="url(#lineGrad)"
                  strokeWidth={2.5}
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

        {/* Coluna 3 */}
        <div className="text-right text-sm sm:text-base font-semibold">
          {usd.format(account.balance)}
        </div>

        <div className="text-xs sm:text-sm font-medium text-white/80">
          {account.ea_name || "—"}
        </div>
        <div className={`text-right text-sm sm:text-base font-semibold ${pnlColor}`}>
          {pnl == null ? "—" : num2.format(pnl)}
        </div>
      </div>
    </BaseCard>
  );
}

export const AccountCard = memo(AccountCardBase);
export type { AccountCardProps as TAccountCardProps };
