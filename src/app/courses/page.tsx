"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ------------------------------------------------------------
// Cursos Page — Starter & PRO
// Caminho: src/app/courses/page.tsx
// Ajuste: Botões e cards levam para /courses/starter e /courses/pro
// ------------------------------------------------------------

const courses = [
  {
    slug: "starter",
    title: "Starter",
    headline: "Fundamentos sólidos para começar do jeito certo",
    description:
      "Aprenda a base indispensável: configuração do ambiente, conceitos essenciais e boas práticas para dar seus primeiros passos com confiança.",
    level: "Iniciante a Intermediário",
    highlights: [
      "Setup completo do ambiente",
      "Fundamentos de estratégia e risco",
      "Primeiros backtests na prática",
      "Checklists reutilizáveis",
    ],
    colorFrom: "from-emerald-500",
    colorTo: "to-teal-600",
    accentRing: "ring-emerald-500/40",
    icon: Rocket,
    cta: "Entrar no Starter",
  },
  {
    slug: "pro",
    title: "PRO",
    headline: "Domine o fluxo completo e escale com eficiência",
    description:
      "Conteúdo avançado para quem quer performance: táticas, automações, indicadores, rotinas de alta consistência e gestão em múltiplas contas.",
    level: "Intermediário a Avançado",
    highlights: [
      "Estratégias PRO e gestão de risco",
      "Automação e integrações",
      "Acompanhamento multi-conta",
      "Playbooks e cases reais",
    ],
    colorFrom: "from-indigo-500",
    colorTo: "to-fuchsia-600",
    accentRing: "ring-indigo-500/40",
    icon: Crown,
    cta: "Ir para o PRO",
  },
] as const;

type Course = (typeof courses)[number];

function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const Icon = course.icon;
  const path = `/courses/${course.slug}`;

  const go = () => router.push(path);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Abrir curso ${course.title}`}
        onClick={go}
        onKeyDown={onKey}
        className={
          "group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
          course.accentRing
        }
      >
        {/* Gradiente decorativo */}
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-tr ${course.colorFrom} ${course.colorTo} opacity-30 blur-3xl transition-opacity duration-300 group-hover:opacity-50`}
        />

        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="bg-white/10 text-white backdrop-blur border-white/10"
            >
              {course.title}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" />
              {course.level}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr ${course.colorFrom} ${course.colorTo} text-white shadow-lg shadow-black/40`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl font-semibold">
                {course.headline}
              </CardTitle>
              <p className="text-sm text-white/70 leading-relaxed">
                {course.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {course.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-white/80">{h}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Aulas em vídeo
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                Materiais de apoio
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                Atualizações contínuas
              </div>
            </div>

            {/* Botão com Link nativo Next.js (prefetch/a11y) */}
            <Button
              asChild
              variant="secondary"
              className="group/button rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15"
              aria-label={`Ir para o curso ${course.title}`}
            >
              <Link href={path}>
                {course.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CoursesPage() {
  return (
    <main className="min-h-[100dvh] bg-[#03182f] text-white">
      {/* Hero */}
      <section className="relative px-4 pt-10 pb-8 md:px-8 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Trilhas disponíveis agora
          </div>

          <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
            Escolha seu caminho: <span className="text-emerald-400">Starter</span> ou
            <span className="text-indigo-400"> PRO</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            Duas jornadas, um objetivo: elevar seu nível com uma experiência
            prática, objetiva e focada em resultados.
          </p>
        </div>
      </section>

      {/* Grid de cursos */}
      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>

        {/* FAQ/Notas rápidas */}
        <div className="mx-auto mt-10 max-w-6xl text-xs text-white/60">
          <p>
            Dica: você pode alternar entre as trilhas a qualquer momento. O
            progresso de aulas é salvo por curso.
          </p>
        </div>
      </section>
    </main>
  );
}
