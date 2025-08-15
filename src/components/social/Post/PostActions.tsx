"use client";

import type { TPost } from "../types";

export function PostActions({ postId, stats }: { postId: string; stats: TPost["stats"] }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground mt-3 max-w-md">
      <button className="hover:text-primary">💬 {stats.comments}</button>
      <button className="hover:text-primary">🔁 {stats.reposts}</button>
      <button className="hover:text-primary">❤️ {stats.likes}</button>
      <button className="hover:text-primary">↗️</button>
    </div>
  );
}
