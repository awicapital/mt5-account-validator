import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { account_number, balance } = body;

    if (!account_number || typeof balance !== "number") {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const { data: account, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("account_number", account_number)
      .single();

    if (error || !account) {
      return NextResponse.json({ success: false, error: "Conta não encontrada" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];

    const { error: insertError } = await supabase
      .from("account_daily_logs")
      .upsert(
        [{
          account_id: account.id,
          date: today,
          end_balance: balance,
        }],
        { onConflict: "account_id,date" }
      );

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
