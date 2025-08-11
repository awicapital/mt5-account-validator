// src/utils/metricsCalculation.ts
import type { Trade } from "@/lib/accountsData";

export type TradeType =
  | "buy"
  | "sell"
  | "deposit"
  | "withdraw"
  | "withdrawal"
  | string;

export interface LogPoint {
  date: string;   // ISO
  pnl: number;    // acumulado (exclui cashflow)
}

export interface SymbolSummary {
  symbol: string;
  trades: number;
  volume: number;
  profit: number;
  avgPerTrade: number;
}

export interface MetricsRatios {
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;  // pode ser Infinity
  payoffRatio: number;   // pode ser Infinity
  gainToPain: number;    // pode ser Infinity
  maxDD: number;
  ulcerIndex: number;
  recoveryFactor: number; // pode ser Infinity
  sharpeRatio: number;     // pode ser Infinity
  sortinoRatio: number;    // pode ser Infinity
  averageTrade: number;
  stdDev: number;
  sqn: number;             // pode ser Infinity
  bestDay: [string, number] | null;
  worstDay: [string, number] | null;
}

export interface MetricsTotals {
  pnlTotal: number;        // acumulado sem cashflow
  currentBalance: number;  // igual ao pnlTotal aqui (sem cashflow)
  deposits: number;        // somatório local (se quiser usar por conta)
  withdrawals: number;     // somatório local (se quiser usar por conta)
}

export interface MetricsResult {
  logs: LogPoint[];
  tradesNoCashflow: Trade[];     // ordenados do mais recente para o mais antigo
  perSymbol: SymbolSummary[];    // ordenado por |profit| desc
  byDaySorted: Array<[string, number]>; // [YYYY-MM-DD, pnlDoDia] desc
  totals: MetricsTotals;
  ratios: MetricsRatios;
}

export interface MetricsOptions {
  /**
   * Se true, inclui cashflow nos logs (pnl acumulado).
   * Padrão: false (apenas resultado de trade).
   */
  includeCashflowInLogs?: boolean;
  /**
   * Se informado, filtra os trades por accountId antes do cálculo.
   */
  accountId?: string;
}

/** Helpers */
const isCashflow = (t: Trade) =>
  t.type === "deposit" || t.type === "withdraw" || t.type === "withdrawal";

const safeDiv = (a: number, b: number) => (b ? a / b : Infinity);

/**
 * Cálculo principal — O(n).
 * - Faz um pass para: depósitos/saques, logs acumulados, por símbolo, por dia, wins/losses/breakevens.
 * - Depois faz passes rápidos para desvio padrão, drawdown e ulcer index.
 */
