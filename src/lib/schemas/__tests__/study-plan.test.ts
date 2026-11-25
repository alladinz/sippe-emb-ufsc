import { describe, it, expect } from "vitest";
import { studyPlanSchema } from "../study-plan";

describe("Study Plan Zod Schema", () => {
  it("should validate a correct study plan", () => {
    const validPlan = {
      semester: "2026.1",
      status: "draft",
      methodology: "Valid methodology",
      evaluation: "Valid evaluation",
      schedule: [{ day: "Segunda-feira", enabled: true }],
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

  it("should validate study plan with contact, officeHours and UFSC schedule slots", () => {
    const plan = {
      semester: "2026.1",
      status: "draft",
      contact: "prof@ufsc.br | Ramal 1234",
      officeHours: "Terças-feiras, 14:00 às 16:00",
      schedule: [
        {
          day: "Segunda-feira",
          enabled: true,
          slots: ["08:40 - 09:30", "09:30 - 10:20"],
          startTime: "08:40",
          endTime: "10:20",
        },
      ],
    };

    const result = studyPlanSchema.safeParse(plan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact).toBe("prof@ufsc.br | Ramal 1234");
      expect(result.data.officeHours).toBe("Terças-feiras, 14:00 às 16:00");
      expect(Array.isArray(result.data.schedule)).toBe(true);
      if (Array.isArray(result.data.schedule)) {
        expect(result.data.schedule[0].slots).toEqual(["08:40 - 09:30", "09:30 - 10:20"]);
      }
    }
  });
});
