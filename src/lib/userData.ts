import { supabase } from "./supabase";

export interface UserSession {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

let cachedUser: UserSession | null = null;

export async function fetchCurrentUser(): Promise<UserSession | null> {
  if (cachedUser) return cachedUser;

  try {
    const { data: session, error } = await supabase.auth.getUser();
    const user = session?.user;

    if (error || !user || !user.email || !user.id) return null;

    cachedUser = {
      id: user.id,
      email: user.email,
      role: user.role ?? "user",
      createdAt: user.created_at,
    };

    return cachedUser;
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  cachedUser = null;
}
