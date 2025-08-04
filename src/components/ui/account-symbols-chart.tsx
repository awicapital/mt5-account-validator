'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface SymbolSummary {
  symbol: string
  trades: number
  volume: number
  profit: number
}

interface AccountSymbolsChartProps {
  data: SymbolSummary[]
}

export function AccountSymbolsChart({ data }: AccountSymbolsChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolSummary | null>(null)

  return (
    <div className="rounded-2xl bg-[#0f1d31] shadow-md p-6 border border-[#1e2c46] space-y-6">
      <div>
        <h2 className="text-white font-semibold text-base mb-4">Gráfico de PnL por Ativo</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e2c46" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="symbol"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#1f2c44"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toFixed(0)}`
              }
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const { symbol, profit } = payload[0].payload as SymbolSummary
                const colorClass = profit >= 0 ? 'text-green-400' : 'text-red-400'
                return (
                  <div className="bg-[#1f2c44] text-white p-3 rounded-md shadow">
                    <div className="text-sm font-medium">{symbol}</div>
                    <div className={`text-xs font-medium ${colorClass}`}>
                      Lucro: ${profit.toFixed(2)}
                    </div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="profit"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              onClick={(data) => {
                const clicked = data.payload as SymbolSummary
                if (selectedSymbol?.symbol === clicked.symbol) {
                  setSelectedSymbol(null) // desmarcar
                } else {
                  setSelectedSymbol(clicked)
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedSymbol && (
        <div className="flex flex-col rounded-xl border border-[#3b82f6] bg-[#1f2c44] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#cbd5e1] font-medium">
              {selectedSymbol.symbol}
            </span>
            <span
              className={`text-base font-semibold ${
                selectedSymbol.profit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {selectedSymbol.profit >= 0 ? '$' : '-$'}
              {Math.abs(selectedSymbol.profit).toFixed(2)}
            </span>
          </div>
          <span className="text-xs text-[#94a3b8] mt-1">
            {selectedSymbol.trades} trade{selectedSymbol.trades > 1 && 's'} • Vol:{' '}
            {selectedSymbol.volume.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
