"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

import {
  Loader2,
  LogOut,
  User2,
  Mail,
  Phone,
  ChevronRight,
  Camera,
  BadgeCheck,
  ShieldCheck,
  CalendarClock,
  Copy,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

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
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [openLogout, setOpenLogout] = useState(false);
  const [editField, setEditField] = useState<"name" | "phone" | null>(null);
  const [newValue, setNewValue] = useState("");

  // ------------ Data fetching ------------
  const fetchProfile = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("users") // ✅ sem genéricos
      .select("id, full_name, phone_number, access_level, access_expires_at, avatar_url") // ✅ sem "*"
      .eq("id", auth.user.id)
      .single();

    if (error) {
      toast.error("Erro ao carregar perfil");
      setLoading(false);
      return;
    }

    setUser({ ...data, email: auth.user.email });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ------------ Helpers ------------
  function initials(name?: string | null) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
  }

  function maskPhone(v: string) {
    const digits = v.replace(/\D/g, "");
    if (digits.length <= 10)
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  }

  // ------------ Mutations ------------
  async function updateField() {
    if (!user || !editField) return;
    const value = newValue.trim();
    if (!value) return toast.error("Preencha um valor válido.");

    const updates =
      editField === "name" ? { full_name: value } : { phone_number: value };

    // Otimista
    const prev = user;
    setUser({ ...user, ...updates });

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      setUser(prev);
      return toast.error("Erro ao atualizar dados");
    }

    toast.success("Dados atualizados!");
    setEditField(null);
    setNewValue("");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function triggerAvatar() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);

    try {
      const file = e.target.files[0];
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const filePath = `${user.id}-${Date.now()}`;
      const { data: up, error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, { cacheControl: "3600", upsert: true });

      if (upErr || !up) {
        throw new Error(upErr?.message || "Falha no upload");
      }

      const { data: pub } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!pub?.publicUrl) throw new Error("Sem URL pública");

      const { error: updErr } = await supabase
        .from("users")
        .update({ avatar_url: pub.publicUrl })
        .eq("id", user.id);

      if (updErr) throw new Error("Erro ao salvar avatar");

      toast.success("Avatar atualizado!");
      setUser({ ...user, avatar_url: pub.publicUrl });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar imagem";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#03182f]">
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando perfil…
        </div>
      </div>
    );
  }

  const accessColor =
    user.access_level === "pro" ? "text-emerald-400" : "text-sky-400";

  return (
    <div className="min-h-dvh bg-[#03182f] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#03182f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 text-white">
          <h1 className="text-base font-semibold">Perfil</h1>
          <Button
            variant="secondary"
            className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setOpenLogout(true)}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-6 px-4 pt-6">
        {/* Profile card */}
        <Card className="overflow-hidden rounded-2xl border border-[#1f2c44] bg-gradient-to-b from-[#0f1b2e] to-[#0b1424] text-white">
          <CardContent className="flex items-start gap-4 p-4">
            <div className="relative">
              <button
                onClick={triggerAvatar}
                className="group relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#268bff] text-xl font-bold"
                aria-label="Alterar foto do perfil"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials(user.full_name)
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-end p-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <Camera className="h-3.5 w-3.5" />
                    {uploading ? "Enviando…" : "Trocar"}
                  </span>
                </span>
              </button>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-medium">
                  {user.full_name || "Usuário sem nome"}
                </div>
                <span
                  className={`rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] ${accessColor}`}
                >
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  {user.access_level || "free"}
                </span>
              </div>
              <div className="text-xs text-white/70">
                <CalendarClock className="mr-1 inline h-3.5 w-3.5" />
                Expira em{" "}
                {user.access_expires_at
                  ? dayjs(user.access_expires_at).format(
                      "D [de] MMMM [de] YYYY"
                    )
                  : "—"}
              </div>
              <div className="text-[11px] text-white/50">
                <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                Seus dados ficam privados e seguros.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details list */}
        <div className="overflow-hidden rounded-2xl border border-[#1f2c44] bg-[#131f35]">
          <button
            onClick={() => {
              setEditField("name");
              setNewValue(user.full_name || "");
            }}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <User2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {user.full_name || "Sem nome definido"}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
          </button>

          <div className="flex items-center justify-between border-t border-[#1f2c44] px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <Mail className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm font-medium">
                {user.email || "Sem e-mail"}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-lg border-white/15 bg-white/10 text-white hover:bg-white/20"
              onClick={() =>
                user.email &&
                navigator.clipboard
                  .writeText(user.email)
                  .then(() => toast.success("E-mail copiado!"))
              }
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
            </Button>
          </div>

          <button
            onClick={() => {
              setEditField("phone");
              setNewValue(user.phone_number || "");
            }}
            className="w-full text-left border-t border-[#1f2c44]"
          >
            <div className="flex items-center justify-between px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {user.phone_number
                    ? maskPhone(user.phone_number)
                    : "Sem telefone"}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
          </button>
        </div>

        {/* Danger zone */}
        <div className="flex items-center justify-center">
          <Button
            className="w-full max-w-sm rounded-xl bg-red-600 text-white hover:bg-red-700"
            onClick={() => setOpenLogout(true)}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </main>

      {/* Logout dialog */}
      <Dialog open={openLogout} onOpenChange={setOpenLogout}>
        <DialogContent className="border border-[#1f2c44] bg-[#131f35]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">
              Deseja sair da sua conta?
            </DialogTitle>
          </DialogHeader>
          <p className="mx-auto max-w-sm text-center text-sm text-white/70">
            Você será redirecionado para a tela de login.
          </p>
          <DialogFooter className="flex justify-center">
            <Button
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editField}
        onOpenChange={() => {
          setEditField(null);
          setNewValue("");
        }}
      >
        <DialogContent className="border border-[#1f2c44] bg-[#131f35]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">
              Editar {editField === "name" ? "nome" : "telefone"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <input
              type="text"
              value={newValue}
              onChange={(e) =>
                setNewValue(
                  editField === "phone"
                    ? maskPhone(e.target.value)
                    : e.target.value
                )
              }
              placeholder={
                editField === "name"
                  ? "Digite seu nome"
                  : "Digite seu telefone"
              }
              className="w-full rounded-md border border-[#2c3a55] bg-[#1f2c44] px-3 py-2 text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#268bff]"
            />
            <DialogFooter>
              <Button
                className="w-full rounded-xl bg-[#268bff] text-white hover:bg-[#1e78e0]"
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
