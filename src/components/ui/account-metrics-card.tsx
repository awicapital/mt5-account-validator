'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Info } from 'lucide-react'
import { Pill } from '@/components/ui/pill'
import { useState } from 'react'

interface Metric {
  label: string
  value: string | number
  hint: string
}

interface AccountMetricsProps {
  metrics: Metric[]
}

export function AccountMetricsCard({ metrics }: AccountMetricsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] rounded-2xl shadow-md">
      <CardContent className="px-3 py-2">
        {/* Título com Pill */}
        <div className="mb-2 flex items-center gap-2">
          <Pill dotColor="bg-blue-500" className="px-2 py-0.5 text-[10px] font-medium">
            Métricas
          </Pill>
        </div>

        {/* Lista com linha divisória */}
        <div className="flex flex-col divide-y divide-[#1e2c46] text-[11px] leading-tight text-white/80">
          {metrics.map((m, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="flex items-center justify-between truncate py-1"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="truncate">{m.label}</span>
                  <Popover open={isOpen} onOpenChange={(o) => setOpenIndex(o ? i : null)}>
                    <PopoverTrigger asChild>
                      <button
                        className="p-0.5 text-white/50 hover:text-white focus:outline-none"
                        aria-label={`Sobre ${m.label}`}
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      sideOffset={4}
                      className="max-w-xs text-[10px] leading-snug py-1 px-2"
                    >
                      {m.hint}
                    </PopoverContent>
                  </Popover>
                </div>

                <span className="font-medium tabular-nums truncate text-white">{m.value}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
