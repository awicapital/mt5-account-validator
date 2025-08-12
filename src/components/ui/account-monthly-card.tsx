'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Pill } from '@/components/ui/pill'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
} from 'recharts'
import { BarChart2 } from 'lucide-react'

export type MonthlyPoint = {
  month: string // ex: '2025-01' | '2025.01' | 'Jan/25'
  pnl: number // P&L do mês (USD)
  gainPct?: number // Variação % do mês (MoM). Se ausente, calculamos automaticamente.
  trades?: number
  winRate?: number // 0–100 (opcional)
}

// =========================
// Utils
// =========================
function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—'
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs.toFixed(0)}`
}

const formatPct = (v?: number) =>
  Number.isFinite(v as number) ? `${Number(v).toFixed(2)}%` : '—'

/**
 * Aceita formatos:
 *  - 'YYYY-MM' (ou 'YYYY.MM')
 *  - 'MMM/YY' (ex.: 'Jan/25')
 * Retorna uma chave ordenável e um label consistente (MMM/yy)
 */
function parseMonth(raw: string): { key: string; label: string; year: number; month: number } | null {
  if (!raw) return null
  const s = String(raw).trim()

  // YYYY-MM ou YYYY.MM
  let m = s.match(/^(\d{4})[-.](\d{1,2})$/)
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    if (month >= 1 && month <= 12) {
      const d = new Date(Date.UTC(year, month - 1, 1))
      const label = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        .format(d)
        .replace(' ', '/') // 'Jan 25' -> 'Jan/25'
      return { key: `${year}-${String(month).padStart(2, '0')}`, label, year, month }
    }
  }

  // MMM/YY
  m = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{2})$/i)
  if (m) {
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const month = monthNames.indexOf(m[1].toLowerCase()) + 1
    const year = 2000 + Number(m[2])
    const key = `${year}-${String(month).padStart(2, '0')}`
    const label = m[1].slice(0,1).toUpperCase() + m[1].slice(1,3).toLowerCase() + '/' + m[2]
    return { key, label, year, month }
  }

  return null
}

// =========================
// Component
// =========================
export function AccountMonthlyCard({
  data,
  computeMoM = true, // calcula variação mês a mês (MoM) a partir do P&L
}: {
  data: MonthlyPoint[]
  computeMoM?: boolean
}) {
  // Normaliza + ordena + calcula MoM (se necessário)
  const clean = useMemo(() => {
    const safe = (Array.isArray(data) ? data : []).filter(
      (d): d is MonthlyPoint => !!d && Number.isFinite(d.pnl) && !!d.month
    )

    const normalized = safe
      .map((d) => {
        const parsed = parseMonth(d.month)
        if (!parsed) return null
        return {
          ...d,
          _key: parsed.key,
          _label: parsed.label,
          _year: parsed.year,
          _month: parsed.month,
        }
      })
      .filter(Boolean) as (MonthlyPoint & { _key: string; _label: string; _year: number; _month: number })[]

    normalized.sort((a, b) => (a._key < b._key ? -1 : a._key > b._key ? 1 : 0))

    if (!normalized.length) return [] as Array<MonthlyPoint & { displayMonth: string }>

    // Calcula MoM para quem não enviou gainPct
    if (computeMoM) {
      for (let i = 0; i < normalized.length; i++) {
        const curr = normalized[i]
        // Se já veio do backend, respeitamos.
        if (Number.isFinite(curr.gainPct as number)) continue
        const prev = normalized[i - 1]
        if (!prev) {
          // Primeiro ponto sem base: 0% (ou null)
          curr.gainPct = 0
        } else {
          const delta = curr.pnl - prev.pnl
          const denom = prev.pnl === 0 ? Math.abs(curr.pnl) || 1 : Math.abs(prev.pnl)
          const pct = (delta / denom) * 100
          curr.gainPct = Number.isFinite(pct) ? pct : 0
        }
      }
    }

    // Saída com label consistente para o eixo X
    return normalized.map((n) => ({ ...n, month: n._key, displayMonth: n._label }))
  }, [data, computeMoM])

  if (!clean.length) {
    // Estado vazio elegante
    return (
      <Card className="bg-[#0f1d31] border border-[#1e2c46] rounded-2xl shadow-md">
        <CardContent className="px-3 py-2">
          <div className="mb-2 flex items-center gap-2">
            <Pill dotColor="bg-blue-500" className="px-2 py-0.5 text-[10px] font-medium">
              <span className="inline-flex items-center gap-1">
                <BarChart2 className="h-3.5 w-3.5" /> Mensal
              </span>
            </Pill>
          </div>
          <div className="h-28 grid place-items-center text-sm text-white/60">
            Sem dados mensais — nenhum trade encontrado para agrupar.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Domínios automáticos com folga (eixo $)
  const pnlVals = clean.map((d) => Number(d.pnl) || 0)
  const min = Math.min(...pnlVals)
  const max = Math.max(...pnlVals)
  const span = Math.max(1, Math.abs(max - min))
  const pad = Math.max(10, Math.round(span * 0.1))
  const leftDomain: [number, number] = [min - pad, max + pad]

  // Resumo do último mês (badge opcional de insight rápido)
  const last = clean[clean.length - 1]
  const lastMoM = last?.gainPct ?? 0
  const lastColor = lastMoM >= 0 ? 'text-emerald-400' : 'text-rose-400'
  const lastSign = lastMoM >= 0 ? '+' : ''

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] rounded-2xl shadow-md">
      <CardContent className="px-3 py-2">
        {/* Header compacto no padrão Metrics */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <Pill dotColor="bg-blue-500" className="px-2 py-0.5 text-[10px] font-medium">
            <span className="inline-flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" aria-hidden /> Mensal
            </span>
          </Pill>
          <div className="text-[11px] text-white/70">
            Último mês: <span className="font-medium text-white">{last?.displayMonth}</span>
            <span className={`ml-2 font-semibold ${lastColor}`}>{lastSign}{formatPct(lastMoM)}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={clean} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeOpacity={0.15} />
              <XAxis
                dataKey="displayMonth"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={formatMoney}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                domain={leftDomain}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={formatPct}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <RTooltip
                contentStyle={{
                  background: '#0f1d31',
                  border: '1px solid #1e2c46',
                  borderRadius: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
                formatter={(value: any, name: any, { payload }: any) => {
                  if (name === 'pnl')
                    return [
                      `${value < 0 ? '-' : ''}$${Math.abs(Number(value) || 0).toFixed(2)}`,
                      'P&L',
                    ]
                  if (name === 'gainPct') return [formatPct(Number(value) || 0), 'Variação MoM']
                  return [value, name]
                }}
                labelFormatter={(label: string, items: any[]) => {
                  const p = items?.[0]?.payload as (MonthlyPoint & { trades?: number; winRate?: number; displayMonth?: string }) | undefined
                  const extra =
                    p && (p.trades || p.winRate !== undefined)
                      ? ` · ${p.trades ?? '--'} trades${p.winRate !== undefined ? ` · Win ${Math.round(p.winRate)}%` : ''}`
                      : ''
                  return `${p?.displayMonth ?? label}${extra}`
                }}
              />
              <Bar yAxisId="left" dataKey="pnl" radius={[6, 6, 0, 0]}>
                {clean.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="gainPct"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
