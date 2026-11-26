import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { criarTokenPrimeiroAcesso } from '@/services/tokenService';
import { requireRoleSession } from '@/lib/auth/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { withErrorHandler } from '@/lib/errorHandler';
import { validarBody } from '@/middleware/validarBody';
import { sendEmail } from '@/lib/email';

const reenviarSchema = z.object({
  usuarioId: z.string().trim().min(1, 'ID de usuário inválido').max(128),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const rateLimitResponse = rateLimitMiddleware(
    req,
    15 * 60 * 1000,
    10,
    'Muitas tentativas. Aguarde 15 minutos.'
  );
  if (rateLimitResponse) return rateLimitResponse;

  const authCheck = await requireRoleSession(['chefe', 'coordenador']);
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.error === 'Unauthorized' ? 'Não autenticado' : 'Permissão negada' },
      { status: authCheck.status }
    );
  }

  const validation = await validarBody(req, reenviarSchema);
  if (!validation.success) return validation.response;
  const { usuarioId } = validation.data;

  const result = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
    })
    .from(userTable)
    .where(eq(userTable.id, usuarioId))
    .limit(1);

  const targetUser = result[0];

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  if (!targetUser.email) {
    return NextResponse.json(
      { error: 'Este usuário ainda não possui e-mail cadastrado' },
      { status: 400 }
    );
  }

  const token = await criarTokenPrimeiroAcesso(usuarioId);
  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: targetUser.email,
    subject: 'Ativação de Acesso - SIPPE',
    html: `
      <h1>Olá, ${targetUser.name}!</h1>
      <p>Um link de primeiro acesso/redefinição de senha foi gerado para sua conta no sistema SIPPE.</p>
      <p>Para definir sua senha, clique no link abaixo (válido por 30 minutos):</p>
      <a href="${resetLink}">Definir Senha de Acesso</a>
      <br/><br/>
      <p>Atenciosamente,<br/>Equipe SIPPE</p>
    `,
  });

  return NextResponse.json({
    message: 'Link de ativação enviado por e-mail com sucesso.',
  });
});
