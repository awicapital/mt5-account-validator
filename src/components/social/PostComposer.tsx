"use client";

import { useRef, useState } from "react";
import {
  Globe,
  ImageIcon,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumCard } from "@/components/ui/premium-card";
import { supabase } from "@/lib/supabase";

interface PostComposerProps {
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  visibility: string;
  onPostSuccess: (newPost: any) => void;
  onCancel?: () => void;
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : `${parts[0][0]}`.toUpperCase();
}

export function PostComposer({
  user,
  visibility: initialVisibility,
  onPostSuccess,
  onCancel,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(initialVisibility);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    let imageUrl: string | null = null;
    let mimeType: string | null = null;

    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `post_media/${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-uploads")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("post-uploads")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
        mimeType = imageFile.type;
      }

      const { data: newPost, error: postError } = await supabase
        .from("posts")
        .insert([{ author_id: user.id, text: content.trim() }])
        .select()
        .single();

      if (postError) throw postError;

      if (imageUrl) {
        const { error: mediaError } = await supabase.from("post_media").insert([
          {
            post_id: newPost.id,
            storage_path: imageUrl,
            mime_type: mimeType,
          },
        ]);

        if (mediaError) throw mediaError;
      }

      onPostSuccess(newPost);
      setContent("");
      handleRemoveImage();
    } catch (err) {
      console.error("Erro ao criar post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumCard className="w-full max-w-xl px-5 py-4 text-white">
      <div className="flex justify-between mb-4">
        <button onClick={onCancel} className="text-white text-sm">
          Cancelar
        </button>
        <button
          onClick={handlePost}
          disabled={!content.trim() || loading}
          className="bg-blue-600 text-white px-4 py-1 rounded-full disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Postar"}
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <Avatar>
          {user.avatar_url && <AvatarImage src={user.avatar_url} />}
          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
        </Avatar>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seu post…"
          className="flex-1 resize-none bg-transparent text-white outline-none min-h-[80px]"
        />
      </div>

      {imagePreview && (
        <div className="relative mb-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full rounded-xl object-cover"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={handleImageSelect}
          />
        </div>
        <button
          onClick={() => setVisibility((v) => (v === "pro" ? "public" : "pro"))}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
            visibility === "pro"
              ? "bg-blue-600 text-white"
              : "bg-white/10 text-white"
          }`}
        >
          {visibility === "pro" ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              PRO
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              Geral
            </>
          )}
        </button>
      </div>
    </PremiumCard>
  );
}
