"use client";

import { Bell, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MobileHeader() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleUserIconClick = () => {
    router.push("/user-m");
  };

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-[#03182f]">
      <div className="pl+4">
        <Image
          src="/logo_extendida.png"
          alt="Logo"
          width={100}
          height={24}
          className="h-6 w-auto object-contain"
          priority
        />
      </div>

      <div className="flex items-center gap-4 text-white">
        <Mail className="w-5 h-5 cursor-pointer" />
        <div className="relative">
          <Bell className="w-5 h-5 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full" />
        </div>
        <User
          className="w-5 h-5 cursor-pointer"
          onClick={handleUserIconClick}
        />
      </div>
    </header>
  );
}