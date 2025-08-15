// src/app/courses/pro/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Layers,
  LineChart,
  Lock,
  Play,
  PlayCircle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { supabase } from "@/lib/supabase";

// -------------------- Tipos --------------------
type EducationRow = {
  id: string;
  parent_id: string | null;
  type: string | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  order_index: number | null;
  duration_min: number | null;
  locked: boolean | null;
  provider: string | null;
  video_id: string | null;
  resource_url: string | null;
  start_seconds: number | null;
};

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

// -------------------- Helpers --------------------
function parseYouTube(url?: string): { id: string | null; startSeconds: number } {
  if (!url) return { id: null, startSeconds: 0 };
  try {
    const u = new URL(url);
    let id: string | null = null;

    if (u.hostname === "youtu.be") id = u.pathname.slice(1) || null;
    if (!id && (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com"))) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
      }
    }

    let startSeconds = 0;
    const t = u.searchParams.get("t") || u.searchParams.get("start");
    if (t) {
      const match = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
      if (match && (match[1] || match[2] || match[3])) {
        const h = parseInt(match[1] || "0", 10);
        const m = parseInt(match[2] || "0", 10);
        const s = parseInt(match[3] || "0", 10);
        startSeconds = h * 3600 + m * 60 + s;
      } else if (/^\d+$/.test(t)) {
        startSeconds = parseInt(t, 10);
      }
    }

    return { id: id ?? null, startSeconds };
  } catch {
    return { id: null, startSeconds: 0 };
  }
}

function toYouTubeEmbed(id: string, startSeconds = 0) {
  const sp = new URLSearchParams();
  sp.set("rel", "0");
  sp.set("modestbranding", "1");
  sp.set("iv_load_policy", "3");
  sp.set("playsinline", "1");
  sp.set("cc_load_policy", "0");
  if (startSeconds > 0) sp.set("start", String(startSeconds));
  return `https://www.youtube-nocookie.com/embed/${id}?${sp.toString()}`;
}

// -------------------- Data fetching --------------------
async function fetchProFromDB() {
  const { data: course, error: courseError } = await supabase
    .from("education")
    .select("id,title,description")
    .eq("slug", "curso-pro")
    .eq("type", "course")
    .single();

  if (courseError || !course) throw courseError || new Error("Curso PRO não encontrado");

  const { data: lessons, error: lessonsError } = await supabase
    .from("education")
    .select("id,title,duration_min,locked,resource_url,order_index")
    .eq("parent_id", course.id)
    .eq("type", "lesson")
    .order("order_index", { ascending: true });

  if (lessonsError) throw lessonsError;

  const module: Module = {
    id: course.id as string,
    title: (course.title as string) ?? "Curso PRO",
    description: (course.description as string) ?? undefined,
    lessons:
      (lessons || []).map((l: Partial<EducationRow>) => ({
        id: String(l.id),
        title: l.title ?? "Aula",
        durationMin: l.duration_min ?? 0,
        locked: !!l.locked,
        resourceUrl: l.resource_url ?? undefined,
      })) ?? [],
  };

  return { course, curriculum: [module] as Module[] };
}

// -------------------- Progresso local --------------------
function useLocalProgress(courseKey = "course-pro-progress", totalLessons: number) {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(courseKey);
      if (saved) setCompleted(JSON.parse(saved));
    } catch {
      // noop
    }
  }, [courseKey]);

  useEffect(() => {
    try {
      localStorage.setItem(courseKey, JSON.stringify(completed));
    } catch {
      // noop
    }
  }, [courseKey, completed]);

  const markDone = (lessonId: string) =>
    setCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));

  const reset = () => setCompleted([]);

  const pct = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;

  return { completed, markDone, reset, pct };
}

