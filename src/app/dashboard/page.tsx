"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();

      if (userError || !user?.user?.email) {
        router.push("/login");
        return;
      }

      setUserEmail(user.user.email);

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", user.user.email);

      if (!error && data) {
        setAccounts(data);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
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
              Status: <Badge variant="outline">Aguardando</Badge>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-slate-100">
      {/* Título + botão */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Minhas Contas</h2>
        <Button onClick={() => router.push("/account-request")}>
          Adicionar nova conta
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm mb-1">
              Contas Ativas
            </div>
            <div className="text-3xl font-bold text-green-600">
              {activeAccounts.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm mb-1">
              Contas Pendentes
            </div>
            <div className="text-3xl font-bold text-yellow-500">
              {pendingAccounts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="p-4 space-y-1">
              <h3 className="text-lg font-medium">
                Conta #{account.account_number}
              </h3>
              <p>EA: {account.ea_name || "—"}</p>
              <p>
                Saldo: R${" "}
                {account.balance !== null && !isNaN(account.balance)
                  ? parseFloat(account.balance).toFixed(2)
                  : "—"}
              </p>
              <p>
                Status:{" "}
                <Badge variant={account.is_active ? "default" : "outline"}>
                  {account.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
