// components/feed/FeedList.tsx
import { FeedItem } from "./FeedItem"

interface FeedListProps {
  posts: {
    id: string
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
  }[]
}

export function FeedList({ posts }: FeedListProps) {
  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <FeedItem key={post.id} {...post} />
      ))}
    </div>
  )
}
