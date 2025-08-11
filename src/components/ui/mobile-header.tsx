"use client";

import { useEffect, useState } from "react";
import { Bell, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";

const ACTIVE = "#268bff";

interface UserProfile {
  full_name?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
    : `${parts[0][0] ?? ""}`.toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Hey, bom dia";
  if (h < 18) return "Hey, boa tarde";
  return "Hey, boa noite";
}

export default function MobileHeader() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;
      if (!email) return;
      const { data: profile } = await supabase
        .from("users")
        .select("full_name,email,access_level,avatar_url")
        .eq("email", email)
        .single();
      setUser(profile ?? null);
    };
    fetchUser();
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 h-[72px]",
        // === Borda premium replicada do MobileNav (adaptada para topo) ===
        "relative rounded-b-2xl border border-white/10 border-t-transparent",
        "bg-[#03182f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#03182f]/90",
        "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]",
        "transition-colors"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      role="banner"
    >
      {/* Glow/gradiente sutil (replica o efeito do nav, invertido para o topo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-10 h-24 bg-gradient-to-b from-[#03182f]/0 via-[#268bff]/5 to-[#03182f]/0 blur-2xl"
      />

      <div className="mx-auto flex h-full w-full max-w-screen-xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#0f1b2e] text-base font-bold text-white/90 ring-1 ring-white/10">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              getInitials(user?.full_name)
            )}
          </div>
          <div className="flex flex-col gap-y-1.5">
            <span className="text-xs text-white/60">{getGreeting()}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">
                {user?.full_name || "Sem nome"}
              </span>
              {user?.access_level && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: ACTIVE }}>
                  {user.access_level}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <IconButton ariaLabel="Notificações" hasBadge>
            <Bell className="h-5 w-5" />
          </IconButton>
          <IconButton ariaLabel="Ajuda">
            <HelpCircle className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  ariaLabel,
  hasBadge = false,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  hasBadge?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={clsx(
        "relative inline-grid h-10 w-10 place-items-center",
        "rounded-2xl bg-transparent",
        // Mantém a paleta coerente com o ACTIVE do sistema
        hasBadge ? "text-[#268bff]" : "text-white/80",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      )}
    >
      {children}
      {hasBadge && (
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
      )}
    </button>
  );
}
