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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados'
        setError(message)
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
      {/* Restante do JSX permanece igual */}
    </div>
  )
}
