import { NextRequest, NextResponse } from 'next/server';

// Caminhos que não precisam de autenticação
const PUBLIC_PATHS = ['/', '/api/auth', '/tv'];
const HIDDEN_FEATURE_PREFIXES = ['/emails', '/status'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (HIDDEN_FEATURE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  // Verifica se existe um token (JWT)
  if (!token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
