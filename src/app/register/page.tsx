"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!nome || !email || !senha) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nome }, // Atualiza o nome no user_metadata
      });

      if (updateError) {
        toast.error("Erro ao atualizar nome: " + updateError.message);
      }
    }

    toast.success("Conta criada com sucesso!");
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#03182f" }}
    >
      <Card className="w-full max-w-sm rounded-lg bg-[#03182f] border-0 shadow-none">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-center text-white">Criar conta</h1>

          <p className="text-center text-sm text-muted-foreground -mt-2 mb-4">
            Insira seus dados para criar a conta
          </p>

          <div className="space-y-2">
            <Label htmlFor="nome" className="text-white">
              Nome
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-white">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar conta"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
