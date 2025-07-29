"use client";

import { Bell, Mail, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MobileHeader() {
  const router = useRouter();

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-[#03182f]">
      {/* Logo compacta */}
      <Image
        src="/logo_compacta.png"
        alt="Logo"
        width={120}
        height={28}
        className="h-7 w-auto object-contain"
        priority
      />

      {/* Ícones de ação */}
      <div className="flex items-center gap-4 text-white">
        <HelpCircle className="w-5 h-5 cursor-pointer" />
        <Mail className="w-5 h-5 cursor-pointer" />
        <div className="relative">
          <Bell className="w-5 h-5 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full" />
        </div>
        <Image
          src="/avatar.png"
          alt="Avatar"
          width={24}
          height={24}
          className="rounded-full object-cover"
        />
      </div>
    </header>
  );
}
