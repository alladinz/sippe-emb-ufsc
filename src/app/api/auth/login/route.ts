import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '@/db';
import { user as userTable, refreshTokens, member } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { gerarAccessToken, gerarRefreshToken } from '@/services/jwtService';
import { z } from 'zod';
import { validarBody } from '@/middleware/validarBody';
import { logger } from '@/utils/logger';
import { rateLimitMiddleware, getClientIpFromHeaders } from '@/lib/rateLimit';
import { withErrorHandler } from '@/lib/errorHandler';
import { normalizeEmailInput, resolvePrimaryRole } from '@/lib/auth/roles';
import { setRefreshTokenCookie } from '@/lib/auth/cookies';

const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido').max(255),
  senha: z.string().min(1, 'Senha é obrigatória').max(128),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const rateLimitResponse = rateLimitMiddleware(
    req,
    15 * 60 * 1000,
    10,
    'Muitas tentativas de login. Aguarde 15 minutos.'
  );
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await validarBody(req, loginSchema);
  if (!validation.success) return validation.response;

  const normalizedEmail = normalizeEmailInput(validation.data.email);
  const { senha } = validation.data;
  const clientIp = getClientIpFromHeaders(req.headers);

  const result = await db
    .select()
    .from(userTable)
    .where(sql`lower(trim(${userTable.email})) = ${normalizedEmail}`)
    .limit(1);

  const user = result[0];

  if (!user) {
    logger.warn('Login falhou: usuário não encontrado', {
      email: normalizedEmail,
      ip: clientIp,
    });
    return NextResponse.json(
      { error: 'E-mail ou senha incorretos.' },
      { status: 401 }
    );
  }

  // Check active lockout
  const now = new Date();
  const lockout = user.bloqueadoAte ? new Date(user.bloqueadoAte) : null;
  if (lockout && lockout > now) {
    logger.warn('Tentativa de login em conta bloqueada', {
      email: normalizedEmail,
      ip: clientIp,
    });
    const minutosRestantes = Math.ceil((lockout.getTime() - now.getTime()) / 60000);
    return NextResponse.json(
      {
        error: `Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} minuto(s).`,
      },
      { status: 429 }
    );
  }

  if (user.status === 'pending_email') {
    return NextResponse.json(
      {
        error:
          'Seu acesso ainda não foi ativado. Solicite ao departamento o cadastro do e-mail ou utilize "Primeiro acesso ou esqueceu a senha?".',
      },
      { status: 403 }
    );
  }

  if (!user.senhaHash) {
    return NextResponse.json(
      {
        error:
          'Senha ainda não cadastrada. Clique em "Primeiro acesso ou esqueceu a senha?" abaixo para definir sua senha.',
      },
      { status: 401 }
    );
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senhaHash);

  if (!senhaCorreta) {
    // Reset expired lockout counter so a user waits once and gets a fresh window
    const lockoutExpired = Boolean(lockout && lockout <= now);
    const previousAttempts = lockoutExpired ? 0 : user.tentativasLogin || 0;
    const tentativas = previousAttempts + 1;
    const bloquear = tentativas >= MAX_LOGIN_ATTEMPTS;

    await db
      .update(userTable)
      .set({
        tentativasLogin: tentativas,
        bloqueadoAte: bloquear ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(userTable.id, user.id));

    if (bloquear) {
      logger.warn('Conta bloqueada por tentativas excessivas', {
        email: normalizedEmail,
        ip: clientIp,
      });
    } else {
      logger.warn('Senha incorreta', {
        email: normalizedEmail,
        ip: clientIp,
        tentativa: tentativas,
      });
    }

    return NextResponse.json(
      {
        error: bloquear
          ? 'Muitas tentativas incorretas. Conta bloqueada por 15 minutos.'
          : `E-mail ou senha incorretos. ${MAX_LOGIN_ATTEMPTS - tentativas} tentativa(s) restante(s).`,
      },
      { status: 401 }
    );
  }

  // Successful login: reset attempt counter
  await db
    .update(userTable)
    .set({
      tentativasLogin: 0,
      bloqueadoAte: null,
      ultimoLogin: new Date(),
    })
    .where(eq(userTable.id, user.id));

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, user.id),
    with: { organization: true },
  });
  const papel = resolvePrimaryRole(memberships);

  logger.info('Login bem-sucedido', {
    usuarioId: user.id,
    papel,
    ip: clientIp,
  });

  const accessToken = gerarAccessToken({
    id: user.id,
    papel,
    email: user.email!,
  });

  const refreshToken = gerarRefreshToken(user.id);
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await db.insert(refreshTokens).values({
    usuarioId: user.id,
    tokenHash,
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: clientIp,
    userAgent: req.headers.get('user-agent') || null,
  });

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      nome: user.name,
      email: user.email,
      papel,
    },
  });

  setRefreshTokenCookie(response, refreshToken);
  return response;
});
