'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentBalance: number
  pnlTotal: number
}

export function AccountResumeCard({ currentBalance, pnlTotal }: Props) {
  const pnlColor =
    pnlTotal > 0 ? 'text-green-400' : pnlTotal < 0 ? 'text-red-400' : 'text-muted-foreground'

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
      <CardContent className="flex items-center justify-between px-6 py-5 gap-6">
        <Item icon={<DollarSign className="w-5 h-5 text-[#8CA3BA]" />} label="Saldo atual" value={`$${currentBalance.toFixed(2)}`} />
        <Item icon={<TrendingUp className="w-5 h-5 text-[#8CA3BA]" />} label="PnL total" value={<span className={pnlColor}>${pnlTotal.toFixed(2)}</span>} />
      </CardContent>
    </Card>
  )
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-[#1e2c46]">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-lg font-semibold text-white leading-tight">{value}</span>
      </div>
    </div>
  )
}
