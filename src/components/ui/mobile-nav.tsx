"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  List,
  Bot,
  GraduationCap,
  User,
  Plus,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number;
  ariaLabel?: string;
};

const DEFAULT_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Contas", href: "/accounts", icon: List },
  { label: "IA", href: "/agents", icon: Bot },
  { label: "Cursos", href: "/courses", icon: GraduationCap },
  { label: "Perfil", href: "/user-profile", icon: User },
];

export type MobileNavProps = {
  items?: NavItem[];
  className?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: React.ComponentType<{ className?: string; size?: number }>;
};

export default function MobileNav({
  items = DEFAULT_ITEMS,
  className,
  onPrimaryAction,
  primaryActionLabel = "Nova ação",
  primaryActionIcon: PrimaryIcon = Plus,
}: MobileNavProps) {
  const pathname = usePathname();

  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => pathname === it.href || pathname.startsWith(`${it.href}/`));
    return idx === -1 ? 0 : idx;
  }, [items, pathname]);

  return (
    <nav
      role="navigation"
      aria-label="Menu inferior"
      className={clsx(
        "fixed inset-x-0 bottom-0 z-50 -mb-px",
        "pb-[calc(env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-t from-[#03182f]/0 via-[#268bff]/5 to-[#03182f]/0 blur-2xl"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          "mx-auto max-w-screen-xl",
          "relative rounded-t-2xl border border-white/10 border-b-transparent",
          "bg-[#03182f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#03182f]/90",
          "shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.35)]"
        )}
      >
        <ul
          role="tablist"
          aria-label="Navegação principal"
          className={clsx("grid grid-cols-5 items-stretch","h-16 px-3")}
        >
          {items.map((item, index) => (
            <li key={item.href} role="presentation" className="relative">
              <NavLink
                item={item}
                active={index === activeIndex}
                aria-posinset={index + 1}
                aria-setsize={items.length}
              />
              <AnimatePresence>
                {index === activeIndex && (
                  <motion.span
                    layoutId="active-underline"
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-8 -top-px h-[3px] rounded-full bg-[#268bff]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>

        {onPrimaryAction && (
          <div className="pointer-events-none absolute -top-6 left-0 right-0 flex justify-center">
            <motion.button
              type="button"
              onClick={onPrimaryAction}
              className={clsx(
                "pointer-events-auto grid place-items-center",
                "h-12 w-12 rounded-2xl border border-white/10",
                "bg-[#268bff] text-white",
                "shadow-lg shadow-[#268bff]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#268bff]/70"
              )}
              aria-label={primaryActionLabel}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <PrimaryIcon size={20} />
            </motion.button>
          </div>
        )}
      </motion.div>
    </nav>
  );
}

function NavLink({
  item,
  active,
  ...aria
}: {
  item: NavItem;
  active: boolean;
} & React.ComponentPropsWithoutRef<typeof Link>) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      role="tab"
      aria-selected={active}
      className={clsx(
        "group relative mx-1 my-2 flex h-12 items-center justify-center gap-1",
        "rounded-xl text-[11px] leading-none",
        active ? "text-[#268bff]" : "text-white/80",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      )}
      {...aria}
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-xl">
        <Icon className={clsx("transition-transform duration-300", active ? "scale-110" : "scale-100")} size={18} />
        <AnimatePresence>
          {!!item.badge && item.badge > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0, y: -4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white shadow"
              aria-label={`${item.badge} novas notificações`}
            >
              {item.badge > 9 ? "9+" : item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span className={clsx("ml-2 hidden sm:inline", active ? "font-medium" : "font-normal")}>{item.label}</span>
    </Link>
  );
}
