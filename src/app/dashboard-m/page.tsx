"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Server, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
};

function AccountCard({ account, onSwipe }: { account: Account; onSwipe: () => void }) {
  const swipeHandlers = useSwipeable({
    onSwipedRight: onSwipe,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div {...swipeHandlers} className="overflow-hidden rounded-xl">
      <Card className="bg-[#131f35] border border-[#1f2c44] text-white">
        <CardContent className="flex items-center justify-between p-4 space-x-4">
          <div className="bg-[#1e2b45] p-2 rounded-lg">
            <Server className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium">
              #{account.account_number} — {account.ea_name || "Sem EA"}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${account.is_active ? "text-green-400" : "text-yellow-400"}`}
            >
              {account.is_active ? "Ativa" : "Pendente"}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">
              $ {account.balance?.toFixed(2) || "—"}
            </div>
            <div className="text-xs text-muted-foreground">Saldo</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MobileDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleDelete = async () => {
    if (!selectedAccount) return;
    await supabase.from("accounts").delete().eq("id", selectedAccount.id);
    setAccounts((prev) => prev.filter((a) => a.id !== selectedAccount.id));
    setDialogOpen(false);
    setSelectedAccount(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4 bg-[#03182f]">
        <h2 className="text-xl font-semibold text-white mb-2">Nenhuma conta encontrada</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Você ainda não possui nenhuma conta MT5 registrada.
        </p>
        <Button onClick={() => router.push("/account-request")}>Solicitar conta</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-[#03182f] min-h-screen pb-24 relative">
      <h1 className="text-lg font-semibold text-white">Minhas Contas</h1>

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
          <AccountCard
            key={account.id}
            account={account}
            onSwipe={() => {
              setSelectedAccount(account);
              setDialogOpen(true);
            }}
          />
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a2236] border border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Deseja excluir esta conta?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não poderá ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        className="fixed z-50 bottom-24 right-6 bg-[#268bff] hover:bg-[#1e78e0] text-white rounded-full p-4 shadow-lg"
        onClick={() => router.push("/account-request")}
        aria-label="Solicitar nova conta"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}