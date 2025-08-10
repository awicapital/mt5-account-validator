'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Props {
  currentBalance?: number
  pnlTotal?: number
  totalDeposits?: number
  totalWithdrawals?: number
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function AccountResumeCard({
  currentBalance = 0,
  pnlTotal = 0,
  totalDeposits = 0,
  totalWithdrawals = 0,
}: Props) {
  const pnlColor =
    pnlTotal > 0 ? 'text-green-400' : pnlTotal < 0 ? 'text-red-400' : 'text-muted-foreground'

  return (
    <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
      <CardHeader className="px-6 py-4 pb-2">
        <CardTitle className="text-white text-base font-semibold">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 px-6 pb-5">
        <Item
          icon={<DollarSign className="w-5 h-5 text-[#8CA3BA]" />}
          label="Saldo atual"
          value={usd.format(currentBalance)}
        />
        <Item
          icon={<TrendingUp className="w-5 h-5 text-[#8CA3BA]" />}
          label="PnL total"
          value={<span className={pnlColor}>{usd.format(pnlTotal)}</span>}
        />
        <Item
          icon={<ArrowDownCircle className="w-5 h-5 text-[#8CA3BA]" />}
          label="Depósitos"
          value={<span className="text-green-400">{usd.format(totalDeposits)}</span>}
        />
        <Item
          icon={<ArrowUpCircle className="w-5 h-5 text-[#8CA3BA]" />}
          label="Saques"
          value={<span className="text-red-400">{usd.format(totalWithdrawals)}</span>}
        />
      </CardContent>
    </Card>
  )
}

function Item({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="p-2 rounded-md bg-[#1e2c46] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-lg font-semibold text-white leading-tight truncate">{value}</span>
      </div>
    </div>
  )
}
