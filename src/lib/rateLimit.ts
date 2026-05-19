import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(ip: string, windowMs: number, max: number) {
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > windowMs) {
    userData.count = 1;
    userData.lastReset = now;
  } else {
    userData.count++;
  }

  rateLimitMap.set(ip, userData);

  return {
    success: userData.count <= max,
    remaining: Math.max(0, max - userData.count),
    reset: userData.lastReset + windowMs
  };
}

export function rateLimitMiddleware(req: NextRequest, windowMs: number, max: number, message: string) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limiter = rateLimit(ip, windowMs, max);

  if (!limiter.success) {
    return NextResponse.json({ error: message }, { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((limiter.reset - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(limiter.reset / 1000).toString()
      }
    });
  }
  return null;
}
