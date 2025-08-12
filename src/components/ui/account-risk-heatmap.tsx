// components/ui/account-monthly-gain-card.tsx
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from 'recharts'
import { BarChart2 } from 'lucide-react'

export type MonthlyGainPoint = { month: string; gainPct: number }

export function AccountMonthlyGainCard({ data }: { data: MonthlyGainPoint[] }) {
  if (!data?.length) return null
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Monthly Gain</CardTitle>
        <CardDescription>Variação percentual mês a mês</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
            <RTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
            <Bar dataKey="gainPct" radius={[8, 8, 0, 0]} fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
