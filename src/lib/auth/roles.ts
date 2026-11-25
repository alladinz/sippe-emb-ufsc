export const SAFE_USER_COLUMNS = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  ultimoLogin: true,
} as const;

export interface MembershipWithOrg {
  id?: string;
  userId?: string;
  organizationId: string;
  role: string;
  organization?: {
    id?: string;
    name?: string | null;
    slug?: string | null;
  } | null;
}

const ROLE_PRIORITY = [
  "chefe",
  "coordenador",
  "secretario",
  "comissao",
  "professor",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}

export function normalizeMembershipRole(membership: {
  role: string;
  organization?: { name?: string | null } | null;
}): string {
  if (
    membership.organization?.name === "Chefia" &&
    membership.role === "professor"
  ) {
    return "chefe";
  }
  return membership.role;
}

export function resolvePrimaryRole(
  memberships: Array<{
    role: string;
    organization?: { name?: string | null } | null;
  }>
): string {
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return "professor";
  }
  const normalized = memberships.map(normalizeMembershipRole);
  for (const role of ROLE_PRIORITY) {
    if (normalized.includes(role)) {
      return role;
    }
  }
  return normalized[0] || "professor";
}

export function hasAnyRole(
  memberships: Array<{
    role: string;
    organization?: { name?: string | null } | null;
  }>,
  allowedRoles: readonly string[]
): boolean {
  return memberships.some((m) =>
    allowedRoles.includes(normalizeMembershipRole(m))
  );
}

export function findCoordinatorMembership<T extends MembershipWithOrg>(
  memberships: T[],
  targetOrganizationId?: string
): T | undefined {
  const chefMembership = memberships.find(
    (m) => normalizeMembershipRole(m) === "chefe"
  );
  if (chefMembership) return chefMembership;

  if (targetOrganizationId) {
    const exactMatch = memberships.find(
      (m) =>
        m.organizationId === targetOrganizationId &&
        normalizeMembershipRole(m) === "coordenador"
    );
    if (exactMatch) return exactMatch;
  }

  return memberships.find((m) => normalizeMembershipRole(m) === "coordenador");
}

export function canViewStudyPlan(params: {
  plan: { userId: string; organizationId: string; status: string };
  userId: string;
  memberships: MembershipWithOrg[];
}): boolean {
  const { plan, userId, memberships } = params;

  if (plan.userId === userId) return true;
  if (hasAnyRole(memberships, ["chefe"])) return true;

  const isOrgCoordinator = memberships.some(
    (m) =>
      normalizeMembershipRole(m) === "coordenador" &&
      m.organizationId === plan.organizationId
  );
  if (isOrgCoordinator) return true;

  if (
    hasAnyRole(memberships, ["secretario"]) &&
    (plan.status === "approved" || plan.status === "archived")
  ) {
    return true;
  }

  return false;
}

export function canAccessProgramaView(
  memberships: Array<{
    role: string;
    organization?: { name?: string | null } | null;
  }>,
  status?: string | null
): boolean {
  if (hasAnyRole(memberships, ["chefe", "coordenador", "comissao"])) {
    return true;
  }
  if (
    hasAnyRole(memberships, ["secretario"]) &&
    (status === "approved" || status === "archived")
  ) {
    return true;
  }
  return false;
}

export function normalizeEmailInput(email: string): string {
  return email.trim().toLowerCase();
}
