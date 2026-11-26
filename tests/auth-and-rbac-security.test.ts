import { describe, it, expect, vi, afterEach } from "vitest";
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { NextRequest } from "next/server";
import api, {
  extractApiErrorMessage,
  shouldSkipAuthRefresh,
  setAccessToken,
  getAccessToken,
} from "@/lib/api";
import {
  SAFE_USER_COLUMNS,
  canViewStudyPlan,
  canAccessProgramaView,
  findCoordinatorMembership,
  hasAnyRole,
  isValidUuid,
  normalizeEmailInput,
  resolvePrimaryRole,
} from "@/lib/auth/roles";
import robots from "@/app/robots";
import { middleware } from "@/middleware";

describe("Auth Interceptor & Error Extraction", () => {
  const originalAdapter = api.defaults.adapter;

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it("should identify auth endpoints that must bypass 401 auto-refresh", () => {
    expect(shouldSkipAuthRefresh("/auth/login")).toBe(true);
    expect(shouldSkipAuthRefresh("/api/auth/login")).toBe(true);
    expect(shouldSkipAuthRefresh("/auth/refresh")).toBe(true);
    expect(shouldSkipAuthRefresh("/auth/definir-senha")).toBe(true);
    expect(shouldSkipAuthRefresh("/auth/me")).toBe(false);
    expect(shouldSkipAuthRefresh("/programas")).toBe(false);
  });

  it("should NOT trigger refresh or reload on 401 from /auth/login and preserve exact error message", async () => {
    const refreshSpy = vi.spyOn(axios, "post");

    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const response: AxiosResponse = {
        data: { error: "E-mail ou senha incorretos. 4 tentativa(s) restante(s)." },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      };
      throw new AxiosError(
        "Request failed with status code 401",
        "ERR_BAD_REQUEST",
        config,
        null,
        response
      );
    };

    let caught: unknown;
    try {
      await api.post("/auth/login", { email: "docente@ufsc.br", senha: "errada" });
    } catch (err) {
      caught = err;
    }

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(extractApiErrorMessage(caught)).toBe(
      "E-mail ou senha incorretos. 4 tentativa(s) restante(s)."
    );
  });

  it("should deduplicate concurrent 401 auto-refreshes and retry original requests", async () => {
    let callCount = 0;
    const refreshSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { accessToken: "fresh-access-token" },
    });

    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      callCount++;
      if (!config.headers?.Authorization) {
        const response: AxiosResponse = {
          data: { error: "Unauthorized" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        };
        throw new AxiosError(
          "Unauthorized",
          "ERR_BAD_REQUEST",
          config,
          null,
          response
        );
      }

      return {
        data: { ok: true, auth: config.headers.Authorization },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const [res1, res2] = await Promise.all([
      api.get("/auth/me"),
      api.get("/programas"),
    ]);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe("fresh-access-token");
    expect(callCount).toBe(4);
    expect(res1.data.auth).toBe("Bearer fresh-access-token");
    expect(res2.data.auth).toBe("Bearer fresh-access-token");
  });

  it("should extract error messages uniformly across string, object and Zod array payloads", () => {
    const stringErr = new AxiosError("fail", "ERR_BAD_REQUEST", undefined, null, {
      data: { error: "Token expirado" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });
    expect(extractApiErrorMessage(stringErr)).toBe("Token expirado");

    const zodErr = new AxiosError("fail", "ERR_BAD_REQUEST", undefined, null, {
      data: {
        error: "Dados inválidos",
        detalhes: [{ campo: "email", mensagem: "E-mail inválido" }],
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });
    expect(extractApiErrorMessage(zodErr)).toBe("E-mail inválido");

    const objErr = new AxiosError("fail", "ERR_BAD_REQUEST", undefined, null, {
      data: { error: { message: "Erro estruturado" } },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });
    expect(extractApiErrorMessage(objErr)).toBe("Erro estruturado");
  });
});

describe("RBAC, Multi-Membership, Safe Columns & Direct URL Guards", () => {
  it("should omit all sensitive security columns from SAFE_USER_COLUMNS", () => {
    const keys = Object.keys(SAFE_USER_COLUMNS);
    expect(keys).toContain("id");
    expect(keys).toContain("name");
    expect(keys).toContain("email");
    expect(keys).not.toContain("senhaHash");
    expect(keys).not.toContain("resetToken");
    expect(keys).not.toContain("resetTokenExpiry");
    expect(keys).not.toContain("resetTokenUsado");
    expect(keys).not.toContain("tentativasLogin");
    expect(keys).not.toContain("bloqueadoAte");
  });

  it("should resolve primary role and coordinator membership across multi-org users", () => {
    const memberships = [
      { organizationId: "org-a", role: "professor", organization: { name: "Aeroespacial" } },
      { organizationId: "org-b", role: "coordenador", organization: { name: "Automotiva" } },
    ];

    expect(resolvePrimaryRole(memberships)).toBe("coordenador");
    expect(hasAnyRole(memberships, ["coordenador"])).toBe(true);
    expect(findCoordinatorMembership(memberships, "org-b")?.organizationId).toBe("org-b");

    const chefiaProfessor = [
      { organizationId: "org-chef", role: "professor", organization: { name: "Chefia" } },
    ];
    expect(resolvePrimaryRole(chefiaProfessor)).toBe("chefe");
  });

  it("should enforce strict authorization on direct Study Plan preview URLs (IDOR guard)", () => {
    const plan = { userId: "prof-1", organizationId: "org-auto", status: "draft" };

    expect(
      canViewStudyPlan({
        plan,
        userId: "prof-1",
        memberships: [{ organizationId: "org-auto", role: "professor" }],
      })
    ).toBe(true);

    // Other professor editing URL directly must be denied
    expect(
      canViewStudyPlan({
        plan,
        userId: "prof-2",
        memberships: [{ organizationId: "org-auto", role: "professor" }],
      })
    ).toBe(false);

    // Coordinator from ANOTHER course must be denied
    expect(
      canViewStudyPlan({
        plan,
        userId: "coord-other",
        memberships: [{ organizationId: "org-naval", role: "coordenador" }],
      })
    ).toBe(false);

    // Coordinator from the SAME org can inspect even with multiple memberships
    expect(
      canViewStudyPlan({
        plan: { ...plan, status: "submitted" },
        userId: "coord-multi",
        memberships: [
          { organizationId: "org-naval", role: "professor" },
          { organizationId: "org-auto", role: "coordenador" },
        ],
      })
    ).toBe(true);

    // Secretary can only view approved or archived plans
    const secMemberships = [{ organizationId: "org-depto", role: "secretario" }];
    expect(canViewStudyPlan({ plan, userId: "sec-1", memberships: secMemberships })).toBe(false);
    expect(
      canViewStudyPlan({
        plan: { ...plan, status: "approved" },
        userId: "sec-1",
        memberships: secMemberships,
      })
    ).toBe(true);
  });

  it("should deny professors from viewing Programas de Ensino and restrict secretary to approved/archived", () => {
    const prof = [{ organizationId: "org-1", role: "professor" }];
    expect(canAccessProgramaView(prof, "draft")).toBe(false);
    expect(canAccessProgramaView(prof, "approved")).toBe(false);
    expect(canAccessProgramaView(prof, "archived")).toBe(false);

    const sec = [{ organizationId: "org-d", role: "secretario" }];
    expect(canAccessProgramaView(sec, "draft")).toBe(false);
    expect(canAccessProgramaView(sec, "archived")).toBe(true);

    const comissao = [{ organizationId: "org-1", role: "comissao" }];
    expect(canAccessProgramaView(comissao, "draft")).toBe(true);
  });

  it("should validate UUIDs and normalize email input safely", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(normalizeEmailInput("  Docente.Teste@UFSC.BR ")).toBe("docente.teste@ufsc.br");
  });
});

describe("Robots & Edge Middleware Protection", () => {
  it("should disallow all crawlers via robots.ts", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });

  it("should redirect unauthenticated /dashboard requests to /login with no-store cache header", () => {
    const req = new NextRequest("https://sippe.ufsc.br/dashboard/chef");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://sippe.ufsc.br/login");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("should allow /dashboard requests carrying refreshToken cookie with private no-store cache headers", () => {
    const req = new NextRequest("https://sippe.ufsc.br/dashboard/study-plans", {
      headers: { cookie: "refreshToken=dummy.jwt.token" },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
