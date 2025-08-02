import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("key") || process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      token!
    );

    const body = await req.text();
    const logs = JSON.parse(body);

    if (!Array.isArray(logs)) {
      return NextResponse.json({ success: false, error: "Formato inválido: esperado array de objetos" }, { status: 400 });
    }

    const first = logs[0];
    if (!first || typeof first.account_number !== "number") {
      return NextResponse.json({ success: false, error: "Campo account_number ausente" }, { status: 400 });
    }

    const filename = `${first.account_number}.json`;

    const { error } = await supabase.storage
      .from("logs")
      .upload(filename, body, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: filename });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}
