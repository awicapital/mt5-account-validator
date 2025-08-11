'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { BackHeader } from '@/components/ui/back-header'
import { AccountResumeCard } from '@/components/ui/account-resume-card'
import { AccountChartCard } from '@/components/ui/account-chart-card'
import { AccountMetricsCard } from '@/components/ui/account-metrics-card'
import { AccountSymbolsChart } from '@/components/ui/account-symbols-chart'
import { AccountHistoryCard } from '@/components/ui/account-history-card'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

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
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const [totalDeposits, setTotalDeposits] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (isNaN(accountNumber)) {
        setError('Número de conta inválido.')
        setLoading(false)
        return
      }

      try {
        const path = `${accountNumber}.json`
        const { data: urlData } = supabase.storage.from('logs').getPublicUrl(path)
        if (!urlData?.publicUrl) throw new Error('Não conseguiu gerar URL pública.')

        const headRes = await fetch(urlData.publicUrl, { method: 'HEAD' })
        const lastModified = headRes.headers.get('last-modified')
        if (lastModified) setLastUpdated(new Date(lastModified).toISOString())

        const res = await fetch(urlData.publicUrl)
        if (!res.ok) throw new Error('Erro ao baixar arquivo JSON público.')
        const rawTrades: Trade[] = await res.json()

        const isCashflow = (t: Trade) =>
          t.type === 'deposit' || t.type === 'withdraw' || t.type === 'withdrawal'

        const deposits = rawTrades
          .filter(t => t.type === 'deposit' && t.profit > 0)
          .reduce((sum, t) => sum + t.profit, 0)

        const withdrawals = rawTrades
          .filter(t => t.type === 'withdraw' || t.type === 'withdrawal' || (t.type === 'deposit' && t.profit < 0))
          .reduce((sum, t) => sum + Math.abs(t.profit), 0)

        setTotalDeposits(deposits)
        setTotalWithdrawals(withdrawals)

        const profit: Log[] = []
        let accProfit = 0

        rawTrades.forEach((t) => {
          if (!isCashflow(t) && !(t.type === 'deposit')) {
            accProfit += t.profit
            profit.push({ date: t.date, pnl: accProfit, end_balance: 0 })
          }
        })

        setTrades(
          rawTrades
            .filter(t => !isCashflow(t) && !(t.type === 'deposit'))
            .reverse()
        )
        setLogs(profit)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados'
        setError(msg)
        console.error('❌ Erro ao buscar JSON:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountNumber])

  // -------- cálculos --------
  const currentBalance = logs.at(-1)?.pnl || 0
  const pnlTotal = logs.at(-1)?.pnl || 0

  const statsBySymbol = trades.reduce<Record<string, Summary>>((acc, t) => {
    acc[t.symbol] ||= { symbol: t.symbol, volume: 0, trades: 0, profit: 0 }
    acc[t.symbol].volume += t.volume
    acc[t.symbol].trades += 1
    acc[t.symbol].profit += t.profit
    return acc
  }, {})

  const wins = trades.filter((t) => t.profit > 0)
  const losses = trades.filter((t) => t.profit < 0)
  const breakevens = trades.filter((t) => t.profit === 0)

  const winRate = wins.length / trades.length || 0
  const lossRate = losses.length / trades.length || 0
  const breakevenRate = breakevens.length / trades.length || 0

  const avgWin = wins.reduce((acc, t) => acc + t.profit, 0) / (wins.length || 1)
  const avgLoss = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0)) / (losses.length || 1)

  const totalWin = wins.reduce((acc, t) => acc + t.profit, 0)
  const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0))
  const expectancy = winRate * avgWin - lossRate * avgLoss
  const profitFactor = totalLoss ? totalWin / totalLoss : Infinity
  const payoffRatio = avgLoss ? avgWin / avgLoss : Infinity

  let peak = logs[0]?.pnl ?? 0
  let maxDD = 0
  const drawdowns: number[] = []
  logs.forEach((log) => {
    if (log.pnl > peak) peak = log.pnl
    const dd = peak - log.pnl
    drawdowns.push(dd)
    if (dd > maxDD) maxDD = dd
  })

  const recoveryFactor = maxDD ? (totalWin - totalLoss) / maxDD : Infinity
  const stdDev = Math.sqrt(trades.reduce((acc, t) => acc + Math.pow(t.profit - expectancy, 2), 0) / (trades.length || 1))
  const averageTrade = trades.reduce((acc, t) => acc + t.profit, 0) / (trades.length || 1)
  const ulcerIndex = Math.sqrt(drawdowns.reduce((acc, d) => acc + Math.pow((d / peak) * 100, 2), 0) / (drawdowns.length || 1))

  const sortinoDenom = Math.sqrt(
    losses.reduce((acc, t) => acc + Math.pow(t.profit, 2), 0) / (losses.length || 1)
  )

  const sharpeRatio = stdDev ? averageTrade / stdDev : Infinity
  const sortinoRatio = sortinoDenom ? averageTrade / sortinoDenom : Infinity
  const gainToPain = totalLoss ? totalWin / totalLoss : Infinity
  const sqn = stdDev ? (averageTrade / stdDev) * Math.sqrt(trades.length) : Infinity

  const grouped: Record<string, number> = {}
  trades.forEach((t) => {
    const d = t.date.split(' ')[0]
    grouped[d] = (grouped[d] || 0) + t.profit
  })

  const sortedByDay = Object.entries(grouped).sort((a, b) => b[1] - a[1])
  const bestDay = sortedByDay[0]
  const worstDay = sortedByDay.at(-1)

  const metrics = [
    { label: 'Número de Trades', value: trades.length, hint: 'Quantidade total de operações realizadas na conta.' },
    { label: 'Win Rate', value: `${(winRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com lucro.' },
    { label: 'Loss Rate', value: `${(lossRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com prejuízo.' },
    { label: 'Break-even Rate', value: `${(breakevenRate * 100).toFixed(2)}%`, hint: 'Percentual de empates (sem lucro ou prejuízo).' },
    { label: 'Média de Lucro', value: `$${avgWin.toFixed(2)}`, hint: 'Lucro médio das operações positivas.' },
    { label: 'Média de Prejuízo', value: `$${avgLoss.toFixed(2)}`, hint: 'Prejuízo médio das operações negativas.' },
    { label: 'Expectativa por Trade', value: `$${expectancy.toFixed(2)}`, hint: 'Lucro esperado por operação.' },
    { label: 'Profit Factor', value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2), hint: 'Lucro bruto dividido pelo prejuízo bruto.' },
    { label: 'Payoff Ratio', value: payoffRatio === Infinity ? '∞' : payoffRatio.toFixed(2), hint: 'Lucro médio / prejuízo médio.' },
    { label: 'Gain to Pain Ratio', value: gainToPain === Infinity ? '∞' : gainToPain.toFixed(2), hint: 'Lucro total dividido pelas perdas totais.' },
    { label: 'Max Drawdown', value: `$${maxDD.toFixed(2)}`, hint: 'Maior queda acumulada desde um topo.' },
    { label: 'Ulcer Index', value: ulcerIndex.toFixed(2), hint: 'Índice que mede profundidade e duração dos drawdowns.' },
    { label: 'Recovery Factor', value: recoveryFactor === Infinity ? '∞' : recoveryFactor.toFixed(2), hint: 'Lucro líquido dividido pelo drawdown máximo.' },
    { label: 'Sharpe Ratio', value: sharpeRatio === Infinity ? '∞' : sharpeRatio.toFixed(2), hint: 'Retorno ajustado pela volatilidade.' },
    { label: 'Sortino Ratio', value: sortinoRatio === Infinity ? '∞' : sortinoRatio.toFixed(2), hint: 'Retorno ajustado pela volatilidade negativa.' },
    { label: 'Average Trade', value: `$${averageTrade.toFixed(2)}`, hint: 'Média de lucro/prejuízo por trade.' },
    { label: 'Standard Deviation', value: `$${stdDev.toFixed(2)}`, hint: 'Desvio padrão dos resultados.' },
    { label: 'SQN (System Quality)', value: sqn === Infinity ? '∞' : sqn.toFixed(2), hint: 'Índice de qualidade estatística da estratégia.' },
    { label: 'Maior Lucro', value: `$${Math.max(...trades.map(t => t.profit)).toFixed(2)}`, hint: 'Trade mais lucrativo registrado.' },
    { label: 'Maior Prejuízo', value: `$${Math.min(...trades.map(t => t.profit)).toFixed(2)}`, hint: 'Maior prejuízo registrado.' },
    { label: 'Melhor Dia', value: bestDay ? `${bestDay[0]} ($${bestDay[1].toFixed(2)})` : '-', hint: 'Maior lucro diário.' },
    { label: 'Pior Dia', value: worstDay ? `${worstDay[0]} ($${worstDay[1].toFixed(2)})` : '-', hint: 'Maior prejuízo diário.' },
  ]

  const symbolsStructured = useMemo(() => {
    return Object.values(statsBySymbol)
      .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
      .map(s => ({
        symbol: s.symbol,
        trades: s.trades,
        volume: s.volume,
        grossProfit: Number(s.profit.toFixed(2)),
        avgPerTrade: Number((s.profit / (s.trades || 1)).toFixed(2)),
      }))
  }, [statsBySymbol])

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
            className="mt-2 px-4 py-2 bg:white/10 hover:bg-white/20 text-white rounded-md"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const buildClipboardJSON = () => {
    const payload = {
      account: {
        id: accountNumber,
        lastUpdated,
        currentBalance: Number(currentBalance.toFixed(2)),
        pnlTotal: Number(pnlTotal.toFixed(2)),
        deposits: Number(totalDeposits.toFixed(2)),
        withdrawals: Number(totalWithdrawals.toFixed(2)),
      },
      metrics: {
        trades: trades.length,
        winRate: Number((winRate * 100).toFixed(2)),
        lossRate: Number((lossRate * 100).toFixed(2)),
        breakevenRate: Number((breakevenRate * 100).toFixed(2)),
        avgWin: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2)),
        expectancy: Number(expectancy.toFixed(2)),
        profitFactor: Number((profitFactor === Infinity ? 0 : profitFactor).toFixed(4)),
        payoffRatio: Number((payoffRatio === Infinity ? 0 : payoffRatio).toFixed(4)),
        gainToPain: Number((gainToPain === Infinity ? 0 : gainToPain).toFixed(4)),
        maxDrawdown: Number(maxDD.toFixed(2)),
        ulcerIndex: Number(ulcerIndex.toFixed(4)),
        recoveryFactor: Number((recoveryFactor === Infinity ? 0 : recoveryFactor).toFixed(4)),
        sharpeRatio: Number((sharpeRatio === Infinity ? 0 : sharpeRatio).toFixed(4)),
        sortinoRatio: Number((sortinoRatio === Infinity ? 0 : sortinoRatio).toFixed(4)),
        averageTrade: Number(averageTrade.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        sqn: Number((sqn === Infinity ? 0 : sqn).toFixed(4)),
        bestDay: bestDay ? { date: bestDay[0], pnl: Number(bestDay[1].toFixed(2)) } : null,
        worstDay: worstDay ? { date: worstDay[0], pnl: Number(worstDay[1].toFixed(2)) } : null,
      },
      bySymbol: symbolsStructured,
    }

    return JSON.stringify(payload, null, 2)
  }

  const copyMetricsToClipboard = async () => {
    const text = buildClipboardJSON()

    try {
      await navigator.clipboard.writeText(text)
      toast.success('Métricas e resumo por ativo copiados!')
      return
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        ta.style.top = '0'
        ta.setAttribute('readonly', '')
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast.success('Métricas e resumo por ativo copiados!')
        return
      } catch (fallbackErr) {
        console.error('Falha ao copiar:', fallbackErr)
        toast.error('Não foi possível copiar. Copie manualmente.')
      }
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="pb-28 bg-[#03182f] min-h-dvh space-y-6">
        <BackHeader
          // mantém colado, texto branco e borda sutil
          className="bg-transparent border-b border-white/10 text-white"
          fallbackHref="/dashboard"
          withBorder
          title={`Account #${accountNumber}`}
          // rightSlot opcional (ex.: ações)
        />
        {lastUpdated && (
          <p className="px-4 -mt-3 text-xs text-white/60">
            Last update: {new Date(lastUpdated).toLocaleString('pt-BR')}
          </p>
        )}

        <div className="space-y-6 px-4 pt-1">
          <AccountResumeCard
            currentBalance={currentBalance}
            pnlTotal={pnlTotal}
            totalDeposits={totalDeposits}
            totalWithdrawals={totalWithdrawals}
          />

          <AccountChartCard logs={logs} />

          <AccountMetricsCard metrics={metrics} />
          <AccountSymbolsChart data={Object.values(statsBySymbol)} />
          <AccountHistoryCard trades={trades} />
        </div>

        {/* Botão Flutuante - Copia métricas + resumo por ativo */}
        <div className="fixed right-4 bottom-24 md:bottom-8 z-40">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={copyMetricsToClipboard}
                className="rounded-full shadow-xl bg-[#1e78e0] text-white hover:bg-[#1663b8] border border-white/20"
                aria-label="Copiar métricas da conta"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Copiar métricas
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p>Copiar todas as métricas e o resumo por ativo (JSON) para a área de transferência.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
