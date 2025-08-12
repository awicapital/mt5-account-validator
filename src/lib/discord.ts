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

  private headers(): HeadersInit {
    return {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
      // Opcional, ajuda na identificação do cliente
      "User-Agent": "mt5-account-validator (+https://github.com/awicapital/mt5-account-validator)",
    };
  }

  // Espera o tempo indicado pelo rate limit (Discord 429); não retorna valor.
  private async retry429(res: ResponseLike): Promise<void> {
    if (res.status !== 429) return;
    const raw = res.headers.get("retry-after");
    const seconds = Number(raw);
    const ms = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds * 1000) : 1000;
    await new Promise((r) => setTimeout(r, ms));
  }

  async getMember(discordUserId: string): Promise<{ roles: string[] } | null> {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}`;
    const res = await fetch(url, { headers: this.headers() });

    if (res.status === 404) return null;

    if (res.status === 429) {
      await this.retry429(res);
      return this.getMember(discordUserId);
    }

    if (!res.ok) {
      throw new Error(`Discord getMember ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  // --- Genéricos ---
  async addRole(discordUserId: string, roleId: string): Promise<void> {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
    const res = await fetch(url, { method: "PUT", headers: this.headers() });

    if (res.status === 429) {
      await this.retry429(res);
      return this.addRole(discordUserId, roleId);
    }

    // Discord retorna 204 No Content em sucesso
    if (res.status !== 204) {
      throw new Error(`Discord addRole ${res.status} ${await res.text()}`);
    }
  }

  async removeRole(discordUserId: string, roleId: string): Promise<void> {
    const url = `${apiBase}/guilds/${this.guildId}/members/${discordUserId}/roles/${roleId}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });

    if (res.status === 429) {
      await this.retry429(res);
      return this.removeRole(discordUserId, roleId);
    }

    if (res.status !== 204) {
      throw new Error(`Discord removeRole ${res.status} ${await res.text()}`);
    }
  }

  // --- Wrappers PRO (retrocompatibilidade) ---
  async addProRole(discordUserId: string): Promise<void> {
    return this.addRole(discordUserId, this.proRoleId);
  }

  async removeProRole(discordUserId: string): Promise<void> {
    return this.removeRole(discordUserId, this.proRoleId);
  }
}
