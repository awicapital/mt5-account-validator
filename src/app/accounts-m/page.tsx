"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Server, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Account {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
  pnl_today?: number | null;
}

function AccountCard({ account, showBalance, onDelete }: { account: Account; showBalance: boolean; onDelete: () => void }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const bgColor = useTransform(x, [-100, 0], ["#7f1d1d", "#131f35"]);

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
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <motion.div {...swipeHandlers} animate={controls} style={{ x, backgroundColor: bgColor }} className="overflow-hidden rounded-xl">
      <Card className="bg-transparent border border-[#1f2c44] text-white">
        <CardContent className="flex items-center justify-between p-4 space-x-4">
          <div className="bg-[#1e2b45] p-2 rounded-lg">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">
              #{account.account_number} — {account.ea_name || "Sem EA"}
            </div>
            <div className={`text-xs font-semibold mt-1 ${account.is_active ? "text-green-400" : "text-yellow-400"}`}>
              {account.is_active ? "Ativa" : "Pendente"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">
              {showBalance ? `$${account.balance?.toFixed(2) || "—"}` : "••••"}
            </div>
            <div className={`text-xs font-semibold ${account.pnl_today ? (account.pnl_today > 0 ? "text-green-400" : "text-red-400") : "text-muted-foreground"}`}>
              {account.pnl_today ? `${account.pnl_today > 0 ? "+" : ""}${account.pnl_today.toFixed(2)}` : "PNL hoje"}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.email) return router.push("/login");

    const { data } = await supabase.from("accounts").select("*").eq("email", user.user.email);
    if (data) setAccounts(data as Account[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const pnlTotal = accounts.reduce((sum, acc) => sum + (acc.pnl_today || 0), 0);
  const pnlBase = totalBalance - pnlTotal;
  const pnlPercent = pnlBase > 0 ? (pnlTotal / pnlBase) * 100 : 0;

  const handleDelete = async () => {
    if (!selectedAccount) return;
    setDialogOpen(false);
    await supabase.from("accounts").delete().eq("id", selectedAccount.id);
    toast.success("Conta excluída com sucesso!");
    await fetchAccounts();
  };

  const handleSubmit = async () => {
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
    await fetchAccounts();
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
    <div className="p-4 bg-[#03182f] min-h-dvh space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Saldo Total</h1>
        <button onClick={() => setShowBalance(!showBalance)} className="text-white">
          {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-center">
        <div className="text-4xl font-bold text-white">
          {showBalance ? `$${totalBalance.toFixed(2)}` : "••••"}
        </div>
        <div className={`text-sm mt-1 ${pnlPercent > 0 ? "text-green-400" : pnlPercent < 0 ? "text-red-400" : "text-muted-foreground"}`}>
          {showBalance ? `${pnlTotal >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%` : ""}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white pt-2">Minhas Contas</h2>
      <div className="space-y-4">
        {accounts.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            showBalance={showBalance}
            onDelete={() => {
              setSelectedAccount(account);
              setDialogOpen(true);
            }}
          />
        ))}
      </div>

      <button
        className="fixed z-50 bottom-24 right-6 bg-[#268bff] hover:bg-[#1e78e0] text-white rounded-full p-4 shadow-lg"
        onClick={() => setRequestDialogOpen(true)}
        aria-label="Solicitar nova conta"
      >
        <Plus className="w-5 h-5" />
      </button>

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
              onClick={handleSubmit}
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
