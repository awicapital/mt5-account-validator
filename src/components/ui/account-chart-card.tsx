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

interface Log {
  date: string
  pnl: number
}

interface AccountChartProps {
  logs: Log[]
}

export function AccountChartCard({ logs }: AccountChartProps) {
  return (
    <div className="rounded-2xl bg-[#0f1d31] shadow-md p-6 border border-[#1e2c46]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-base">
          Evolução
        </h2>
      </div>

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
              const colorClass = log.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              return (
                <div className="bg-[#1f2c44] text-white p-3 rounded-md shadow">
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
  )
}
