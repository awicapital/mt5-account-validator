import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin"; // usa service_role

export async function POST(req: Request) {
  try {
    const body = await req.text(); // recebe como string JSON

    const logs = JSON.parse(body);

    if (!Array.isArray(logs)) {
      return NextResponse.json({ success: false, error: "Formato inválido: esperado array de objetos" }, { status: 400 });
    }

    const first = logs[0];
    if (!first || typeof first.account_number !== "number") {
      return NextResponse.json({ success: false, error: "Campo account_number ausente" }, { status: 400 });
    }

    const filename = `${first.account_number}-${new Date().toISOString().split("T")[0]}.json`;

    const { error } = await supabase.storage
      .from("logs")
      .upload(filename, body, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error("Erro ao salvar JSON no bucket:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: filename });
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}
