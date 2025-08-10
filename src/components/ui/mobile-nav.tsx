"use client";

import { Home, List, Bot, GraduationCap, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Contas", href: "/accounts", icon: List },
  { label: "IA", href: "/agents", icon: Bot },
  { label: "Cursos", href: "/courses", icon: GraduationCap },
  { label: "Perfil", href: "/user-profile", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className={clsx(
        // fixa e “puxa pra cima” acrescentando 1rem ao safe‐area
        "fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)]",
        "z-50 bg-[#03182f] flex justify-around items-center px-4",
        // altura fixa do menu
        "h-[64px]"
      )}
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={clsx(
              "flex flex-col items-center text-xs transition-colors duration-200",
              isActive
                ? "text-[#268bff]"
                : "text-[#ebebec] hover:text-[#268bff]"
            )}
          >
            <Icon size={20} className="mb-1" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
