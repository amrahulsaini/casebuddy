import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Check if it's the casetool subdomain
  if (hostname.startsWith('casetool.')) {
    // Rewrite to /casetool path
    const url = request.nextUrl.clone();
    
    // If already on /casetool path, continue
    if (url.pathname.startsWith('/casetool')) {
      return NextResponse.next();
    }
    
    // Rewrite root and other paths to /casetool
    if (url.pathname === '/') {
      url.pathname = '/casetool';
    } else {
      url.pathname = `/casetool${url.pathname}`;
    }
    
    return NextResponse.rewrite(url);
  }
  
  // For main domain, continue as normal
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
