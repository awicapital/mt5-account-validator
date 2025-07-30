"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Server } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Account {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
  pnl_today?: number | null;
}

function AccountCard({ account }: { account: Account }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const bgColor = useTransform(x, [-100, 0], ["#7f1d1d", "#131f35"]);

  return (
    <motion.div animate={controls} style={{ x, backgroundColor: bgColor }} className="overflow-hidden rounded-xl">
      <Card className="bg-transparent border border-[#1f2c44] text-white">
        <CardContent className="flex items-center justify-between p-4 space-x-4">
          <div className="bg-[#1e2b45] p-2 rounded-lg">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">
              #{account.account_number} — {account.ea_name || "Sem EA"}
            </div>
            <div className={`text-xs font-semibold mt-1 ${account.is_active ? "text-green-400" : "text-yellow-400"}`}>{account.is_active ? "Ativa" : "Pendente"}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">${account.balance?.toFixed(2) || "—"}</div>
            <div className={`text-xs font-semibold ${account.pnl_today ? (account.pnl_today > 0 ? "text-green-400" : "text-red-400") : "text-muted-foreground"}`}>
              {account.pnl_today ? `${account.pnl_today > 0 ? "+" : ""}${account.pnl_today.toFixed(2)}` : "PNL hoje"}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const fetchAccounts = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.email) return router.push("/login");

    const { data } = await supabase.from("accounts").select("*").eq("email", user.user.email);
    if (data) setAccounts(data as Account[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const pnlTotal = accounts.reduce((sum, acc) => sum + (acc.pnl_today || 0), 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#03182f] min-h-dvh space-y-6 pb-20">
      <h1 className="text-lg font-semibold text-white">Resumo de PNL</h1>

      <Card className="bg-[#0a294d] border border-[#1f2c44] text-white">
        <CardContent className="p-4 text-center">
          <div className="text-muted-foreground text-sm">PNL Total Hoje</div>
          <div className={`text-3xl font-bold mt-2 ${pnlTotal > 0 ? "text-green-400" : pnlTotal < 0 ? "text-red-400" : "text-white"}`}>
            {pnlTotal >= 0 ? "+" : ""}{pnlTotal.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-white pt-2">Minhas Contas</h2>
      <div className="space-y-4">
        {accounts.map(account => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
