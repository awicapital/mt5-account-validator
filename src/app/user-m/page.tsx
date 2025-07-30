"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  User2,
  Mail,
  Phone,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import imageCompression from "browser-image-compression";

dayjs.locale("pt-br");

interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  access_level: string | null;
  access_expires_at: string | null;
  avatar_url?: string | null;
}

export default function UserProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<"name" | "phone" | null>(null);
  const [newValue, setNewValue] = useState("");

  const fetchProfile = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return router.push("/login");

    const { data, error } = await supabase.from("users").select("*").eq("id", auth.user.id).single();
    if (error) {
      toast.error("Erro ao carregar perfil");
      return;
    }
    setUser({ ...data, email: auth.user.email });
    setLoading(false);
  };

  const updateField = async () => {
    if (!user || !editing) return;
    const updates = editing === "name" ? { full_name: newValue } : { phone_number: newValue };
    const { error } = await supabase.from("users").update(updates).eq("id", user.id);
    if (error) return toast.error("Erro ao atualizar dados");
    setEditing(null);
    setNewValue("");
    toast.success("Dados atualizados com sucesso!");
    fetchProfile();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setLoading(true);

    try {
      const file = e.target.files[0];
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 512,
        useWebWorker: true
      });

      const filePath = `${user.id}-${Date.now()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: true
      });
      if (uploadError || !uploadData) {
    		console.error("Erro no upload:", uploadError?.message || uploadError);
    		return toast.error(`Erro ao enviar imagem: ${uploadError?.message || "erro desconhecido"}`);
    	}

      const { data: publicUrlData, error: urlError } = supabase.storage.from("avatars").getPublicUrl(filePath);
      if (urlError || !publicUrlData?.publicUrl) {
        console.error("Erro ao obter URL pública:", urlError);
        return toast.error("Erro ao obter URL da imagem");
      }

      const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrlData.publicUrl }).eq("id", user.id);
      if (updateError) {
        console.error("Erro ao atualizar avatar no banco:", updateError);
        return toast.error("Erro ao atualizar avatar");
      }

      toast.success("Avatar atualizado!");
      fetchProfile();
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro ao comprimir ou enviar a imagem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#03182f] min-h-dvh space-y-6 pb-28">
      <h1 className="text-lg font-semibold text-white text-center">Perfil</h1>

      <Card className="bg-[#131f35] border border-[#1f2c44] text-white">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex flex-col items-center gap-1">
            <div
              onClick={handleAvatarClick}
              className="w-20 h-20 flex items-center justify-center rounded-full bg-[#268bff] text-white text-xl font-bold overflow-hidden cursor-pointer transition-all duration-300"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                user.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span
              onClick={handleAvatarClick}
              className="text-xs text-[#94a3b8] hover:underline cursor-pointer"
            >
              Alterar foto
            </span>
          </div>

          <div className="flex-1 space-y-1 ml-2">
            <div className="text-base font-medium">
              {user.full_name || "Usuário sem nome"}
            </div>
            <div className="text-sm text-muted-foreground">
              Nível: {user.access_level || "free"}
            </div>
            <div className="text-xs text-[#94a3b8]">
              Expira em{" "}
              {user.access_expires_at
                ? dayjs(user.access_expires_at).format("D [de] MMMM [de] YYYY")
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1f2c44] border-none">
        <CardContent className="p-4 text-white text-sm rounded-xl">
          {/* Comentário válido */}
        </CardContent>
      </Card>

      <div className="divide-y divide-[#2c3a55] rounded-xl overflow-hidden border border-[#1f2c44] bg-[#131f35]">
        <button onClick={() => { setEditing("name"); setNewValue(user.full_name || ""); }} className="w-full text-left">
          <div className="flex items-center justify-between px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <User2 className="w-5 h-5" />
              <span className="text-sm font-medium">{user.full_name || "Sem nome definido"}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
        <div className="flex items-center justify-between px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">{user.email || "Sem e-mail"}</span>
          </div>
        </div>
        <button onClick={() => { setEditing("phone"); setNewValue(user.phone_number || ""); }} className="w-full text-left">
          <div className="flex items-center justify-between px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium">{user.phone_number || "Sem telefone"}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      </div>

      <Button
        className="bg-[#268bff] hover:bg-[#1e78e0] text-white w-full"
        onClick={() => setOpenDialog(true)}
      >
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#131f35] border border-[#1f2c44]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl text-center">Deseja sair da sua conta?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-5">Você será redirecionado para a tela de login.</p>
          <DialogFooter className="flex justify-center">
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => { setEditing(null); setNewValue(""); }}>
        <DialogContent className="bg-[#131f35] border border-[#1f2c44]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl text-center">
              Editar {editing === "name" ? "nome" : "telefone"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={editing === "name" ? "Digite seu nome" : "Digite seu telefone"}
              className="w-full bg-[#1f2c44] text-white border border-[#2c3a55] rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#268bff]"
            />
            <DialogFooter>
              <Button
                className="bg-[#268bff] hover:bg-[#1e78e0] text-white w-full"
                onClick={updateField}
              >
                Salvar alterações
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
