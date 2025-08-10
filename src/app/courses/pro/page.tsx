"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  GraduationCap,
  KeyRound,
  Layers,
  LineChart,
  Lock,
  Play,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ------------------------------------------------------------
// PRO Course Page — Premium Track
// Path: src/app/courses/pro/page.tsx
// Notes:
// - Stateless demo data below; you can plug Supabase for real content, progress & gating.
// - Accessible, keyboard-friendly, mobile-first. Sticky sidebar on desktop.
// ------------------------------------------------------------

// Types
interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  locked?: boolean;
  resourceUrl?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

// Demo Curriculum (replace with DB fetch)
const curriculum: Module[] = [
  {
    id: "m1",
    title: "Fundamentos de Performance PRO",
    description:
      "Princípios avançados de consistência, ajuste fino e mentalidade orientada a sistemas.",
    lessons: [
      { id: "l1", title: "Arquitetura de Rotina PRO", durationMin: 14 },
      { id: "l2", title: "Gestão de Risco Multicontas", durationMin: 18 },
      { id: "l3", title: "Métricas que Importam (KPI Stack)", durationMin: 22 },
    ],
  },
  {
    id: "m2",
    title: "Automação e Integrações",
    description:
      "Fluxos automatizados, validações e alertas. Do setup ao monitoramento em produção.",
    lessons: [
      { id: "l4", title: "Pipelines & Webhooks", durationMin: 19 },
      { id: "l5", title: "Validador de Contas em Profundidade", durationMin: 21 },
      { id: "l6", title: "Alertas e Auditoria", durationMin: 16 },
    ],
  },
  {
    id: "m3",
    title: "Playbooks & Estudos de Caso",
    description:
      "Aplicações reais com números, decisões e pós-mortem.",
    lessons: [
      { id: "l7", title: "Playbook PRO #1", durationMin: 24 },
      { id: "l8", title: "Playbook PRO #2", durationMin: 27, locked: true },
      { id: "l9", title: "Case: Escalando com Segurança", durationMin: 20, locked: true },
    ],
  },
];

const flatLessons = curriculum.flatMap((m) => m.lessons);

// Simple local progress mock (replace with API)
function useLocalProgress(courseKey = "course-pro-progress") {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(courseKey);
    if (saved) setCompleted(JSON.parse(saved));
  }, [courseKey]);

  useEffect(() => {
    localStorage.setItem(courseKey, JSON.stringify(completed));
  }, [courseKey, completed]);

  const markDone = (lessonId: string) =>
    setCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));

  const reset = () => setCompleted([]);

  const pct = Math.round((completed.length / flatLessons.length) * 100);

  return { completed, markDone, reset, pct };
}

