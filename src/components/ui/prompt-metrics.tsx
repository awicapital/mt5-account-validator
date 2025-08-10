'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

interface Metric {
  label: string
  value: string | number
  hint: string
}

interface AccountMetricsProps {
  metrics: Metric[]
}

export function AccountMetricsCard({ metrics }: AccountMetricsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
      <CardContent className="pt-6 pb-4 px-6 space-y-4">
        <h3 className="text-white font-semibold text-base">Métricas Avançadas</h3>

        <div className="flex flex-col text-sm text-white">
          {metrics.map((metric, index) => {
            const isActive = activeIndex === index
            const isLast = index === metrics.length - 1

            return (
              <div key={index}>
                <motion.div
                  onClick={() => toggle(index)}
                  className={`relative py-2 cursor-pointer transition-all rounded-md ${
                    isActive
                      ? 'px-4 -mx-2 bg-[#1e2c46] border border-[#3b82f6]'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015, duration: 0.25 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-semibold whitespace-nowrap">{metric.value}</span>
                  </div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="mt-1 text-white/80 text-xs leading-snug"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                      >
                        {metric.hint}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {!isLast && <div className="h-px bg-[#1e2c46]" />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
