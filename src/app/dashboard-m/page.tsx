//
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CalendarPNL } from "@/components/ui/calendar-pnl";

interface Account {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
  pnl_total?: number;
}

export default function MobileDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUserAndData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user?.email) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email;
      setEmail(userEmail);

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", userEmail);

      if (!accountsData) {
        setLoading(false);
        return;
      }

      const enhancedAccounts = await Promise.all(
        accountsData.map(async (account: Account) => {
          try {
            const path = `${account.account_number}.json`;
            const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
            if (!urlData?.publicUrl) return account;

            const res = await fetch(urlData.publicUrl);
            if (!res.ok) return account;

            const trades: { profit: number; type: string; date: string }[] = await res.json();
            let pnl = 0;

            for (const trade of trades) {
              if (trade.type !== "deposit") {
                pnl += trade.profit;
              }
            }

            return {
              ...account,
              pnl_total: pnl,
            };
          } catch (error) {
            console.error("Erro ao calcular PNL:", error);
            return account;
          }
        })
      );

      console.log("Contas carregadas com PNL:", enhancedAccounts);
      setAccounts(enhancedAccounts);
      setLoading(false);
    };

    fetchUserAndData();
  }, [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-2 space-y-6 bg-[#03182f] min-h-dvh pb-28">
      <h1 className="text-lg font-semibold text-white">Calendário</h1>

      <div className="text-xs text-white/50">
        <div>Email: {email}</div>
        <div>Contas carregadas: {accounts.length}</div>
      </div>

      {email && accounts.length > 0 ? (
        <CalendarPNL email={email} accounts={accounts} />
      ) : (
        <div className="text-sm text-white/60">Nenhuma conta encontrada.</div>
      )}
    </div>
  );
}
