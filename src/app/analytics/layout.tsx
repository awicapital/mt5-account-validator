import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopMenu } from "@/components/ui/top-menu"; // importe o seu TopMenu

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <header className="h-16 bg-[#03182f] flex items-center px-6">
          <TopMenu />
        </header>

        <main className="flex-1 p-6 bg-[#03182f]">{children}</main>
      </div>
    </div>
  );
}
