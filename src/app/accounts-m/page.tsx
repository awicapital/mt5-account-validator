"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AccountCard } from "@/components/ui/account-card";
import { fetchAccountsData } from "@/lib/accountsData";

interface Account {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  pnl_total?: number;
  sparkline?: number[];
}

type SwipeableAccountCardProps = {
  account: Account;
  onDelete: () => void;
  onOpen: () => void;
};

function SwipeableAccountCard({ account, onDelete, onOpen }: SwipeableAccountCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const bgColor = useTransform(x, [-100, 0], ["#7f1d1d", account.is_active ? "#131f35" : "#4d4d1f"]);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (e.deltaX < 0) x.set(e.deltaX);
    },
    onSwipedLeft: async () => {
      await controls.start({ x: -150, opacity: 0, transition: { duration: 0.2 } });
      onDelete();
      x.set(0);
      await controls.start({ x: 0, opacity: 1 });
    },
    onSwipedRight: () => x.set(0),
    onTap: () => account.is_active && onOpen(), // só abre detalhes se ativa
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <motion.div
      {...swipeHandlers}
      onClick={() => account.is_active && onOpen()}
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.99 }}
      animate={controls}
      style={{ x, backgroundColor: bgColor }}
      className={`overflow-hidden rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#268bff]/60 ${
        account.is_active ? "" : "bg-yellow-500/20 border border-yellow-400"
      }`}
      aria-label={
        account.is_active
          ? `Abrir detalhes da conta ${account.account_number}`
          : `Conta ${account.account_number} pendente de aprovação`
      }
    >
      {account.is_active ? (
  <AccountCard account={account} className="bg-[#1e2b45]" />
) : (
  <div className="flex flex-col items-center justify-center h-20 text-yellow-300 text-sm font-medium gap-1">
    <span>Pending Approval</span>
    <span className="text-xs opacity-80">Account: {account.account_number}</span>
  </div>
)}
    </motion.div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.email) return router.push("/login");

    // 1) Busca contas no banco
    const { data: accRows } = await supabase
      .from("accounts")
      .select("*")
      .eq("email", user.user.email);

    if (!accRows) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    // 2) Busca dados de trades/dailyPnls
    const accountsData = await fetchAccountsData();
    if (!accountsData) {
      // Sem dados: mostra contas com fallback
      setAccounts(
        accRows.map((acct) => ({
          ...acct,
          balance: acct.balance ?? 0,
          pnl_total: null,
          sparkline: [],
        }))
      );
      setLoading(false);
      return;
    }

    // 3) Agrupa PnL diário por conta
    const dailyPnlsByAcc: Record<string, Record<string, number>> = {};
    for (const t of accountsData.trades) {
      if (t.type === "deposit") continue; // depósitos não contam no PnL
      const day = t.date.split("T")[0];
      const accId = String(t.accountId);
      if (!dailyPnlsByAcc[accId]) dailyPnlsByAcc[accId] = {};
      dailyPnlsByAcc[accId][day] = (dailyPnlsByAcc[accId][day] || 0) + t.profit;
    }

    // 4) Monta lista final com cálculos individuais
    const enhanced: Account[] = accRows.map((acct) => {
      const accId = String(acct.account_number);
      const dayMap = dailyPnlsByAcc[accId] || {};
      const sortedDays = Object.keys(dayMap).sort();
      let cumulative = 0;
      const sparkline = sortedDays.map((day) => {
        cumulative += dayMap[day];
        return cumulative;
      });

      return {
        ...acct,
        balance: acct.balance ?? 0,
        pnl_total: sparkline.length ? sparkline[sparkline.length - 1] : null,
        sparkline,
      };
    });

    setAccounts(enhanced);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async () => {
    if (!selectedAccount) return;
    setDialogOpen(false);
    await supabase.from("accounts").delete().eq("id", selectedAccount.id);
    toast.success("Conta excluída com sucesso!");
    fetchAccounts();
  };

  const handleRequest = async () => {
    if (!accountNumber) return toast.error("Informe o número da conta.");
    setSubmitting(true);
    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email;
    if (!email) return;

    const { error } = await supabase.from("accounts").insert({
      account_number: Number(accountNumber),
      email,
      requested_at: new Date().toISOString(),
      is_active: false,
    });

    setSubmitting(false);
    if (error) return toast.error("Erro ao solicitar conta.");

    setRequestDialogOpen(false);
    setAccountNumber("");
    fetchAccounts();
    toast.success("Solicitação enviada com sucesso!");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <div className="pt-4 pb-28 bg-[#03182f] min-h-dvh space-y-6">
      <h1 className="text-sm font-semibold text-white">Minhas Contas</h1>

      {accounts.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm mt-10">
          Nenhuma conta cadastrada.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <SwipeableAccountCard
              key={account.id}
              account={account}
              onDelete={() => {
                setSelectedAccount(account);
                setDialogOpen(true);
              }}
              onOpen={() => router.push(`/accounts-details-m/${account.account_number}`)}
            />
          ))}
        </div>
      )}

      <button
        className="fixed z-50 bottom-24 right-6 bg-[#268bff] hover:bg-[#1e78e0] text-white rounded-full p-4 shadow-lg"
        onClick={() => setRequestDialogOpen(true)}
        aria-label="Solicitar nova conta"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Dialog de exclusão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#131f35] border border-[#1f2c44]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-white">
              Deseja excluir esta conta?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
            Esta ação não poderá ser desfeita.
          </p>
          <DialogFooter className="flex justify-center mt-2">
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de solicitação */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="bg-[#131f35] border border-[#1f2c44]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-white">
              Solicitar nova conta
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
            Informe o número da conta MT5 que deseja vincular.
          </p>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Ex: 123456"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-[#1f2c44] text-white border border-[#2c3a55] rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#268bff]"
            />
          </div>
          <DialogFooter className="flex justify-center mt-6">
            <Button
              className="bg-[#268bff] hover:bg-[#1e78e0] text-white w-full"
              onClick={handleRequest}
              disabled={submitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
