"use client";

// src/app/dashboard-m/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
};

export default function MobileDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user?.email) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", user.user.email);

      if (!error && data) setAccounts(data as Account[]);
      setLoading(false);
    };
    fetchAccounts();
  }, [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-semibold text-white mb-2">Nenhuma conta encontrada</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Você ainda não possui nenhuma conta MT5 registrada.
        </p>
        <Button onClick={() => router.push("/account-request")}>Solicitar conta</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-[#03182f] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Minhas Contas</h1>
        <Button size="sm" onClick={() => router.push("/account-request")}>Nova</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-none">
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm">Ativas</div>
            <div className="text-2xl font-bold text-green-400">
              {accounts.filter((a) => a.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-none">
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-400">
              {accounts.filter((a) => !a.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-zinc-800 border-none text-white">
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-medium">
                #{account.account_number} — {account.ea_name || "Sem EA"}
              </div>
              <div className="text-sm">Saldo: $ {account.balance?.toFixed(2) || "—"}</div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${account.is_active ? "bg-green-500" : "bg-yellow-500"}`}>
                {account.is_active ? "Ativa" : "Pendente"}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
