"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Layers,
  LineChart,
  Play,
  PlayCircle,
  ShieldCheck,
  Trophy,
  Video,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lesson {
  id: string;
  title: string;
  durationMin: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

const curriculum: Module[] = [
  {
    id: "m1",
    title: "Primeiros Passos",
    description: "Aprenda a configurar seu ambiente e entender os conceitos básicos.",
    lessons: [
      { id: "l1", title: "Introdução ao curso", durationMin: 5 },
      { id: "l2", title: "Instalação e Setup", durationMin: 12 },
      { id: "l3", title: "Conceitos fundamentais", durationMin: 15 },
    ],
  },
  {
    id: "m2",
    title: "Primeiras Estratégias",
    description: "Execute seus primeiros testes e valide hipóteses.",
    lessons: [
      { id: "l4", title: "Fundamentos de estratégia e risco", durationMin: 18 },
      { id: "l5", title: "Executando backtests", durationMin: 20 },
      { id: "l6", title: "Checklist antes de operar", durationMin: 10 },
    ],
  },
];

const flatLessons = curriculum.flatMap((m) => m.lessons);

function useLocalProgress(courseKey = "course-progress") {
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

export default function CoursePage() {
  const router = useRouter();
  const { completed, markDone, reset, pct } = useLocalProgress();

  const [selectedLessonId, setSelectedLessonId] = useState<string>(flatLessons[0].id);
  const selectedLesson = useMemo(
    () => flatLessons.find((l) => l.id === selectedLessonId) ?? flatLessons[0],
    [selectedLessonId]
  );

  return (
    <main className="min-h-[100dvh] bg-[#03182f] text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#03182f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <button
            onClick={() => router.push("/courses")}
            className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="h-4 w-4" /> Curso
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative px-4 pt-6 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-2xl font-semibold md:text-4xl">
              Fundamentos sólidos para começar do jeito certo
            </h1>
            <p className="max-w-2xl text-sm text-white/70 md:text-base">
              Aprenda a base indispensável para iniciar: setup, conceitos
              essenciais e boas práticas para dar seus primeiros passos com
              confiança.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <LineChart className="h-4 w-4" /> Iniciante → Intermediário
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> ~2h por módulo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Certificado digital
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  document.getElementById("player")?.scrollIntoView({ behavior: "smooth" })
                }
                size="lg"
                className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {completed.length > 0 ? "Continuar curso" : "Começar agora"}
              </Button>
            </div>

            {/* Progresso */}
            <Card className="rounded-2xl border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  Seu progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    {completed.length} / {flatLessons.length} aulas
                  </span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    onClick={reset}
                    className="h-8 rounded-lg text-white/70 hover:text-white"
                  >
                    Reiniciar progresso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Separator className="my-6 border-white/10" />

      {/* Main */}
      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.6fr_.8fr] lg:items-stretch">
          {/* Player */}
          <div className="lg:h-full">
            <Card
              id="player"
              className="flex h-full flex-col overflow-hidden rounded-2xl border-white/10 bg-slate-950"
            >
              <div className="relative w-full aspect-[16/9] max-h-[78vh] grid place-items-center bg-slate-900/20">
                <Button
                  className="rounded-2xl bg-white/95 text-slate-900 hover:bg-white"
                  onClick={() => markDone(selectedLesson.id)}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Marcar como concluída
                </Button>
              </div>
              <CardContent className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 p-4 text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Video className="h-4 w-4 text-white/70" />
                  <span className="truncate" title={selectedLesson.title}>
                    {selectedLesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Clock className="h-4 w-4" /> {selectedLesson.durationMin}min
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:self-stretch">
            <Card className="flex h-full flex-col rounded-2xl border-white/10 bg-slate-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Layers className="h-5 w-5" />
                  Conteúdo do curso
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ScrollArea className="h-full pr-3">
                  <Accordion type="single" collapsible className="w-full">
                    {curriculum.map((mod) => (
                      <AccordionItem key={mod.id} value={mod.id} className="border-b border-white/10">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div>
                            <p className="text-sm font-medium">{mod.title}</p>
                            {mod.description && (
                              <p className="text-xs text-white/60">{mod.description}</p>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {mod.lessons.map((lesson) => {
                              const done = completed.includes(lesson.id);
                              const isSelected = selectedLessonId === lesson.id;
                              return (
                                <li key={lesson.id}>
                                  <button
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className={`group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                                      isSelected ? "bg-white/5" : ""
                                    }`}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      {done ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      ) : (
                                        <Play className="h-4 w-4 text-white/60" />
                                      )}
                                      <span className="truncate">{lesson.title}</span>
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
          </div>
        </div>
      </section>
    </main>
  );
}
