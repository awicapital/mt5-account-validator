"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Account = {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  granted_at?: string | null;
  email: string;
};

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from("accounts").select("*");

      if (!error && data) {
        setAccounts(data as Account[]);
      }

      setLoading(false);
    };

    fetchAccounts();
  }, []);

  const total = accounts.length;
  const ativos = accounts.filter((a) => a.is_active).length;
  const pendentes = accounts.filter((a) => !a.is_active && a.granted_at === null).length;

  const grouped = accounts.reduce((acc, account) => {
    if (!acc[account.email]) acc[account.email] = [];
    acc[account.email].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const toggleStatus = async (account: Account) => {
    const { error } = await supabase
      .from("accounts")
      .update({ is_active: !account.is_active })
      .eq("id", account.id);

    if (!error) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === account.id ? { ...a, is_active: !a.is_active } : a
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-slate-100 space-y-6">
      <h2 className="text-2xl font-semibold">Painel do Administrador</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm">Total de Contas</div>
            <div className="text-3xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-600">{ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-muted-foreground text-sm">Contas Pendentes</div>
            <div className="text-3xl font-bold text-yellow-500">{pendentes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([email, contas]) => (
          <div key={email}>
            <h3 className="text-lg font-semibold text-muted-foreground">{email}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {contas.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Conta #{account.account_number}
                      </h4>
                      <Badge
                        className={
                          account.is_active
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }
                      >
                        {account.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">EA:</p>
                      <p>{account.ea_name || "—"}</p>

                      <p className="text-muted-foreground">Saldo:</p>
                      <p>
                        {typeof account.balance === "number"
                          ? `R$ ${account.balance.toFixed(2)}`
                          : "—"}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => toggleStatus(account)}
                    >
                      {account.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
