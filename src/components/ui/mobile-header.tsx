"use client";

import { Bell, Mail, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MobileHeader() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("avatar_url, full_name")
          .eq("id", user.id)
          .single();

        if (userData) {
          const { avatar_url, full_name } = userData;

          if (avatar_url) {
            const cleanedPath = avatar_url.replace(/^\/+/, "");
            let url = "";

            if (avatar_url.startsWith("http")) {
              url = avatar_url;
            } else {
              const { data: publicData } = supabase.storage
                .from("avatars")
                .getPublicUrl(cleanedPath);
              url = publicData?.publicUrl ?? "";
            }

            if (url) setAvatarUrl(url);
          }

          if (full_name) {
            const initials = full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            setUserInitials(initials);
          }
        }
      }
    };

    getUserData();
  }, []);

  const handleAvatarClick = () => {
    router.push("/user-m");
  };

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-[#03182f]">
      <div className="pl-4">
        <Image
          src="/logo_extendida.png"
          alt="Logo"
          width={140}
          height={32}
          className="h-8 w-auto object-contain"
          priority
        />
      </div>

      <div className="flex items-center gap-4 text-white">
        <HelpCircle className="w-5 h-5 cursor-pointer" />
        <Mail className="w-5 h-5 cursor-pointer" />
        <div className="relative">
          <Bell className="w-5 h-5 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full" />
        </div>

        <div
          onClick={handleAvatarClick}
          className="w-6 h-6 rounded-full bg-[#268bff] text-white text-xs font-bold flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
