import MobileNav from "@/components/ui/mobile-nav";
import MobileHeader from "@/components/ui/mobile-header";
import { Toaster } from "sonner";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <main className="flex-1 overflow-y-auto pb-[64px]">
        <MobileHeader />
        {children}
      </main>
      <MobileNav />
      <Toaster richColors position="bottom-center" />
    </div>
  );
}
