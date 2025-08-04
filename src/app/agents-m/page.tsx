"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowUp } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  return (
    <div className="relative z-40 flex flex-col min-h-screen bg-[#03182f]">
      <main
        ref={containerRef}
        className="flex-1 flex flex-col overflow-y-auto px-6 pt-6 pb-[110px] scroll-smooth"
      >
        {!hasConversationStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center text-white text-center space-y-4">
            <img
              src="/apollo_ai.png"
              alt="Apollo Logo"
              className="w-40 h-40 opacity-90"
            />
            <h2 className="text-xl font-semibold">Oi, sou o Apollo</h2>
            <p className="text-sm text-gray-300">Como posso te ajudar hoje?</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] rounded-2xl px-5 py-3 ${
                    m.role === "user"
                      ? "ml-auto bg-blue-600 text-white"
                      : "mr-auto bg-[#e2e8f0] text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-[80px] left-0 right-0 z-50 px-4">
        <div className="relative w-full max-w-3xl mx-auto rounded-2xl shadow-2xl backdrop-blur-md bg-[#0f1b2ecc] border border-white/10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Apollo, analise a minha conta número X"
            rows={2}
            className="w-full pr-10 resize-none text-sm text-white placeholder:text-gray-400 bg-transparent border-none rounded-2xl px-4 py-3 focus:outline-none"
          />
          {input.trim() !== "" && (
            <button
              onClick={handleSend}
              disabled={loading}
              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-blue-500 transition-opacity duration-200 ease-in-out hover:bg-blue-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ArrowUp className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}