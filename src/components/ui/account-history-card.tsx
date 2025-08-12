'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Pill } from '@/components/ui/pill'

interface Trade {
  date: string
  symbol: string
  type: 'buy' | 'sell'
  volume: number
  profit: number
}

interface AccountHistoryCardProps {
  trades: Trade[]
}

function formatMoney(v: number) {
  const sign = v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toFixed(2)}`
}

function formatDateTime(dt: string) {
  const [date, time] = dt.split('T')
  return `${date} ${time}`
}

export function AccountHistoryCard({ trades }: AccountHistoryCardProps) {
  const sorted = [...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] rounded-2xl shadow-md">
      <CardContent className="px-3">
        {/* Título (mesmo padrão da Metrics) */}
        <div className="mb-2 flex items-center gap-2">
          <Pill dotColor="bg-blue-500" className="px-2 py-0.5 text-[10px] font-medium">
            Histórico
          </Pill>
        </div>

        {/* Lista (mesma densidade/linha e divisores da Metrics) */}
        <div
          className="flex flex-col max-h-[260px] overflow-y-auto pr-1 scrollbar-hide text-white"
          aria-label="Lista de trades"
        >
          {sorted.map((t, idx) => {
            const profitPositive = t.profit > 0
            const profitNegative = t.profit < 0

            return (
              <div key={`${t.symbol}-${t.date}-${idx}`} className="text-[11px]">
                {idx !== 0 && <div className="h-px bg-[#1e2c46]" />}

                <div className="py-2">
                  {/* Linha principal (padrão: label à esquerda, valor à direita) */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    {/* Esquerda: símbolo + chip + meta enxuta */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-white/80">{t.symbol}</span>

                        <span
                          className={[
                            'uppercase rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                            t.type === 'buy'
                              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
                          ].join(' ')}
                        >
                          {t.type}
                        </span>
                      </div>

                      {/* Meta compacta no mesmo padrão da linha auxiliar da Metrics */}
                      <div className="mt-0.5 text-[10px] text-white/60 truncate">
                        {formatDateTime(t.date)} · Vol: <span className="tabular-nums">{t.volume}</span>
                      </div>
                    </div>

                    {/* Direita: lucro/prejuízo alinhado (tabular) */}
                    <span
                      className={[
                        'justify-self-end tabular-nums font-medium',
                        profitPositive ? 'text-emerald-400' : '',
                        profitNegative ? 'text-red-400' : '',
                        !profitPositive && !profitNegative ? 'text-white/70' : '',
                      ].join(' ')}
                    >
                      {formatMoney(t.profit)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {sorted.length === 0 && (
            <div className="py-6 text-center text-white/60 text-[11px]">Sem trades</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
