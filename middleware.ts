import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Check if accessing /casetool routes (including subdomain)
  const isCasetoolRoute = pathname.startsWith('/casetool') || hostname.startsWith('casetool.');
  
  // Allow auth API and login page without authentication
  if (pathname === '/casetool/api/auth' || pathname === '/casetool/login') {
    if (hostname.startsWith('casetool.') && !pathname.startsWith('/casetool')) {
      const url = request.nextUrl.clone();
      url.pathname = `/casetool${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  
  // Check authentication for casetool routes
  if (isCasetoolRoute) {
    const authCookie = request.cookies.get('casetool_auth');
    
    if (!authCookie || authCookie.value !== 'authenticated') {
      const url = request.nextUrl.clone();
      url.pathname = '/casetool/login';
      return NextResponse.redirect(url);
    }
  }
  
  // Handle subdomain routing
  if (hostname.startsWith('casetool.')) {
    const url = request.nextUrl.clone();
    
    if (url.pathname.startsWith('/casetool')) {
      return NextResponse.next();
    }
    
    if (url.pathname === '/') {
      url.pathname = '/casetool';
    } else {
      url.pathname = `/casetool${url.pathname}`;
    }
    
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|output).*)',
  ],
};
