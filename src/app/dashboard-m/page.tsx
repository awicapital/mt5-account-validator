"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from "date-fns";

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
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Account {
  id: string;
  account_number: string;
  balance: number | null;
  ea_name?: string;
  is_active: boolean;
}
interface Trade {
  date: string;
  profit: number;
  type: string;
}

export default function MobileDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [pnlByDate, setPnlByDate] = useState<Record<string, number>>({});
  const [tradesByDate, setTradesByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    const init = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user.user?.email) {
        router.push("/login");
        return;
      }

      const userEmail = user.user.email;
      setEmail(userEmail);
      setUserName(user.user.user_metadata?.name || "");

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", userEmail);

      if (accountsData) {
        setAccounts(accountsData as Account[]);
        await fetchPNL(accountsData as Account[]);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  const fetchPNL = async (accounts: Account[]) => {
    const allTrades: Trade[] = [];

    await Promise.all(
      accounts.map(async (acc) => {
        const path = `${acc.account_number}.json`;
        const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
        if (!urlData?.publicUrl) return;

        try {
          const res = await fetch(urlData.publicUrl);
          if (!res.ok) return;
          const trades: Trade[] = await res.json();
          allTrades.push(...trades.filter((t) => t.type !== "deposit"));
        } catch {}
      })
    );

    const pnl: Record<string, number> = {};
    const tradeCounts: Record<string, number> = {};

    allTrades.forEach((t) => {
      const date = format(new Date(t.date), "yyyy-MM-dd");
      pnl[date] = (pnl[date] || 0) + t.profit;
      tradeCounts[date] = (tradeCounts[date] || 0) + 1;
    });

    setPnlByDate(pnl);
    setTradesByDate(tradeCounts);
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

    if (!error) {
      toast.success("Solicitação enviada com sucesso!");
      setRequestDialogOpen(false);
      setAccountNumber("");
      await fetchAccounts(email);
    } else {
      toast.error("Erro ao solicitar conta.");
    }
  };

  const fetchAccounts = async (userEmail: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("email", userEmail);
    if (data) setAccounts(data as Account[]);
  };

  const formatShortCurrency = (value: number) => {
    const abs = Math.abs(value);
    const formatted = abs >= 1e6
      ? `${(abs / 1e6).toFixed(1).replace(/\.0$/, "")}M`
      : abs >= 1e3
      ? `${(abs / 1e3).toFixed(1).replace(/\.0$/, "")}K`
      : abs.toFixed(0);

    return `${value > 0 ? "+" : "-"}$${formatted}`;
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
          const key = format(day, "yyyy-MM-dd");

          if (!isCurrentMonth) {
            return (
              <div
                key={i}
                className="aspect-square flex items-center justify-center rounded-md text-muted-foreground border border-transparent text-xs"
              >
                {format(day, "d")}
              </div>
            );
          }

          const pnl = pnlByDate[key] ?? 0;
          const tradesCount = tradesByDate[key] ?? 0;

          const bgClass =
            pnl > 0
              ? "bg-[#10382c] border-[#00ff99]"
              : pnl < 0
              ? "bg-[#3f1f1f] border-[#ff4c4c]"
              : isCurrentDay
              ? "bg-[#268bff] border-[#268bff]"
              : "bg-[#1e2b45] border-[#1f2c44]";

          const pnlClass =
            pnl > 0
              ? "text-[#00ff99]"
              : pnl < 0
              ? "text-[#ff4c4c]"
              : "text-white/40";

          return (
            <div
              key={i}
              className={`aspect-square relative rounded-md border p-1 text-white ${bgClass}`}
            >
              <div className="absolute top-1 right-1 text-[10px] text-white/70">
                {format(day, "d")}
              </div>
              {pnl !== 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-1">
                  <div className={`text-[11px] leading-tight ${pnlClass}`}>
                    {formatShortCurrency(pnl)}
                  </div>
                </div>
              )}
              {tradesCount > 0 && (
                <div className="absolute bottom-1 right-1 text-[10px] text-white/50">
                  {tradesCount} trade{tradesCount > 1 && "s"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-[#03182f] min-h-dvh pb-28">
      <h1 className="text-lg font-semibold text-white">Panorama Geral</h1>

      {/* Card do usuário */}
      <div className="rounded-xl bg-[#03182f] border border-[#1e2b45] px-4 py-3 text-white">
        <div className="flex flex-col text-sm space-y-1">
          {userName && <span className="font-semibold text-base">{userName}</span>}
          <span className="text-white/70 text-xs">{email}</span>
          <div className="flex gap-4 text-xs pt-1">
            <span className="text-green-400">
              {accounts.filter((a) => a.is_active).length} conta(s) ativa(s)
            </span>
            {accounts.some((a) => !a.is_active) && (
              <span className="text-yellow-400">
                {accounts.filter((a) => !a.is_active).length} pendente(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendário */}
      <div className="space-y-4 pt-4">
        <h2 className="text-white font-semibold text-lg">Calendário</h2>
        <Card className="bg-[#03182f] border-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              >
                <ChevronLeft />
              </Button>
              <div className="text-white font-semibold">
                {format(calendarDate, "MMMM yyyy")}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
            {renderCalendar()}
          </CardContent>
        </Card>
      </div>

      {/* Modal de nova conta */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-white">
              Solicitar nova conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="account" className="text-white">
              Número da Conta
            </Label>
            <Input
              id="account"
              type="number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <DialogFooter className="flex justify-center mt-4">
            <Button
              className="bg-[#268bff] text-white w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
