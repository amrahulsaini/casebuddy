import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Protect admin dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const adminToken = request.cookies.get('admin_token');
    
    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }
  
  // Check if accessing /casetool routes (including subdomain)
  const isCasetoolRoute = pathname.startsWith('/casetool') || hostname.startsWith('casetool.');
  
  // Allow auth, user API, login and email pages without checks
  if (
    pathname === '/casetool/api/auth' || 
    pathname === '/casetool/api/user' ||
    pathname === '/casetool/login' ||
    pathname === '/casetool/email'
  ) {
    if (hostname.startsWith('casetool.') && !pathname.startsWith('/casetool')) {
      const url = request.nextUrl.clone();
      url.pathname = `/casetool${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  
  // Allow /editor and /editor/api routes without rewriting
  if (pathname.startsWith('/editor')) {
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
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/casetool/:path*',
    '/editor/:path*',
  ],
};
