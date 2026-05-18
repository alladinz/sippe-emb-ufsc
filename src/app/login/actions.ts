"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { criarTokenPrimeiroAcesso } from "@/services/tokenService";
import { sendEmail } from "@/lib/email";

export async function requestPasswordResetAction(email: string) {
    // 1. Check if user exists in our DB
    const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email)
    });

    if (!existingUser) {
        // For security, don't reveal if user exists, but here we keep existing behavior
        throw new Error("Este e-mail não está cadastrado no sistema.");
    }

    // 2. Generate custom secure token
    const token = await criarTokenPrimeiroAcesso(existingUser.id);
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // 3. Send manual email
    try {
        await sendEmail({
            to: existingUser.email!,
            subject: "Redefinição de Senha - SIPPE",
            html: `
              <h1>Olá, ${existingUser.name}!</h1>
              <p>Você solicitou a redefinição de sua senha ou este é o seu primeiro acesso ao sistema SIPPE.</p>
              <p>Para definir sua senha, clique no link abaixo (válido por 30 minutos):</p>
              <a href="${resetLink}">Redefinir Senha</a>
              <p>Se você não solicitou isso, ignore este e-mail.</p>
              <br/>
              <p>Atenciosamente,<br/>Equipe SIPPE</p>
            `,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Password reset email error:", error);
        throw new Error("Erro ao enviar e-mail. Tente novamente.");
    }
}
