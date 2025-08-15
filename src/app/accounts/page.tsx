"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/ui/account-card";
import { BackHeader } from "@/components/ui/back-header";
import { Pill } from "@/components/ui/pill";
import { DashboardCalendar } from "@/components/ui/dashboard-calendar";
import type { DailyPnL } from "@/components/ui/dashboard-calendar";
import { supabase } from "@/lib/supabase";
import { fetchAccountsData } from "@/lib/accountsData";
import { toast } from "sonner";

interface Account {
  id: string;
  account_number: string;
  balance: number;
  ea_name?: string;
  is_active: boolean;
  pnl_total?: number | null;
  sparkline?: number[];
}

function ClickableAccountCard({ account }: { account: Account }) {
  const router = useRouter();

  const handleClick = () => {
    if (account.is_active) {
      router.push(`/accounts-details/${account.account_number}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#268bff]/60 focus:ring-offset-[#03182f]"
    >
      <AccountCard account={account} />
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
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [allTrades, setAllTrades] = useState([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

    const accountsData = await fetchAccountsData();
    setAllTrades(accountsData?.trades || []);

    if (accountsData) {
      const parsedDaily: DailyPnL[] = Object.entries(accountsData.dailyPnls).map(([date, pnl]) => ({
        date: date.replaceAll(".", "-"),
        pnl: typeof pnl === "number" ? pnl : 0,
      }));
      setDailyPnls(parsedDaily);
    }

    if (error) {
      toast.error("Erro ao carregar contas");
      setAccounts([]);
      setLoading(false);
      return;
    }

    const dailyPnlsByAcc: Record<string, Record<string, number>> = {};
    for (const t of accountsData?.trades || []) {
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
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 pt-4">
        {dailyPnls.length > 0 && (
          <section className="sm:px-0">
            <DashboardCalendar dailyPnls={dailyPnls} trades={allTrades} onDaySelect={setSelectedDay} />
          </section>
        )}

        {selectedDay && (
          <section className="space-y-4 sm:px-0">
            <div className="rounded-2xl border border-white/10 bg-[#0f1b2d]/80 backdrop-blur-sm p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] bg-[radial-gradient(100%_100%_at_0%_0%,rgba(38,139,255,0.12),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.06),transparent_50%)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium">Dia selecionado</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] sm:text-[11px] text-white/70">
                    {selectedDay}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-white/60">
                  {allTrades.filter((t) => t.date.split("T")[0] === selectedDay).length} trade(s)
                </span>
              </div>
              <div className="divide-y divide-[#334155]">
                <div className="grid grid-cols-5 gap-2 pb-2 text-[10px] sm:text-[11px] text-white/50">
                  <span>Hora</span>
                  <span>Ativo</span>
                  <span>Lote</span>
                  <span className="text-center">Tipo</span>
                  <span className="text-right">Resultado</span>
                </div>
                {allTrades
                  .filter((t) => t.date.split("T")[0] === selectedDay)
                  .map((trade) => (
                    <div key={trade.id} className="grid grid-cols-5 gap-2 py-2 text-[11px] sm:text-xs">
                      <span className="text-white/70">{new Date(trade.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="truncate">{trade.symbol || "---"}</span>
                      <span>{trade.volume?.toFixed(2)} lot</span>
                      <span className="flex justify-center">
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold ${
                          trade.type === "buy"
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                            : "border-rose-500 bg-rose-500/15 text-rose-400"
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </span>
                      <span className={`text-right ${
                        trade.profit > 0 ? "text-emerald-400" : trade.profit < 0 ? "text-rose-400" : "text-white"
                      }`}>
                        {trade.profit.toLocaleString("pt-BR", { style: "currency", currency: "USD" })}
                      </span>
                    </div>
                  ))}
                {allTrades.filter((t) => t.date.split("T")[0] === selectedDay).length === 0 && (
                  <div className="py-2 text-center text-sm text-white/60">Nenhum trade registrado para este dia.</div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="sm:px-0">
          <div className="py-2">
            <Pill dotColor="bg-[#268bff]">Contas</Pill>
          </div>

          {!accounts.length ? (
            <div className="mt-10 text-center text-sm text-white/60">Nenhuma conta cadastrada.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((account) => (
                <ClickableAccountCard key={account.id} account={account} />
              ))}
              {filtered.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
                  Nada encontrado para &quot;{query}&quot;.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <button
        type="button"
        className="fixed bottom-24 right-6 z-50 rounded-full bg-[#268bff] p-4 text-white shadow-lg transition hover:bg-[#1e78e0]"
        onClick={() => setRequestDialogOpen(true)}
        aria-label="Solicitar nova conta"
      >
        <Plus className="h-5 w-5" />
      </button>

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

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="border border-[#1f2c44] bg-[#131f35]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">Solicitar nova conta</DialogTitle>
          </DialogHeader>
          <p className="mt-1 mb-5 text-center text-sm text-white/70">
            Informe o número da conta MT5 que deseja vincular.
          </p>
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
