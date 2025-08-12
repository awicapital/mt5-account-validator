'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

interface SymbolSummary {
  symbol: string
  trades: number
  volume: number
  profit: number
}

interface AccountSymbolsChartProps {
  data: SymbolSummary[]
  className?: string
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const compactUsd = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : Math.abs(v) >= 1_000 ? `$${(v / 1_000).toFixed(1)}K`
  : `$${v.toFixed(0)}`

export function AccountSymbolsChart({ data, className }: AccountSymbolsChartProps) {
  const [selected, setSelected] = useState<SymbolSummary | null>(null)

  const chartData = useMemo(
    () => [...data].sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit)),
    [data]
  )

  const onBarClick = (d: SymbolSummary) => {
    setSelected((curr) => (curr?.symbol === d.symbol ? null : d))
  }

  if (!data?.length) {
    return (
      <div className={cn('isolate rounded-2xl border border-[#1e2c46] bg-[#0f1d31] p-4 md:p-6', className)}>
        <Pill dotColor="bg-sky-400" className="px-2 py-0.5 text-xs text-white/80">
          P&L por Ativo
        </Pill>
        <div className="mt-6 text-sm text-white/60">Sem dados para exibir.</div>
      </div>
    )
  }

  return (
    <div className={cn('isolate rounded-2xl border border-[#1e2c46] bg-[#0f1d31] p-4 md:p-6 space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Pill dotColor="bg-sky-400" className="px-2 py-0.5 text-xs text-white/80">
          P&L por Ativo
        </Pill>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <CartesianGrid stroke="#1e2c46" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="symbol" stroke="#8CA3BA" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#1f2c44" fontSize={12} tickLine={false} axisLine={false} tickFormatter={compactUsd} />
          <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />

          {/* remove overlay de hover que “apaga” o chart */}
          <RechartsTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as SymbolSummary
              const isPos = p.profit >= 0
              return (
                <div className="rounded-md bg-[#12243d] border border-[#1e2c46] px-3 py-2 shadow">
                  <div className="text-xs text-white/80">{p.symbol}</div>
                  <div className={cn('text-sm font-semibold', isPos ? 'text-emerald-400' : 'text-rose-400')}>
                    {usd.format(p.profit)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/60">
                    {p.trades} trade{p.trades > 1 ? 's' : ''} • Vol: {p.volume.toFixed(2)}
                  </div>
                </div>
              )
            }}
          />

          <Bar dataKey="profit" radius={[6, 6, 0, 0]} onClick={(e) => onBarClick((e as any).payload as SymbolSummary)}>
            {chartData.map((d) => {
              const isPos = d.profit >= 0
              const base = isPos ? '#10b981' : '#f43f5e'
              return (
                <Cell
                  key={d.symbol}
                  fill={base}
                  // sem opacidade nas barras para não parecer “lavado”
                  className="transition-transform hover:brightness-110"
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Painel do item selecionado */}
      {selected && (
        <div className="rounded-xl border border-white/10 bg-[#11233b] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">{selected.symbol}</span>
            <span className={cn('text-sm font-semibold', selected.profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {usd.format(selected.profit)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-white/60">
            {selected.trades} trade{selected.trades > 1 ? 's' : ''} • Vol: {selected.volume.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  )
}
