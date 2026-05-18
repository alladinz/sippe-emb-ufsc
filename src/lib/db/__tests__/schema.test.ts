import { describe, it, expect } from 'vitest';
import * as schema from "../../../db/schema";

describe('Database Schema', () => {
  it('should have auth tables defined', () => {
    expect(schema.user).toBeDefined();
    expect(schema.session).toBeDefined();
    expect(schema.account).toBeDefined();
    expect(schema.organization).toBeDefined();
    expect(schema.member).toBeDefined();
  });

  it('should have study plan tables defined', () => {
    expect(schema.studyPlans).toBeDefined();
    expect(schema.courses).toBeDefined();
    expect(schema.bibliography).toBeDefined();
  });
});
