// src/components/ui/dashboard-calendar.tsx
"use client";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo, Variants } from "framer-motion";
import { Trade } from "@/lib/accountsData";
import { Pill } from "@/components/ui/pill";

dayjs.locale("pt-br");

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface DailyPnL {
  date: string;
  pnl: number;
}

interface DashboardCalendarProps {
  dailyPnls: DailyPnL[];
  trades: Trade[];
  onDaySelect: (date: string | null) => void;
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
  changeMonth,
  onClose,
}: {
  months: string[];
  currentMonthIndex: number;
  changeMonth: (newIndex: number) => void;
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const yearsMap = months.reduce<Record<string, string[]>>((acc, m) => {
    const [year] = m.split("-");
    (acc[year] = acc[year] || []).push(m);
    return acc;
  }, {});

  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 
                 bg-[#0f172a] border border-[#1d4ed8]/40 shadow-[0_0_0_1px_#1d4ed8] 
                 rounded-xl px-6 py-5 w-full max-w-sm"
    >
      {Object.entries(yearsMap).map(([year, yearMonths]) => (
        <div key={year} className="mb-4">
          <div className="text-sm text-white/50 font-semibold mb-3">{year}</div>
          <div className="grid grid-cols-6 gap-2">
            {yearMonths.map((m) => {
              const index = months.indexOf(m);
              const isSelected = index === currentMonthIndex;
              return (
                <button
                  key={m}
                  onClick={() => {
                    changeMonth(index);
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

export function DashboardCalendar({
  dailyPnls,
  trades,
  onDaySelect,
}: DashboardCalendarProps) {
  const today = dayjs();
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // mapa date → pnl
  const pnlMap = useMemo(
    () => new Map(dailyPnls.map((d) => [d.date, d.pnl])),
    [dailyPnls]
  );

  // build months array
  const months = useMemo(() => {
    if (dailyPnls.length === 0) return [today.format("YYYY-MM")];
    const minDate = dayjs(
      dailyPnls.reduce((m, d) => (d.date < m ? d.date : m), dailyPnls[0].date)
    );
    return getMonthsRange(minDate, today);
  }, [dailyPnls, today]);

  // estado com índice e direção para animação
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => months.length - 1);
  const [direction, setDirection] = useState(0);

  const changeMonth = (newIndex: number) => {
    setDirection(newIndex > currentMonthIndex ? 1 : -1);
    setCurrentMonthIndex(newIndex);
  };

  const currentMonth = dayjs(months[currentMonthIndex]);

  // grid de days
  const startOfMonth = currentMonth.startOf("month").startOf("week");
  const endOfMonth = currentMonth.endOf("month").endOf("week");
  const days: Dayjs[] = [];
  let date = startOfMonth;
  while (date.isBefore(endOfMonth) || date.isSame(endOfMonth, "day")) {
    days.push(date);
    date = date.add(1, "day");
  }

  // totais do mês
  const monthTotal = days.reduce((sum, d) => {
    if (!d.isSame(currentMonth, "month")) return sum;
    return sum + (pnlMap.get(d.format("YYYY-MM-DD")) ?? 0);
  }, 0);
  const totalColor =
    monthTotal > 0
      ? "text-[#10b981]"
      : monthTotal < 0
      ? "text-[#ef4444]"
      : "text-white";

  // variantes customizadas para enter/exit
  const variants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
  };

  function handleSwipe(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    const threshold = 50;
    if (info.offset.x > threshold && currentMonthIndex > 0) {
      changeMonth(currentMonthIndex - 1);
    } else if (
      info.offset.x < -threshold &&
      currentMonthIndex < months.length - 1
    ) {
      changeMonth(currentMonthIndex + 1);
    }
  }

  // seleção de dia
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const onClickDay = (key: string, hasPnl: boolean) => {
    if (!hasPnl) return;
    const newKey = selectedDay === key ? null : key;
    setSelectedDay(newKey);
    onDaySelect(newKey);
  };

  return (
    <div className="w-full">
      <div className="rounded-xl py-4 bg-[#03182f] text-white max-w-6xl mx-auto px-0 relative">
        {/* Header */}
<div className="flex items-center justify-between mb-4">
  <Pill>Calendário</Pill>

  <div className="flex flex-col items-end">
    <button
      onClick={() => setShowMonthPicker((v) => !v)}
      className="text-sm font-medium text-white hover:underline"
    >
      {currentMonth.format("MM/YY")}
    </button>
    <span className={`text-xs mt-1 font-medium ${totalColor}`}>
      Resultado: {formatPnl(monthTotal)}
    </span>
  </div>
</div>

        {/* Month Picker */}
        {showMonthPicker && (
          <MonthYearSelect
            months={months}
            currentMonthIndex={currentMonthIndex}
            changeMonth={changeMonth}
            onClose={() => setShowMonthPicker(false)}
          />
        )}

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#94a3b8] mb-2">
          {daysOfWeek.map((dow, i) => (
            <div key={i}>{dow}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentMonthIndex}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={direction}
            transition={{ type: "tween", duration: 0.3 }}
            className="grid grid-cols-7 gap-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleSwipe}
          >
            {days.map((day) => {
              const key = day.format("YYYY-MM-DD");
              const pnl = pnlMap.get(key);
              const hasPnl = pnl !== undefined;
              const isPositive = hasPnl && pnl! > 0;
              const isNegative = hasPnl && pnl! < 0;
              const isCurrent = day.isSame(currentMonth, "month");
              const isSelected = selectedDay === key;

              const border = isSelected
                ? "border-blue-600"
                : hasPnl
                ? isPositive
                  ? "border-[#10b981]"
                  : isNegative
                  ? "border-[#ef4444]"
                  : "border-[#334155]"
                : "border-transparent";

              const bg = isSelected
                ? "bg-[#1e293b]"
                : hasPnl
                ? isPositive
                  ? "bg-[#10b981]/20"
                  : isNegative
                  ? "bg-[#ef4444]/20"
                  : "bg-[#1e293b]"
                : "bg-[#1e293b]";

              return (
                <div
                  key={key}
                  onClick={() => onClickDay(key, hasPnl)}
                  className={`cursor-pointer relative aspect-square w-full rounded-md 
                              text-xs font-medium flex flex-col items-center justify-center 
                              border ${border} ${bg} ${!isCurrent ? "opacity-30" : ""}`}
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
      </div>
    </div>
  );
}
