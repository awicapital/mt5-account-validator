import { supabase } from "./supabase";

export interface Trade {
  date: string;
  type: string;
  profit: number;
  accountId: string;
}

export interface AccountsData {
  trades: Trade[];
  dailyPnls: Record<string, number>;
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
    if (accountNumbers.length === 0) return { trades: [], dailyPnls: {} };

    const trades: Trade[] = [];

    for (const accNumber of accountNumbers) {
      const path = `${accNumber}.json`;
      const { data: urlData } = supabase.storage.from("logs").getPublicUrl(path);

      if (!urlData?.publicUrl) continue;

      try {
        const res = await fetch(urlData.publicUrl);
        if (!res.ok) continue;

        const raw = await res.json();
        if (!Array.isArray(raw)) continue;

        const parsed = raw
          .filter((t) => t.type !== "deposit" && t.date && typeof t.profit === "number")
          .map((t) => ({
            date: t.date,
            type: t.type,
            profit: t.profit,
            accountId: accNumber.toString(),
          }));

        trades.push(...parsed);
      } catch (err) {
        continue;
      }
    }

    const dailyPnls: Record<string, number> = {};
    trades.forEach((t) => {
      const d = t.date.split(" ")[0];
      dailyPnls[d] = (dailyPnls[d] || 0) + t.profit;
    });

    return { trades, dailyPnls };
  } catch (err) {
    return null;
  }
}
