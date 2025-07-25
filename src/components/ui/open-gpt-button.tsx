"use client";

import Link from "next/link";
import { Chat } from "lucide-react";

type OpenGptButtonProps = {
  /** URL do seu Custom GPT (ex: https://chat.openai.com/g/... ) */
  href: string;
  /** Texto do botão (opcional) */
  label?: string;
  /** Classes adicionais de estilo */
  className?: string;
};

export function OpenGptButton({ href, label = "Abrir GPT", className = "" }: OpenGptButtonProps) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      <button
        aria-label={label}
        className={
          `flex items-center gap-2 p-2 rounded cursor-pointer group transition-colors focus:outline-none focus:ring-2 focus:ring-[#268bff] ` +
          `bg-[#03182f] hover:bg-[#268bff] text-white ${className}`
        }
      >
        <Chat className="w-5 h-5 text-white group-hover:text-white" />
        <span className="text-sm font-medium">{label}</span>
      </button>
    </Link>
  );
}