"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DownloadCloud, ChevronDown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";
import { BackHeader } from "@/components/ui/back-header";
import { Pill } from "@/components/ui/pill";

const categories = ["Experts", "Sets", "Copiers", "Scripts", "Tools"] as const;
type Category = typeof categories[number];

interface DownloadItem {
  name: string;
  href: string;
  size?: string;
  description?: string;
}

type FilesByCategory = Record<Category, DownloadItem[]>;

function formatBytes(bytes?: number): string | undefined {
  if (!bytes && bytes !== 0) return undefined;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

const categoryIcons: Record<Category, JSX.Element> = {
  Experts: <span className="text-xl">⚡</span>,
  Sets: <span className="text-xl">⚙️</span>,
  Copiers: <span className="text-xl">📄</span>,
  Scripts: <span className="text-xl">💻</span>,
  Tools: <span className="text-xl">🛠️</span>,
};

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
  const [expanded, setExpanded] = useState<Partial<Record<Category, boolean>>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const updates: Partial<FilesByCategory> = {};
      await Promise.all(
        categories.map(async (category) => {
          const { data, error } = await supabase.storage
            .from("downloads")
            .list(category, {
              limit: 200,
              sortBy: { column: "name", order: "asc" },
            });

          if (!error && data) {
            const items: DownloadItem[] = data.map((f) => {
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
                description: f.name,
              };
            });
            (updates as any)[category] = items;
          }
        })
      );
      if (active) setFiles((prev) => ({ ...prev, ...(updates as FilesByCategory) }));
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[#03182f] py-8 text-white md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <BackHeader
          backHref="/features"
          backLabel="Voltar"
          className="border-b border-white/10 text-white"
        />
        <Pill dotColor="bg-sky-500">Downloads</Pill>

        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-xl border border-white/10 bg-white/5 shadow-sm"
            >
              <button
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [category]: !prev[category],
                  }))
                }
                className="flex w-full items-center justify-between rounded-t-xl px-4 py-3 transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
                    {categoryIcons[category]}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{category}</p>
                    <p className="text-xs text-white/50">
                      {files[category].length} arquivo(s)
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={clsx(
                    "h-4 w-4 text-white/70 transition-transform duration-300",
                    expanded[category] && "rotate-180"
                  )}
                />
              </button>

              {expanded[category] && files[category].length > 0 && (
                <ul className="divide-y divide-white/10 border-t border-white/10 bg-transparent text-sm">
                  {files[category].map((item) => {
                    const ext = item.name.split(".").pop()?.toUpperCase();
                    return (
                      <li
                        key={item.href}
                        className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-white/10"
                      >
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate text-sm font-medium text-white">
                            {item.description}
                          </span>
                          <span className="truncate text-xs text-white/50">
                            {item.name}
                          </span>
                          <div className="mt-1 flex gap-2 text-[10px] text-white/60">
                            {item.size && (
                              <span className="rounded bg-white/10 px-2 py-0.5">
                                {item.size}
                              </span>
                            )}
                            {ext && (
                              <span className="rounded bg-white/10 px-2 py-0.5">
                                .{ext}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={item.href}
                          prefetch={false}
                          className="shrink-0 rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                          aria-label={`Download ${item.name}`}
                        >
                          Baixar
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
