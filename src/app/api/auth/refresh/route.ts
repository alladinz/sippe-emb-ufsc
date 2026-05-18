import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { user as userTable, refreshTokens, member } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verificarRefreshToken, gerarAccessToken } from '@/services/jwtService';

import { withErrorHandler } from '@/lib/errorHandler';

interface RefreshTokenPayload {
  id: string;
  type: string;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const payload = verificarRefreshToken(refreshToken) as unknown as RefreshTokenPayload;

  // Check token exists and is not revoked in DB
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const stored = await db.select()
    .from(refreshTokens)
    .where(and(
      eq(refreshTokens.tokenHash, tokenHash),
      eq(refreshTokens.usuarioId, payload.id)
    ))
    .limit(1);

  const storedToken = stored[0];

  if (!storedToken || storedToken.revogado || (storedToken.expiry && new Date() > new Date(storedToken.expiry))) {
    return NextResponse.json({ 
      error: 'Token inválido ou revogado' 
    }, { status: 401 });
  }

  // Get current user data
  const userResult = await db.select()
    .from(userTable)
    .where(eq(userTable.id, payload.id))
    .limit(1);

  const user = userResult[0];

  if (!user || user.status !== 'active') {
    return NextResponse.json({ 
      error: 'Usuário inativo ou não encontrado' 
    }, { status: 401 });
  }

  // Get user role
  const memberResult = await db.select()
    .from(member)
    .where(eq(member.userId, user.id))
    .limit(1);
  
  const papel = memberResult[0]?.role || 'professor';

  // Issue new access token
  const novoAccessToken = gerarAccessToken({
    id: user.id,
    papel: papel,
    email: user.email!
  });

  return NextResponse.json({ accessToken: novoAccessToken });
});
