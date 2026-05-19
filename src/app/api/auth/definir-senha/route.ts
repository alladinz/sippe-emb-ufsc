import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validarToken } from '@/services/tokenService';
import { z } from 'zod';
import { validarBody } from '@/middleware/validarBody';
import { logger } from '@/utils/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const definirSenhaSchema = z.object({
  token: z.string().length(64, 'Token inválido'),
  novaSenha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Máximo 128 caracteres')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Deve conter maiúsculas, minúsculas e números')
});

import { withErrorHandler } from '@/lib/errorHandler';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const rateLimitResponse = rateLimitMiddleware(req, 15 * 60 * 1000, 10, 'Muitas tentativas. Aguarde 15 minutos.');
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await validarBody(req, definirSenhaSchema);
  if (!validation.success) return validation.response;
  const { token, novaSenha } = validation.data;

  const { valido, usuarioId, motivo } = await validarToken(token);

  if (!valido || !usuarioId) {
    logger.warn('Tentativa com token inválido', { 
      ip: req.ip || req.headers.get('x-forwarded-for'), token: token.substring(0, 10) + '...', motivo 
    });
    return NextResponse.json({ error: motivo }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 12);
  // bcrypt cost factor 12 — strong but not slow for login

  await db.update(user)
    .set({
      senhaHash: senhaHash,
      status: 'active',
      resetTokenUsado: true,
      resetToken: null,
      resetTokenExpiry: null
    })
    .where(eq(user.id, usuarioId));

  return NextResponse.json({ 
    message: 'Senha definida com sucesso. Você já pode fazer login.' 
  });
});
