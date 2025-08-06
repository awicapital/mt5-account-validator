// next.config.ts
import { join } from "path";
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 1) Defina apenas as opções do PWA aqui:
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isProd,
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 2) Exemplo de alias de import
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": join(__dirname, "src"),
    };
    return config;
  },
};

// 3) Envolva o nextConfig com as opções do PWA
export default withPWA(pwaConfig)(nextConfig);
