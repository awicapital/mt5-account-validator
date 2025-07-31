'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, DollarSign, TrendingUp, Percent, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface Log {
  date: string
  pnl: number
  end_balance: number
}

interface Account {
  id: string
  account_number: number
  ea_name?: string
  is_active: boolean
  balance: number
}

export default function AccountDetailsPage() {
  const { account_number } = useParams<{ account_number: string }>()
  const accountNumber = Number(account_number)
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (isNaN(accountNumber)) {
        console.error('accountNumber inválido:', account_number)
        setLoading(false)
        return
      }

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .single()

      if (accountError || !accountData) {
        console.error('Erro ao buscar conta:', accountError)
        setLoading(false)
        return
      }

      const { data: logsData, error: logsError } = await supabase
        .from('account_daily_logs')
        .select('date, pnl, end_balance')
        .eq('account_id', accountData.id)
        .order('date', { ascending: true })

      if (logsError) {
        console.error('Erro ao buscar logs:', logsError)
      }

      setAccount(accountData)
      setLogs(logsData || [])
      setLoading(false)
    }

    fetchData()
  }, [accountNumber])

  if (loading || !account) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f]">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    )
  }

  const pnlTotal = logs.reduce((sum, l) => sum + l.pnl, 0)
  const diasOperados = logs.length
  const firstBalance = logs[0]?.end_balance || 0
  const lastBalance = logs[logs.length - 1]?.end_balance || account.balance
  const pnlPercent = firstBalance > 0 ? ((lastBalance - firstBalance) / firstBalance) * 100 : 0

  const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-[#1e2c46]">
        <Icon className="text-[#8CA3BA] w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-lg font-semibold text-white leading-tight">{value}</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 bg-[#03182f] min-h-dvh pb-32 space-y-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-white p-2 rounded-full hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-white space-y-1">
          <h1 className="text-2xl font-bold leading-tight">Conta #{account.account_number}</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{account.ea_name || 'Sem EA'}</p>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                account.is_active ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
              }`}
            >
              {account.is_active ? 'Ativa' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      <Card className="bg-[#0f1d31] border border-[#1e2c46] shadow-md rounded-2xl">
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6">
          <Stat icon={DollarSign} label="Saldo atual" value={`$${account.balance.toFixed(2)}`} />
          <Stat icon={TrendingUp} label="PnL total" value={`$${pnlTotal.toFixed(2)}`} />
          <Stat icon={Percent} label="% crescimento" value={`${pnlPercent.toFixed(2)}%`} />
        </CardContent>
      </Card>

      <div className="rounded-2xl bg-[#0f1d31] shadow-md p-6 border border-[#1e2c46]">
        <h2 className="text-white font-semibold text-base mb-4">Evolução do PnL</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={logs} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e2c46" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1f2c44', border: 'none', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#268bff"
              strokeWidth={2.5}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0f1d31] rounded-2xl border border-[#1e2c46] overflow-hidden shadow-md">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-white font-semibold text-base">Histórico Diário</h3>
        </div>
        <CardContent className="pt-0 pb-6 px-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-[#1f2c44]">
                <th className="py-2">Data</th>
                <th className="py-2 text-right">PnL</th>
                <th className="py-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.date} className="border-t border-[#1f2c44] hover:bg-[#131f35] transition-colors">
                  <td className="py-2 text-white font-medium">{log.date}</td>
                  <td
                    className={`text-right font-semibold ${
                      log.pnl > 0
                        ? 'text-green-400'
                        : log.pnl < 0
                        ? 'text-red-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {log.pnl.toFixed(2)}
                  </td>
                  <td className="text-right text-white">{log.end_balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </div>
    </div>
  )
}
