"use client";

import { memo } from "react";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { PostReply } from "./PostReply";
import type { TPost } from "../types";

export interface PostCardProps {
  post: TPost;
  withReplyBox?: boolean;
  className?: string;
}

function PostCardBase({ post, withReplyBox = false, className = "" }: PostCardProps) {
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
        <PostHeader user={post.user} createdAt={post.createdAt} />
        <PostContent content={post.content} media={post.media} />
        <PostActions postId={post.id} stats={post.stats} />
        {withReplyBox && <PostReply postId={post.id} />}
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardBase);
export type { PostCardProps as TPostCardProps };
