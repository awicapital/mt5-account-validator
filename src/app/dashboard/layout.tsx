import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <header className="h-16 bg-white shadow flex items-center px-6">
          <h1 className="text-lg font-bold">Dashboard</h1>
        </header>

        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
