import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import MobileHeader from "@/components/ui/mobile-header";
import MobileNav from "@/components/ui/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "MT5 Account Validator",
  description: "Validação de contas MT5 com segurança e performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans bg-background text-foreground antialiased min-h-screen">
        <AuthProvider>
          <MobileHeader />
          <main className="pt-[72px] px-4 md:px-8 py-6">
            {children}
          </main>
          <MobileNav />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
