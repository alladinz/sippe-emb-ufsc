import { db } from "@/db";
import { notifications, user } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { sendEmail } from "./email";

export async function createNotification({
  userId,
  type,
  title,
  message,
  planId,
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  planId?: string;
}) {
  try {
    // 1. Auto-cleanup: remove notifications older than 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    await db.delete(notifications).where(lt(notifications.createdAt, oneMonthAgo));

    // 2. Create the notification in DB
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      planId,
    });

    // 3. Send email notification
    const targetUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { email: true, name: true }
    });

    if (targetUser?.email) {
        await sendEmail({
            to: targetUser.email,
            subject: `[Sippe] ${title}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                    <h2 style="color: #1e293b; margin-top: 0;">Olá, ${targetUser.name}</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                        Você recebeu uma nova notificação no sistema Sippe:
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        <strong style="display: block; color: #1e293b; margin-bottom: 5px;">${title}</strong>
                        <span style="color: #64748b;">${message || ''}</span>
                    </div>
                    <p style="margin-top: 30px;">
                        <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard" 
                           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Acessar o Painel
                        </a>
                    </p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        Este é um e-mail automático. Por favor, não responda.
                    </p>
                </div>
            `
        });
    }
  } catch (error) {
    console.error("Failed to process notification/email:", error);
  }
}
