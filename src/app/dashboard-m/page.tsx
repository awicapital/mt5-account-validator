"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { fetchAccountsData, Trade } from "@/lib/accountsData";
import { DashboardUserCard } from "@/components/ui/dashboard-user-card";
import { DashboardCalendar, DailyPnL } from "@/components/ui/dashboard-calendar";

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
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [hasAccountData, setHasAccountData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
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

      const accountsData = await fetchAccountsData();

      if (accountsData && accountsData.dailyPnls && accountsData.trades) {
        const parsed: DailyPnL[] = Object.entries(accountsData.dailyPnls).map(
          ([date, pnl]) => ({
            date: date.replaceAll(".", "-"),
            pnl: typeof pnl === "number"
              ? pnl
              : Object.values(pnl as Record<string, number>).reduce(
                  (sum, val) => sum + val,
                  0
                ),
          })
        );

        setDailyPnls(parsed);
        setTotalTrades(accountsData.trades.length);
        setHasAccountData(true);
      } else {
        setHasAccountData(false);
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

  return (
    <div className="p-4 bg-[#03182f] min-h-dvh pb-28 space-y-6 text-white">
      <DashboardUserCard
        name={user.full_name}
        email={user.email}
        role={user.access_level}
        avatarUrl={user.avatar_url || undefined}
      />

      <div className={hasAccountData ? "" : "opacity-30 pointer-events-none"}>
        <DashboardCalendar dailyPnls={dailyPnls} />
      </div>

      {!hasAccountData && (
        <p className="text-center text-sm text-white/70">
          Aguardando dados das contas...
        </p>
      )}
    </div>
  );
}
