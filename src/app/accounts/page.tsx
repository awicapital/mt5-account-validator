"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AccountCard } from "@/components/ui/account-card";
import { fetchAccountsData } from "@/lib/accountsData";
import { BackHeader } from "@/components/ui/back-header";
import { Pill } from "@/components/ui/pill";

interface Account {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  pnl_total?: number | null;
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
  const bgColor = useTransform(
    x,
    [-140, 0, 80],
    ["#7f1d1d", account.is_active ? "#131f35" : "#4d4d1f", account.is_active ? "#131f35" : "#4d4d1f"]
  );
  const revealDelete = useTransform(x, [-140, -90, 0], [1, 1, 0]);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (e.deltaX < 0) x.set(e.deltaX);
      if (e.deltaX > 0) x.set(0);
    },
    onSwipedLeft: async (e) => {
      if (e.deltaX < -90) {
        await controls.start({ x: -160, opacity: 0, transition: { duration: 0.18 } });
        onDelete();
        x.set(0);
        await controls.start({ x: 0, opacity: 1 });
      } else {
        await controls.start({ x: -90, transition: { type: "spring", stiffness: 260, damping: 24 } });
      }
    },
    onSwipedRight: () => controls.start({ x: 0, transition: { type: "spring", stiffness: 260, damping: 24 } }),
    onTap: () => {
      if (account.is_active) onOpen();
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (account.is_active) onOpen();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      onDelete();
    }
  }

  return (
    <div className="relative">
      {/* área vermelha revelada no swipe */}
      <motion.div
        aria-hidden
        style={{ opacity: revealDelete }}
        className="absolute inset-0 z-0 grid place-items-center rounded-2xl bg-red-900/70"
      >
        <div className="flex items-center gap-2 text-sm text-red-200">
          <Trash2 className="h-4 w-4" /> Deslize para excluir
        </div>
      </motion.div>

      <motion.div
        {...swipeHandlers}
        onClick={() => account.is_active && onOpen()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        whileTap={{ scale: 0.99 }}
        animate={controls}
        style={{ x, backgroundColor: bgColor }}
        className={`relative z-10 overflow-hidden rounded-2xl cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#268bff]/60 focus:ring-offset-[#03182f]
          ${account.is_active ? "border-0 bg-transparent" : "border border-yellow-400 bg-yellow-500/20"}`}
        aria-label={
          account.is_active
            ? `Abrir detalhes da conta ${account.account_number}`
            : `Conta ${account.account_number} pendente de aprovação`
        }
      >
        {account.is_active ? (
          <AccountCard account={account} className="rounded-2xl" />
        ) : (
          <div className="flex h-20 flex-col items-center justify-center gap-1 text-sm font-medium text-yellow-300">
            <span>Pendente de aprovação</span>
            <span className="text-xs opacity-80">Conta: {account.account_number}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AccountsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.account_number.includes(q) || (a.ea_name ?? "").toLowerCase().includes(q.toLowerCase())
    );
  }, [accounts, query]);

  const fetchAccounts = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.email) {
      router.push("/login");
      return;
    }

    const { data: accRows, error } = await supabase.from("accounts").select("*").eq("email", user.user.email);

    if (error) {
      toast.error("Erro ao carregar contas");
      setAccounts([]);
      setLoading(false);
      return;
    }

    const accountsData = await fetchAccountsData();
    if (!accountsData) {
      setAccounts(
        (accRows ?? []).map((acct) => ({
          ...acct,
          balance: acct.balance ?? 0,
          pnl_total: null,
          sparkline: [],
        }))
      );
      setLoading(false);
      return;
    }

    const dailyPnlsByAcc: Record<string, Record<string, number>> = {};
    for (const t of accountsData.trades) {
      if (t.type === "deposit") continue;
      const day = t.date.split("T")[0];
      const accId = String(t.accountId);
      if (!dailyPnlsByAcc[accId]) dailyPnlsByAcc[accId] = {};
      dailyPnlsByAcc[accId][day] = (dailyPnlsByAcc[accId][day] || 0) + t.profit;
    }

    const enhanced: Account[] = (accRows ?? []).map((acct) => {
      const accId = String(acct.account_number);
      const dayMap = dailyPnlsByAcc[accId] || {};
      const sortedDays = Object.keys(dayMap).sort();
      let cumulative = 0;
      const sparkline = sortedDays.map((day) => (cumulative += dayMap[day]));

      return {
        ...acct,
        balance: acct.balance ?? 0,
        pnl_total: sparkline.length ? sparkline[sparkline.length - 1] : null,
        sparkline,
      };
    });

    setAccounts(enhanced);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function confirmDelete(account: Account) {
    setSelectedAccount(account);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!selectedAccount) return;
    setDialogOpen(false);
    const toDelete = selectedAccount;

    // otimista
    setAccounts((prev) => prev.filter((a) => a.id !== toDelete.id));
    try {
      const { error } = await supabase.from("accounts").delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Conta excluída com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir conta");
      await fetchAccounts();
    }
  }

  async function handleRequest() {
    const raw = accountNumber.trim();
    if (!raw) return toast.error("Informe o número da conta.");
    if (!/^\d{4,12}$/.test(raw)) return toast.error("Número inválido.");

    setSubmitting(true);
    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email;
    if (!email) return;

    const { error } = await supabase.from("accounts").insert({
      account_number: Number(raw),
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
  }

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#03182f]">
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando contas…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#03182f] pb-28 text-white">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-[#03182f]/80 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <BackHeader
  backHref="/"
  backLabel="Voltar"
  className="bg-transparent border-b border-white/10 text-white"
  rightSlot={
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por número ou EA"
        className="w-[220px] rounded-lg border border-white/10 bg-white/5 pl-8 pr-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
    </div>
  }
/>


          {/* Pill imediatamente abaixo do BackHeader */}
          <div className="py-2">
            <Pill dotColor="bg-[#268bff]">Contas</Pill>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 pt-4">
        {!accounts.length ? (
          <div className="mt-10 text-center text-sm text-white/60">Nenhuma conta cadastrada.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((account) => (
              <SwipeableAccountCard
                key={account.id}
                account={account}
                onDelete={() => confirmDelete(account)}
                onOpen={() => router.push(`/accounts-details/${account.account_number}`)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
                Nada encontrado para &quot;{query}&quot;.
              </p>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        type="button"
        className="fixed bottom-24 right-6 z-50 rounded-full bg-[#268bff] p-4 text-white shadow-lg transition hover:bg-[#1e78e0]"
        onClick={() => setRequestDialogOpen(true)}
        aria-label="Solicitar nova conta"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Dialog de exclusão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border border-[#1f2c44] bg-[#131f35]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">Deseja excluir esta conta?</DialogTitle>
          </DialogHeader>
          <p className="mt-1 mb-5 text-center text-sm text-white/70">Esta ação não poderá ser desfeita.</p>
          <DialogFooter className="mt-2 flex justify-center">
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de solicitação */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="border border-[#1f2c44] bg-[#131f35]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">Solicitar nova conta</DialogTitle>
          </DialogHeader>
          <p className="mt-1 mb-5 text-center text-sm text-white/70">Informe o número da conta MT5 que deseja vincular.</p>
          <div className="space-y-2">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Ex: 123456"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-[#2c3a55] bg-[#1f2c44] px-3 py-2 text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#268bff]"
            />
          </div>
          <DialogFooter className="mt-6 flex justify-center">
            <Button
              className="w-full bg-[#268bff] text-white hover:bg-[#1e78e0]"
              onClick={handleRequest}
              disabled={submitting}
            >
              <Plus className="mr-2 h-4 w-4" /> {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
