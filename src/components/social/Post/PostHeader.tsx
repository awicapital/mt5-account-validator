"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  name: string;
  handle: string;
}

interface PostHeaderProps {
  user: User;
  createdAt: string | Date;
}

export function PostHeader({ user, createdAt }: PostHeaderProps) {
  const relativeTime = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{user.name}</span>
      <span className="text-muted-foreground">@{user.handle}</span>
      <span>·</span>
      <span className="whitespace-nowrap text-muted-foreground">{relativeTime}</span>
    </div>
  );
}
