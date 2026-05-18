import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user as userTable, member } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { criarTokenPrimeiroAcesso } from '@/services/tokenService';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { rateLimitMiddleware } from '@/lib/rateLimit';

import { withErrorHandler } from '@/lib/errorHandler';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const rateLimitResponse = rateLimitMiddleware(req, 15 * 60 * 1000, 10, 'Muitas tentativas. Aguarde 15 minutos.');
  if (rateLimitResponse) return rateLimitResponse;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Role check: 'chefe' or 'coordenador'
  // Better-auth organization plugin might store roles in 'member' table
  const userRole = await db.select()
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  const rolesAllowed = ['chefe', 'coordenador'];
  const hasPermission = userRole.length > 0 && rolesAllowed.includes(userRole[0].role);

  if (!hasPermission) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  const { usuarioId } = await req.json();

  const result = await db.select()
    .from(userTable)
    .where(eq(userTable.id, usuarioId))
    .limit(1);

  const user = result[0];

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  if (!user.email) {
    return NextResponse.json(
      { error: 'Este usuário ainda não possui e-mail cadastrado' },
      { status: 400 }
    );
  }

  const token = await criarTokenPrimeiroAcesso(usuarioId);
  
  // In a real scenario, integrate with email service:
  // await emailService.enviarLinkAtivacao(user.email, user.name, token);

  return NextResponse.json({ 
    message: 'Link de ativação reenviado',
    // In development, return token for testing:
    ...(process.env.NODE_ENV === 'development' && { token })
  });
});
