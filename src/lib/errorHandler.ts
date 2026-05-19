import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

type ApiHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse | Response>;

export function withErrorHandler(handler: ApiHandler) {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(req, ...args);
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Erro não tratado na API', {
        message: error.message,
        stack: error.stack,
        path: req.nextUrl.pathname,
        method: req.method,
        ip: req.ip || req.headers.get('x-forwarded-for')
      });

      return NextResponse.json({
        error: process.env.NODE_ENV === 'production'
          ? 'Erro interno do servidor'
          : error.message
      }, { status: 500 });
    }
  };
}
