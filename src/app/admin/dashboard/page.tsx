"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  granted_at?: string | null;
  email: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (!error && data) setAccounts(data as Account[]);
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const pendingAccounts = accounts.filter((a) => !a.is_active && !a.granted_at);

  const grouped = accounts.reduce((acc, account) => {
    if (!acc[account.email]) acc[account.email] = [];
    acc[account.email].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-slate-100">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel do Administrador</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Total de Contas</p>
            <p className="text-3xl font-bold text-blue-600">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Contas Ativas</p>
            <p className="text-3xl font-bold text-green-600">{activeAccounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm mb-1">Contas Pendentes</p>
            <p className="text-3xl font-bold text-yellow-500">{pendingAccounts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([email, contas]) => (
          <div key={email}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{email}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contas.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Conta #{account.account_number}
                      </span>
                      <Badge variant={account.is_active ? "default" : "outline"}>
                        {account.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-muted-foreground">EA:</span>
                      <span>{account.ea_name || "—"}</span>
                      <span className="text-muted-foreground">Saldo:</span>
                      <span>
                        {typeof account.balance === "number"
                          ? `R$ ${account.balance.toFixed(2)}`
                          : "—"}
                      </span>
                    </div>
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
