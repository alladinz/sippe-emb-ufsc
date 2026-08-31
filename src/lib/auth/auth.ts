import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { verificarAccessToken, verificarRefreshToken } from "../../services/jwtService";
import crypto from 'crypto';

interface JWTPayload {
  id: string;
}

export const auth = {
  api: {
    getSession: async () => {
      const allHeaders = await headers();
      const authHeader = allHeaders.get("authorization");
      const token = authHeader?.split(" ")[1];

      // If no auth header, check cookies (might be needed for server components)
      if (!token) {
        // In our manual flow, accessToken is memory-only on client.
        // On server, we only have the refreshToken in cookie.
        // We can try to "auto-login" with the refresh token if needed,
        // or just return null and let the client handle refresh.
        // HOWEVER, Next.js Server Components need a session.
        // Let's check for refreshToken and "simulate" a session.
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (refreshToken) {
          try {
            const payload = verificarRefreshToken(refreshToken) as unknown as JWTPayload;
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            
            const stored = await db.select().from(schema.refreshTokens)
              .where(and(eq(schema.refreshTokens.tokenHash, tokenHash), eq(schema.refreshTokens.usuarioId, payload.id)))
              .limit(1);

            if (stored.length > 0 && !stored[0].revogado && (!stored[0].expiry || new Date() < new Date(stored[0].expiry))) {
              const user = await db.query.user.findFirst({
                where: eq(schema.user.id, payload.id)
              });
              if (user && user.status === 'active') {
                const userMemberships = await db.query.member.findMany({
                    where: eq(schema.member.userId, user.id),
                    with: { organization: true }
                });
                const userRoles = userMemberships.map(m => m.organization?.name === 'Chefia' && m.role === 'professor' ? 'chefe' : m.role);
                const displayUserRole = userRoles.includes("chefe") ? "chefe" : 
                                   userRoles.includes("coordenador") ? "coordenador" : 
                                   userRoles.includes("secretario") ? "secretario" : 
                                   userRoles.includes("comissao") ? "comissao" : "professor";

                return { user: { ...user, papel: displayUserRole } };
              }
            }
          } catch {
            return null;
          }
        }
        return null;
      }

      try {
        const payload = verificarAccessToken(token) as unknown as JWTPayload;
        const user = await db.query.user.findFirst({
          where: eq(schema.user.id, payload.id)
        });
        if (!user || user.status !== 'active') return null;

        const memberships = await db.query.member.findMany({
            where: eq(schema.member.userId, user.id),
            with: { organization: true }
        });
        const roles = memberships.map(m => m.organization?.name === 'Chefia' && m.role === 'professor' ? 'chefe' : m.role);
        const displayRole = roles.includes("chefe") ? "chefe" : 
                           roles.includes("coordenador") ? "coordenador" : 
                           roles.includes("secretario") ? "secretario" : 
                           roles.includes("comissao") ? "comissao" : "professor";

        return { user: { ...user, papel: displayRole } };
      } catch {
        return null;
      }
    },
    getActiveMember: async () => {
        const session = await auth.api.getSession();
        if (!session) return null;
        return await db.query.member.findFirst({
            where: eq(schema.member.userId, session.user.id),
            with: { organization: true }
        });
    },
    listOrganizations: async () => {
        const session = await auth.api.getSession();
        if (!session) return [];
        return await db.query.member.findMany({
            where: eq(schema.member.userId, session.user.id),
            with: { organization: true }
        });
    }
  }
};
