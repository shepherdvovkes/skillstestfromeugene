import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { combinedSecurityMiddleware } from './middleware/security';

// Main middleware function for Next.js
export function middleware(request: NextRequest) {
  // Apply comprehensive security checks
  return combinedSecurityMiddleware(request);
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
