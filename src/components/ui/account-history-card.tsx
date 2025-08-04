'use client'

import { Card, CardContent } from '@/components/ui/card'

interface Trade {
  date: string
  symbol: string
  type: string
  volume: number
  profit: number
}

interface AccountHistoryCardProps {
  trades: Trade[]
}

export function AccountHistoryCard({ trades }: AccountHistoryCardProps) {
  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
      <CardContent className="pt-6 pb-4 px-6 space-y-4">
        <h3 className="text-white font-semibold text-base">Histórico de Trades</h3>

        <div className="flex flex-col text-sm text-white max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
          {sorted.map((t, idx) => {
            const typeColor = t.type === 'buy' ? 'text-green-400' : 'text-red-400'
            const profitColor =
              t.profit > 0
                ? 'text-green-400'
                : t.profit < 0
                ? 'text-red-400'
                : 'text-muted-foreground'

            const isFirst = idx === 0

            return (
              <div key={idx}>
                {!isFirst && <div className="h-px bg-[#1e2c46]" />}

                <div className="py-2">
                  {/* Linha 1 */}
                  <div className="grid grid-cols-3 items-center font-medium">
                    <span className="truncate">{t.symbol}</span>
                    <span className={`text-center uppercase ${typeColor}`}>{t.type}</span>
                    <span className={`text-right ${profitColor}`}>
                      {t.profit < 0 ? '- ' : ''}
                      ${Math.abs(t.profit).toFixed(2)}
                    </span>
                  </div>

                  {/* Linha 2 */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{t.date}</span>
                    <span>{t.volume}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
