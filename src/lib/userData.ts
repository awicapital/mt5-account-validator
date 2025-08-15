// /lib/useUser.ts
import useSWR from "swr";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

export const useUser = () => {
  return useSWR("user-profile", async (): Promise<UserProfile | null> => {
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email;
    if (!email) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("id, full_name, username, email, access_level, avatar_url")
      .eq("email", email)
      .single();

    return profile || null;
  });
};
