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

      if (accountsData) {
        setAccounts(accountsData as Account[]);
      }

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
    <div className="p-4 space-y-6 bg-[#03182f] min-h-dvh pb-28">
      <h1 className="text-lg font-semibold text-white">Calendário</h1>
      {email && accounts.length > 0 ? (
        <CalendarPNL email={email} accounts={accounts} />
      ) : (
        <div className="text-sm text-white/60">Nenhuma conta encontrada.</div>
      )}
    </div>
  );
}
