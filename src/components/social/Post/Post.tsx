// components/social/Post/Post.tsx
import { memo, useCallback } from "react";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { PostReply } from "./PostReply";
import { Card } from "@/components/ui/card";

interface PostProps {
  post: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    likes: number;
    // etc...
  };
  onLike?: (id: string) => void;
  onReply?: (id: string, text: string) => void;
}

const Post = memo(({ post, onLike, onReply }: PostProps) => {
  const handleLike = useCallback(() => {
    onLike?.(post.id);
  }, [onLike, post.id]);

  const handleReply = useCallback((text: string) => {
    onReply?.(post.id, text);
  }, [onReply, post.id]);

  return (
    <Card className="w-full max-w-xl mx-auto mb-4 p-4 rounded-2xl shadow-sm">
      <PostHeader
        user={{ name: post.author, handle: post.author }}
        createdAt={post.createdAt}
      />
      <PostContent content={post.content} />
      <PostActions likes={post.likes} onLike={handleLike} />
      <PostReply onReply={handleReply} />
    </Card>
  );
});

export { Post };
