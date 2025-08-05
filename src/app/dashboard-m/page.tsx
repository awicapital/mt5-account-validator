"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardUserCard } from "@/components/ui/dashboard-user-card";

interface UserProfile {
  full_name?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

export default function DashboardMPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await supabase.auth.getUser();
      const email = session?.user?.email;
      if (!email) return router.push("/login");

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, email, access_level, avatar_url")
        .eq("email", email)
        .single();

      if (profile) setUser(profile);
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#03182f]">
        <Loader2 className="animate-spin w-6 h-6 text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center text-white bg-[#03182f]">
        Usuário não encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#03182f] min-h-dvh pb-28">
      <DashboardUserCard
        name={user.full_name}
        email={user.email}
        role={user.access_level}
        avatarUrl={user.avatar_url || undefined}
      />
    </div>
  );
}
