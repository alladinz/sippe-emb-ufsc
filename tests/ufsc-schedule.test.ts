import { describe, it, expect } from "vitest";
import {
  UFSC_TIME_SLOTS,
  groupContiguousSlots,
  formatPlanScheduleSummary,
  getDaysWithInsufficientCredits,
} from "@/lib/schedule/ufsc-schedule";

describe("UFSC Schedule Utilities", () => {
  it("should contain all 12 official UFSC time slots", () => {
    expect(UFSC_TIME_SLOTS).toHaveLength(12);
    expect(UFSC_TIME_SLOTS[0].id).toBe("07:30 - 08:20");
    expect(UFSC_TIME_SLOTS[11].id).toBe("18:50 - 19:40");
  });

  it("should merge 2 consecutive credits like 08:40-09:30 and 09:30-10:20 into 08:40 - 10:20", () => {
    const blocks = groupContiguousSlots(["09:30 - 10:20", "08:40 - 09:30"]);
    expect(blocks).toEqual([
      { startTime: "08:40", endTime: "10:20", label: "08:40 - 10:20", credits: 2 },
    ]);
  });

  it("should merge same-shift adjacent slots across short break (<=20min) and separate lunch break", () => {
    const blocks = groupContiguousSlots([
      "08:40 - 09:30",
      "09:30 - 10:20",
      "10:30 - 11:20",
      "11:20 - 12:10",
      "13:30 - 14:20",
      "14:20 - 15:10",
    ]);
    expect(blocks.map((b) => b.label)).toEqual(["08:40 - 12:10", "13:30 - 15:10"]);
  });

  it("should keep non-adjacent slots in same shift separated", () => {
    const blocks = groupContiguousSlots(["07:30 - 08:20", "10:30 - 11:20"]);
    expect(blocks.map((b) => b.label)).toEqual(["07:30 - 08:20", "10:30 - 11:20"]);
  });

  it("should format complete plan schedule summary cleanly", () => {
    const summary = formatPlanScheduleSummary([
      { day: "Segunda-feira", enabled: true, slots: ["08:40 - 09:30", "09:30 - 10:20"] },
      { day: "Terça-feira", enabled: false, slots: [] },
      { day: "Quarta-feira", enabled: true, slots: ["13:30 - 14:20", "14:20 - 15:10"] },
    ]);
    expect(summary).toBe("Segunda-feira: 08:40 - 10:20 | Quarta-feira: 13:30 - 15:10");
  });

  it("should fall back to indicacaoHorario for legacy plans without selected UFSC slots", () => {
    const summary = formatPlanScheduleSummary(
      [{ day: "Segunda-feira", enabled: true, startTime: "08:00", endTime: "10:00" }],
      "2.0840-2 / 4.0840-2"
    );
    expect(summary).toBe("2.0840-2 / 4.0840-2");
  });

  it("should flag active days with fewer than 2 credits", () => {
    const invalid = getDaysWithInsufficientCredits([
      { day: "Segunda-feira", enabled: true, slots: ["08:40 - 09:30"] },
      { day: "Quarta-feira", enabled: true, slots: ["08:40 - 09:30", "09:30 - 10:20"] },
    ]);
    expect(invalid).toEqual(["Segunda-feira"]);
  });
});
