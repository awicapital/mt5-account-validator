"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

type PostCardProps = {
  post: any;
  onReply?: (post: any) => void;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
};

export default function PostCard({ post, onReply, onEdit, onDelete }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="relative bg-[#03182f] border-b border-white/10 rounded-md overflow-hidden">
      <div className="flex gap-4 px-4 py-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <span className="font-semibold text-white">{post.author.name}</span>
            {post.author.role && (
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-[1px] text-[10px] uppercase font-semibold",
                  {
                    "bg-blue-600 text-white": post.author.role === "PRO",
                    "bg-white/10 text-white/70": post.author.role === "Starter",
                    "bg-yellow-500 text-white": post.author.role === "Admin",
                  }
                )}
              >
                {post.author.role}
              </span>
            )}
            <span className="text-white/50">@{post.author.username}</span>
          </div>
          <div className="text-xs text-white/40">{timeAgo}</div>
          <p className="text-sm whitespace-pre-wrap text-white">{post.text}</p>
          {post.media?.[0]?.url && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={post.media[0].url}
                alt="media"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
          <div className="flex gap-4 pt-1">
            <Action
              icon={MessageCircle}
              count={post.repliesCount}
              label="Responder"
              onClick={() => onReply?.(post)}
            />
            <Action
              icon={Heart}
              count={post.reactions.count}
              active={post.reactions.userReacted}
              label="Curtir"
            />
            <Action icon={Share2} label="Compartilhar" />
            <Action icon={Trash2} label="Deletar" onClick={() => onDelete?.(post.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

type ActionProps = {
  icon: React.ElementType;
  count?: number;
  active?: boolean;
  label: string;
  onClick?: () => void;
};

function Action({ icon: Icon, count, active, label, onClick }: ActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1 px-2 text-muted-foreground hover:text-white transition",
        active && "text-red-500"
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
      {count !== undefined && (
        <span className="ml-1 text-xs group-hover:text-white">{count}</span>
      )}
    </Button>
  );
}
