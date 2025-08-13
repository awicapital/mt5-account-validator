import { NextRequest, NextResponse } from "next/server";
// ajuste o caminho se seu client estiver noutro lugar
import { supabase } from "@/lib/supabase";
import { DiscordClient } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // proteção simples via header secreto
  const secret = req.headers.get("x-admin-sync-secret");
  if (process.env.ADMIN_SYNC_SECRET && secret !== process.env.ADMIN_SYNC_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // valida body
  const { user_id } = await req.json().catch(() => ({} as any));
  if (!user_id || typeof user_id !== "string") {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const {
    DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID,
    DISCORD_PRO_ROLE_ID,
    DISCORD_STARTER_ROLE_ID,
  } = process.env;

  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_PRO_ROLE_ID) {
    return NextResponse.json({ error: "Missing Discord env vars" }, { status: 500 });
  }

  // busca dados na VIEW (centralizada em public.users)
  const { data, error } = await supabase
    .from("discord_links_view")
    .select("discord_user_id, pro_active")
    .eq("user_id", user_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // valida discord_user_id
  const discordUserId = data.discord_user_id as string | null;
  if (!discordUserId) {
    return NextResponse.json({ error: "missing discord_user_id" }, { status: 422 });
  }
  if (!/^\d+$/.test(discordUserId)) {
    return NextResponse.json({ error: "invalid discord_user_id (must be snowflake)" }, { status: 422 });
  }

  const discord = new DiscordClient(DISCORD_BOT_TOKEN!, DISCORD_GUILD_ID!, DISCORD_PRO_ROLE_ID!);
  const starterRoleId = DISCORD_STARTER_ROLE_ID || null;

  // checa se o membro está no servidor
  const member = await discord.getMember(discordUserId);
  if (!member) {
    return NextResponse.json({ error: "user not in guild" }, { status: 409 });
  }

  const hasPro = member.roles.includes(DISCORD_PRO_ROLE_ID!);
  const hasStarter = starterRoleId ? member.roles.includes(starterRoleId) : false;

  // aplica/remover roles conforme pro_active
  let action: string = "noop";
  if (data.pro_active) {
    if (!hasPro) {
      await discord.addProRole(discordUserId);
      action = "add:PRO";
    }
    if (starterRoleId && hasStarter) {
      await discord.removeRole(discordUserId, starterRoleId);
      action = action === "noop" ? "remove:STARTER" : `${action}+remove:STARTER`;
    }
  } else {
    if (hasPro) {
      await discord.removeProRole(discordUserId);
      action = "remove:PRO";
    }
    if (starterRoleId && !hasStarter) {
      await discord.addRole(discordUserId, starterRoleId);
      action = action === "noop" ? "add:STARTER" : `${action}+add:STARTER`;
    }
  }

  // carimbo de sync agora em public.users
  await supabase
    .from("users")
    .update({ last_role_sync: new Date().toISOString() })
    .eq("id", user_id);

  return NextResponse.json({ ok: true, action });
}
