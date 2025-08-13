"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isMobile } from "react-device-detect";

import { FaDiscord } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push("/dashboard");
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    if (!email || !senha) {
      toast.error("Preencha todos os campos.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) toast.error(error.message);
    else {
      toast.success("Login realizado!");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    const redirectTo = `${window.location.origin}/login`;

    if (isMobile) {
      window.location.href = "discord://";
      setTimeout(async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
        if (error) toast.error("Erro ao entrar com Discord: " + error.message);
      }, 800);
    } else {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
      if (error) toast.error("Erro ao entrar com Discord: " + error.message);
    }
  };

  const handleRecover = async () => {
    setRecoverLoading(true);
    if (!recoverEmail) {
      toast.error("Informe seu e-mail.");
      setRecoverLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(recoverEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link enviado! Verifique sua caixa de entrada.");
      setModalOpen(false);
    }

    setRecoverLoading(false);
  };

  return (
    <main className="fixed inset-0 grid place-items-center bg-gradient-to-br from-[#03182f] via-[#09172c] to-[#0a1121] overflow-hidden px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg">
          <CardContent className="px-8 py-10 space-y-6">
            <div className="flex justify-center">
              <Image
                src="/logo_extendida.png"
                alt="Logo AWI Club"
                width={200}
                height={60}
                priority
              />
            </div>

            <h2 className="text-xl font-semibold text-white text-center">Olá! Acesse sua conta</h2>
            <p className="text-center text-sm text-gray-300">Entre para continuar</p>

            <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="email" className="text-gray-200">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/20 placeholder-gray-400 placeholder:text-sm text-white focus:bg-white/30 transition-colors duration-200"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="senha" className="text-gray-200">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="bg-white/20 placeholder-gray-400 placeholder:text-sm text-white focus:bg-white/30 transition-colors duration-200"
                />
              </div>

              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-blue-400 hover:underline transition-colors duration-200"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remember"
                  checked={remember}
                  onCheckedChange={setRemember}
                  className="border-gray-600 bg-gray-800"
                />
                <Label htmlFor="remember" className="text-sm text-gray-300">Lembrar-me</Label>
              </div>

              <Button
                type="submit"
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition-colors duration-200"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="pt-6">
              <Button
                onClick={handleDiscordLogin}
                className="
                  flex items-center justify-center gap-2
                  w-full py-2
                  bg-[#5865F2]/20 backdrop-blur-sm
                  border border-[#5865F2]/50
                  text-white font-semibold rounded-lg shadow-md
                  hover:bg-[#5865F2]/30 transition-all duration-200
                "
              >
                <FaDiscord size={20} color="#FFF" />
                {isMobile ? "Entrar com app do Discord" : "Entrar com Discord"}
              </Button>
            </div>

            <p className="mt-4 text-center text-sm text-gray-400">
              Ainda não tem conta?{" "}
              <Link href="/register" className="text-blue-400 hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de recuperação de senha */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0f172a] border border-[#1e293b] text-white rounded-2xl shadow-xl">

          <DialogHeader>
            <DialogTitle className="text-white text-lg">🔐 Recuperar senha</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-zinc-400 mb-4">
            Informe o e-mail da sua conta. Enviaremos um link para redefinir sua senha.
          </p>

          <div className="space-y-2">
            <Label htmlFor="recover-email" className="text-gray-300">E-mail</Label>
            <Input
              id="recover-email"
              type="email"
              placeholder="seu@email.com"
              value={recoverEmail}
              onChange={e => setRecoverEmail(e.target.value)}
              className="bg-white/10 placeholder-gray-400 placeholder:text-sm text-white focus:bg-white/20 transition-colors duration-200"
            />
            <Button
              onClick={handleRecover}
              disabled={recoverLoading}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              {recoverLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
