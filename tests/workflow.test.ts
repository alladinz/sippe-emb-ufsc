import { describe, it, expect } from "vitest";
import { isValidTransition, StudyPlanStatus } from "../src/lib/schemas/study-plan";

describe("Study Plan State Machine Transitions", () => {
  it("should allow valid transitions", () => {
    expect(isValidTransition("draft", "submitted")).toBe(true);
    expect(isValidTransition("submitted", "pending_review")).toBe(true);
    expect(isValidTransition("pending_review", "approved")).toBe(true);
    expect(isValidTransition("pending_review", "rejected")).toBe(true);
    expect(isValidTransition("rejected", "submitted")).toBe(true);
  });

  it("should block invalid transitions", () => {
    // Cannot skip pending_review
    expect(isValidTransition("submitted", "approved")).toBe(false);
    expect(isValidTransition("submitted", "rejected")).toBe(false);
    
    // Cannot go back to draft once submitted
    expect(isValidTransition("submitted", "draft")).toBe(false);
    expect(isValidTransition("pending_review", "draft")).toBe(false);
    
    // Cannot move from final state
    expect(isValidTransition("approved", "submitted")).toBe(false);
    expect(isValidTransition("approved", "pending_review")).toBe(false);
    
    // Cannot move from draft to anything but submitted
    expect(isValidTransition("draft", "pending_review")).toBe(false);
    expect(isValidTransition("draft", "approved")).toBe(false);
  });
});
