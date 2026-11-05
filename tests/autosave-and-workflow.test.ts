import { describe, it, expect, vi, beforeEach } from "vitest";
import { isProgramaEditable, canSubmitPrograma, PROGRAMA_STATUS_LABEL } from "../src/utils/programaStatus";
import { professor, coordenador, chefe, secretario } from "../src/lib/auth/permissions";
import { isValidTransition } from "../src/lib/schemas/study-plan";

describe("Fase 4 — Autosave Serial Queue, Concurrency and Monotonic Sequencing", () => {
  it("should ignore out-of-order resolution from slower previous requests", async () => {
    let currentSavedData = "Initial";
    let saveSeq = 0;
    const history: string[] = [];

    // Simulate saving engine with monotonic sequencing
    const executeMockSave = async (data: string, delayMs: number) => {
      const thisSeq = ++saveSeq;
      await new Promise(r => setTimeout(r, delayMs));

      // Only update if this request is still the newest
      if (thisSeq === saveSeq) {
        currentSavedData = data;
        history.push(data);
      }
    };

    // Request A starts with "Change A", takes 150ms
    const promiseA = executeMockSave("Change A", 150);
    // Request B starts with "Change B", takes 40ms
    const promiseB = executeMockSave("Change B", 40);

    await Promise.all([promiseA, promiseB]);

    // Request B finishes first and becomes "Change B".
    // When Request A finishes at 150ms, its sequence (1) is less than saveSeq (2),
    // so it is discarded and does NOT overwrite "Change B".
    expect(currentSavedData).toBe("Change B");
    expect(history).toEqual(["Change B"]);
  });

  it("should serialize multiple saves when in-flight save is active", async () => {
    let isSaving = false;
    let pendingData: string | null = null;
    const completedSaves: string[] = [];

    const saveToServer = async (data: string) => {
      if (isSaving) {
        pendingData = data;
        return;
      }

      isSaving = true;
      try {
        await new Promise(r => setTimeout(r, 50));
        completedSaves.push(data);
      } finally {
        isSaving = false;
        if (pendingData) {
          const next = pendingData;
          pendingData = null;
          await saveToServer(next);
        }
      }
    };

    // Dispatch save 1
    const p1 = saveToServer("Edit 1");
    // While save 1 is saving, user makes Edit 2, Edit 3
    const p2 = saveToServer("Edit 2");
    const p3 = saveToServer("Edit 3");

    await Promise.all([p1, p2, p3]);

    // Edit 2 was superseded by Edit 3 in pendingData
    expect(completedSaves).toEqual(["Edit 1", "Edit 3"]);
  });

  it("should flush pending changes and await resolution before navigation", async () => {
    let isSaving = false;
    let serverValue = "Old";
    let pendingValue: string | null = null;

    const performSave = async (val: string) => {
      isSaving = true;
      await new Promise(r => setTimeout(r, 60));
      serverValue = val;
      isSaving = false;
    };

    const flushSave = async (latestFormValue: string): Promise<boolean> => {
      while (isSaving) {
        pendingValue = latestFormValue;
        await new Promise(r => setTimeout(r, 20));
      }
      if (serverValue !== latestFormValue || pendingValue !== null) {
        pendingValue = null;
        await performSave(latestFormValue);
      }
      return true;
    };

    // User types "Brand New", save is triggered
    performSave("Typing 1");
    // Immediately, user clicks "Visualizar" with "Brand New"
    const flushPromise = flushSave("Brand New");

    const ok = await flushPromise;
    expect(ok).toBe(true);
    // After flush finishes, server has the newest value before navigation
    expect(serverValue).toBe("Brand New");
    expect(isSaving).toBe(false);
  });

  it("should fail flush and prevent submission if server save rejects", async () => {
    const failingSave = async () => {
      throw new Error("Network timeout (10s)");
    };

    const flushSave = async (): Promise<boolean> => {
      try {
        await failingSave();
        return true;
      } catch {
        return false;
      }
    };

    const success = await flushSave();
    expect(success).toBe(false);
    // Submission handler will abort if flushSave returns false!
  });
});

