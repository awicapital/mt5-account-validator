"use client"

import { useRef, useState, useMemo } from "react"
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, Plus, X, Loader2 } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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

export default function NewPostButton({ onCreate }: { onCreate: (post: SocialPost) => void }) {
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

      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 pt-3">
          <div className="flex gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que está acontecendo?"
              className="resize-none min-h-[100px] text-sm bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground"
              maxLength={500}
            />
          </div>

          {preview && (
            <div className="relative mt-3">
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

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
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