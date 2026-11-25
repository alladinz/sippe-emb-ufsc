import type { NextResponse } from 'next/server';

export function getRefreshTokenCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string
) {
  response.cookies.set(
    'refreshToken',
    refreshToken,
    getRefreshTokenCookieOptions(7 * 24 * 60 * 60)
  );
}

export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set(
    'refreshToken',
    '',
    getRefreshTokenCookieOptions(0)
  );
}
