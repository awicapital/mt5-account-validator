"use client";

import { useEffect, useState } from "react";
import { Bell, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  full_name?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

function getInitials(name: string | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
    : `${parts[0][0] ?? ""}`.toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Hey, bom dia";
  if (hour < 18) return "Hey, boa tarde";
  return "Hey, boa noite";
}

export default function MobileHeader() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await supabase.auth.getUser();
      const email = session?.user?.email;
      if (!email) return;

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, email, access_level, avatar_url")
        .eq("email", email)
        .single();

      setUser(profile);
    };

    fetchUser();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#03182f] text-white flex items-center">
      <div className="w-full max-w-screen-xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1e2b45] flex items-center justify-center text-white text-base font-bold">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user?.full_name)
            )}
          </div>

          <div className="flex flex-col gap-y-1.5">
            <span className="text-xs text-white/60">{getGreeting()}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {user?.full_name || "Sem nome"}
              </span>
              {user?.access_level && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0f172a] text-[#60a5fa] font-medium border border-[#1e2b45]">
                  {user.access_level}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-5 h-5 cursor-pointer text-white" />
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full" />
          </div>
          <button className="text-white hover:text-[#60a5fa]">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
