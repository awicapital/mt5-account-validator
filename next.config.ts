// next.config.ts
import { join } from "path";
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 1) Opções do PWA
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd, // desabilita PWA no dev
};

// 2) Next config (sem swcMinify)
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Descomente TEMPORARIAMENTE se precisar passar o build enquanto corrige lints:
  // eslint: { ignoreDuringBuilds: true },

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
