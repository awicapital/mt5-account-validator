'use client'

import { Card, CardContent } from '@/components/ui/card'

interface SymbolSummary {
  symbol: string
  trades: number
  volume: number
  profit: number
}

interface AccountSymbolsCardProps {
  data: SymbolSummary[]
}

export function AccountSymbolsCard({ data }: AccountSymbolsCardProps) {
  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
      <CardContent className="px-4 py-5 space-y-4">
        <h3 className="text-white font-semibold text-base">Resumo por Ativo</h3>

        <div className="flex flex-col divide-y divide-[#1e2c46]">
          {data.map((item) => (
            <div key={item.symbol} className="py-3 grid grid-cols-2 items-center text-sm text-white">
              <span className="font-medium">{item.symbol}</span>
              <div className="text-right space-y-0.5 leading-snug">
                <div className="text-muted-foreground text-xs">
                  {item.trades} trades • Vol: {item.volume.toFixed(2)}
                </div>
                <div
                  className={`font-semibold ${
                    item.profit > 0
                      ? 'text-green-400'
                      : item.profit < 0
                      ? 'text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  ${item.profit.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
