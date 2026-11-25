"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { criarTokenPrimeiroAcesso } from "@/services/tokenService";
import { sendEmail } from "@/lib/email";
import { normalizeEmailInput } from "@/lib/auth/roles";
import { getClientIpFromHeaders, rateLimit } from "@/lib/rateLimit";

const resetRequestSchema = z
  .string()
  .trim()
  .email("Informe um e-mail válido.")
  .max(255, "E-mail muito longo.");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function requestPasswordResetAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const headerStore = await headers();
  const clientIp = getClientIpFromHeaders(headerStore);
  const limiter = rateLimit(`pwd-reset:${clientIp}`, 15 * 60 * 1000, 10);

  if (!limiter.success) {
    return {
      success: false,
      error: "Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.",
    };
  }

  const parsed = resetRequestSchema.safeParse(email);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Informe um e-mail válido.",
    };
  }

  const normalizedEmail = normalizeEmailInput(parsed.data);

  const existingUser = await db.query.user.findFirst({
    where: sql`lower(trim(${user.email})) = ${normalizedEmail}`,
    columns: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Neutral response: never disclose whether the account exists
  if (!existingUser || !existingUser.email) {
    return { success: true };
  }

  const token = await criarTokenPrimeiroAcesso(existingUser.id);

  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const safeName = escapeHtml(existingUser.name || "Docente");

  try {
    await sendEmail({
      to: existingUser.email,
      subject: "Redefinição de Senha - SIPPE",
      html: `
        <h1>Olá, ${safeName}!</h1>
        <p>Você solicitou a redefinição de sua senha ou este é o seu primeiro acesso ao sistema SIPPE.</p>
        <p>Para definir sua senha, clique no link abaixo (válido por 30 minutos):</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
        <br/>
        <p>Atenciosamente,<br/>Equipe SIPPE</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Password reset email error:", error);
    return {
      success: false,
      error: "Não foi possível enviar o e-mail no momento. Tente novamente em instantes.",
    };
  }
}
