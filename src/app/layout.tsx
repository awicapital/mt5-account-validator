import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import LayoutWrapper from "@/components/ui/layout-wrapper";
import { HistoryTracker } from "@/components/ui/history-tracker";

export const metadata: Metadata = {
  title: "AWI Capital",
  description: "App oficial da AWI Capital",
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
      <body className="min-h-[100dvh] bg-background text-foreground antialiased">
        <HistoryTracker />
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
