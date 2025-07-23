import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { account_number, name, balance, ea_name } = body;

    if (!account_number || typeof balance !== "number") {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("accounts")
      .select("*")
      .eq("account_number", account_number)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      await supabase
        .from("accounts")
        .update({
          balance,
          ea_name,
          name,
          is_active: true,
          granted_at: existing.granted_at ?? now,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("accounts").insert([
        {
          account_number,
          name,
          balance,
          ea_name,
          is_active: true,
          granted_at: now,
        },
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
