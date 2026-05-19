import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { withErrorHandler } from '@/lib/errorHandler';

export const GET = withErrorHandler(async () => {
  const session = await auth.api.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
});
