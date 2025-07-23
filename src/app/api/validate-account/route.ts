import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account");

  if (!account) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, is_active")
    .eq("account_number", account)
    .single();

  if (error || !data || !data.is_active) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}
