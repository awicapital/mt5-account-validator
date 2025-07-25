"use client";

import { HelpCircle, Mail, Bell } from "lucide-react";

export function TopMenu() {
  return (
    <div className="flex items-center gap-4 bg-[#03182f] px-4 py-2 rounded-none justify-end w-full max-w-full">
      <button
        aria-label="Help"
        className="p-2 rounded cursor-pointer group"
      >
        <HelpCircle className="w-5 h-5 text-white group-hover:text-[#268bff] transition-colors" />
      </button>

      <button
        aria-label="Email"
        className="p-2 rounded cursor-pointer group"
      >
        <Mail className="w-5 h-5 text-white group-hover:text-[#268bff] transition-colors" />
      </button>

      <button
        aria-label="Notifications"
        className="p-2 rounded cursor-pointer relative group"
      >
        <Bell className="w-5 h-5 text-white group-hover:text-[#268bff] transition-colors" />
        <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <button
        aria-label="User profile"
        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
      >
        <img
          src="/path-to-avatar.jpg"
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
}
