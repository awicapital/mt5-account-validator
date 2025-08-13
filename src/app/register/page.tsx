// src/app/(public)/register/page.tsx
//"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleRegister = async () => {
    if (!nome || !email || !senha) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);

    // 1. Cria usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Atualiza metadados (opcional)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nome },
      });
      if (updateError) {
        toast.error("Erro ao atualizar nome: " + updateError.message);
      }

      // 3. Cria entrada na tabela `users`
      const { error: insertError } = await supabase.from("users").insert({
        email,
        full_name: nome,
        access_level: "STARTER",
      });

      if (insertError) {
        toast.error("Erro ao salvar dados extras: " + insertError.message);
        setLoading(false);
        return;
      }
    }

    toast.success("Conta criada com sucesso!");
    setLoading(false);
    router.push("/dashboard-m");
  };

  return (
    <main
      className="
        fixed inset-0
        grid place-items-center
        bg-gradient-to-br from-[#03182f] via-[#09172c] to-[#0a1121]
        overflow-hidden px-4
      "
    >
      <div className="w-full max-w-md">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg">
          <CardContent className="px-8 py-10 space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-xl font-semibold text-white">Criar conta</h2>
              <p className="text-center text-sm text-gray-300">
                Insira seus dados para criar a conta
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
            >
              <div className="flex flex-col space-y-1">
                <Label htmlFor="nome" className="text-gray-200">
                  Nome
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="
                    bg-white/20
                    placeholder-gray-400 placeholder:text-sm
                    text-white
                    focus:bg-white/30
                    transition-colors duration-200
                  "
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="email" className="text-gray-200">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    bg-white/20
                    placeholder-gray-400 placeholder:text-sm
                    text-white
                    focus:bg-white/30
                    transition-colors duration-200
                  "
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="senha" className="text-gray-200">
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="
                    bg-white/20
                    placeholder-gray-400 placeholder:text-sm
                    text-white
                    focus:bg-white/30
                    transition-colors duration-200
                  "
                />
              </div>

              <Button
                type="submit"
                className="
                  w-full py-2
                  bg-blue-500 hover:bg-blue-600
                  text-white font-medium
                  rounded-lg shadow-md
                  transition-colors duration-200
                "
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-400">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-blue-400 hover:underline font-medium"
              >
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
