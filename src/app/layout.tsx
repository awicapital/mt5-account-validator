import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import LayoutWrapper from "@/components/ui/layout-wrapper";

export const metadata: Metadata = {
  title: "AWI Capital",
  description: "Validação de contas MT5 com segurança e performance.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/logo_compacta.png", sizes: "192x192", type: "image/png" },
      { url: "/logo_compacta.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: { url: "/logo_compacta.png" },
    apple: { url: "/logo_compacta.png" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      {/* 100dvh evita bugs de 100vh no mobile */}
      <body className="min-h-[100dvh] bg-background text-foreground antialiased">
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
