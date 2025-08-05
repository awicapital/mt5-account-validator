"use client";

import { useEffect, useState } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface CalendarPNLProps {
  email: string;
  accounts: Account[];
}

export function CalendarPNL({ email, accounts }: CalendarPNLProps) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [pnlByDate, setPnlByDate] = useState<Record<string, number>>({});
  const [tradesByDate, setTradesByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    if (accounts.length === 0) return;

    const fetchPNL = async () => {
      const allTrades: Trade[] = [];

      await Promise.all(
        accounts.map(async (acc) => {
          const path = `${acc.account_number}.json`;
          const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);

          if (!urlData?.publicUrl) {
            console.warn(`[❌] URL pública não encontrada para: ${path}`);
            return;
          }

          console.log("[📱 FETCH URL]:", urlData.publicUrl);

          try {
            const res = await fetch(urlData.publicUrl, { cache: "no-store" });

            console.log("[📱 FETCH STATUS]:", res.status);

            if (!res.ok) {
              console.warn(`[❌] Erro ao buscar JSON: ${res.statusText}`);
              return;
            }

            const trades: Trade[] = await res.json();
            console.log(`[✅ TRADES - ${acc.account_number}]:`, trades);

            allTrades.push(...trades.filter((t) => t.type !== "deposit"));
          } catch (err) {
            console.error("[🔥 ERRO FETCH JSON]:", err);
          }
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

    fetchPNL();
  }, [accounts]);

  const formatShortCurrency = (value: number) => {
    const abs = Math.abs(value);
    const formatted =
      abs >= 1e6
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
              className={`aspect-square relative rounded-md border text-white ${bgClass}`}
            >
              <div className="absolute top-1 right-1 text-[10px] text-white/70">
                {format(day, "d")}
              </div>
              <div className="flex flex-col items-center justify-center h-full px-1 space-y-1">
                {pnl !== 0 && (
                  <div className={`text-[12px] font-semibold leading-snug ${pnlClass}`}>
                    {formatShortCurrency(pnl)}
                  </div>
                )}
                {tradesCount > 0 && (
                  <div className="text-[10px] text-white/60 leading-none">
                    {tradesCount} trade{tradesCount > 1 && "s"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
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
  );
}
