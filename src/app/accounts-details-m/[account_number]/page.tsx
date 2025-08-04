'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { AccountResumeCard } from '@/components/ui/account-resume-card'
import { AccountChartCard } from '@/components/ui/account-chart-card'
import { AccountMetricsCard } from '@/components/ui/account-metrics-card'
import { AccountSymbolsCard } from '@/components/ui/account-symbols-card'
import { AccountSymbolsChart } from '@/components/ui/account-symbols-chart'
import { AccountHistoryCard } from '@/components/ui/account-history-card'

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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (isNaN(accountNumber)) {
        setError('Número de conta inválido.')
        setLoading(false)
        return
      }

      try {
        const path = `${accountNumber}.json`

        const { data: urlData, error: urlError } = supabase.storage.from('logs').getPublicUrl(path)
        if (urlError || !urlData.publicUrl) {
          throw new Error(urlError?.message || 'Não conseguiu gerar URL pública.')
        }

        // HEAD request para pegar Last-Modified
        const headRes = await fetch(urlData.publicUrl, { method: 'HEAD' })
        const lastModified = headRes.headers.get('last-modified')
        if (lastModified) {
          setLastUpdated(new Date(lastModified).toISOString())
        }

        const res = await fetch(urlData.publicUrl)
        if (!res.ok) throw new Error('Erro ao baixar arquivo JSON público.')
        const rawTrades: Trade[] = await res.json()

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

        setTrades(rawTrades.filter((t) => t.type !== 'deposit').reverse())
        setLogs(profitLogs)
        setGrowthLogs(growthLogs)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados'
        setError(errorMessage)
        console.error('❌ Erro ao buscar JSON:', err)
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

  const currentBalance = growthLogs.at(-1)?.pnl || 0
  const pnlTotal = logs.at(-1)?.pnl || 0

  const statsBySymbol = trades.reduce<Record<string, Summary>>((acc, t) => {
    const symbol = t.symbol
    acc[symbol] = acc[symbol] || { symbol, volume: 0, trades: 0, profit: 0 }
    acc[symbol].volume += t.volume
    acc[symbol].trades += 1
    acc[symbol].profit += t.profit
    return acc
  }, {})

  const wins = trades.filter((t) => t.profit > 0)
  const losses = trades.filter((t) => t.profit < 0)
  const breakevens = trades.filter((t) => t.profit === 0)

  const winRate = wins.length / trades.length || 0
  const lossRate = losses.length / trades.length || 0
  const breakevenRate = breakevens.length / trades.length || 0

  const avgWin = wins.length ? wins.reduce((acc, t) => acc + t.profit, 0) / wins.length : 0
  const avgLoss = losses.length ? Math.abs(losses.reduce((acc, t) => acc + t.profit, 0) / losses.length) : 0
  const totalWin = wins.reduce((acc, t) => acc + t.profit, 0)
  const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0))
  const expectancy = winRate * avgWin - lossRate * avgLoss
  const profitFactor = totalLoss ? totalWin / totalLoss : Infinity
  const payoffRatio = avgLoss ? avgWin / avgLoss : Infinity

  let peak = growthLogs[0]?.pnl ?? 0
  let maxDD = 0
  const drawdowns: number[] = []
  growthLogs.forEach((log) => {
    if (log.pnl > peak) peak = log.pnl
    const dd = peak - log.pnl
    drawdowns.push(dd)
    if (dd > maxDD) maxDD = dd
  })

  const recoveryFactor = maxDD ? (totalWin - totalLoss) / maxDD : Infinity
  const stdDev = Math.sqrt(
    trades.reduce((acc, t) => acc + Math.pow(t.profit - expectancy, 2), 0) / trades.length
  )

  const averageTrade = trades.reduce((acc, t) => acc + t.profit, 0) / trades.length
  const ulcerIndex = Math.sqrt(drawdowns.reduce((acc, d) => acc + Math.pow((d / peak) * 100, 2), 0) / drawdowns.length)
  const sharpeRatio = stdDev ? averageTrade / stdDev : Infinity
  const sortinoDenom = Math.sqrt(
    trades.filter((t) => t.profit < 0).reduce((acc, t) => acc + Math.pow(t.profit, 2), 0) / losses.length
  )
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
  const worstDay = sortedByDay[sortedByDay.length - 1]

   const metrics = [
    { label: 'Número de Trades', value: trades.length, hint: 'Quantidade total de operações realizadas na conta.' },
    { label: 'Win Rate', value: `${(winRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com lucro. Alto valor é positivo, mas deve ser analisado junto ao risco-retorno.' },
    { label: 'Loss Rate', value: `${(lossRate * 100).toFixed(2)}%`, hint: 'Porcentagem de trades com prejuízo. Quanto menor, melhor para o controle de risco.' },
    { label: 'Break-even Rate', value: `${(breakevenRate * 100).toFixed(2)}%`, hint: 'Percentual de operações que terminaram sem lucro nem prejuízo.' },
    { label: 'Média de Lucro', value: `$${avgWin.toFixed(2)}`, hint: 'Lucro médio das operações positivas. Quanto maior, melhor o desempenho das vitórias.' },
    { label: 'Média de Prejuízo', value: `$${avgLoss.toFixed(2)}`, hint: 'Perda média das operações negativas. Valores menores indicam melhor gestão de risco.' },
    { label: 'Expectativa por Trade', value: `$${expectancy.toFixed(2)}`, hint: 'Lucro médio esperado por operação. Deve ser positivo para indicar um sistema lucrativo.' },
    { label: 'Profit Factor', value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2), hint: 'Relação entre lucro bruto e prejuízo bruto. Ideal acima de 1.5. Abaixo de 1 indica perdas superiores aos ganhos.' },
    { label: 'Payoff Ratio', value: payoffRatio === Infinity ? '∞' : payoffRatio.toFixed(2), hint: 'Relação entre o lucro médio e o prejuízo médio. Valores acima de 1 indicam bom equilíbrio entre risco e retorno.' },
    { label: 'Gain to Pain Ratio', value: gainToPain === Infinity ? '∞' : gainToPain.toFixed(2), hint: 'Lucro total dividido pela soma dos prejuízos. Valores acima de 1 mostram que o ganho compensa a dor.' },
    { label: 'Max Drawdown', value: `$${maxDD.toFixed(2)}`, hint: 'Maior perda acumulada desde um topo. Valores menores indicam maior segurança.' },
    { label: 'Ulcer Index', value: ulcerIndex.toFixed(2), hint: 'Mede intensidade e duração dos drawdowns. Quanto menor, mais suave a curva de capital.' },
    { label: 'Recovery Factor', value: recoveryFactor === Infinity ? '∞' : recoveryFactor.toFixed(2), hint: 'Lucro líquido dividido pelo drawdown máximo. Ideal acima de 1.' },
    { label: 'Sharpe Ratio', value: sharpeRatio === Infinity ? '∞' : sharpeRatio.toFixed(2), hint: 'Retorno ajustado pela volatilidade total. Bom se acima de 1, ótimo acima de 2.' },
    { label: 'Sortino Ratio', value: sortinoRatio === Infinity ? '∞' : sortinoRatio.toFixed(2), hint: 'Similar ao Sharpe, mas considera apenas volatilidade negativa. Valores acima de 2 são muito positivos.' },
    { label: 'Average Trade', value: `$${averageTrade.toFixed(2)}`, hint: 'Retorno médio por operação. Deve ser consistentemente positivo.' },
    { label: 'Standard Deviation', value: `$${stdDev.toFixed(2)}`, hint: 'Volatilidade geral dos resultados. Alta variação pode indicar falta de consistência.' },
    { label: 'SQN (System Quality)', value: sqn === Infinity ? '∞' : sqn.toFixed(2), hint: 'Índice de qualidade estatística da estratégia. Acima de 2 é bom, acima de 5 é excelente.' },
    { label: 'Maior Lucro', value: `$${Math.max(...trades.map(t => t.profit)).toFixed(2)}`, hint: 'Trade mais lucrativo registrado.' },
    { label: 'Maior Prejuízo', value: `$${Math.min(...trades.map(t => t.profit)).toFixed(2)}`, hint: 'Maior prejuízo individual entre todas as operações.' },
    { label: 'Melhor Dia', value: bestDay ? `${bestDay[0]} ($${bestDay[1].toFixed(2)})` : '-', hint: 'Data com o maior lucro diário.' },
    { label: 'Pior Dia', value: worstDay ? `${worstDay[0]} ($${worstDay[1].toFixed(2)})` : '-', hint: 'Data com o maior prejuízo diário.' },
  ]

  return (
    <div className="p-6 bg-[#03182f] min-h-dvh pb-32 space-y-10">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="text-white p-2 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-white space-y-1">
          <h1 className="text-2xl font-bold leading-tight">Conta #{accountNumber}</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      <AccountResumeCard currentBalance={currentBalance} pnlTotal={pnlTotal} />
      <AccountChartCard mode={mode} onChangeMode={setMode} logs={mode === 'profit' ? logs : growthLogs} />
      <AccountMetricsCard metrics={metrics} />
      <AccountSymbolsChart data={Object.values(statsBySymbol)} />
      <AccountHistoryCard trades={trades} />
    </div>
  )
}
