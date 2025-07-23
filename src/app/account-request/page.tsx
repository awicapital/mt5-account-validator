"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountRequestPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? "");
    };

    getUserEmail();
  }, []);

  const handleSubmit = async () => {
    if (!accountNumber) {
      toast.error("Informe o número da conta.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("accounts").insert({
      account_number: Number(accountNumber),
      email,
      requested_at: new Date().toISOString(),
      is_active: false,
    });

    if (error) {
      toast.error("Erro ao solicitar conta.");
    } else {
      toast.success("Solicitação enviada com sucesso!");
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-center">
            Solicitar Nova Conta
          </h1>

          <div className="space-y-2">
            <Label htmlFor="account">Número da Conta MT5</Label>
            <Input
              id="account"
              type="number"
              placeholder="Ex: 123456"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
