"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  ArrowUp,
  ArrowDown,
  Settings2,
  Sparkles,
  Clock,
} from "lucide-react";

// Apollo AI — Polished Chat UI
// - Visual de vidro (glass) + gradientes sutis
// - Header fixo com branding e ações
// - Mensagens com bolhas, avatar, rótulos e hora
// - Sugestões de prompt no estado vazio
// - Botão flutuante “ir para o fim”
// - Input com auto-resize + Enter para enviar
// - Indicador de "digitando" enquanto aguardando resposta

interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
  ts?: number; // timestamp local
}

export default function ApolloAIPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "system",
      content:
        "Você é Apollo AI, um analista financeiro que fornece respostas técnicas e objetivas sobre o mercado.",
      ts: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasConversationStarted = messages.length > 1;

  const suggestions = useMemo(
    () => [
      "Analise minha conta #10293 e identifique riscos",
      "Resumo do desempenho do último mês em USD",
      "Quais métricas devo monitorar diariamente?",
      "Como otimizar alocação entre 3 contas?",
    ],
    []
  );

  function autogrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px"; // limite 6–7 linhas
  }

  useEffect(() => {
    autogrow();
  }, [input]);

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
      setShowScrollDown(!nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;

    const tsNow = Date.now();
    const updated: Msg[] = [
      ...messages,
      { role: "user", content: value, ts: tsNow },
    ];
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
      const reply = data.choices?.[0]?.message?.content || "Erro ao obter resposta.";
      setMessages([...updated, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages([...updated, { role: "assistant", content: "Erro de conexão com o Apollo AI.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#03182f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#03182f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 shadow-lg shadow-black/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">Apollo AI</h1>
              <p className="text-[11px] text-white/60 leading-tight">Analista financeiro • respostas técnicas e objetivas</p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            title="Configurações"
          >
            <Settings2 className="h-4 w-4" />
            Preferências
          </button>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={containerRef}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[128px] pt-4"
      >
        {!hasConversationStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <img src="/apollo_ai.png" alt="Apollo Logo" className="mb-4 h-28 w-28 opacity-90" />
            <h2 className="text-xl font-semibold">Oi, sou o Apollo</h2>
            <p className="mt-1 max-w-md text-sm text-white/70">
              Posso analisar contas, resumir desempenho, sugerir métricas e estratégias.
            </p>
            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}

            {loading && (
              <div className="mr-auto max-w-[85%] rounded-2xl bg-slate-200 px-5 py-3 text-sm text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600" />
                  <span className="text-[13px] font-medium text-slate-700">Apollo está digitando…</span>
                </div>
                <div className="mt-2 flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0.2s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Composer */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative mb-3 rounded-2xl border border-white/10 bg-[#0f1b2ecc] shadow-2xl backdrop-blur-md">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Apollo, analise a minha conta número X"
              rows={1}
              className="w-full resize-none rounded-2xl bg-transparent px-4 pb-10 pt-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />

            {/* Footer actions inside composer */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-2">
              <div className="pointer-events-auto flex items-center gap-2 text-[11px] text-white/50">
                <Clock className="h-3.5 w-3.5" /> Enter para enviar • Shift+Enter quebra linha
              </div>
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600 text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                aria-label="Enviar mensagem"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-to-bottom */}
      {showScrollDown && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-[108px] right-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur hover:bg-white/20"
        >
          <ArrowDown className="h-4 w-4" /> Ir para o fim
        </button>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const time = msg.ts ? new Date(msg.ts) : null;
  const hh = time ? time.getHours().toString().padStart(2, "0") : "";
  const mm = time ? time.getMinutes().toString().padStart(2, "0") : "";

  return (
    <div
      className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "ml-auto bg-blue-600 text-white"
          : "mr-auto bg-slate-200 text-slate-900"
      }`}
      role="group"
    >
      <div className={`mb-1 flex items-center gap-2 ${isUser ? "text-white/80" : "text-slate-600"}`}>
        <div
          className={`h-6 w-6 shrink-0 rounded-full ${
            isUser
              ? "bg-blue-500"
              : "bg-gradient-to-tr from-indigo-500 to-fuchsia-600"
          }`}
        />
        <span className="text-[11px] font-medium">
          {isUser ? "Você" : "Apollo"}
        </span>
        {time && <span className="text-[10px] opacity-60">{hh}:{mm}</span>}
      </div>
      <div>{msg.content}</div>
    </div>
  );
}