export function computeMetrics(
  allTrades: Trade[],
  opts: MetricsOptions = {}
): MetricsResult {
  const { includeCashflowInLogs = false, accountId } = opts;

  // filtro por conta (se solicitado)
  const trades = accountId
    ? allTrades.filter((t) => t.accountId === accountId)
    : allTrades;

  let deposits = 0;
  let withdrawals = 0;

  const logs: LogPoint[] = [];
  const tradesNoCashflow: Trade[] = [];
  const bySymbol = new Map<string, { trades: number; volume: number; profit: number }>();
  const byDay = new Map<string, number>();

  let accPnl = 0; // acumulado para logs
  let accPnlWithCashflow = 0; // caso queira incluir cashflow

  // Estatísticas base
  let wins = 0,
    losses = 0,
    breakevens = 0;
  let sumWin = 0,
    sumLoss = 0,
    sumAll = 0;

  for (const t of trades) {
    // depósitos/saques
    if (t.type === "deposit" && t.profit > 0) deposits += t.profit;
    else if (
      t.type === "withdraw" ||
      t.type === "withdrawal" ||
      (t.type === "deposit" && t.profit < 0)
    ) {
      withdrawals += Math.abs(t.profit);
    }

    const day = t.date.split("T")[0];

    // logs + por símbolo + por dia usando só os trades (sem cashflow)
    if (!isCashflow(t) && t.type !== "deposit") {
      tradesNoCashflow.push(t);
      accPnl += t.profit;
      logs.push({ date: t.date, pnl: accPnl });

      // símbolo
      const s = t.symbol ?? "-";
      const cur = bySymbol.get(s) ?? { trades: 0, volume: 0, profit: 0 };
      cur.trades += 1;
      cur.volume += t.volume ?? 0;
      cur.profit += t.profit;
      bySymbol.set(s, cur);

      // dia
      byDay.set(day, (byDay.get(day) ?? 0) + t.profit);

      // estatísticas base
      sumAll += t.profit;
      if (t.profit > 0) {
        wins++;
        sumWin += t.profit;
      } else if (t.profit < 0) {
        losses++;
        sumLoss += t.profit; // negativo
      } else {
        breakevens++;
      }
    }

    // opcional: logs incluindo cashflow
    if (includeCashflowInLogs) {
      accPnlWithCashflow += t.profit;
      // substitui o último ponto se for do mesmo instante? Não — mantemos série completa
      // (se quiser consolidar por timestamp, dá pra agregar aqui)
    }
  }

  // Ordenações derivadas
  const perSymbol: SymbolSummary[] = [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      trades: v.trades,
      volume: v.volume,
      profit: v.profit,
      avgPerTrade: v.trades ? v.profit / v.trades : 0,
    }))
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

  const byDaySorted = [...byDay.entries()].sort((a, b) => b[1] - a[1]);
  const bestDay = byDaySorted[0] ?? null;
  const worstDay = byDaySorted.length
    ? byDaySorted[byDaySorted.length - 1]
    : null;

  // Métricas
  const N = tradesNoCashflow.length || 1;
  const winRate = wins / N;
  const lossRate = losses / N;
  const breakevenRate = breakevens / N;

  const avgWin = wins ? sumWin / wins : 0;
  const avgLoss = losses ? Math.abs(sumLoss / losses) : 0;

  const totalWin = sumWin;
  const totalLossAbs = Math.abs(sumLoss);
  const expectancy = winRate * avgWin - lossRate * avgLoss;
  const profitFactor = totalLossAbs ? totalWin / totalLossAbs : Infinity;
  const payoffRatio = avgLoss ? avgWin / avgLoss : Infinity;

  // Drawdown e Ulcer Index
  let peak = logs[0]?.pnl ?? 0;
  let maxDD = 0;
  let ulcerAcc = 0;
  for (const l of logs) {
    if (l.pnl > peak) peak = l.pnl;
    const dd = peak - l.pnl;
    if (dd > maxDD) maxDD = dd;
    const ddPct = peak ? (dd / peak) * 100 : 0;
    ulcerAcc += ddPct * ddPct;
  }
  const ulcerIndex = logs.length ? Math.sqrt(ulcerAcc / logs.length) : 0;

  // Desvio padrão em relação à expectancy
  let varAcc = 0;
  for (const t of tradesNoCashflow) {
    varAcc += Math.pow(t.profit - expectancy, 2);
  }
  const stdDev = tradesNoCashflow.length
    ? Math.sqrt(varAcc / tradesNoCashflow.length)
    : 0;
  const averageTrade = tradesNoCashflow.length ? sumAll / tradesNoCashflow.length : 0;

  const sortinoDenom = Math.sqrt(
    losses
      ? tradesNoCashflow
          .filter((t) => t.profit < 0)
          .reduce((a, t) => a + Math.pow(t.profit, 2), 0) / losses
      : 0
  );

  const sharpeRatio = stdDev ? averageTrade / stdDev : Infinity;
  const sortinoRatio = sortinoDenom ? averageTrade / sortinoDenom : Infinity;
  const gainToPain = totalLossAbs ? totalWin / totalLossAbs : Infinity;
  const sqn = stdDev
    ? (averageTrade / stdDev) * Math.sqrt(tradesNoCashflow.length)
    : Infinity;

  const pnlTotal = logs.at(-1)?.pnl ?? 0;

  return {
    logs,
    tradesNoCashflow: tradesNoCashflow.slice().reverse(), // mais recente primeiro
    perSymbol,
    byDaySorted,
    totals: {
      pnlTotal,
      currentBalance: pnlTotal,
      deposits,
      withdrawals,
    },
    ratios: {
      winRate,
      lossRate,
      breakevenRate,
      avgWin,
      avgLoss,
      expectancy,
      profitFactor,
      payoffRatio,
      gainToPain,
      maxDD,
      ulcerIndex,
      recoveryFactor: maxDD ? (totalWin - totalLossAbs) / maxDD : Infinity,
      sharpeRatio,
      sortinoRatio,
      averageTrade,
      stdDev,
      sqn,
      bestDay,
      worstDay,
    },
  };
}
