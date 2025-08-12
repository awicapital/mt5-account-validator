// src/lib/discord.ts

// Use o fetch nativo do Next/Vercel (Undici) — sem importar 'node-fetch'
const apiBase = "https://discord.com/api/v10";

type ResponseLike = {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<any>;
  text(): Promise<string>;
};

export class DiscordClient {
  constructor(
    private token: string,
    private guildId: string,
    private proRoleId: string
  ) {}

  private headers() {
    return {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  // Aceita qualquer Response compatível (DOM/Undici ou node-fetch)
  private async retry429<T>(res: ResponseLike, again: () => Promise<T>): Promise<T | void> {
    if (res.status !== 429) return;
    const raw = res.headers.get("retry-after");
    const seconds = Number(raw);
    const ms = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds * 1000) : 1000;
    await new Promise((r) => setTimeout(r, ms));
    return again();
  }

  async getMember(discordUserId: string): Promise<{ roles: string[] } | null> {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}`;
    const res = await fetch(url, { headers: this.headers() });

    if (res.status === 404) return null;
    if (res.status === 429) return this.retry429(res, () => this.getMember(discordUserId)) as any;
    if (!res.ok) throw new Error(`Discord getMember ${res.status} ${await res.text()}`);

    return res.json();
  }

  // --- Genéricos ---
  async addRole(discordUserId: string, roleId: string) {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
    const res = await fetch(url, { method: "PUT", headers: this.headers() });

    if (res.status === 429) return this.retry429(res, () => this.addRole(discordUserId, roleId));
    if (res.status !== 204) throw new Error(`Discord addRole ${res.status} ${await res.text()}`);
  }

  async removeRole(discordUserId: string, roleId: string) {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });

    if (res.status === 429) return this.retry429(res, () => this.removeRole(discordUserId, roleId));
    if (res.status !== 204) throw new Error(`Discord removeRole ${res.status} ${await res.text()}`);
  }

  // --- Wrappers PRO (retrocompatibilidade) ---
  async addProRole(discordUserId: string)    { return this.addRole(discordUserId, this.proRoleId); }
  async removeProRole(discordUserId: string) { return this.removeRole(discordUserId, this.proRoleId); }
}
