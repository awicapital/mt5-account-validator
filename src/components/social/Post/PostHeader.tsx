"use client";

import { memo } from "react";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { PostReply } from "./PostReply";
import type { TPost } from "../types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PostCardProps {
  post: TPost;
  withReplyBox?: boolean;
  className?: string;
}

function PostCardBase({ post, withReplyBox = false, className = "" }: PostCardProps) {
  const relativeTime = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article
      className={[
        "flex gap-3 px-4 py-3",
        "transition-colors duration-150 hover:bg-muted/50",
        className,
      ].join(" ")}
      role="article"
      aria-label={`Post de ${post.user.name}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <div className="size-10 rounded-full bg-muted/40" />
      </div>

      {/* Post Body */}
      <div className="flex-1 min-w-0">
        <PostHeader />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{post.user.name}</span>
          <span className="text-muted-foreground">@{post.user.handle}</span>
          <span>·</span>
          <span className="whitespace-nowrap text-muted-foreground">{relativeTime}</span>
        </div>

        <PostContent content={post.content} media={post.media} />
        <PostActions postId={post.id} stats={post.stats} />
        {withReplyBox && <PostReply postId={post.id} />}
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardBase);
export type { PostCardProps as TPostCardProps };
