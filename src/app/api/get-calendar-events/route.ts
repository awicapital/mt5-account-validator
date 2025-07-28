import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Payload deve ser um array" }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "Token ausente" }, { status: 401 });
    }

    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 });
    }

    const insertableItems = body.map(item => ({
      event: item.event,
      importance: item.importance,
      time: item.time,
    }));

    const { error } = await supabase.from("calendar_events").insert(insertableItems);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
