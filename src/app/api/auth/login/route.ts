import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '@/db';
import { user as userTable, refreshTokens, member } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { gerarAccessToken, gerarRefreshToken } from '@/services/jwtService';
import { z } from 'zod';
import { validarBody } from '@/middleware/validarBody';
import { logger } from '@/utils/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  senha: z.string().min(1, 'Senha é obrigatória').max(128)
});

import { withErrorHandler } from '@/lib/errorHandler';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const rateLimitResponse = rateLimitMiddleware(req, 15 * 60 * 1000, 10, 'Muitas tentativas de login. Aguarde 15 minutos.');
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await validarBody(req, loginSchema);
  if (!validation.success) return validation.response;
  const { email, senha } = validation.data;

  const result = await db.select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  const user = result[0];

  if (!user) {
    logger.warn('Login falhou: usuário não encontrado', { 
      email, ip: req.headers.get('x-forwarded-for') || 'unknown'
    });
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 }
    );
  }

  // Check for account lockout first
  const lockout = user.bloqueadoAte ? new Date(user.bloqueadoAte) : null;
  if (lockout && lockout > new Date()) {
    logger.warn('Tentativa de login em conta bloqueada', {
      email, ip: req.headers.get('x-forwarded-for') || 'unknown'
    });
    const minutosRestantes = Math.ceil((lockout.getTime() - new Date().getTime()) / 60000);
    return NextResponse.json({
      error: `Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} minuto(s).`
    }, { status: 429 });
  }

  // Check pending_email status
  if (user.status === 'pending_email') {
    return NextResponse.json({
      error: 'Seu acesso ainda não foi ativado. Verifique seu e-mail para definir sua senha.'
    }, { status: 403 });
  }

  // Verify password
  if (!user.senhaHash) {
      return NextResponse.json({ error: 'Senha não definida. Verifique seu e-mail.' }, { status: 401 });
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senhaHash);

  if (!senhaCorreta) {
    // Increment failed attempts
    const tentativas = (user.tentativasLogin || 0) + 1;
    const bloquear = tentativas >= 5;

    await db.update(userTable)
      .set({
        tentativasLogin: tentativas,
        bloqueadoAte: bloquear ? new Date(Date.now() + 15 * 60 * 1000) : null // 15min block
      })
      .where(eq(userTable.id, user.id));

    if (bloquear) {
      logger.warn('Conta bloqueada por tentativas excessivas', { 
        email, ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
    } else {
      logger.warn('Senha incorreta', { 
        email, ip: req.headers.get('x-forwarded-for') || 'unknown', tentativa: tentativas 
      });
    }

    return NextResponse.json({
      error: bloquear
        ? 'Muitas tentativas incorretas. Conta bloqueada por 15 minutos.'
        : `Senha incorreta. ${5 - tentativas} tentativa(s) restante(s).`
    }, { status: 401 });
  }

  // Successful login: reset attempt counter
  await db.update(userTable)
    .set({
      tentativasLogin: 0,
      bloqueadoAte: null,
      ultimoLogin: new Date()
    })
    .where(eq(userTable.id, user.id));

  // Get user role
  const memberResult = await db.select()
    .from(member)
    .where(eq(member.userId, user.id))
    .limit(1);
  
  const papel = memberResult[0]?.role || 'professor';

  logger.info('Login bem-sucedido', { 
    usuarioId: user.id, papel: papel, ip: req.headers.get('x-forwarded-for') || 'unknown'
  });

  // Issue tokens
  const accessToken = gerarAccessToken({
    id: user.id,
    papel: papel,
    email: user.email!
  });

  const refreshToken = gerarRefreshToken(user.id);

  // Store refresh token in DB
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db.insert(refreshTokens).values({
    usuarioId: user.id,
    tokenHash: tokenHash,
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown' || null,
    userAgent: req.headers.get('user-agent') || null
  });

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      nome: user.name,
      email: user.email,
      papel: papel
    }
  });

  // Set Refresh Token as httpOnly cookie
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  });

  return response;
});
