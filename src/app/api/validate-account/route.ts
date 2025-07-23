// src/app/api/validate-account/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account");

  if (!account) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = createClient();

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
