// src/middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig as any);

const protectedRoutes = ['/dashboard', '/expenses', '/tasks', '/reports', '/portfolio', '/settings', '/calendar', '/team', '/mentor', '/admin'];
const authRoutes = ['/login', '/register'];

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtected = protectedRoutes.some(r => nextUrl.pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => nextUrl.pathname.startsWith(r));

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
