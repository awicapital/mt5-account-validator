"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Card, CardContent } from "@/components/ui/card";
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const activeAccounts = accounts.filter((a) => a.is_active);
  const pendingAccounts = accounts.filter(
    (a) => !a.is_active && a.granted_at === null
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Confirma exclusão da conta? Essa ação não pode ser desfeita."))
      return;
    setDeletingId(id);
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (!error) setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    else alert("Erro ao deletar conta");
    setDeletingId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-[#b6d5ff] rounded-tl-lg rounded-tr-lg">
        <div className="space-y-4">
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={200} />
        </div>
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
    <main className="min-h-screen p-6 bg-[#b6d5ff] rounded-tl-lg rounded-tr-lg flex flex-col gap-8">
      {/* Solicitar nova conta */}
      <div className="flex justify-end">
        <Button onClick={() => router.push("/account-request")}>Solicitar nova conta</Button>
      </div>

      {/* Título: Visão Geral */}
      <h2 className="text-xl font-semibold text-gray-800">Visão Geral de Contas</h2>

      {/* Resumo de contas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-6">
            <div className="text-gray-300 text-sm mb-1">Contas Ativas</div>
            <div className="text-3xl font-bold text-green-400">{activeAccounts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-default">
          <CardContent className="p-6">
            <div className="text-gray-300 text-sm mb-1">Contas Pendentes</div>
            <div className="text-3xl font-bold text-yellow-400">{pendingAccounts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Título: Minhas Contas */}
      <h2 className="text-xl font-semibold text-gray-800">Minhas Contas</h2>

      {/* Lista de contas */}
      <ul className="flex flex-col space-y-4">
        {accounts.map((account) => (
          <li key={account.id}>
            <Card className="relative border-none shadow-md hover:shadow-lg transition-shadow">
              {/* Botão excluir posicionado no canto superior direito */}
              <button
                aria-label="Excluir conta"
                onClick={() => handleDelete(account.id)}
                disabled={deletingId === account.id}
                className="absolute top-2 right-6 text-red-500 hover:text-red-700 transition-colors"
              >
                {deletingId === account.id ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <span className="text-xl font-bold">×</span>
                )}
              </button>

              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-medium text-white">
                    Conta #{account.account_number}
                  </h4>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-300 text-sm">EA:</p>
                    <p className="text-white text-base">{account.ea_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Saldo:</p>
                    <p className="text-white text-base">
                      {typeof account.balance === "number"
                        ? `R$ ${account.balance.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${
                      account.is_active
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {account.is_active ? "Ativa" : "Pendente"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
