'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Pill } from '@/components/ui/pill'

interface Log {
  date: string
  pnl: number
}

interface AccountChartProps {
  logs: Log[]
}

export function AccountChartCard({ logs }: AccountChartProps) {
  const first = logs?.[0]?.pnl ?? 0
  const last = logs?.[logs.length - 1]?.pnl ?? 0
  const delta = last - first
  const dotColor =
    delta > 0 ? 'bg-emerald-500' : delta < 0 ? 'bg-rose-500' : 'bg-slate-400'

  return (
    <div className="rounded-2xl bg-[#0f1d31] shadow-md px-3 py-6 border border-[#1e2c46]">
      <div className="flex items-center justify-between mb-4">
        <Pill
          dotColor={dotColor}
          className="px-2 py-0.5 text-[11px] font-medium text-white/80 border-white/10"
          aria-label="Evolução do PnL"
        >
          Evolução
        </Pill>
      </div>

      <div className="pr-1">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={logs} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e2c46" strokeDasharray="3 3" vertical={false} />
            <XAxis hide />
            <YAxis
              stroke="#1f2c44"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2000', 'dataMax + 2000']}
              tickFormatter={(v) =>
                `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toFixed(0)}`
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const log = payload[0].payload as Log
                const colorClass = log.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                return (
                  <div className="bg-[#1f2c44] text-white p-3 rounded-md shadow border border-white/10">
                    <div className="text-sm font-medium">{log.date}</div>
                    <div className={`text-xs font-medium ${colorClass}`}>
                      PnL acumulado: ${log.pnl.toFixed(2)}
                    </div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
