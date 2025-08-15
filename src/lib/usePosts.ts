import useSWR, { mutate as globalMutate } from "swr";
import { supabase } from "@/lib/supabase";

export interface Post {
  id: string;
  text: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    role?: string;
  };
  reactions?: { count: number; userReacted: boolean };
  repliesCount?: number;
}

const fetchPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      text,
      created_at,
      users:author_id (
        id,
        full_name,
        username,
        avatar_url,
        access_level
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar posts:", error.message);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    text: p.text,
    created_at: p.created_at,
    author: {
      id: p.users?.id || "",
      name: p.users?.full_name || "",
      username: p.users?.username || "",
      avatar_url: p.users?.avatar_url || "",
      role: p.users?.access_level || "",
    },
    reactions: { count: 0, userReacted: false },
    repliesCount: 0,
  }));
};

export const usePosts = () => {
  const { data, error, isLoading, mutate } = useSWR("posts", fetchPosts, {
    revalidateOnFocus: true,
  });

  return {
    posts: data || [],
    isLoading,
    error,
    mutate,
  };
};

// ✅ Corrigido: usa mutate global corretamente
export const mutatePosts = () => {
  return globalMutate("posts");
};

export { fetchPosts };
