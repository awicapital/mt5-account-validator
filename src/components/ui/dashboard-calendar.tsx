"use client";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

dayjs.locale("pt-br");

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  if (abs >= 1000) return `$${Math.round(pnl / 1000)}k`;
  return `$${Math.round(pnl)}`;
}

export interface DailyPnL {
  date: string; // yyyy-MM-DD
  pnl: number;
}

interface DashboardCalendarProps {
  dailyPnls: DailyPnL[];
  onDaySelect?: (date: string | null) => void;
}

function getMonthsRange(start: Dayjs, end: Dayjs): Dayjs[] {
  const months: Dayjs[] = [];
  let date = start.startOf("month");
  while (date.isBefore(end, "month") || date.isSame(end, "month")) {
    months.push(date);
    date = date.add(1, "month");
  }
  return months;
}

export function DashboardCalendar({ dailyPnls, onDaySelect }: DashboardCalendarProps) {
  const today = dayjs();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPnl, setSelectedPnl] = useState<number | null>(null);
  const currentMonthRef = useRef<HTMLDivElement | null>(null);

  const months = useMemo(() => {
    if (dailyPnls.length === 0) return [today];
    const minDate = dayjs(
      dailyPnls.reduce((min, d) => (d.date < min ? d.date : min), dailyPnls[0].date)
    );
    return getMonthsRange(minDate, today);
  }, [dailyPnls, today]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (currentMonthRef.current) {
        currentMonthRef.current.scrollIntoView({ behavior: "auto", inline: "start" });
      }
    });
  }, []);

  return (
    <div className="w-full overflow-x-auto scroll-smooth snap-x snap-mandatory flex">
      {months.map((month) => {
        const isCurrentMonth = month.isSame(today, "month");
        const pnlMap = new Map(dailyPnls.map((entry) => [entry.date, entry.pnl]));
        const startOfMonth = month.startOf("month").startOf("week");
        const endOfMonth = month.endOf("month").endOf("week");

        const days: Dayjs[] = [];
        let date = startOfMonth;
        while (date.isBefore(endOfMonth) || date.isSame(endOfMonth, "day")) {
          days.push(date);
          date = date.add(1, "day");
        }

        const monthTotal = days.reduce((acc, d) => {
          const val = pnlMap.get(d.format("YYYY-MM-DD")) ?? 0;
          return acc + val;
        }, 0);

        const totalColor =
          monthTotal > 0
            ? "text-[#10b981]"
            : monthTotal < 0
            ? "text-[#ef4444]"
            : "text-white";

        return (
          <div
            key={month.format("YYYY-MM")}
            ref={isCurrentMonth ? currentMonthRef : null}
            className="min-w-full snap-start px-4"
          >
            <div className="rounded-xl py-4 bg-[#03182f] text-white w-full max-w-[720px] mx-auto">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="text-[1.125rem] font-semibold text-white">Calendário</div>
                <div className="text-[1.125rem] font-semibold capitalize text-white">
                  {month.format("MMMM YYYY")}
                </div>
              </div>

              <div className={`text-right text-sm mb-3 px-1 ${totalColor}`}>
                Total: {formatPnl(monthTotal)}
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#94a3b8] mb-2">
                {daysOfWeek.map((day, index) => (
                  <div key={`dow-${index}`}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const isCurrentMonthDay = day.isSame(month, "month");
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
                      className={`cursor-pointer relative w-full h-16 rounded-md text-xs font-medium flex flex-col items-center justify-center border ${borderColor} ${bgColor} ${!isCurrentMonthDay ? "opacity-30" : ""}`}
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
              </div>

              <AnimatePresence>
                {selectedDay && dayjs(selectedDay).isSame(month, "month") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 bg-[#1e293b] border border-blue-600 rounded-md p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white/70 font-medium">
                          {dayjs(selectedDay).format("dddd, DD [de] MMMM YYYY")}
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-1">
                          Descrição detalhada ou ações futuras.
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-white whitespace-nowrap">
                        {formatPnl(selectedPnl ?? 0)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
