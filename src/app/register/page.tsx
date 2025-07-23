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
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);

    if (!email || !senha) {
      toast.error("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
    } else {
      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-center">Criar conta</h1>

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
