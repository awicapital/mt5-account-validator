"use client";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/lib/accountsData";

dayjs.locale("pt-br");

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface DailyPnL {
  date: string;
  pnl: number;
}

interface DashboardCalendarProps {
  dailyPnls: DailyPnL[];
  trades?: Trade[];
  onDaySelect?: (date: string | null) => void;
}

function formatPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  if (abs >= 1000) return `$${Math.round(pnl / 1000)}k`;
  return `$${Math.round(pnl)}`;
}

function getMonthsRange(start: Dayjs, end: Dayjs): string[] {
  const months: string[] = [];
  let date = start.startOf("month");
  while (date.isBefore(end, "month") || date.isSame(end, "month")) {
    months.push(date.format("YYYY-MM"));
    date = date.add(1, "month");
  }
  return months;
}

function MonthYearSelect({
  months,
  currentMonthIndex,
  setCurrentMonthIndex,
  onClose,
}: {
  months: string[];
  currentMonthIndex: number;
  setCurrentMonthIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const yearsMap = months.reduce<Record<string, string[]>>((acc, m) => {
    const [year, month] = m.split("-");
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {});

  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0f172a] border border-[#1d4ed8]/40 shadow-[0_0_0_1px_#1d4ed8] rounded-xl px-6 py-5 w-full max-w-sm"
    >
      {Object.entries(yearsMap).map(([year, yearMonths]) => (
        <div key={year} className="mb-4">
          <div className="text-sm text-white/50 font-semibold mb-3">{year}</div>
          <div className="grid grid-cols-6 gap-2">
            {yearMonths.map((m) => {
              const index = months.findIndex((x) => x === m);
              const isSelected = m === months[currentMonthIndex];
              return (
                <button
                  key={m}
                  onClick={() => {
                    setCurrentMonthIndex(index);
                    onClose();
                  }}
                  className={`text-xs rounded-md px-2 py-1 capitalize transition font-medium ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-[#1e293b] text-white/70 hover:bg-[#334155]"
                  }`}
                >
                  {dayjs(m).format("MMM")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardCalendar({ dailyPnls, trades, onDaySelect }: DashboardCalendarProps) {
  const today = dayjs();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPnl, setSelectedPnl] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = useMemo(() => {
    if (dailyPnls.length === 0) return [today.format("YYYY-MM")];
    const minDate = dayjs(
      dailyPnls.reduce((min, d) => (d.date < min ? d.date : min), dailyPnls[0].date)
    );
    return getMonthsRange(minDate, today);
  }, [dailyPnls, today]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(months.length - 1);
  const currentMonth = dayjs(months[currentMonthIndex]);
  const pnlMap = new Map(dailyPnls.map((entry) => [entry.date, entry.pnl]));

  const startOfMonth = currentMonth.startOf("month").startOf("week");
  const endOfMonth = currentMonth.endOf("month").endOf("week");

  const days: Dayjs[] = [];
  let date = startOfMonth;
  while (date.isBefore(endOfMonth) || date.isSame(endOfMonth, "day")) {
    days.push(date);
    date = date.add(1, "day");
  }

  const tradesForSelectedDay = useMemo(() => {
    if (!trades || !selectedDay) return [];
    return trades.filter(
      (t) => new Date(t.date).toISOString().split("T")[0] === selectedDay
    );
  }, [trades, selectedDay]);

  const monthTotal = days.reduce((acc, d) => {
    if (!d.isSame(currentMonth, "month")) return acc;
    const val = pnlMap.get(d.format("YYYY-MM-DD")) ?? 0;
    return acc + val;
  }, 0);

  const totalColor =
    monthTotal > 0 ? "text-[#10b981]" : monthTotal < 0 ? "text-[#ef4444]" : "text-white";

  const handleSwipe = (event: any, info: { offset: { x: number } }) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentMonthIndex > 0) {
      setCurrentMonthIndex((prev) => prev - 1);
    } else if (info.offset.x < -threshold && currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-xl py-4 bg-[#03182f] text-white w-full max-w-6xl mx-auto px-0 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="text-sm font-semibold text-white">Calendário</div>
          <div className="flex flex-col items-end">
            <button
              onClick={() => setShowMonthPicker((prev) => !prev)}
              className="text-sm font-medium text-white hover:underline"
            >
              {currentMonth.format("MM/YY")}
            </button>
            <span className="text-xs mt-1 font-medium">
              Resultado: <span className={totalColor}>{formatPnl(monthTotal)}</span>
            </span>
          </div>
        </div>

        {showMonthPicker && (
          <MonthYearSelect
            months={months}
            currentMonthIndex={currentMonthIndex}
            setCurrentMonthIndex={setCurrentMonthIndex}
            onClose={() => setShowMonthPicker(false)}
          />
        )}

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#94a3b8] mb-2">
          {daysOfWeek.map((day, index) => (
            <div key={`dow-${index}`}>{day}</div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMonth.format("YYYY-MM")}
            initial={{ opacity: 0, scale: 0.98, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="grid grid-cols-7 gap-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleSwipe}
          >
            {days.map((day) => {
              const isCurrentMonthDay = day.isSame(currentMonth, "month");
              const key = day.format("YYYY-MM-DD");
              const pnl = pnlMap.get(key);
              const hasPnl = pnl !== undefined;
              const pnlPositive = hasPnl && pnl! > 0;
              const pnlNegative = hasPnl && pnl! < 0;
              const isSelected = selectedDay === key;

              const borderColor = isSelected
                ? "border-blue-600"
                : hasPnl
                ? pnlPositive
                  ? "border-[#10b981]"
                  : pnlNegative
                  ? "border-[#ef4444]"
                  : "border-[#334155]"
                : "border-transparent";

              const bgColor = isSelected
                ? "bg-[#1e293b]"
                : hasPnl
                ? pnlPositive
                  ? "bg-[#10b981]/20"
                  : pnlNegative
                  ? "bg-[#ef4444]/20"
                  : "bg-[#1e293b]"
                : "bg-[#1e293b]";

              const handleClick = () => {
                if (!hasPnl) return;
                const newDay = selectedDay === key ? null : key;
                setSelectedDay(newDay);
                setSelectedPnl(newDay ? pnl ?? null : null);
                onDaySelect?.(newDay);
              };

              return (
                <div
                  key={key}
                  onClick={handleClick}
                  className={`cursor-pointer relative aspect-square w-full rounded-md text-xs font-medium flex flex-col items-center justify-center border ${borderColor} ${bgColor} ${
                    !isCurrentMonthDay ? "opacity-30" : ""
                  }`}
                >
                  <span className="absolute top-1 right-1 text-[10px]">
                    {day.format("D")}
                  </span>
                  {hasPnl && (
                    <span className="text-sm font-semibold text-white">
                      {formatPnl(pnl!)}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {selectedDay && dayjs(selectedDay).isSame(currentMonth, "month") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="mt-6 w-full max-w-3xl mx-auto px-4"
            >
              <div className="rounded-2xl border border-blue-600/30 bg-[#1e293b] p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-base font-semibold text-white">
                      {dayjs(selectedDay).format("dddd, DD [de] MMMM YYYY")}
                    </div>
                    <div className="text-sm text-white/70 mt-1">
                      Trades realizados neste dia
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#10b981] whitespace-nowrap">
                    {formatPnl(selectedPnl ?? 0)}
                  </div>
                </div>

                {tradesForSelectedDay.length === 0 ? (
                  <p className="text-sm text-white/70">Nenhum trade nesse dia.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {tradesForSelectedDay.map((trade, index) => (
                      <div
                        key={`${trade.accountId}-${trade.date}-${trade.symbol}-${index}`}
                        className="flex justify-between items-center py-2 text-sm"
                      >
                        <span className="text-white flex items-center gap-2">
                          {trade.symbol}
                          <span
                            className={`uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              trade.type === "buy"
                                ? "bg-green-600/20 text-[#10b981]"
                                : "bg-red-600/20 text-[#ef4444]"
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </span>
                        <span
                          className={
                            trade.profit > 0
                              ? "text-[#10b981] font-medium"
                              : trade.profit < 0
                              ? "text-[#ef4444] font-medium"
                              : "text-white"
                          }
                        >
                          {trade.profit.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
