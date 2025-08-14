"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BotMessageSquare,
  Calculator,
  NotebookPen,
  LineChartIcon,
  ShieldHalf,
  ArrowRight,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BackHeader } from "@/components/ui/back-header";
import { Pill } from "@/components/ui/pill";

export default function FeaturesHubPage() {
  const items = useMemo<FeatureItem[]>(() => [
    {
      slug: "/features/apollo-ai",
      title: "Apollo AI",
      description: "Assistente tático para sizing, risco e leitura de mercado.",
      icon: BotMessageSquare,
      accent: "from-sky-500/20 via-sky-400/10 to-transparent",
      label: "Beta",
    },
    {
      slug: "/features/tradingview",
      title: "Gráfico",
      description: "Visualização limpa com tema escuro e tooltip profissional.",
      icon: LineChartIcon,
      accent: "from-emerald-500/20 via-emerald-400/10 to-transparent",
      label: "Novo",
    },
    {
      slug: "/features/traiding-diary",
      title: "Trading Diary",
      description: "Jornal de trades para métricas e aprendizado contínuo.",
      icon: NotebookPen,
      accent: "from-violet-500/20 via-violet-400/10 to-transparent",
      label: "Em breve",
    },
    {
      slug: "/features/calculators",
      title: "Calculadoras",
      description: "Hedge, tamanho de posição e risco R:R em segundos.",
      icon: Calculator,
      accent: "from-amber-500/20 via-amber-400/10 to-transparent",
      label: "Pro",
    },
    {
      slug: "/features/downloads",
      title: "Downloads",
      description: "Recursos, templates e documentos úteis para seu trading.",
      icon: Download,
      accent: "from-pink-500/20 via-pink-400/10 to-transparent",
      label: "Utilitário",
    },
  ], []);

  return (
    <div className="min-h-[100dvh] bg-[#03182f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#03182f]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl   pt-2">
          <BackHeader
            backHref="/"
            backLabel="Voltar"
            className="border-b border-white/10 text-white"
            rightSlot={
              <Badge className="hidden sm:inline-block bg-white/10 text-white/80">
                A11y Ready
              </Badge>
            }
          />
          <Pill dotColor="bg-sky-500">Features</Pill>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-6xl   pt-8">

        {/* Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <FeatureCard key={item.slug} item={item} />
          ))}
        </section>

      </main>
    </div>
  );
}

// --- Componentes ---

type FeatureItem = {
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  label?: string;
};

function FeatureCard({ item }: { item: FeatureItem }) {
  const Icon = item.icon;

  return (
    <Link href={item.slug} className="focus:outline-none group">
      <article
        className="relative flex flex-col justify-between h-full rounded-2xl border border-white/10 bg-[#0f1b2e]/70 p-5 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-label={item.title}
      >
        {/* Glow */}
        <div
          className={`pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${item.accent} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
        />

        <div className="flex items-center justify-between mb-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/70">
            {item.label}
          </span>
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm text-white/60">{item.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-sky-400">
          <span className="font-medium">Ver mais</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </article>
    </Link>
  );
}