export default function CoursePROPage() {
  const router = useRouter();
  const { completed, markDone, reset, pct } = useLocalProgress();

  const [selectedLessonId, setSelectedLessonId] = useState<string>(flatLessons[0].id);
  const selectedLesson = useMemo(
    () => flatLessons.find((l) => l.id === selectedLessonId) ?? flatLessons[0],
    [selectedLessonId]
  );

  const isLocked = !!selectedLesson.locked;

  // Notes (local only)
  const notesKey = `notes-${selectedLessonId}`;
  const [notes, setNotes] = useState<string>("");
  useEffect(() => {
    setNotes(localStorage.getItem(notesKey) || "");
  }, [notesKey]);
  useEffect(() => {
    localStorage.setItem(notesKey, notes);
  }, [notesKey, notes]);

  const startOrContinue = () => {
    // If user not enrolled, you could gate here using Supabase profile/access.
    // For now just scroll to player
    const el = document.getElementById("pro-player");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <TooltipProvider>
      <main className="min-h-[100dvh] bg-[#03182f] text-white">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#03182f]/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
            <button
              onClick={() => router.push("/courses")}
              className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg px-1 py-1"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" /> Acesso Premium
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative px-4 pt-6 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1.1fr_.9fr]">
            {/* Left — Intro */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <Badge className="bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white border-0">
                PRO
              </Badge>
              <h1 className="text-2xl font-semibold md:text-4xl">
                PRO — Domine o fluxo completo e escale com eficiência
              </h1>
              <p className="max-w-2xl text-sm text-white/70 md:text-base">
                Conteúdo premium com táticas avançadas, automações, indicadores
                e rotinas de alta consistência. Feito para quem quer performance
                real, com estudos de caso e playbooks prontos.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><LineChart className="h-4 w-4"/> Intermediário → Avançado</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4"/> ~3–5h por módulo</span>
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4"/> Certificado digital</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={startOrContinue} size="lg" className="rounded-xl bg-white text-slate-900 hover:bg-white/90">
                  <Play className="mr-2 h-4 w-4"/>
                  {completed.length > 0 ? "Continuar curso" : "Começar agora"}
                </Button>
                <Button variant="secondary" className="rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20">
                  <Download className="mr-2 h-4 w-4"/> Materiais
                </Button>
              </div>
            </motion.div>

            {/* Right — Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <Card className="rounded-2xl border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Trophy className="h-5 w-5 text-amber-400"/>
                    Seu progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{completed.length} / {flatLessons.length} aulas</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <BookmarkCheck className="h-4 w-4"/>
                    Progresso salvo localmente (demo)
                  </div>
                  <div className="pt-2">
                    <Button variant="ghost" onClick={reset} className="h-8 rounded-lg text-white/70 hover:text-white">
                      Reiniciar progresso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <Separator className="my-6 border-white/10" />

        {/* Main Content */}
        <section className="px-4 pb-20 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.4fr_.8fr]">
            {/* Player + Notes */}
            <div className="space-y-6">
              {/* Player */}
              <Card id="pro-player" className="overflow-hidden rounded-2xl border-white/10 bg-slate-950">
                <div className="relative aspect-video w-full">
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600/20 via-slate-900 to-slate-950">
                    <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />
                    <div className="text-center">
                      {isLocked ? (
                        <div className="flex flex-col items-center gap-3">
                          <Lock className="h-10 w-10 text-white/70"/>
                          <p className="max-w-md px-6 text-sm text-white/70">
                            Esta aula está bloqueada no plano atual.
                          </p>
                          <Button className="rounded-xl bg-white text-slate-900 hover:bg-white/90">
                            <KeyRound className="mr-2 h-4 w-4"/>
                            Desbloquear acesso PRO
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="rounded-2xl bg-white/95 text-slate-900 hover:bg-white"
                          onClick={() => markDone(selectedLesson.id)}
                        >
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Marcar como concluída
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 p-4 text-sm">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Video className="h-4 w-4 text-white/70"/>
                    <span className="truncate" title={selectedLesson.title}>
                      {selectedLesson.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Clock className="h-4 w-4"/> {selectedLesson.durationMin}min
                  </div>
                </CardContent>
              </Card>

              {/* Notas */}
              <Card className="rounded-2xl border-white/10 bg-slate-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileText className="h-5 w-5"/> Minhas anotações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escreva aqui seus insights, pontos de atenção e próximos passos..."
                    className="min-h-[140px] resize-vertical rounded-xl border-white/10 bg-slate-900 text-white placeholder:text-white/40"
                  />
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Salvo automaticamente no seu navegador</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 rounded-lg border-white/15 bg-white/10 text-white hover:bg-white/20"
                        onClick={() => navigator.clipboard.writeText(notes)}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-white/70 hover:text-white"
                        onClick={() => setNotes("")}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Curriculum / Sidebar */}
            <div className="space-y-4 lg:sticky lg:top-[76px] lg:h-[calc(100dvh-100px)]">
              <Card className="rounded-2xl border-white/10 bg-slate-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Layers className="h-5 w-5"/>
                    Conteúdo do curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[380px] pr-3">
                    <Accordion type="single" collapsible className="w-full">
                      {curriculum.map((mod) => (
                        <AccordionItem key={mod.id} value={mod.id} className="border-b border-white/10">
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex w-full items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{mod.title}</p>
                                {mod.description && (
                                  <p className="text-xs text-white/60">{mod.description}</p>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-1">
                              {mod.lessons.map((lesson) => {
                                const done = completed.includes(lesson.id);
                                return (
                                  <li key={lesson.id}>
                                    <button
                                      onClick={() => setSelectedLessonId(lesson.id)}
                                      className={`group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                                        selectedLessonId === lesson.id ? "bg-white/5" : ""
                                      }`}
                                      aria-current={selectedLessonId === lesson.id ? "true" : undefined}
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        {lesson.locked ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Lock className="h-4 w-4 text-white/50" />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-white/10">
                                              Aula bloqueada no seu plano
                                            </TooltipContent>
                                          </Tooltip>
                                        ) : done ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                          <Play className="h-4 w-4 text-white/60" />
                                        )}
                                        <span className="truncate" title={lesson.title}>{lesson.title}</span>
                                      </div>
                                      <span className="flex shrink-0 items-center gap-2 text-xs text-white/60">
                                        <Clock className="h-3.5 w-3.5" /> {lesson.durationMin}m
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-white/10 bg-gradient-to-b from-indigo-600/20 to-fuchsia-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <GraduationCap className="h-5 w-5"/>
                    Certificação PRO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/80">
                  <p>
                    Complete todas as aulas e conclua o checklist final para gerar
                    seu <span className="font-medium text-white">certificado digital</span>.
                  </p>
                  <Button className="w-full rounded-xl bg-white text-slate-900 hover:bg-white/90">
                    <Sparkles className="mr-2 h-4 w-4"/> Gerar certificado (em breve)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </TooltipProvider>
  );
}
