import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  const url = request.nextUrl.clone();

  // Exemplo: redirecionar "/dashboard" para "/dashboard-m" se for mobile
  if (url.pathname === "/dashboard" && isMobile) {
    url.pathname = "/dashboard-m";
    return NextResponse.redirect(url);
  }

  // Você pode replicar esse comportamento para outras páginas raiz
  if (url.pathname === "/accounts" && isMobile) {
    url.pathname = "/accounts-m";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Define quais rotas devem ser interceptadas
export const config = {
  matcher: ["/dashboard", "/accounts"], // adicione outras rotas raiz aqui
};
