import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to redirect '/' to '/maintenance' after login, unless maintenance is completed
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to the root route
  if (pathname === '/') {
    // Check for a cookie indicating maintenance is completed
    const maintenanceDone = request.cookies.get('maintenanceDone')?.value;
    if (!maintenanceDone) {
      // Redirect to /maintenance if not completed
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  }

  // Allow all other requests
  return NextResponse.next();
}

// Specify the matcher to only run on the root route
export const config = {
  matcher: [
    '/',
  ],
}; 