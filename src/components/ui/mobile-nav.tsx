"use client";

import { Home, List, Bot, HelpCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { label: "Início", href: "/dashboard-m", icon: Home },
  { label: "Contas", href: "/accounts-m", icon: List },
  { label: "IA", href: "/agents-m", icon: Bot },
  { label: "Ajuda", href: "/help-desk-m", icon: HelpCircle },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#03182f] flex justify-around items-center h-[64px] px-4">
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
