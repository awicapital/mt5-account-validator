'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { BackHeader } from '@/components/ui/back-header'
import { AccountResumeCard } from '@/components/ui/account-resume-card'
import { AccountChartCard } from '@/components/ui/account-chart-card'
import { AccountMetricsCard } from '@/components/ui/account-metrics-card'
import { AccountSymbolsChart } from '@/components/ui/account-symbols-chart'
import { AccountHistoryCard } from '@/components/ui/account-history-card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Pill } from '@/components/ui/pill'

import { computeMetrics } from '@/lib/metricsCalculation'

type Trade = {
  account_number: number
  date: string
  symbol: string
  type: string
  volume: number
  profit: number
}

type HistoryTrade = {
  id: string
  date: string
  type: string
  profit: number
  accountId: string
  symbol: string
  volume: number
}

export default function AccountDetailsPage() {
  const { account_number } = useParams<{ account_number: string }>()
  const accountNumber = Number(account_number)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [rawTrades, setRawTrades] = useState<Trade[]>([])

  useEffect(() => {
    (async () => {
      if (Number.isNaN(accountNumber)) {
        setError('Número de conta inválido.')
        setLoading(false)
        return
      }
      try {
        const path = `${accountNumber}.json`
        const { data: urlData } = supabase.storage.from('logs').getPublicUrl(path)
        const url = urlData?.publicUrl
        if (!url) throw new Error('Não conseguiu gerar URL pública.')

        const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Erro ao baixar arquivo JSON público.')
        const lm = res.headers.get('last-modified')
        if (lm) setLastUpdated(new Date(lm).toISOString())

        const arr = (await res.json()) as unknown
        if (!Array.isArray(arr)) throw new Error('Formato inesperado do JSON.')
        setRawTrades(arr as Trade[])
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'Erro ao carregar dados'
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [accountNumber])

  const computed = useMemo(() => {
    if (!rawTrades.length) return null

    const normalized = rawTrades.map(t => ({
      ...t,
      date: t.date.includes('T') ? t.date : t.date.replace(' ', 'T'),
    }))

    return computeMetrics(
      normalized.map(t => ({
        id: `${accountNumber}-${t.date}`,
        date: t.date,
        type: t.type,
        profit: t.profit,
        accountId: String(accountNumber),
        symbol: t.symbol,
        volume: t.volume,
      })),
      { includeCashflowInLogs: false }
    )
  }, [rawTrades, accountNumber])

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f]">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    )
  }

  if (error || !computed) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f] text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Erro ao carregar dados da conta</p>
          <p className="text-sm text-white/70">{error ?? 'Dados indisponíveis.'}</p>
        </div>
      </div>
    )
  }

  const { logs, tradesNoCashflow, perSymbol, totals, ratios, byDaySorted } = computed

  const metrics = [
    { label: 'Número de Trades', value: tradesNoCashflow.length, hint: 'Quantidade total de operações realizadas na conta.' },
    { label: 'Win Rate', value: `${(ratios.winRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com lucro.' },
    { label: 'Loss Rate', value: `${(ratios.lossRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com prejuízo.' },
    { label: 'Break-even Rate', value: `${(ratios.breakevenRate * 100).toFixed(2)}%`, hint: 'Percentual de empates (sem lucro ou prejuízo).' },
    { label: 'Média de Lucro', value: `$${ratios.avgWin.toFixed(2)}`, hint: 'Lucro médio das operações positivas.' },
    { label: 'Média de Prejuízo', value: `$${ratios.avgLoss.toFixed(2)}`, hint: 'Prejuízo médio das operações negativas.' },
    { label: 'Expectativa por Trade', value: `$${ratios.expectancy.toFixed(2)}`, hint: 'Lucro esperado por operação.' },
    { label: 'Profit Factor', value: ratios.profitFactor === Infinity ? '∞' : ratios.profitFactor.toFixed(2), hint: 'Lucro bruto dividido pelo prejuízo bruto.' },
    { label: 'Payoff Ratio', value: ratios.payoffRatio === Infinity ? '∞' : ratios.payoffRatio.toFixed(2), hint: 'Lucro médio / prejuízo médio.' },
    { label: 'Gain to Pain Ratio', value: ratios.gainToPain === Infinity ? '∞' : ratios.gainToPain.toFixed(2), hint: 'Lucro total dividido pelas perdas totais.' },
    { label: 'Max Drawdown', value: `$${ratios.maxDD.toFixed(2)}`, hint: 'Maior queda acumulada desde um topo.' },
    { label: 'Ulcer Index', value: ratios.ulcerIndex.toFixed(2), hint: 'Índice que mede profundidade e duração dos drawdowns.' },
    { label: 'Recovery Factor', value: ratios.recoveryFactor === Infinity ? '∞' : ratios.recoveryFactor.toFixed(2), hint: 'Lucro líquido dividido pelo drawdown máximo.' },
    { label: 'Sharpe Ratio', value: ratios.sharpeRatio === Infinity ? '∞' : ratios.sharpeRatio.toFixed(2), hint: 'Retorno ajustado pela volatilidade.' },
    { label: 'Sortino Ratio', value: ratios.sortinoRatio === Infinity ? '∞' : ratios.sortinoRatio.toFixed(2), hint: 'Retorno ajustado pela volatilidade negativa.' },
    { label: 'Average Trade', value: `$${ratios.averageTrade.toFixed(2)}`, hint: 'Média de lucro/prejuízo por trade.' },
    { label: 'Standard Deviation', value: `$${ratios.stdDev.toFixed(2)}`, hint: 'Desvio padrão dos resultados.' },
    { label: 'SQN (System Quality)', value: ratios.sqn === Infinity ? '∞' : ratios.sqn.toFixed(2), hint: 'Índice de qualidade estatística da estratégia.' },
    { label: 'Melhor Dia', value: ratios.bestDay ? `${ratios.bestDay[0]} ($${ratios.bestDay[1].toFixed(2)})` : '-', hint: 'Maior lucro diário.' },
    { label: 'Pior Dia', value: ratios.worstDay ? `${ratios.worstDay[0]} ($${ratios.worstDay[1].toFixed(2)})` : '-', hint: 'Maior prejuízo diário.' },
  ]

  const buildClipboardJSON = () =>
    JSON.stringify(
      {
        account: {
          id: accountNumber,
          lastUpdated,
          currentBalance: Number(totals.currentBalance.toFixed(2)),
          pnlTotal: Number(totals.pnlTotal.toFixed(2)),
          deposits: Number(totals.deposits.toFixed(2)),
          withdrawals: Number(totals.withdrawals.toFixed(2)),
        },
        metrics: {
          trades: tradesNoCashflow.length,
          winRate: Number((ratios.winRate * 100).toFixed(2)),
          lossRate: Number((ratios.lossRate * 100).toFixed(2)),
          breakevenRate: Number((ratios.breakevenRate * 100).toFixed(2)),
          avgWin: Number(ratios.avgWin.toFixed(2)),
          avgLoss: Number(ratios.avgLoss.toFixed(2)),
          expectancy: Number(ratios.expectancy.toFixed(2)),
          profitFactor: Number((ratios.profitFactor === Infinity ? 0 : ratios.profitFactor).toFixed(4)),
          payoffRatio: Number((ratios.payoffRatio === Infinity ? 0 : ratios.payoffRatio).toFixed(4)),
          gainToPain: Number((ratios.gainToPain === Infinity ? 0 : ratios.gainToPain).toFixed(4)),
          maxDrawdown: Number(ratios.maxDD.toFixed(2)),
          ulcerIndex: Number(ratios.ulcerIndex.toFixed(4)),
          recoveryFactor: Number((ratios.recoveryFactor === Infinity ? 0 : ratios.recoveryFactor).toFixed(4)),
          sharpeRatio: Number((ratios.sharpeRatio === Infinity ? 0 : ratios.sharpeRatio).toFixed(4)),
          sortinoRatio: Number((ratios.sortinoRatio === Infinity ? 0 : ratios.sortinoRatio).toFixed(4)),
          averageTrade: Number(ratios.averageTrade.toFixed(2)),
          stdDev: Number(ratios.stdDev.toFixed(2)),
          sqn: Number((ratios.sqn === Infinity ? 0 : ratios.sqn).toFixed(4)),
          bestDay: byDaySorted[0] ? { date: byDaySorted[0][0], pnl: Number(byDaySorted[0][1].toFixed(2)) } : null,
          worstDay: byDaySorted.at(-1) ? { date: byDaySorted.at(-1)![0], pnl: Number(byDaySorted.at(-1)![1].toFixed(2)) } : null,
        },
        bySymbol: perSymbol.map(s => ({
          symbol: s.symbol,
          trades: s.trades,
          volume: s.volume,
          grossProfit: Number(s.profit.toFixed(2)),
          avgPerTrade: Number(s.avgPerTrade.toFixed(2)),
        })),
      },
      null,
      2
    )

  const copyMetricsToClipboard = async () => {
    const text = buildClipboardJSON()
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Métricas e resumo por ativo copiados!')
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
      } catch {
        toast.error('Não foi possível copiar. Copie manualmente.')
      }
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="pb-28 bg-[#03182f] min-h-dvh space-y-6">
        <BackHeader
          className="bg-transparent border-b border-white/10 text-white"
          fallbackHref="/dashboard"
          withBorder
        />

        {/* Pill com número da conta e bolinha verde (mesmo estilo do componente Pill) */}
        <div className="pt-2">
          <Pill dotColor="bg-green-500">{accountNumber}</Pill>
        </div>

        {lastUpdated && (
          <p className="mt-1 text-xs text-white/60">
            Last update: {new Date(lastUpdated).toLocaleString('pt-BR')}
          </p>
        )}

        <div className="space-y-6 pt-1">
          <AccountResumeCard
            currentBalance={totals.currentBalance}
            pnlTotal={totals.pnlTotal}
            totalDeposits={totals.deposits}
            totalWithdrawals={totals.withdrawals}
          />

          <AccountChartCard logs={logs} />

          <AccountMetricsCard metrics={metrics} />
          <AccountSymbolsChart
            data={perSymbol.map(s => ({
              symbol: s.symbol,
              trades: s.trades,
              volume: s.volume,
              profit: s.profit,
            }))}
          />
          <AccountHistoryCard trades={tradesNoCashflow as unknown as HistoryTrade[]} />
        </div>

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