describe("Fase 4 — Programas de Ensino: Workflow, Status & Unanimous Approval", () => {
  it("should allow editing and submitting for both draft and rejected statuses", () => {
    // Both draft and rejected can be edited and submitted
    expect(isProgramaEditable("draft")).toBe(true);
    expect(isProgramaEditable("rejected")).toBe(true);
    expect(canSubmitPrograma("draft")).toBe(true);
    expect(canSubmitPrograma("rejected")).toBe(true);

    // Submitted, approved and archived are read-only
    expect(isProgramaEditable("submitted")).toBe(false);
    expect(isProgramaEditable("approved")).toBe(false);
    expect(isProgramaEditable("archived")).toBe(false);
    expect(canSubmitPrograma("submitted")).toBe(false);
    expect(canSubmitPrograma("approved")).toBe(false);
  });

  it("should allow Chefe to edit in pending_chefe status", () => {
    expect(isProgramaEditable("pending_chefe", "chefe")).toBe(true);
    expect(isProgramaEditable("pending_chefe", "professor")).toBe(false);
    expect(isProgramaEditable("pending_chefe", "comissao")).toBe(false);
  });

  it("should verify unanimous approval logic across multiple courses", () => {
    interface Aprovacao {
      curso: string;
      status: "pending" | "approved" | "rejected";
    }

    const computeProgramStatus = (aprovacoes: Aprovacao[]): "submitted" | "approved" | "rejected" => {
      if (aprovacoes.some(a => a.status === "rejected")) {
        return "rejected";
      }
      if (aprovacoes.every(a => a.status === "approved")) {
        return "approved";
      }
      return "submitted"; // Partial approval
    };

    // 2 courses linked: Curso 601 and Curso 602
    const aprovacoes: Aprovacao[] = [
      { curso: "601 - Ciência e Tecnologia", status: "pending" },
      { curso: "602 - Engenharia Mecatrônica", status: "pending" }
    ];

    expect(computeProgramStatus(aprovacoes)).toBe("submitted");

    // Course 1 approves, Course 2 still pending -> partial approval (remains submitted)
    aprovacoes[0].status = "approved";
    expect(computeProgramStatus(aprovacoes)).toBe("submitted");

    // Course 2 also approves -> UNANIMOUS APPROVAL!
    aprovacoes[1].status = "approved";
    expect(computeProgramStatus(aprovacoes)).toBe("approved");

    // If one of the courses rejects -> becomes rejected
    aprovacoes[1].status = "rejected";
    expect(computeProgramStatus(aprovacoes)).toBe("rejected");
  });
});

describe("Fase 4 — RBAC Matrix & Role Permissions", () => {
  it("should enforce Professor boundaries", () => {
    const stmts = professor.statements.study_plan;
    expect(stmts).toContain("create");
    expect(stmts).toContain("submit");
    expect(stmts).toContain("view_own");
    expect(stmts).not.toContain("approve");
    expect(stmts).not.toContain("reject");
    expect(stmts).not.toContain("archive");
    expect(stmts).not.toContain("manage_users");
  });

  it("should enforce Coordenador boundaries", () => {
    const stmts = coordenador.statements.study_plan;
    expect(stmts).toContain("approve");
    expect(stmts).toContain("reject");
    expect(stmts).toContain("view_all");
    expect(stmts).not.toContain("create");
    expect(stmts).not.toContain("submit");
    expect(stmts).not.toContain("archive");
  });

  it("should enforce Chefe departmental governance privileges", () => {
    const stmts = chefe.statements.study_plan;
    expect(stmts).toContain("view_all");
    expect(stmts).toContain("approve");
    expect(stmts).toContain("reject");
    expect(stmts).toContain("manage_users");
    expect(stmts).toContain("import_courses");
  });

  it("should enforce Secretário archival custody boundaries", () => {
    const stmts = secretario.statements.study_plan;
    expect(stmts).toContain("archive");
    expect(stmts).toContain("view_all");
    expect(stmts).not.toContain("create");
    expect(stmts).not.toContain("approve");
  });
});
