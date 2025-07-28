"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ApolloAIPage() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Você é Apollo AI, um analista financeiro que fornece respostas técnicas e objetivas sobre o mercado.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasConversationStarted = messages.length > 1;

  async function handleSend() {
    if (!input.trim()) return;

    const updated = [...messages, { role: "user", content: input }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/apollo-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content || "Erro ao obter resposta.";
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...updated,
        { role: "assistant", content: "Erro de conexão com o Apollo AI." },
      ]);
    }

    setLoading(false);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="min-h-screen flex flex-col p-6 bg-[#b6d5ff] rounded-tl-lg rounded-tr-lg">

      <Card className="relative flex flex-col flex-grow bg-[#b6d5ff] rounded-md shadow-none border-none ring-0 outline-none">
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 shadow-none border-none ring-0 outline-none">
          {!hasConversationStarted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-center text-gray-700 text-base sm:text-lg max-w-md px-4">
                Comece enviando uma pergunta. O Apollo responderá com base nos dados que você fornecer.
              </p>
            </div>
          )}

          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <div
                key={i}
                className={`text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }`}
              >
                <span
                  className={`px-4 py-2 rounded-2xl max-w-[80%] inline-block ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 rounded-b-2xl"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 bg-transparent flex flex-col sm:flex-row items-center gap-4 rounded-b-md">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ex: Qual sua análise para o EUR/USD hoje?"
            className="flex-1 text-gray-900 placeholder:text-gray-500 bg-white/50 border-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleSend} disabled={loading} className="min-w-[100px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
