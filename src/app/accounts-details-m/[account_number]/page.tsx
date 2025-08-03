'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, TrendingUp, ArrowLeft, LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import React from 'react'

interface Trade {
  account_number: number
  date: string
  symbol: string
  type: string
  volume: number
  profit: number
}

interface Log {
  date: string
  pnl: number
  end_balance: number
}

interface Summary {
  symbol: string
  volume: number
  trades: number
  profit: number
}

export default function AccountDetailsPage() {
  const { account_number } = useParams<{ account_number: string }>()
  const accountNumber = Number(account_number)
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [growthLogs, setGrowthLogs] = useState<Log[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'profit' | 'growth'>('profit')

  useEffect(() => {
    const fetchData = async () => {
      if (isNaN(accountNumber)) {
        setError('Número de conta inválido.')
        setLoading(false)
        return
      }

      try {
        const { data: file, error } = await supabase.storage
          .from('logs')
          .download(`${accountNumber}.json`)

        let rawTrades: Trade[] = []

        if (error || !file) {
          console.warn('❌ Supabase falhou, tentando fallback local:', error?.message)
          const res = await fetch(`/mock/${accountNumber}.json`)
          if (!res.ok) throw new Error('Mock local não encontrado.')
          rawTrades = await res.json()
        } else {
          const text = await file.text()
          rawTrades = JSON.parse(text)
        }

        const growthLogs: Log[] = []
        const profitLogs: Log[] = []
        let total = 0
        let profitOnly = 0

        rawTrades.forEach((t) => {
          total += t.profit
          if (t.type !== 'deposit') {
            profitOnly += t.profit
            profitLogs.push({ date: t.date, pnl: profitOnly, end_balance: 0 })
          }
          growthLogs.push({ date: t.date, pnl: total, end_balance: 0 })
        })

        setTrades(rawTrades.filter(t => t.type !== 'deposit').reverse())
        setLogs(profitLogs)
        setGrowthLogs(growthLogs)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados')
        console.error('❌ Erro total ao buscar JSON:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountNumber])

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f]">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f] text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Erro ao carregar dados da conta</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const selectedLogs = mode === 'profit' ? logs : growthLogs
  const currentBalance = growthLogs.at(-1)?.pnl || 0
  const pnlTotal = logs.at(-1)?.pnl || 0
  const pnlColorClass = pnlTotal > 0 ? 'text-green-400' : pnlTotal < 0 ? 'text-red-400' : 'text-muted-foreground'

  const statsBySymbol = trades.reduce<Record<string, Summary>>((acc, t) => {
    const symbol = t.symbol
    acc[symbol] = acc[symbol] || { symbol, volume: 0, trades: 0, profit: 0 }
    acc[symbol].volume += t.volume
    acc[symbol].trades += 1
    acc[symbol].profit += t.profit
    return acc
  }, {})

  const Stat = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | React.ReactNode }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-[#1e2c46]">
        <Icon className="text-[#8CA3BA] w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-lg font-semibold text-white leading-tight">{value}</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 bg-[#03182f] min-h-dvh pb-32 space-y-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-white p-2 rounded-full hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-white space-y-1">
          <h1 className="text-2xl font-bold leading-tight">Conta #{accountNumber}</h1>
          <p className="text-sm text-muted-foreground">Dados carregados via JSON</p>
        </div>
      </div>

      <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
        <CardContent className="flex items-start justify-between px-4 py-6">
          <Stat icon={DollarSign} label="Saldo atual" value={`$${currentBalance.toFixed(2)}`} />
          <Stat icon={TrendingUp} label="PnL total" value={<span className={pnlColorClass}>${pnlTotal.toFixed(2)}</span>} />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button variant={mode === 'growth' ? 'default' : 'outline'} onClick={() => setMode('growth')}>Growth</Button>
        <Button variant={mode === 'profit' ? 'default' : 'outline'} onClick={() => setMode('profit')}>Profit</Button>
      </div>

      <div className="rounded-2xl bg-[#0f1d31] shadow-md p-6 border border-[#1e2c46]">
        <h2 className="text-white font-semibold text-base mb-4">Evolução do {mode === 'profit' ? 'Profit' : 'Growth'}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={selectedLogs} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e2c46" strokeDasharray="3 3" vertical={false} />
            <XAxis hide />
            <YAxis stroke="#1f2c44" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2000', 'dataMax + 2000']} tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toFixed(0)}`} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null
              const log = payload[0].payload as Log
              const colorClass = log.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              return (
                <div className="bg-[#1f2c44] text-white p-3 rounded-md shadow">
                  <div className="text-sm font-medium">{log.date}</div>
                  <div className={`text-xs font-medium ${colorClass}`}>PnL acumulado: ${log.pnl.toFixed(2)}</div>
                </div>
              )
            }} />
            <Line type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={false} animationDuration={500} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
        <CardContent className="space-y-4">
          <h3 className="text-white font-semibold text-base">Resumo por Ativo</h3>
          {Object.values(statsBySymbol).map((s) => (
            <div key={s.symbol} className="flex justify-between text-sm text-white border-b border-[#1e2c46] pb-2">
              <span>{s.symbol}</span>
              <span className="text-right">{s.trades} trades • Vol: {s.volume.toFixed(2)} • <span className={s.profit >= 0 ? 'text-green-400' : 'text-red-400'}>${s.profit.toFixed(2)}</span></span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
        <CardContent className="pt-6 px-6 pb-4">
          <h3 className="text-white font-semibold text-base mb-4">Histórico de Trades</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-[#0f1d31]">
                <tr className="text-muted-foreground border-b border-[#1f2c44]">
                  <th className="py-2 sticky top-0 bg-[#0f1d31]">Data</th>
                  <th className="py-2 sticky top-0 bg-[#0f1d31]">Ativo</th>
                  <th className="py-2 sticky top-0 bg-[#0f1d31]">Tipo</th>
                  <th className="py-2 text-right sticky top-0 bg-[#0f1d31]">Volume</th>
                  <th className="py-2 text-right sticky top-0 bg-[#0f1d31]">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, idx) => (
                  <tr key={idx} className="border-t border-[#1f2c44] hover:bg-[#131f35] transition-colors">
                    <td className="py-2 text-white whitespace-nowrap">{t.date}</td>
                    <td className="text-white whitespace-nowrap">{t.symbol}</td>
                    <td className="text-white capitalize whitespace-nowrap">{t.type}</td>
                    <td className="text-right text-white whitespace-nowrap">{t.volume}</td>
                    <td className={`text-right font-semibold whitespace-nowrap ${t.profit > 0 ? 'text-green-400' : t.profit < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{t.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}