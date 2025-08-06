import { supabase } from "./supabase";

export interface Trade {
  id: string;         // <— novo campo
  date: string;
  type: string;
  profit: number;
  accountId: string;
  symbol?: string;
  volume?: number;
}

export interface AccountsData {
  trades: Trade[];
  dailyPnls: Record<string, number>;
  totalDeposits: number;
}

export async function fetchAccountsData(): Promise<AccountsData | null> {
  try {
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return null;

    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("account_number")
      .eq("email", email);
    if (accountsError || !accounts) return null;

    const accountNumbers = accounts.map((acc) => acc.account_number);
    if (accountNumbers.length === 0) {
      return { trades: [], dailyPnls: {}, totalDeposits: 0 };
    }

    const trades: Trade[] = [];
    let totalDeposits = 0;

    for (const accNumber of accountNumbers) {
      const path = `${accNumber}.json`;
      const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
      if (!urlData?.publicUrl) continue;

      try {
        const res = await fetch(urlData.publicUrl);
        if (!res.ok) continue;

        const raw = await res.json();
        if (!Array.isArray(raw)) continue;

        // Aqui geramos um id único para cada trade, combinando conta + timestamp + índice
        const parsed: Trade[] = raw
          .filter((t) => t.date && typeof t.profit === "number")
          .map((t, idx) => {
            // contabiliza depósitos
            if (t.type === "deposit") {
              totalDeposits += t.profit;
            }

            return {
              id: `${accNumber}-${t.date}-${idx}`,  // <— geração do id
              date: t.date,
              type: t.type,
              profit: t.profit,
              accountId: accNumber.toString(),
              symbol: t.symbol,
              volume: t.volume,
            };
          });

        trades.push(...parsed);
      } catch (err) {
        // ignora erro de fetch / parse naquele arquivo
        continue;
      }
    }

    // monta o dailyPnls (sem os depósitos)
    const dailyPnls: Record<string, number> = {};
    trades
      .filter((t) => t.type !== "deposit")
      .forEach((t) => {
        // usa a parte da data antes do espaço (por ex. "2025-08-05")
        const day = t.date.split(" ")[0];
        dailyPnls[day] = (dailyPnls[day] || 0) + t.profit;
      });

    return { trades, dailyPnls, totalDeposits };
  } catch (err) {
    return null;
  }
}
