import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenants";

// Caminhos que não precisam de autenticação
const PUBLIC_PATHS = ["/", "/api/auth", "/tv"];

export function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  const tenant = resolveTenantFromHost(host);

  // Injeta o tenant na requisição para server components e rotas API
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant.slug);

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = request.cookies.get("token")?.value;
  // Verifica se existe um token (JWT)
  if (!token) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
