import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { combinedSecurityMiddleware } from './middleware/security';

export function middleware(request: NextRequest) {
  return combinedSecurityMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
