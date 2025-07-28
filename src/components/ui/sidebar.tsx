"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Home,
  BarChart2,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronsLeft,
  Cpu,
  BookOpen,
  Activity,
} from "lucide-react";

const categories = [
  {
    title: "MAIN MENU",
    items: [
      { label: "Dashboard", icon: Home, href: "/dashboard" },
      { label: "Analytics", icon: BarChart2, href: "/analytics" },
    ],
  },
  {
    title: "FEATURES",
    items: [
      { label: "Discord", icon: MessageCircle, href: "/features/discord" },
      { label: "Hedge Calculator", icon: Cpu, href: "/features/hedge-calculator" },
    ],
  },
  {
    title: "COURSES",
    items: [{ label: "PRO", icon: BookOpen, href: "/courses/pro" }],
  },
  {
    title: "AGENTS",
    items: [
      { label: "Backtester AI", icon: Activity, href: "/agents/backtester-ai" },
      { label: "Premarket AI", icon: Activity, href: "/agents/premarket-ai" },
      { label: "Apollo AI", icon: Activity, href: "/agents/apollo-ai" },
    ],
  },
  {
    title: "GENERAL",
    items: [
      { label: "Settings", icon: Settings, href: "/general/settings" },
      { label: "Help Desk", icon: HelpCircle, href: "/general/help-desk" },
      { label: "Log out", icon: LogOut, href: "/logout" },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      className={`h-screen flex flex-col transition-width duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{
        backgroundColor: "#03182f",
        borderRight: "1px solid #0b1320",
        minWidth: collapsed ? 80 : undefined,
      }}
    >
      {/* Header com logo e toggle */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#0b1320" }}
      >
        <div
          onClick={() => collapsed && setCollapsed(false)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: collapsed ? 40 : "auto",
            height: collapsed ? 40 : "auto",
            marginLeft: collapsed ? "4px" : undefined,
          }}
        >
          {collapsed ? (
            <Image
              src="/logo_compacta.png"
              alt="Logo AWI Compact"
              width={24}
              height={24}
              style={{ objectFit: "contain" }}
              priority
            />
          ) : (
            <Image
              src="/logo_extendida.png"
              alt="Logo AWI Capital"
              width={130}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          )}
        </div>

        {!collapsed && (
          <button
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded cursor-pointer"
            style={{ color: "white", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#268bff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
          >
            <ChevronsLeft size={24} />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-1 py-4 scrollbar-thin scrollbar-thumb-[#268bff]/60 scrollbar-track-transparent">
        {categories.map((category) => (
          <div key={category.title} className="mb-6">
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-[#6a8faf] select-none">
                {category.title}
              </h3>
            )}
            <ul>
              {category.items.map(({ label, icon: Icon, href }) => {
                const isActive = pathname === href;
                const isLogout = label === "Log out";

                return (
                  <li key={label}>
                    {isLogout ? (
                      <button
                        onClick={handleLogout}
                        className={`group flex items-center ${
                          collapsed ? "justify-center px-0" : "px-3"
                        } py-2 rounded-md text-sm font-medium cursor-pointer text-white/80 hover:text-[#268bff] w-full`}
                      >
                        <Icon className="w-5 h-5 text-white/80 group-hover:text-[#268bff]" />
                        {!collapsed && (
                          <span className="ml-3 group-hover:text-[#268bff]">
                            {label}
                          </span>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={href}
                        className={`group flex items-center ${
                          collapsed ? "justify-center px-0" : "px-3"
                        } py-2 rounded-md text-sm font-medium cursor-pointer ${
                          isActive
                            ? "font-semibold text-[#268bff]"
                            : "text-white/80"
                        } hover:text-[#268bff]`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? "text-[#268bff]"
                              : "text-white/80 group-hover:text-[#268bff]"
                          }`}
                        />
                        {!collapsed && (
                          <span className="ml-3 group-hover:text-[#268bff]">
                            {label}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
