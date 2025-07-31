import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Payload recebido do MT5:", JSON.stringify(body));
    console.log("→ pnl:", body.pnl, "| Tipo de pnl:", typeof body.pnl);

    const { account_number, balance, pnl, date } = body;

    if (!account_number || typeof balance !== "number" || typeof pnl !== "number") {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const { data: account, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("account_number", account_number)
      .single();

    if (error || !account) {
      console.log("Conta não encontrada para account_number:", account_number);
      return NextResponse.json({ success: false, error: "Conta não encontrada" }, { status: 404 });
    }

    const logDate = date || new Date().toISOString().split("T")[0];

    const { error: upsertError } = await supabase
      .from("account_daily_logs")
      .upsert([{
        account_id: account.id,
        date: logDate,
        end_balance: balance,
        pnl: pnl,
      }], {
        onConflict: ['account_id', 'date']
      });

    if (upsertError) {
      console.error("Erro ao inserir/atualizar:", upsertError.message);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    console.log("Upsert realizado com sucesso para data:", logDate);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
