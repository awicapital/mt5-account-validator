"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Download, Code2, Settings2, Puzzle, Wrench, TerminalSquare } from "lucide-react";
import { BackHeader } from "@/components/ui/back-header";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FileItem = {
  name: string;
  url: string;
};

const getCategory = (name: string) => {
  if (name.startsWith("ea_")) return "Expert Advisors";
  if (name.startsWith("set_")) return "Sets";
  if (name.startsWith("copier_")) return "Copiers";
  if (name.startsWith("script_")) return "Scripts";
  if (name.startsWith("tool_")) return "Tools";
  return "Outros";
};

const categoryIcons = {
  "Expert Advisors": <Code2 className="w-5 h-5 text-pink-400" />,
  Sets: <Settings2 className="w-5 h-5 text-amber-400" />,
  Copiers: <Puzzle className="w-5 h-5 text-green-400" />,
  Scripts: <TerminalSquare className="w-5 h-5 text-cyan-400" />,
  Tools: <Wrench className="w-5 h-5 text-indigo-400" />,
  Outros: <Download className="w-5 h-5 text-white" />,
};

export default function DownloadsPage() {
  const [filesByCategory, setFilesByCategory] = useState<Record<string, FileItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const { data, error } = await supabase.storage.from("downloads").list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
          setErrorMsg("Nenhum arquivo disponível para download.");
          setLoading(false);
          return;
        }

        const grouped: Record<string, FileItem[]> = {};

        for (const file of data) {
          const { data: publicUrlData } = supabase.storage.from("downloads").getPublicUrl(file.name);
          const category = getCategory(file.name);
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push({ name: file.name, url: publicUrlData.publicUrl });
        }

        setFilesByCategory(grouped);
        setLoading(false);
      } catch (err: any) {
        console.error("Erro ao carregar arquivos:", err.message);
        setErrorMsg("Erro ao carregar os arquivos.");
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#03182f] text-white pb-24">
      <div className="sticky top-0 z-40 bg-[#03182f]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl pt-2">
          <BackHeader backHref="/" backLabel="Voltar" className="border-b border-white/10 text-white" />
          <Pill dotColor="bg-pink-500">Downloads</Pill>
        </div>
      </div>

      <main className="mx-auto max-w-6xl pt-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Arquivos para download</h1>

        {loading && <p className="text-white/60">Carregando arquivos...</p>}
        {errorMsg && <p className="text-red-400">{errorMsg}</p>}

        {!loading && Object.keys(filesByCategory).map((category) => (
          <section key={category} className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              {categoryIcons[category]}
              <h2 className="text-lg font-semibold text-white">{category}</h2>
            </div>
            <ul className="space-y-3">
              {filesByCategory[category].map((file) => (
                <li key={file.name} className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                  <span className="truncate text-white/90">{file.name}</span>
                  <Button variant="secondary" asChild>
                    <a href={file.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Baixar
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
