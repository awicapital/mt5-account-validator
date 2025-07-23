"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Settings,
  BarChart2,
  BookOpen,
  MessageCircle,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "./button";
import { useState, useEffect } from "react";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/contas", label: "Contas", icon: CreditCard },
  { href: "/dashboard/configuracao", label: "Configuração", icon: Settings },
  { href: "/dashboard/performance", label: "Performance", icon: BarChart2 },
  { href: "/dashboard/aulas", label: "Aulas", icon: BookOpen },
  { href: "/dashboard/discord", label: "Discord", icon: MessageCircle },
];

export function Sidebar() {
  const path = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-64 p-4 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 space-y-6 border-r border-gray-200 dark:border-gray-700">
      <div className="mb-8 text-2xl font-bold">AWI Capital</div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = path === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium
                ${
                  active
                    ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white text-gray-600 dark:text-gray-400"
                }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Modo Escuro</span>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
