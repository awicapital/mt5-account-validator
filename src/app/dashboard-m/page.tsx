"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Server, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
};

function AccountCard({ account, onSwipe }: { account: Account; onSwipe: () => void }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const bgColor = useTransform(x, [-100, 0], ["#7f1d1d", "#131f35"]);

  const swipeHandlers = useSwipeable({
    onSwiping: e => { if (e.deltaX < 0) x.set(e.deltaX); },
    onSwipedLeft: async () => {
      await controls.start({ x: -150, opacity: 0, transition: { duration: 0.2 } });
      onSwipe();
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
            <div className={`text-xs font-semibold mt-1 ${account.is_active ? "text-green-400" : "text-yellow-400"}`}>{account.is_active ? "Ativa" : "Pendente"}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">${account.balance?.toFixed(2) || "—"}</div>
            <div className="text-xs text-muted-foreground">Saldo</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MobileDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchAccounts = async (userEmail: string) => {
    const { data, error } = await supabase.from("accounts").select("*").eq("email", userEmail);
    if (!error && data) setAccounts(data as Account[]);
  };

  useEffect(() => {
    const initialize = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user?.email) {
        router.push("/login");
        return;
      }
      const userEmail = user.user.email;
      setEmail(userEmail);
      await fetchAccounts(userEmail);
      setLoading(false);
    };
    initialize();
  }, [router]);

  const handleDelete = async () => {
    if (!selectedAccount) return;
    setDialogOpen(false);
    await supabase.from("accounts").delete().eq("id", selectedAccount.id);
    await fetchAccounts(email);
    toast.success("Conta excluída com sucesso!");
    setSelectedAccount(null);
  };

  const handleSubmit = async () => {
    if (!accountNumber) {
      toast.error("Informe o número da conta.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("accounts").insert({
      account_number: Number(accountNumber),
      email,
      requested_at: new Date().toISOString(),
      is_active: false,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Erro ao solicitar conta.");
    } else {
      setRequestDialogOpen(false);
      setAccountNumber("");
      await fetchAccounts(email);
      toast.success("Solicitação enviada com sucesso!");
    }
  };

  const renderCalendar = () => {
    const startMonth = startOfMonth(calendarDate);
    const endMonth = endOfMonth(calendarDate);
    const startDate = startOfWeek(startMonth);
    const endDate = endOfWeek(endMonth);

    const days = [];
    let current = startDate;
    while (current <= endDate) {
      days.push(current);
      current = addDays(current, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-muted-foreground font-medium">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, calendarDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-md text-white text-sm font-medium border ${
                isCurrentMonth
                  ? isCurrentDay
                    ? "bg-[#268bff] border-[#268bff] text-white"
                    : "bg-[#1e2b45] border-[#1f2c44]"
                  : "bg-transparent border-transparent text-muted-foreground"
              }`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 bg-[#03182f] min-h-dvh pb-28 relative">
      <h1 className="text-lg font-semibold text-white">Minhas Contas</h1>

      <div className="grid grid-cols-2 gap-4">
        <motion.div className="w-full h-32 rounded-xl bg-[#0a294d] text-white flex flex-col items-center justify-center font-semibold text-sm">
          <div className="text-muted-foreground text-xs">Ativas</div>
          <div className="text-3xl font-bold text-green-400">{accounts.filter(a => a.is_active).length}</div>
        </motion.div>
        <motion.div className="w-full h-32 rounded-xl bg-[#0a294d] text-white flex flex-col items-center justify-center font-semibold text-sm">
          <div className="text-muted-foreground text-xs">Pendentes</div>
          <div className="text-3xl font-bold text-yellow-400">{accounts.filter(a => !a.is_active).length}</div>
        </motion.div>
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

      <div className="space-y-4 pt-4">
        <h2 className="text-white font-semibold text-lg">Calendário</h2>
        <Card className="bg-[#03182f] border-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button size="icon" variant="ghost" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                <ChevronLeft />
              </Button>
              <div className="text-white font-semibold">{format(calendarDate, "MMMM yyyy")}</div>
              <Button size="icon" variant="ghost" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                <ChevronRight />
              </Button>
            </div>
            {renderCalendar()}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-white font-semibold text-lg">Novidades</h2>
        <motion.div className="w-full h-32 rounded-xl bg-[#0a294d] text-white flex items-center justify-center font-semibold text-sm">
          Slide de divulgação #1
        </motion.div>
      </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-white">
              Solicitar nova conta
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
            Informe o número da conta MT5 que deseja vincular.
          </p>
          <div className="space-y-2">
            <Label htmlFor="account" className="text-white">
              Número da Conta
            </Label>
            <Input
              id="account"
              type="number"
              placeholder="Ex: 123456"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <DialogFooter className="flex justify-center mt-6">
            <Button
              className="bg-[#268bff] hover:bg-[#1e78e0] text-white w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        className="fixed z-50 bottom-24 right-6 bg-[#268bff] hover:bg-[#1e78e0] text-white rounded-full p-4 shadow-lg"
        onClick={() => setRequestDialogOpen(true)}
        aria-label="Solicitar nova conta"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
