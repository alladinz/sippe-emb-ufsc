import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { refreshTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { withErrorHandler } from '@/lib/errorHandler';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256')
      .update(refreshToken).digest('hex');
    
    await db.update(refreshTokens)
      .set({ revogado: true })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  const response = NextResponse.json({ message: 'Logout realizado' });
  
  // Clear the refresh token cookie
  response.cookies.delete('refreshToken');
  
  return response;
});
