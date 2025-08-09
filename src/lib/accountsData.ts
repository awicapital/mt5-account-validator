import { supabase } from "./supabase";

export interface Trade {
  id: string;
  date: string; // ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
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

// Tipagem flexível do JSON cru do storage
type RawTrade = {
  date?: unknown;
  type?: unknown;
  profit?: unknown;
  symbol?: unknown;
  volume?: unknown;
};

// Type guard: aceita objetos, exige profit number e presença de date
function isParsableRawTrade(x: unknown): x is RawTrade & { profit: number; date: unknown } {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.profit === "number" && "date" in obj;
}

export async function fetchAccountsData(): Promise<AccountsData | null> {
  try {
    // 1) Usuário autenticado
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return null;

    // 2) Contas do usuário
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

    // 3) Para cada conta, baixa e processa o JSON
    for (const accNumber of accountNumbers) {
      const path = `${accNumber}.json`;
      const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);
      if (!urlData?.publicUrl) continue;

      try {
        const freshUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        const res = await fetch(freshUrl, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) continue;

        const raw: unknown = await res.json();
        if (!Array.isArray(raw)) continue;

        const parsed: Trade[] = raw
          .filter(isParsableRawTrade)
          .map((t, idx) => {
            // 3.1) Acumula depósitos
            const typeVal = typeof t.type === "string" ? t.type : "unknown";
            if (typeVal === "deposit") {
              totalDeposits += t.profit;
            }

            // 3.2) Normaliza rawDate
            const rawDate = String(t.date ?? "").trim();
            const withHyphens = rawDate.replace(/\./g, "-");
            const asIsoString = withHyphens.includes("T")
              ? withHyphens
              : withHyphens.replace(" ", "T");

            // 3.3) ISO final
            const dt = new Date(asIsoString);
            const isoDate = isNaN(dt.getTime())
              ? (() => {
                  const dt2 = new Date(withHyphens);
                  return isNaN(dt2.getTime()) ? rawDate : dt2.toISOString();
                })()
              : dt.toISOString();

            const symbol = typeof t.symbol === "string" ? t.symbol : undefined;
            const volume = typeof t.volume === "number" ? t.volume : undefined;

            return {
              id: `${accNumber}-${isoDate}-${idx}`,
              date: isoDate,
              type: typeVal,
              profit: t.profit,
              accountId: String(accNumber),
              symbol,
              volume,
            };
          });

        trades.push(...parsed);
      } catch {
        continue; // ignora erro naquele arquivo
      }
    }

    // 4) dailyPnls (exclui depósitos)
    const dailyPnls: Record<string, number> = {};
    for (const t of trades) {
      if (t.type === "deposit") continue;
      const day = t.date.split("T")[0];
      dailyPnls[day] = (dailyPnls[day] || 0) + t.profit;
    }

    return { trades, dailyPnls, totalDeposits };
  } catch {
    return null;
  }
}
