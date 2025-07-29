"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);

    if (!email || !senha) {
      toast.error("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      toast.error("Email ou senha inválidos.");
    } else {
      toast.success("Login realizado com sucesso!");

      if (email === "contato@awi.capital") {
        router.push("/admin/dashboard");
      } else {
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 768;
        router.push(isMobile ? "/dashboard-m" : "/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-card px-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardContent className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/logo_extendida.png"
              alt="Logo Awi Capital"
              width={200}
              height={60}
              priority
            />
          </div>

          {/* Chamada amigável abaixo da logo */}
          <p className="text-center text-sm text-muted-foreground">
            Entre na sua conta para continuar
          </p>

          {/* Formulário */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