// -------------------- Page --------------------
export default function CoursePROPage() {
  const router = useRouter();
  const search = useSearchParams();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Module[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { curriculum } = await fetchProFromDB();
        if (!mounted) return;
        setCurriculum(curriculum);
      } catch (e: any) {
        if (!mounted) return;
        setLoadError(e?.message || "Falha ao carregar o Curso PRO");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const flatLessons = useMemo(() => curriculum.flatMap((m) => m.lessons), [curriculum]);
  const { completed, markDone, reset, pct } = useLocalProgress("course-pro-progress", flatLessons.length);

  // lidar com lesson vinda da URL
  const initialId = search.get("lesson") || flatLessons[0]?.id;
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(initialId || undefined);

  useEffect(() => {
    if (!selectedLessonId && flatLessons[0]?.id) {
      setSelectedLessonId(flatLessons[0].id);
    }
  }, [flatLessons, selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    const url = `${pathname}?lesson=${selectedLessonId}`;
    window.history.replaceState(null, "", url);
  }, [pathname, selectedLessonId]);

  const selectedLesson = useMemo(
    () => flatLessons.find((l) => l.id === selectedLessonId) ?? flatLessons[0],
    [flatLessons, selectedLessonId]
  );

  const isLocked = !!selectedLesson?.locked;

  const startOrContinue = () => {
    const el = document.getElementById("pro-player");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { id: ytId, startSeconds } = parseYouTube(selectedLesson?.resourceUrl);
  const embedUrl = ytId ? toYouTubeEmbed(ytId, startSeconds) : null;

  const handleEmitCertificate = () => {
    router.push("/courses/pro/certificate");
  };

  return (
    <TooltipProvider>
      <main className="min-h-[100dvh] bg-[#03182f] text-white">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#03182f]/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
            <button
              onClick={() => router.push("/courses")}
              className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Voltar para cursos"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4" /> Acesso Premium
            </div>
          </div>
        </div>

        {/* Hero: coluna única com card de progresso logo abaixo do botão */}
        <section className="relative px-4 pt-6 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-1">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <Badge className="border-0 bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white">PRO</Badge>
              <h1 className="text-2xl font-semibold md:text-4xl">PRO — Domine o fluxo completo e escale com eficiência</h1>
              <p className="max-w-2xl text-sm text-white/70 md:text-base">
                Conteúdo premium com táticas avançadas, automações, indicadores e rotinas de alta consistência. Feito para quem quer performance real, com estudos de caso e playbooks prontos.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><LineChart className="h-4 w-4"/> Intermediário → Avançado</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4"/> ~3–5h por módulo</span>
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4"/> Certificado digital</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={startOrContinue} size="lg" className="rounded-xl bg-white text-slate-900 hover:bg-white/90" disabled={loading || !selectedLesson}>
                  <Play className="mr-2 h-4 w-4"/>
                  {completed.length > 0 ? "Continuar curso" : "Começar agora"}
                </Button>
              </div>

              {/* Card de progresso abaixo do botão */}
              <Card className="mt-4 rounded-2xl border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl">
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

                  {pct === 100 ? (
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Parabéns! Você concluiu todas as aulas.
                      </div>
                      <Button
                        onClick={handleEmitCertificate}
                        className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4"/>
                        Emitir certificado
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <BookmarkCheck className="h-4 w-4"/>
                      Progresso salvo localmente (demo)
                    </div>
                  )}

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
          {/* player maior (1.6fr) + alturas iguais */}
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.6fr_.8fr] lg:items-stretch">
            {/* Player */}
            <div className="space-y-6 lg:h-full">
              <Card id="pro-player" className="flex h-full flex-col overflow-hidden rounded-2xl border-white/10 bg-slate-950">
                {/* 16:9 ajustado ao vídeo */}
                <div className="relative w-full aspect-[16/9] max-h-[78vh]">
                  {loading ? (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-sm text-white/70">Carregando curso…</div>
                    </div>
                  ) : loadError ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-white/80">
                      <p className="text-sm">Não foi possível carregar o Curso PRO.</p>
                      <p className="mt-1 text-xs text-white/60">{loadError}</p>
                    </div>
                  ) : selectedLesson && !isLocked && embedUrl ? (
                    <iframe
                      title={`YouTube player — ${selectedLesson.title}`}
                      src={embedUrl}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
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
                        ) : selectedLesson ? (
                          <Button
                            className="rounded-2xl bg-white/95 text-slate-900 hover:bg-white"
                            onClick={() => markDone(selectedLesson.id)}
                          >
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Marcar como concluída
                          </Button>
                        ) : (
                          <div className="text-sm text-white/70">Nenhuma lição disponível.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer do player */}
                <CardContent className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/80 p-4 text-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Video className="h-4 w-4 text-white/70"/>
                    <span className="truncate" title={selectedLesson?.title || ""}>
                      {selectedLesson?.title || "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-white/60 md:gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {selectedLesson?.durationMin ?? 0}min
                    </span>
                    {!isLocked && selectedLesson && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-white/80 hover:text-white"
                        onClick={() => markDone(selectedLesson.id)}
                        aria-label="Marcar aula como concluída"
                      >
                        Concluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: conteúdo do curso */}
            <div className="space-y-4 lg:self-stretch">
              <Card className="flex h-full flex-col rounded-2xl border-white/10 bg-slate-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Layers className="h-5 w-5"/>
                    Conteúdo do curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ScrollArea className="h-full pr-3">
                    {loading ? (
                      <div className="px-2 py-4 text-sm text-white/70">Carregando conteúdo…</div>
                    ) : loadError ? (
                      <div className="px-2 py-4 text-sm text-white/70">Falha ao carregar conteúdo.</div>
                    ) : (
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
                                  const isSelected = selectedLessonId === lesson.id;
                                  return (
                                    <li key={lesson.id}>
                                      <button
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className={`group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                                          isSelected ? "bg-white/5" : ""
                                        }`}
                                        aria-current={isSelected ? "true" : undefined}
                                      >
                                        <div className="flex min-w-0 items-center gap-2">
                                          {lesson.locked ? (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Lock className="h-4 w-4 text-white/50" />
                                              </TooltipTrigger>
                                              <TooltipContent className="border-white/10 bg-slate-900 text-white">
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
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </TooltipProvider>
  );
}
