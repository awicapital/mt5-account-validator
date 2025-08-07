"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { supabase } from "@/lib/supabase";
import { fetchAccountsData, Trade, DailyPnL } from "@/lib/accountsData";
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [monthlyGrowthPercent, setMonthlyGrowthPercent] = useState<number>(0);
  const [monthlyGrowthPositive, setMonthlyGrowthPositive] =
    useState<boolean>(true);
  const [hasAccountData, setHasAccountData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
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
        // transforma dailyPnls
        const parsedDaily: DailyPnL[] = Object.entries(
          accountsData.dailyPnls
        ).map(([date, pnl]) => ({
          date: date.replaceAll(".", "-"),
          pnl: typeof pnl === "number" ? pnl : 0,
        }));
        setDailyPnls(parsedDaily);
        setAllTrades(accountsData.trades);

        // total balance
        const nonDeposits = accountsData.trades.filter(
          (t) => t.type !== "deposit"
        );
        const totalPnL = nonDeposits.reduce((sum, t) => sum + t.profit, 0);
        setBalance(accountsData.totalDeposits + totalPnL);

        // growth mensal
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const pnlThisMonth = nonDeposits
          .filter((t) => new Date(t.date) >= firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const capitalBeforeMonth = nonDeposits
          .filter((t) => new Date(t.date) < firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const growth =
          capitalBeforeMonth > 0
            ? Number(((pnlThisMonth / capitalBeforeMonth) * 100).toFixed(2))
            : 0;
        setMonthlyGrowthPercent(growth);
        setMonthlyGrowthPositive(pnlThisMonth >= 0);
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f]">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f] text-white">
        Usuário não encontrado.
      </div>
    );
  }

  // agrupa trades do dia selecionado por conta
  const tradesByAccount: Record<string, Trade[]> = {};
  if (selectedDay) {
    allTrades
      .filter((t) => t.date.split("T")[0] === selectedDay)
      .forEach((trade) => {
        tradesByAccount[trade.accountId] = tradesByAccount[trade.accountId] || [];
        tradesByAccount[trade.accountId].push(trade);
      });
  }

  return (
    <div className="pb-6 bg-[#03182f] min-h-dvh space-y-6 lg:px-8 text-white">
      {/* Card principal de PnL */}
      <DashboardPnLCard
        balance={balance}
        growthPercent={monthlyGrowthPercent}
        growthPositive={monthlyGrowthPositive}
      />

      {/* Calendário */}
      <div className={`${hasAccountData ? "opacity-100" : "opacity-30"} transition-opacity`}>
        <DashboardCalendar
          dailyPnls={dailyPnls}
          trades={allTrades}
          onDaySelect={setSelectedDay}
        />
      </div>

      {/* Cards por conta para o dia selecionado */}
      {selectedDay && (
        <div className="mt-6 space-y-6">
          {Object.entries(tradesByAccount).map(([accountId, trades]) => {
            // dia da semana com inicial maiúscula
            const weekday = dayjs(selectedDay).format("dddd");
            const weekdayCap = weekday[0].toUpperCase() + weekday.slice(1);

            return (
              <div
                key={accountId}
                className="
                  rounded-2xl
                  border border-blue-600/30
                  bg-[#1e293b]/80 backdrop-blur-sm
                  p-4
                  shadow-lg
                "
              >
                {/* Cabeçalho com dia da semana e conta */}
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-sm font-medium text-white">
                    {weekdayCap}
                  </span>
                  <span className="text-xs text-white/70">
                    Conta {accountId}
                  </span>
                </div>

                {/* Lista de trades */}
                {trades.length === 0 ? (
                  <p className="text-xs text-white/70">
                    Nenhum trade registrado.
                  </p>
                ) : (
                  <div className="divide-y divide-[#334155]">
                    {trades.map((trade) => (
                      <div
                        key={trade.id}
                        className="grid grid-cols-5 gap-2 py-2 text-xs"
                      >
                        <span className="text-white/70">
                          {dayjs(trade.date).format("HH:mm")}
                        </span>
                        <span>{trade.symbol || "---"}</span>
                        <span>{trade.volume?.toFixed(2)} lot</span>
                        <span className="flex justify-center">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                              trade.type === "buy"
                                ? "bg-green-600/20 border-green-600 text-green-500"
                                : "bg-red-600/20 border-red-600 text-red-500"
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </span>
                        <span
                          className={`text-right ${
                            trade.profit > 0
                              ? "text-green-500"
                              : trade.profit < 0
                              ? "text-red-500"
                              : "text-white"
                          }`}
                        >
                          {trade.profit.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasAccountData && (
        <p className="text-center text-sm text-white/70">
          Aguardando dados das contas...
        </p>
      )}
    </div>
  );
}
