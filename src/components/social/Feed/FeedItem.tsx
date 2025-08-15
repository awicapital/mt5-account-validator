// components/feed/FeedItem.tsx
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Repeat2, Heart, Share } from "lucide-react"

interface FeedItemProps {
  user: {
    name: string
    username: string
    avatarUrl: string
  }
  timestamp: string
  content: string
  sharedPost?: {
    author: string
    text: string
    image?: string
  }
}

export function FeedItem({
  user,
  timestamp,
  content,
  sharedPost,
}: FeedItemProps) {
  return (
    <div className="flex gap-4 px-4 py-5">
      {/* Avatar */}
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatarUrl} />
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      </Avatar>

      {/* Body */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-1 flex-wrap text-sm leading-none">
          <span className="font-semibold text-foreground">{user.name}</span>
          <span className="text-muted-foreground">@{user.username}</span>
          <span className="text-muted-foreground">· {timestamp}</span>
        </div>

        {/* Content */}
        <div className="mt-2 text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {content}
        </div>

        {/* Shared Post */}
        {sharedPost && (
          <Card className="mt-3 p-4 bg-muted/40 border rounded-2xl">
            <div className="text-sm">
              <span className="font-medium text-foreground">{sharedPost.author}</span>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                {sharedPost.text}
              </p>

              {sharedPost.image && (
                <img
                  src={sharedPost.image}
                  alt="shared media"
                  className="mt-3 w-full rounded-xl max-h-60 object-cover"
                />
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 text-muted-foreground text-sm max-w-[420px]">
          <Action icon={<MessageSquare className="w-4 h-4" />} count={749} />
          <Action icon={<Repeat2 className="w-4 h-4" />} count={1100} />
          <Action icon={<Heart className="w-4 h-4" />} count={6800} />
          <Action icon={<Share className="w-4 h-4" />} count={1200} />
        </div>
      </div>
    </div>
  )
}

function Action({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors duration-200">
      {icon}
      <span className="text-xs">{Intl.NumberFormat().format(count)}</span>
    </div>
  )
}
