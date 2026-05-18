import crypto from 'crypto';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

export function gerarTokenSeguro(): string {
  return crypto.randomBytes(32).toString('hex');
  // 64-char hex string — cryptographically random
}

export async function criarTokenPrimeiroAcesso(
  usuarioId: string
): Promise<string> {
  const token = gerarTokenSeguro();
  const expiry = new Date(Date.now() + 30 * 60 * 1000);
  // 30 minutes from now

  await db.update(user)
    .set({
      resetToken: token,
      resetTokenExpiry: expiry,
      resetTokenUsado: false
    })
    .where(eq(user.id, usuarioId));

  return token;
}

export async function validarToken(token: string): Promise<{
  valido: boolean;
  usuarioId?: string;
  motivo?: string;
}> {
  const result = await db.select()
    .from(user)
    .where(eq(user.resetToken, token))
    .limit(1);

  if (result.length === 0) {
    return { valido: false, motivo: 'Token inválido' };
  }

  const u = result[0];

  if (u.resetTokenUsado) {
    return { valido: false, motivo: 'Token já utilizado' };
  }

  if (u.resetTokenExpiry && new Date() > new Date(u.resetTokenExpiry)) {
    return { valido: false, motivo: 'Token expirado' };
  }

  return { valido: true, usuarioId: u.id };
}

export async function invalidarToken(
  usuarioId: string
): Promise<void> {
  await db.update(user)
    .set({
      resetToken: null,
      resetTokenExpiry: null,
      resetTokenUsado: true
    })
    .where(eq(user.id, usuarioId));
}
