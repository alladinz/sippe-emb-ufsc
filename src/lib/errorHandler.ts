import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

export function withErrorHandler(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (err: any) {
      logger.error('Erro não tratado na API', {
        message: err.message,
        stack: err.stack,
        path: req.nextUrl.pathname,
        method: req.method,
        ip: req.ip || req.headers.get('x-forwarded-for')
      });

      return NextResponse.json({
        error: process.env.NODE_ENV === 'production'
          ? 'Erro interno do servidor'
          : err.message
      }, { status: 500 });
    }
  };
}
