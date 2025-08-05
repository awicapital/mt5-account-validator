"use client";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useState } from "react";

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
}

export function DashboardCalendar({ dailyPnls }: DashboardCalendarProps) {
  const [currentDate] = useState(dayjs());
  const pnlMap = new Map(dailyPnls.map((entry) => [entry.date, entry.pnl]));

  const startOfMonth = currentDate.startOf("month").startOf("week");
  const endOfMonth = currentDate.endOf("month").endOf("week");
  const today = dayjs();

  const days = [];
  let date = startOfMonth;
  while (date.isBefore(endOfMonth) || date.isSame(endOfMonth, "day")) {
    days.push(date);
    date = date.add(1, "day");
  }

  return (
    <div className="rounded-xl py-4 px-4 bg-[#03182f] text-white w-full max-w-[720px] mx-auto">
      <div className="text-center text-lg font-semibold capitalize mb-4">
        {currentDate.format("MMMM YYYY")}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#94a3b8] mb-2">
        {daysOfWeek.map((day, index) => (
          <div key={`dow-${index}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = day.isSame(today, "day");
          const isCurrentMonth = day.isSame(currentDate, "month");
          const key = day.format("YYYY-MM-DD");
          const pnl = pnlMap.get(key);

          const hasPnl = pnl !== undefined;
          const pnlPositive = pnl !== undefined && pnl > 0;
          const pnlNegative = pnl !== undefined && pnl < 0;

          const borderColor = hasPnl
            ? pnlPositive
              ? "border-[#10b981]"
              : pnlNegative
              ? "border-[#ef4444]"
              : "border-[#334155]"
            : isToday
            ? "border-blue-600"
            : "border-transparent";

          const bgColor = hasPnl
            ? pnlPositive
              ? "bg-[#10b981]/20"
              : pnlNegative
              ? "bg-[#ef4444]/20"
              : "bg-[#1e293b]"
            : "bg-[#1e293b]";

          const ring = !hasPnl && isToday ? "ring-2 ring-blue-600" : "";

          return (
            <div
              key={key}
              className={`relative w-full h-16 rounded-lg text-xs font-medium flex flex-col items-center justify-center border ${borderColor} ${bgColor} ${ring} ${!isCurrentMonth ? "opacity-30" : ""}`}
            >
              <span className="absolute top-1 right-1 text-[10px]">{day.format("D")}</span>
              {hasPnl && (
                <span className="text-sm font-semibold text-white">
                  {formatPnl(pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
