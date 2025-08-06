import { supabase } from "./supabase";

export interface Trade {
  id: string;
  date: string;    // sempre ISO: "YYYY-MM-DDTHH:mm:ss.sssZ"
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
    // 1) Pega usuário autenticado
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return null;

    // 2) Busca as contas do usuário
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("account_number")
      .eq("email", email);
    if (accountsError || !accounts) return null;

    const accountNumbers = accounts.map((a) => a.account_number);
    if (accountNumbers.length === 0) {
      return { trades: [], dailyPnls: {}, totalDeposits: 0 };
    }

    const trades: Trade[] = [];
    let totalDeposits = 0;

    // 3) Para cada conta, busca o JSON de logs e processa
    for (const accNumber of accountNumbers) {
      const path = `${accNumber}.json`;
      const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
      if (!urlData?.publicUrl) continue;

      try {
        const res = await fetch(urlData.publicUrl);
        if (!res.ok) continue;
        const raw = await res.json();
        if (!Array.isArray(raw)) continue;

        const parsed: Trade[] = raw
          .filter((t) => t.date && typeof t.profit === "number")
          .map((t, idx) => {
            // 3.1) Acumula depósitos
            if (t.type === "deposit") {
              totalDeposits += t.profit;
            }

            // 3.2) Normaliza rawDate: troca pontos por hífen e espaço por 'T'
            const rawDate = t.date.trim();
            const withHyphens = rawDate.replace(/\./g, "-");
            const asIsoString = withHyphens.includes("T")
              ? withHyphens
              : withHyphens.replace(" ", "T");
            // 3.3) Gera objeto Date e ISO final
            const dt = new Date(asIsoString);
            const isoDate = isNaN(dt.getTime())
              ? // se ainda inválido, tenta sem 'T'
                (() => {
                  const dt2 = new Date(withHyphens);
                  return isNaN(dt2.getTime()) ? rawDate : dt2.toISOString();
                })()
              : dt.toISOString();

            return {
              id: `${accNumber}-${isoDate}-${idx}`,
              date: isoDate,
              type: t.type,
              profit: t.profit,
              accountId: accNumber.toString(),
              symbol: t.symbol,
              volume: t.volume,
            };
          });

        trades.push(...parsed);
      } catch {
        // ignora erro naquele arquivo
        continue;
      }
    }

    // 4) Monta o dailyPnls (soma por dia, excluindo depósitos)
    const dailyPnls: Record<string, number> = {};
    for (const t of trades) {
      if (t.type === "deposit") continue;
      // t.date agora é ISO => basta splitizar em 'T'
      const day = t.date.split("T")[0];
      dailyPnls[day] = (dailyPnls[day] || 0) + t.profit;
    }

    return { trades, dailyPnls, totalDeposits };
  } catch {
    return null;
  }
}
