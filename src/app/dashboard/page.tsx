"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { supabase } from "@/lib/supabase";
import { fetchAccountsData, Trade } from "@/lib/accountsData";
import type { DailyPnL } from "@/components/ui/dashboard-calendar";
import { DashboardCalendar } from "@/components/ui/dashboard-calendar";
import { DashboardPnLCard } from "@/components/ui/dashboard-pnl-card";

dayjs.locale("pt-br");

interface UserProfile {
  id: string;
  full_name?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

export default function DashboardMPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [monthlyGrowthPercent, setMonthlyGrowthPercent] = useState<number>(0);
  const [monthlyGrowthPositive, setMonthlyGrowthPositive] = useState<boolean>(true);
  const [hasAccountData, setHasAccountData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getUser();
      const email = session?.user?.email;
      if (!email) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, email, access_level, avatar_url")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        setLoading(false);
        return;
      }
      setUser(profile);

      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select("is_active")
        .eq("email", profile.email);
      setHasAccountData(!accountsError && !!accounts && accounts.length > 0);

      const accountsData = await fetchAccountsData();
      if (accountsData) {
        const parsedDaily: DailyPnL[] = Object.entries(accountsData.dailyPnls).map(([date, pnl]) => ({
          date: date.replaceAll(".", "-"),
          pnl: typeof pnl === "number" ? pnl : 0,
        }));
        setDailyPnls(parsedDaily);
        setAllTrades(accountsData.trades);

        const nonDeposits = accountsData.trades.filter((t) => t.type !== "deposit");
        const totalPnL = nonDeposits.reduce((sum, t) => sum + t.profit, 0);
        setBalance(accountsData.totalDeposits + totalPnL);

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const pnlThisMonth = nonDeposits
          .filter((t) => new Date(t.date) >= firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const capitalBeforeMonth = nonDeposits
          .filter((t) => new Date(t.date) < firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const growth = capitalBeforeMonth > 0 ? Number(((pnlThisMonth / capitalBeforeMonth) * 100).toFixed(2)) : 0;
        setMonthlyGrowthPercent(growth);
        setMonthlyGrowthPositive(pnlThisMonth >= 0);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const tradesByAccount = useMemo(() => {
    if (!selectedDay) return {} as Record<string, Trade[]>;
    const map: Record<string, Trade[]> = {};
    allTrades
      .filter((t) => t.type !== "deposit" && t.date.split("T")[0] === selectedDay)
      .forEach((trade) => {
        (map[trade.accountId] = map[trade.accountId] || []).push(trade);
      });
    return map;
  }, [allTrades, selectedDay]);

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[#03182f]">
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[#03182f] text-white">
        Usuário não encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#03182f] pb-[calc(84px+env(safe-area-inset-bottom))] text-white">
      <main className="mx-auto max-w-6xl space-y-6 pt-4 lg:px-8">
        {/* Card principal de PnL */}
        <div className="relative z-30">
          <DashboardPnLCard
            balance={balance}
            growthPercent={monthlyGrowthPercent}
            growthPositive={monthlyGrowthPositive}
          />
        </div>

        {/* Calendário */}
        <section className={`${hasAccountData ? "opacity-100" : "opacity-30"} transition-opacity`}>
          <DashboardCalendar dailyPnls={dailyPnls} trades={allTrades} onDaySelect={setSelectedDay} />
        </section>

        {/* Trades do dia selecionado */}
        {selectedDay && (
          <section className="space-y-4">
            {Object.entries(tradesByAccount).length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Nenhum trade registrado para este dia.
              </p>
            ) : (
              Object.entries(tradesByAccount).map(([accountId, trades]) => {
                const sum = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
                return (
                  <div
                    key={accountId}
                    className="rounded-2xl border border-blue-600/30 bg-[#0f1b2e]/80 p-4 shadow-lg backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Conta {accountId}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                          {trades.length} trade{trades.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          sum > 0 ? "text-emerald-400" : sum < 0 ? "text-rose-400" : "text-white/80"
                        }`}
                      >
                        {sum.toLocaleString("pt-BR", { style: "currency", currency: "USD" })}
                      </div>
                    </div>
                    <div className="divide-y divide-[#334155]">
                      <div className="grid grid-cols-5 gap-2 pb-2 text-[11px] text-white/50">
                        <span>Hora</span>
                        <span>Ativo</span>
                        <span>Lote</span>
                        <span className="text-center">Tipo</span>
                        <span className="text-right">Resultado</span>
                      </div>
                      {trades.map((trade) => (
                        <div key={trade.id} className="grid grid-cols-5 gap-2 py-2 text-xs">
                          <span className="text-white/70">{dayjs(trade.date).format("HH:mm")}</span>
                          <span className="truncate">{trade.symbol || "---"}</span>
                          <span>{trade.volume?.toFixed(2)} lot</span>
                          <span className="flex justify-center">
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                trade.type === "buy"
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                                  : "border-rose-500 bg-rose-500/15 text-rose-400"
                              }`}
                            >
                              {trade.type.toUpperCase()}
                            </span>
                          </span>
                          <span
                            className={`text-right ${
                              trade.profit > 0
                                ? "text-emerald-400"
                                : trade.profit < 0
                                ? "text-rose-400"
                                : "text-white"
                            }`}
                          >
                            {trade.profit.toLocaleString("pt-BR", { style: "currency", currency: "USD" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {!hasAccountData && (
          <p className="text-center text-sm text-white/70">Aguardando dados das contas…</p>
        )}
      </main>
    </div>
  );
}
