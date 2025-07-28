"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Account = {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
  granted_at?: string | null;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("balance");

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

  const filtered = accounts
    .filter((a) => {
      const s = search.toLowerCase();
      return (
        a.email.toLowerCase().includes(s) ||
        String(a.account_number).includes(s) ||
        (a.ea_name?.toLowerCase().includes(s) ?? false)
      );
    })
    .filter((a) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return a.is_active;
      if (statusFilter === "pending") return !a.is_active;
      return true;
    })
    .sort((a, b) => {
      if (sortField === "balance") return (b.balance ?? 0) - (a.balance ?? 0);
      if (sortField === "account") return String(b.account_number).localeCompare(String(a.account_number));
      if (sortField === "ea") return (b.ea_name || "").localeCompare(a.ea_name || "");
      return 0;
    });

  const activeAccounts = filtered.filter((a) => a.is_active);
  const pendingAccounts = filtered.filter((a) => !a.is_active);

  const handleDelete = async (id: string) => {
    if (!confirm("Confirma exclusão da conta? Essa ação não pode ser desfeita.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (!error) setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    else alert("Erro ao deletar conta");
    setDeletingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#b6d5ff]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-700" />
      </main>
    );
  }

  if (accounts.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#b6d5ff] px-4 rounded-tl-lg rounded-tr-lg">
        <h2 className="text-xl font-semibold text-center mb-2 text-gray-800">
          Nenhuma conta encontrada
        </h2>
        <p className="text-center text-gray-700 mb-6 max-w-md">
          Você ainda não possui nenhuma conta MT5 registrada. Solicite sua primeira conta e acompanhe métricas e desempenho aqui.
        </p>
        <Button onClick={() => router.push("/account-request")}>Solicitar nova conta</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-[#b6d5ff] space-y-10 rounded-tl-lg rounded-tr-lg">
      <div className="flex justify-end">
        <Button onClick={() => router.push("/account-request")}>Solicitar nova conta</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-4 text-center">
            <div className="text-gray-300 text-sm">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-500">{activeAccounts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-4 text-center">
            <div className="text-gray-300 text-sm">Contas Pendentes</div>
            <div className="text-3xl font-bold text-yellow-500">{pendingAccounts.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#03182f] p-4 rounded-md shadow">
        <Input
          placeholder="Buscar por e-mail, número ou EA"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance">Saldo</SelectItem>
              <SelectItem value="account">Conta</SelectItem>
              <SelectItem value="ea">EA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800">Minhas Contas</h2>

      <div className="space-y-4">
        {filtered.map((account) => (
          <Card
            key={account.id}
            className="bg-[#03182f] text-white shadow-md hover:shadow-lg transition-all py-4 px-6 rounded-lg border-none relative"
          >
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">
                  #{account.account_number} <span className="text-white/70">— {account.ea_name || "Sem EA"}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-white/80 min-w-[90px] text-right">
                  {typeof account.balance === "number"
                    ? `$ ${account.balance.toFixed(2)}`
                    : "—"}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                    account.is_active
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {account.is_active ? "Ativa" : "Pendente"}
                </span>
                <button
                  aria-label="Excluir conta"
                  onClick={() => handleDelete(account.id)}
                  disabled={deletingId === account.id}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  {deletingId === account.id ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <span className="text-lg font-bold">×</span>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
