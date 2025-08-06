import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { supabase } from "./supabase";

dayjs.extend(customParseFormat);

export interface Trade {
  id: string;
  date: string;    // sempre em ISO, ex: "2025-08-01T14:23:00.000Z"
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
    // 1) pega o usuário logado
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return null;

    // 2) busca as contas do usuário
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

    // 3) para cada conta, baixa o JSON de logs e parseia os trades
    for (const accNumber of accountNumbers) {
      const path = `${accNumber}.json`;
      const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
      if (!urlData?.publicUrl) continue;

      try {
        const res = await fetch(urlData.publicUrl);
        if (!res.ok) continue;

        const raw = await res.json();
        if (!Array.isArray(raw)) continue;

        // 4) converte cada registro bruto em Trade tipado e com date em ISO
        const parsed: Trade[] = raw
          .filter((t) => t.date && typeof t.profit === "number")
          .map((t, idx) => {
            // contabiliza depósitos
            if (t.type === "deposit") {
              totalDeposits += t.profit;
            }

            // tenta parsear formatos conhecidos de forma estrita
            let dateObj = dayjs(
              t.date,
              [
                "YYYY-MM-DDTHH:mm:ss.SSSZ",  // ISO completo
                "YYYY-MM-DDTHH:mm:ssZ",      // ISO sem milissegundos
                "YYYY-MM-DD HH:mm:ss",       // espaço em vez de T
                "YYYY.MM.DD HH:mm:ss",       // ponto no lugar de hífen
              ],
              true // strict
            );
            // se não parseou no strict, usa o parse solto do dayjs
            if (!dateObj.isValid()) {
              dateObj = dayjs(t.date);
            }
            // se ainda não for válido, fallback para string original
            const isoDate = dateObj.isValid() ? dateObj.toISOString() : t.date;

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
        // ignora erro naquele arquivo e segue
      }
    }

    // 5) monta o dailyPnls (soma por dia, excluindo depósitos)
    const dailyPnls: Record<string, number> = {};
    trades
      .filter((t) => t.type !== "deposit")
      .forEach((t) => {
        // pega a parte YYYY-MM-DD do ISO
        const day = t.date.split("T")[0];
        dailyPnls[day] = (dailyPnls[day] || 0) + t.profit;
      });

    return { trades, dailyPnls, totalDeposits };
  } catch {
    return null;
  }
}
