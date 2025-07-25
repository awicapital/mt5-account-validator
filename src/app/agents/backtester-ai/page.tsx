// src/app/agents/backtester-ai/page.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function BacktesterAIPage() {
  return (
    <div className="flex flex-col p-6 space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Backtester AI</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Converse com o agente <strong>Backtester AI</strong> diretamente dentro da aplicação.
            Faça análises de estratégias, gere relatórios e receba insights sobre backtests.
          </p>

          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border shadow-lg">
            <iframe
              src="https://chat.openai.com/g/g-6883e2016c848191a8be8daf2bd64daf-awicapital-analista"
              className="w-full h-full"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-500 mt-2">
            <AlertTriangle className="w-4 h-4 mt-1" />
            <span>
              O agente é carregado via OpenAI. O usuário precisa estar <strong>logado no ChatGPT</strong> no navegador para funcionar corretamente.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
