// src/app/api/cron/discord-sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DiscordClient } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const lookback = Number(process.env.SYNC_LOOKBACK_MINUTES || 1440); // 24h
  const limit = Number(process.env.SYNC_MAX_USERS_PER_RUN || 1000);
  const since = new Date(Date.now() - lookback * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const discord = new DiscordClient(
    process.env.DISCORD_BOT_TOKEN!,
    process.env.DISCORD_GUILD_ID!,
    process.env.DISCORD_PRO_ROLE_ID!
  );
  const starterRoleId = process.env.DISCORD_STARTER_ROLE_ID; // opcional

  // pega usuários que mudaram recentemente / precisam de sync periódico
  const { data, error } = await supabase
    .from("discord_links_view")
    .select("user_id, discord_user_id, pro_active, last_role_sync, updated_at")
    .or(`updated_at.gt.${since},last_role_sync.is.null,last_role_sync.lt.${sixHoursAgo}`)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: any[] = [];

  for (const row of data ?? []) {
    try {
      const member = await discord.getMember(row.discord_user_id);
      if (!member) {
        results.push({ user_id: row.user_id, status: "skip:not_in_guild" });
        continue;
      }

      const hasPro = member.roles.includes(process.env.DISCORD_PRO_ROLE_ID!);
      const hasStarter = starterRoleId ? member.roles.includes(starterRoleId) : false;

      if (row.pro_active) {
        // garantir PRO
        if (!hasPro) await discord.addProRole(row.discord_user_id);
        // opcional: remover STARTER se existir
        if (starterRoleId && hasStarter) await discord.removeRole(row.discord_user_id, starterRoleId);
        results.push({ user_id: row.user_id, action: hasPro ? "noop" : "add:PRO" });
      } else {
        // garantir que PRO não esteja e (opcional) dar STARTER
        if (hasPro) await discord.removeProRole(row.discord_user_id);
        if (starterRoleId && !hasStarter) await discord.addRole(row.discord_user_id, starterRoleId);
        results.push({ user_id: row.user_id, action: hasPro ? "remove:PRO" : (starterRoleId ? "add:STARTER" : "noop") });
      }

      await supabase
        .from("discord_meta")
        .update({ last_role_sync: new Date().toISOString() })
        .eq("user_id", row.user_id);
    } catch (e: any) {
      results.push({ user_id: row.user_id, error: e.message });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
