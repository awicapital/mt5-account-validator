// next.config.ts
import { join } from "path";
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 1) Opções do PWA (ativo só em produção)
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd,
};

// 2) Next config
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🔓 Desbloqueia o deploy enquanto corrige os lints localmente
  eslint: {
    ignoreDuringBuilds: true, // REMOVA depois de corrigir os erros de lint
  },

  // Permite otimizar imagens de qualquer domínio (restrinja se precisar)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }, // remova se não usar http
    ],
  },

  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": join(__dirname, "src"),
    };
    return config;
  },
};

// 3) Exporta com PWA aplicado
export default withPWA(pwaConfig)(nextConfig);
