//
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AccountCard } from "@/components/ui/account-card";

type Account = {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  granted_at?: string | null;
  email: string;
};

export default function DashboardPage() {
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

      if (!error && data) {
        setAccounts(data as Account[]);
      }

      setLoading(false);
    };

    fetchAccounts();
  }, [router]);

  const activeAccounts = accounts.filter((a) => a.is_active === true);
  const pendingAccounts = accounts.filter(
    (a) => a.granted_at === null && a.is_active === false
  );

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-slate-100">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton height={20} width={120} className="mb-2" />
                <Skeleton height={30} width={80} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton height={24} width="100%" className="mb-2" />
                <Skeleton height={16} width="60%" />
                <Skeleton height={16} width="80%" />
                <Skeleton height={16} width="40%" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (accounts.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
        <h2 className="text-xl font-semibold text-center mb-2">
          Nenhuma conta encontrada
        </h2>
        <p className="text-center text-muted-foreground mb-6 max-w-md">
          Você ainda não possui nenhuma conta MT5 registrada. Solicite sua
          primeira conta e acompanhe métricas e desempenho aqui.
        </p>

        <Button onClick={() => router.push("/account-request")}>
          Solicitar nova conta
        </Button>

        <Card className="w-full max-w-md mt-8">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-lg font-medium">Exemplo de conta</h3>
            <p>Número da conta: —</p>
            <p>EA: —</p>
            <p>Saldo: —</p>
            <p>
              Status: <span className="text-sm text-muted-foreground">Aguardando</span>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-slate-100">
      {/* Painel resumo com 2 cards */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm mb-1">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-600">{activeAccounts.length}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm mb-1">Contas Pendentes</div>
            <div className="text-3xl font-bold text-yellow-500">{pendingAccounts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          />
        ))}
      </div>
    </main>
  );
}
