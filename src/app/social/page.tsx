"use client"

import { useRef, useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, Plus, X, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FeedList } from "@/components/social/feed"

export type SocialPost = {
  id: string
  user: {
    name: string
    username: string
    avatarUrl: string
  }
  timestamp: string
  content: string
  mediaUrl?: string
  sharedPost?: {
    author: string
    text: string
    image?: string
  }
}

const mockPosts: SocialPost[] = [
  {
    id: "1",
    user: {
      name: "João Silva",
      username: "joaosilva",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
    },
    timestamp: "2h",
    content: "Acabei de lançar uma nova feature no produto! 🚀",
    sharedPost: {
      author: "Equipe Dev",
      text: "Feature X agora permite automações em tempo real. Confira no changelog!",
      image: "https://source.unsplash.com/random/800x600?tech",
    },
  },
  {
    id: "2",
    user: {
      name: "Maria Santos",
      username: "mariasantos",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
    },
    timestamp: "1d",
    content: "O design system está ficando incrível! ✨",
  },
  {
    id: "3",
    user: {
      name: "Lucas Lima",
      username: "lucaslima",
      avatarUrl: "https://i.pravatar.cc/150?img=8",
    },
    timestamp: "3d",
    content: "Iniciando nova sprint com foco total em performance 🔥",
    sharedPost: {
      author: "Product Manager",
      text: "Sprint 32: foco em otimização e testes automatizados. 🚀",
    },
  },
]

export default function SocialFeedPage() {
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts)

  function handleCreatePost(newPost: SocialPost) {
    setPosts((prev) => [newPost, ...prev])
  }

  return (
    <main className="w-screen min-h-screen flex justify-center bg-background text-foreground">
      <section className="w-full max-w-[600px] min-h-screen relative">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Feed Social</h1>
          </div>
        </header>

        <div className="flex flex-col divide-y divide-border">
          <FeedList posts={posts} />
        </div>
      </section>

      <div className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 md:right-[calc(50%-300px+16px)] z-[60]">
        <div className="pointer-events-auto">
          <NewPostButton onCreate={handleCreatePost} />
        </div>
      </div>
    </main>
  )
}

function NewPostButton({ onCreate }: { onCreate: (post: SocialPost) => void }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [visibility, setVisibility] = useState<"public" | "pro">("public")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUser = useMemo(() => ({
    name: "Você",
    username: "voce",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
  }), [])

  function resetForm() {
    setContent("")
    setFile(null)
    setPreview(null)
    fileInputRef.current?.form?.reset()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) return
    setSubmitting(true)

    try {
      const newPost: SocialPost = {
        id: crypto.randomUUID(),
        user: currentUser,
        timestamp: "agora",
        content: content.trim(),
        mediaUrl: preview ?? undefined,
      }

      onCreate(newPost)
      setOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="h-12 w-12 rounded-full shadow-lg md:h-14 md:w-14"
        aria-label="Criar novo post"
      >
        <Plus className="h-5 w-5 md:h-6 md:w-6" />
        <span className="sr-only">Novo Post</span>
      </Button>

      <DialogContent className="sm:max-w-[520px] p-4 pb-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo?"
              className="resize-none min-h-[100px] text-sm bg-transparent border-none focus-visible:ring-0"
              maxLength={500}
            />
          </div>

          {preview && (
            <div className="relative">
              <img src={preview} alt="preview" className="rounded-xl border border-border object-cover max-h-64 w-full" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-primary" asChild>
                  <span role="button" aria-label="Anexar imagem">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                </Button>
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    {visibility === "public" ? "Todos podem responder" : "Somente membros PRO"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1 text-sm">
                  <div
                    className={cn("px-3 py-2 rounded cursor-pointer hover:bg-muted", visibility === "public" && "bg-muted")}
                    onClick={() => setVisibility("public")}
                  >
                    Todos podem responder
                  </div>
                  <div
                    className={cn("px-3 py-2 rounded cursor-pointer hover:bg-muted", visibility === "pro" && "bg-muted")}
                    onClick={() => setVisibility("pro")}
                  >
                    Somente membros PRO
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" size="sm" disabled={submitting || (!content.trim() && !file)}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Postando...
                </>
              ) : (
                "Postar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
