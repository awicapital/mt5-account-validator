"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";

import { supabase } from "@/lib/supabase";
import { fetchAccountsData, Trade } from "@/lib/accountsData";
import { DashboardCalendar, DailyPnL } from "@/components/ui/dashboard-calendar";
import { DashboardPnLCard } from "@/components/ui/dashboard-pnl-card";

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
  const [monthlyGrowthPositive, setMonthlyGrowthPositive] = useState<boolean>(true);
  const [hasAccountData, setHasAccountData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
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

      setHasAccountData(!accountsError && accounts && accounts.length > 0);

      const accountsData = await fetchAccountsData();

      if (accountsData) {
        const parsed: DailyPnL[] = Object.entries(accountsData.dailyPnls).map(
          ([date, pnl]) => ({
            date: date.replaceAll(".", "-"),
            pnl: typeof pnl === "number" ? pnl : 0,
          })
        );

        setDailyPnls(parsed);
        setAllTrades(accountsData.trades);

        const trades = accountsData.trades;

        const totalPnL = trades
          .filter((t) => t.type !== "deposit")
          .reduce((sum, t) => sum + t.profit, 0);

        const fullBalance = accountsData.totalDeposits + totalPnL;
        setBalance(fullBalance);

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pnlThisMonth = trades
          .filter((t) => t.type !== "deposit" && new Date(t.date) >= thisMonth)
          .reduce((sum, t) => sum + t.profit, 0);

        const capitalBeforeMonth = trades
          .filter((t) => new Date(t.date) < thisMonth)
          .reduce((sum, t) => sum + t.profit, 0);

        const growth =
          capitalBeforeMonth > 0
            ? Number(((pnlThisMonth / capitalBeforeMonth) * 100).toFixed(2))
            : 0;

        setMonthlyGrowthPercent(growth);
        setMonthlyGrowthPositive(pnlThisMonth >= 0);
      }

      setLoading(false);
    };

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
      <div className="h-dvh flex items-center justify-center text-white bg-[#03182f]">
        Usuário não encontrado.
      </div>
    );
  }

  const tradesByAccount = allTrades
    .filter((t) => selectedDay && t.date.split("T")[0] === selectedDay)
    .reduce<Record<string, Trade[]>>((acc, trade) => {
      if (!acc[trade.accountId]) acc[trade.accountId] = [];
      acc[trade.accountId].push(trade);
      return acc;
    }, {});

  return (
    <div className="pb-6 bg-[#03182f] min-h-dvh space-y-6 text-white lg:px-8">
      <DashboardPnLCard
        balance={balance}
        growthPercent={monthlyGrowthPercent}
        growthPositive={monthlyGrowthPositive}
      />

      <div className={hasAccountData ? "" : "opacity-30 pointer-events-none"}>
        <DashboardCalendar
          dailyPnls={dailyPnls}
          trades={allTrades}
          onDaySelect={(day) => setSelectedDay(day)}
        />
      </div>

      {selectedDay && (
        <div className="mt-6 space-y-6">
          {Object.entries(tradesByAccount).map(([accountId, trades]) => (
            <div
              key={`account-${accountId}`}
              className="bg-[#0f172a] border border-white/10 rounded-lg p-4"
            >
              <h3 className="text-sm text-white/70 mb-2">
                Conta {accountId}
              </h3>
              <ul className="text-sm space-y-2">
                {trades.map((trade) => (
                  <li
                    key={trade.id}
                    className="grid grid-cols-5 gap-2 border-b border-white/5 pb-1 text-white/90"
                  >
                    <span className="col-span-1 text-white/70">
                      {dayjs(trade.date).format("HH:mm")}
                    </span>
                    <span className="col-span-1">{trade.symbol || "---"}</span>
                    <span className="col-span-1">{trade.volume?.toFixed(2)} lot</span>
                    <span className="col-span-1 capitalize">{trade.type}</span>
                    <span
                      className={
                        trade.profit > 0
                          ? "text-green-500 text-right"
                          : trade.profit < 0
                          ? "text-red-500 text-right"
                          : "text-white text-right"
                      }
                    >
                      {trade.profit.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
