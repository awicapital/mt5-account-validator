"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DownloadCloud, Activity, ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { BackHeader } from "@/components/ui/back-header";

const categories = ["Experts", "Sets", "Copiers", "Scripts", "Tools"] as const;
export type Category = typeof categories[number];

export type DownloadItem = {
  name: string;
  href: string;
  size?: string;
  description?: string;
};
export type FilesByCategory = Record<Category, DownloadItem[]>;

const categoryIcons: Record<Category, JSX.Element> = {
  Experts: <span className="text-xl">👨‍💻</span>,
  Sets: <span className="text-xl">🧩</span>,
  Copiers: <span className="text-xl">📎</span>,
  Scripts: <span className="text-xl">📜</span>,
  Tools: <span className="text-xl">🛠️</span>,
};

function formatBytes(bytes?: number): string | undefined {
  if (!bytes && bytes !== 0) return undefined;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function DownloadsPage() {
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [files, setFiles] = useState<FilesByCategory>({
    Experts: [],
    Sets: [],
    Copiers: [],
    Scripts: [],
    Tools: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const updates: Partial<FilesByCategory> = {};
        await Promise.all(
          categories.map(async (category) => {
            const { data, error } = await supabase.storage
              .from("downloads")
              .list(category, {
                limit: 200,
                sortBy: { column: "name", order: "asc" },
              });
            if (error) throw error;

            const items: DownloadItem[] = (data ?? []).map((f) => {
              const { data: publicData } = supabase.storage
                .from("downloads")
                .getPublicUrl(`${category}/${f.name}`);
              const size = formatBytes(
                (f as any)?.metadata?.size ?? (f as any)?.metadata?.contentLength
              );
              return {
                name: f.name,
                href: publicData.publicUrl,
                size,
              };
            });
            (updates as any)[category] = items;
          })
        );
        if (active)
          setFiles((prev) => ({ ...prev, ...(updates as FilesByCategory) }));
      } catch (e: any) {
        if (active) setError(e?.message ?? "Erro ao carregar arquivos");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <BackHeader title="Downloads">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm text-foreground hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-400">
            <Activity className="h-3 w-3 animate-pulse" />
            {loading ? "Carregando arquivos..." : "Atualização automática ativada"}
          </div>
        </div>
      </BackHeader>

      {error && (
        <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-20">
        {categories.map((category) => (
          <section key={category} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-white/5 shadow-inner">
                {categoryIcons[category]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {category}
                </h2>
                <p className="text-sm text-white/60">
                  {files[category].length} arquivo(s) disponível(is)
                </p>
              </div>
            </div>

            {files[category].length === 0 ? (
              <p className="text-sm italic text-white/50">
                Nenhum arquivo disponível nesta categoria.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {files[category].map((item) => {
                  const ext = item.name.split(".").pop()?.toLowerCase();
                  return (
                    <li
                      key={item.href}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-5 shadow-md transition hover:scale-[1.015] hover:shadow-xl"
                    >
                      <div className="flex-1 space-y-2">
                        <p className="truncate text-lg font-medium text-white" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          {item.size && <span>{item.size}</span>}
                          {ext && (
                            <span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 uppercase tracking-wider">
                              .{ext}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={item.href}
                        prefetch={false}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Baixar
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
