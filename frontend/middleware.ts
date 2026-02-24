import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hasToken = req.cookies.get('accessToken');
  if (req.nextUrl.pathname.startsWith('/app') && !hasToken) return NextResponse.redirect(new URL('/auth/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
