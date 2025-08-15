"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { supabase } from "@/lib/supabase";
import { fetchAccountsData } from "@/lib/accountsData";
import type { DailyPnL } from "@/components/ui/dashboard-calendar";
import { DashboardPnLCard } from "@/components/ui/dashboard-pnl-card";
import PostCard from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { Pill } from "@/components/ui/pill";
import { usePosts } from "@/lib/usePosts";
import type { Post } from "@/lib/usePosts"; 

dayjs.locale("pt-br");

interface UserProfile {
  id: string;
  full_name?: string;
  email: string;
  access_level?: string;
  avatar_url?: string;
}

export default function DashboardMPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [visibility, setVisibility] = useState("public");
  const [showPostCard, setShowPostCard] = useState(false);
  const [replyTo, setReplyTo] = useState<Post | null>(null);
  const [dailyPnls, setDailyPnls] = useState<DailyPnL[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [monthlyGrowthPercent, setMonthlyGrowthPercent] = useState<number>(0);
  const [monthlyGrowthPositive, setMonthlyGrowthPositive] = useState<boolean>(true);

  const { posts, isLoading, mutate } = usePosts();

  useEffect(() => {
    const fetch = async () => {
      const { data: session } = await supabase.auth.getUser();
      const email = session?.user?.email;
      if (!email) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id, full_name, email, access_level, avatar_url")
        .eq("email", email)
        .single();

      setUser(profile || null);

      const accountsData = await fetchAccountsData();
      if (accountsData) {
        const parsedDaily: DailyPnL[] = Object.entries(accountsData.dailyPnls).map(([date, pnl]) => ({
          date: date.replaceAll(".", "-"),
          pnl: typeof pnl === "number" ? pnl : 0,
        }));
        setDailyPnls(parsedDaily);

        const nonDeposits = accountsData.trades.filter((t) => t.type !== "deposit");
        const totalPnL = nonDeposits.reduce((sum, t) => sum + t.profit, 0);
        setBalance(accountsData.totalDeposits + totalPnL);

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const pnlThisMonth = nonDeposits
          .filter((t) => new Date(t.date) >= firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const capitalBeforeMonth = nonDeposits
          .filter((t) => new Date(t.date) < firstOfMonth)
          .reduce((sum, t) => sum + t.profit, 0);
        const growth = capitalBeforeMonth > 0
          ? Number(((pnlThisMonth / capitalBeforeMonth) * 100).toFixed(2))
          : 0;
        setMonthlyGrowthPercent(growth);
        setMonthlyGrowthPositive(pnlThisMonth >= 0);
      }
    };

    fetch();
  }, []);

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("Erro ao deletar post:", error.message);
      return;
    }

    mutate((prev) => prev?.filter((post) => post.id !== postId), false);
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#03182f] pb-[calc(84px+env(safe-area-inset-bottom))] text-white">
      <main className="mx-auto max-w-6xl space-y-6 pt-4 lg:px-8">
        <div className="relative z-30">
          <DashboardPnLCard
            balance={balance}
            growthPercent={monthlyGrowthPercent}
            growthPositive={monthlyGrowthPositive}
          />
        </div>

        <section className="space-y-4">
          <Pill dotColor="bg-[#268bff]">Feed</Pill>
          {isLoading ? (
            <p className="text-muted text-sm">Carregando posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted text-sm">Nenhum post encontrado.</p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReply={() => setReplyTo(post)}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>
      </main>

      <button
        className="fixed bottom-[110px] right-4 z-50 rounded-full bg-blue-600 p-3 shadow-lg transition hover:bg-blue-700"
        onClick={() => setShowPostCard(true)}
      >
        <Pencil className="h-4 w-4 text-white" />
      </button>

      {showPostCard && user && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4">
          <PostComposer
            user={user}
            visibility={visibility}
            onPostSuccess={(newPost) => {
              const formattedPost = {
                ...newPost,
                author: {
                  id: user.id,
                  name: user.full_name || "",
                  username: user.email.split("@")[0],
                  avatar_url: user.avatar_url,
                  role: user.access_level,
                },
                media: newPost.media || [],
                reactions: { count: 0, userReacted: false },
                repliesCount: 0,
              };

              mutate((prev) => [formattedPost, ...(prev || [])], false);
              setShowPostCard(false);
              setReplyTo(null);
            }}
            onCancel={() => {
              setShowPostCard(false);
              setReplyTo(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
