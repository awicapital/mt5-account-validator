'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/ui/pill'
import { DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Props {
  accountNumber?: number | string
  lastUpdate?: Date | string
  currentBalance?: number
  pnlTotal?: number
  totalDeposits?: number
  totalWithdrawals?: number
  className?: string
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function AccountResumeCard({
  accountNumber,
  lastUpdate,
  currentBalance = 0,
  pnlTotal = 0,
  totalDeposits = 0,
  totalWithdrawals = 0,
  className,
}: Props) {
  const pnlColor =
    pnlTotal > 0 ? 'text-emerald-400' : pnlTotal < 0 ? 'text-rose-400' : 'text-slate-300'

  const lastUpdateDate = React.useMemo(() => {
    if (!lastUpdate) return null
    const d = lastUpdate instanceof Date ? lastUpdate : new Date(lastUpdate)
    return isNaN(d.getTime()) ? null : d
  }, [lastUpdate])

  const formattedDate =
    lastUpdateDate?.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) ?? null

  return (
    <div className={cn('text-white', className)}>
      {/* Header */}
      <div className="mb-3">
        {accountNumber != null && (
          <Pill
            dotColor="bg-green-500"
            className="px-2 py-0.5 text-xs text-white/80 mb-1"
          >
            {accountNumber}
          </Pill>
        )}
        {formattedDate && lastUpdateDate && (
          <p className="text-[11px] text-white/60 leading-relaxed">
            <time dateTime={lastUpdateDate.toISOString()}>
              Última atualização: {formattedDate}
            </time>
          </p>
        )}
      </div>

      {/* Lista de métricas */}
      <ul className="space-y-2">
        <MetricItem
          icon={<DollarSign className="h-3.5 w-3.5 text-[#8CA3BA]" aria-hidden />}
          label="Saldo Atual"
          value={usd.format(currentBalance)}
        />
        <MetricItem
          icon={<TrendingUp className="h-3.5 w-3.5 text-[#8CA3BA]" aria-hidden />}
          label="P&L Total"
          value={usd.format(pnlTotal)}
          valueClassName={pnlColor}
        />
        <MetricItem
          icon={<ArrowDownCircle className="h-3.5 w-3.5 text-[#8CA3BA]" aria-hidden />}
          label="Depósitos"
          value={usd.format(totalDeposits)}
        />
        <MetricItem
          icon={<ArrowUpCircle className="h-3.5 w-3.5 text-[#8CA3BA]" aria-hidden />}
          label="Saques"
          value={usd.format(totalWithdrawals)}
        />
      </ul>
    </div>
  )
}

export { AccountResumeCard }
export default AccountResumeCard

function MetricItem({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <li className="flex items-center justify-between border-b border-white/10 pb-1">
      <div className="flex items-center gap-2 text-xs font-medium text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <span
        className={cn(
          'tabular-nums font-semibold text-sm text-white',
          valueClassName
        )}
      >
        {value}
      </span>
    </li>
  )
}
