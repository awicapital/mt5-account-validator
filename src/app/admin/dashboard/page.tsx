"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Account {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  granted_at?: string | null;
  email: string;
}

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("balance");

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (!error && data) setAccounts(data as Account[]);
      setLoading(false);
    };
    fetchAccounts();
  }, []);

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
      if (sortField === "balance") return b.balance - a.balance;
      if (sortField === "account") return String(b.account_number).localeCompare(String(a.account_number));
      if (sortField === "ea") return (b.ea_name || "").localeCompare(a.ea_name || "");
      return 0;
    });

  const ativos = filtered.filter((a) => a.is_active).length;
  const pendentes = filtered.filter((a) => !a.is_active).length;

  const grouped = filtered.reduce((acc, account) => {
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
        prev.map((a) => (a.id === account.id ? { ...a, is_active: !a.is_active } : a))
      );
    }
  };

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

  return (
    <main className="min-h-screen p-6 bg-[#b6d5ff] space-y-10 rounded-tl-lg rounded-tr-lg">
      <h2 className="text-2xl font-semibold text-gray-800">Painel do Administrador</h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-4 text-center">
            <div className="text-gray-300 text-sm">Total de Contas</div>
            <div className="text-3xl font-bold text-blue-600">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-4 text-center">
            <div className="text-gray-300 text-sm">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-500">{ativos}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-4 text-center">
            <div className="text-gray-300 text-sm">Contas Pendentes</div>
            <div className="text-3xl font-bold text-yellow-500">{pendentes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtro e ordenação */}
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

      {/* Listagem de contas */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([email, contas]) => (
          <div key={email} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{email}</h3>
            {contas.map((account) => (
              <Card
                key={account.id}
                className="bg-[#03182f] text-white shadow-md hover:shadow-lg transition-all py-3 px-5 rounded-lg border-none"
              >
                <CardContent className="flex items-center justify-between w-full gap-6">
                  <div className="text-sm font-medium truncate">
                    #{account.account_number} <span className="text-xs text-white/70">— {account.ea_name || "Sem EA"}</span>
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
                    {!account.is_active ? (
                      <Button onClick={() => toggleStatus(account)} size="sm">
                        Ativar
                      </Button>
                    ) : (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
