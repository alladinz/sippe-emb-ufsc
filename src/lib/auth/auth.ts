import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import {
  verificarAccessToken,
  verificarRefreshToken,
} from "../../services/jwtService";
import crypto from "crypto";
import {
  SAFE_USER_COLUMNS,
  resolvePrimaryRole,
  hasAnyRole,
  type MembershipWithOrg,
} from "./roles";

interface JWTPayload {
  id: string;
}

async function buildSafeSession(userId: string) {
  const safeUser = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    columns: SAFE_USER_COLUMNS,
  });

  if (!safeUser || safeUser.status !== "active") {
    return null;
  }

  const memberships = await db.query.member.findMany({
    where: eq(schema.member.userId, safeUser.id),
    with: { organization: true },
  });

  const papel = resolvePrimaryRole(memberships);

  return {
    user: { ...safeUser, papel },
    memberships,
  };
}

export const auth = {
  api: {
    getSession: async () => {
      const allHeaders = await headers();
      const authHeader = allHeaders.get("authorization");
      const token = authHeader?.split(" ")[1];

      if (!token) {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (!refreshToken) return null;

        try {
          const payload = verificarRefreshToken(
            refreshToken
          ) as unknown as JWTPayload;
          const tokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

          const stored = await db
            .select()
            .from(schema.refreshTokens)
            .where(
              and(
                eq(schema.refreshTokens.tokenHash, tokenHash),
                eq(schema.refreshTokens.usuarioId, payload.id)
              )
            )
            .limit(1);

          if (
            stored.length > 0 &&
            !stored[0].revogado &&
            (!stored[0].expiry || new Date() < new Date(stored[0].expiry))
          ) {
            return await buildSafeSession(payload.id);
          }
        } catch {
          return null;
        }
        return null;
      }

      try {
        const payload = verificarAccessToken(token) as unknown as JWTPayload;
        return await buildSafeSession(payload.id);
      } catch {
        return null;
      }
    },

    getActiveMember: async () => {
      const session = await auth.api.getSession();
      if (!session) return null;
      if (Array.isArray(session.memberships) && session.memberships.length > 0) {
        return session.memberships[0];
      }
      return await db.query.member.findFirst({
        where: eq(schema.member.userId, session.user.id),
        with: { organization: true },
      });
    },

    listOrganizations: async () => {
      const session = await auth.api.getSession();
      if (!session) return [];
      if (Array.isArray(session.memberships)) {
        return session.memberships;
      }
      return await db.query.member.findMany({
        where: eq(schema.member.userId, session.user.id),
        with: { organization: true },
      });
    },
  },
};

export async function requireRoleSession(allowedRoles: readonly string[]) {
  const session = await auth.api.getSession();
  if (!session) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const memberships: MembershipWithOrg[] = Array.isArray(session.memberships)
    ? session.memberships
    : await db.query.member.findMany({
        where: eq(schema.member.userId, session.user.id),
        with: { organization: true },
      });

  if (!hasAnyRole(memberships, allowedRoles)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, session, memberships };
}
