import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable} 
          bg-slate-100 text-gray-900 
          dark:bg-gray-900 dark:text-gray-100 
          antialiased min-h-screen
        `}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
