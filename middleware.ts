import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // If accessing casetool subdomain at root, redirect to /casetool
  if (hostname.startsWith('casetool.') && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/casetool', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
