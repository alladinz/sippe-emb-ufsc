import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { user as userTable, refreshTokens, member } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verificarRefreshToken, gerarAccessToken } from '@/services/jwtService';
import { withErrorHandler } from '@/lib/errorHandler';
import { SAFE_USER_COLUMNS, resolvePrimaryRole } from '@/lib/auth/roles';
import { clearRefreshTokenCookie } from '@/lib/auth/cookies';

interface RefreshTokenPayload {
  id: string;
  type: string;
}

function unauthorizedWithClearedCookie(message: string) {
  const res = NextResponse.json({ error: message }, { status: 401 });
  clearRefreshTokenCookie(res);
  return res;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let payload: RefreshTokenPayload;
  try {
    payload = verificarRefreshToken(refreshToken) as unknown as RefreshTokenPayload;
  } catch {
    return unauthorizedWithClearedCookie('Sessão expirada ou token inválido');
  }

  if (!payload?.id || payload.type !== 'refresh') {
    return unauthorizedWithClearedCookie('Token inválido');
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const stored = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.usuarioId, payload.id)
      )
    )
    .limit(1);

  const storedToken = stored[0];

  if (
    !storedToken ||
    storedToken.revogado ||
    (storedToken.expiry && new Date() > new Date(storedToken.expiry))
  ) {
    return unauthorizedWithClearedCookie('Token inválido ou revogado');
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.id, payload.id),
    columns: SAFE_USER_COLUMNS,
  });

  if (!user || user.status !== 'active') {
    return unauthorizedWithClearedCookie('Usuário inativo ou não encontrado');
  }

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, user.id),
    with: { organization: true },
  });
  const papel = resolvePrimaryRole(memberships);

  const novoAccessToken = gerarAccessToken({
    id: user.id,
    papel,
    email: user.email!,
  });

  return NextResponse.json({ accessToken: novoAccessToken });
});
