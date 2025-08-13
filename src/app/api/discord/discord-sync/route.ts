import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DiscordClient } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const {
    DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID,
    DISCORD_PRO_ROLE_ID,
    DISCORD_STARTER_ROLE_ID,
    SYNC_LOOKBACK_MINUTES,
    SYNC_MAX_USERS_PER_RUN,
  } = process.env;

  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_PRO_ROLE_ID) {
    return NextResponse.json(
      { error: "Missing Discord env vars (BOT_TOKEN/GUILD_ID/PRO_ROLE_ID)" },
      { status: 500 }
    );
  }

  const lookback = Number(SYNC_LOOKBACK_MINUTES || 1440); // 24h
  const limit = Number(SYNC_MAX_USERS_PER_RUN || 1000);
  const since = new Date(Date.now() - lookback * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const discord = new DiscordClient(DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_PRO_ROLE_ID);
  const starterRoleId = DISCORD_STARTER_ROLE_ID || null;

  // Apenas usuários com discord_user_id válido; pega quem mudou/precisa de sync periódico
  const { data, error } = await supabase
    .from("discord_links_view")
    .select("user_id, discord_user_id, pro_active, last_role_sync, updated_at")
    .not("discord_user_id", "is", null)
    .or(`updated_at.gt.${since},last_role_sync.is.null,last_role_sync.lt.${sixHoursAgo}`)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: any[] = [];

  for (const row of data ?? []) {
    // segurança extra: só números (snowflake)
    if (!row.discord_user_id || !/^\d+$/.test(row.discord_user_id)) {
      results.push({ user_id: row.user_id, status: "skip:no_valid_discord_id" });
      continue;
    }

    try {
      const member = await discord.getMember(row.discord_user_id);
      if (!member) {
        results.push({ user_id: row.user_id, status: "skip:not_in_guild" });
        continue;
      }

      const hasPro = member.roles.includes(DISCORD_PRO_ROLE_ID);
      const hasStarter = starterRoleId ? member.roles.includes(starterRoleId) : false;

      if (row.pro_active) {
        // garantir PRO
        if (!hasPro) await discord.addProRole(row.discord_user_id);
        // remover STARTER se existir
        if (starterRoleId && hasStarter) await discord.removeRole(row.discord_user_id, starterRoleId);
        results.push({ user_id: row.user_id, action: hasPro ? "noop" : "add:PRO" });
      } else {
        // remover PRO, opcionalmente dar STARTER
        if (hasPro) await discord.removeProRole(row.discord_user_id);
        if (starterRoleId && !hasStarter) await discord.addRole(row.discord_user_id, starterRoleId);
        results.push({
          user_id: row.user_id,
          action: hasPro ? "remove:PRO" : (starterRoleId ? "add:STARTER" : "noop"),
        });
      }

      // 🔁 agora atualiza em public.users (não mais em discord_meta)
      await supabase
        .from("users")
        .update({ last_role_sync: new Date().toISOString() })
        .eq("id", row.user_id);
    } catch (e: any) {
      results.push({ user_id: row.user_id, error: e.message || String(e) });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
