import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // 🔍 Loga todos os headers recebidos
    console.log("🔍 HEADERS RECEBIDOS:");
    req.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    // 🔐 Extrai a chave da query ou usa fallback
    const url = new URL(req.url);
    const token = url.searchParams.get("key") || process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("🔑 KEY USADA:", token?.slice(0, 10) || "❌ NÃO DEFINIDA");

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      token!
    );

    const body = await req.text();
    console.log("📥 JSON RECEBIDO:", body.slice(0, 100));

    const logs = JSON.parse(body);

    if (!Array.isArray(logs)) {
      console.warn("❌ Formato inválido (não é array)");
      return NextResponse.json({ success: false, error: "Formato inválido: esperado array de objetos" }, { status: 400 });
    }

    const first = logs[0];
    if (!first || typeof first.account_number !== "number") {
      console.warn("❌ Campo account_number ausente ou inválido");
      return NextResponse.json({ success: false, error: "Campo account_number ausente" }, { status: 400 });
    }

    const filename = `${first.account_number}-${new Date().toISOString().split("T")[0]}.json`;
    console.log("📁 Nome do arquivo:", filename);

    const { error } = await supabase.storage
      .from("logs")
      .upload(filename, body, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error("❌ Erro ao salvar no Supabase:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("✅ Upload realizado com sucesso:", filename);
    return NextResponse.json({ success: true, file: filename });
  } catch (err) {
    console.error("💥 Erro interno:", err);
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  }
}
