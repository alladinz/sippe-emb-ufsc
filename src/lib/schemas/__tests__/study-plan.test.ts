import { describe, it, expect } from "vitest";
import { studyPlanSchema } from "../study-plan";

describe("Study Plan Zod Schema", () => {
  it("should validate a correct study plan", () => {
    const validPlan = {
      semester: "2026.1",
      status: "draft",
      methodology: "Valid methodology",
      evaluation: "Valid evaluation",
      schedule: "<p>Valid schedule</p>",
      courses: [
        { code: "ABC1234", name: "Cálculo I" }
      ],
      bibliography: [
        { type: "basic", author: "Author", title: "Title", year: 2024 }
      ]
    };
    
    const result = studyPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("should fail if semester is missing or empty", () => {
    const invalidPlan = {
      semester: "",
      status: "draft"
    };
    
    const result = studyPlanSchema.safeParse(invalidPlan);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("O semestre é obrigatório");
    }
  });

  it("should fail if course code is missing", () => {
    const invalidPlan = {
      semester: "2026.1",
      courses: [{ name: "Missing Code" }]
    };
    
    const result = studyPlanSchema.safeParse(invalidPlan);
    expect(result.success).toBe(false);
  });
});
