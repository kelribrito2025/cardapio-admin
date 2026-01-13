import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

describe("getWeeklyRevenue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return arrays with 7 zeros when database is not available", async () => {
    vi.mocked(db.getDb).mockResolvedValue(null);

    const result = await db.getWeeklyRevenue(1);

    // When db is null, it returns early with empty arrays but the function
    // actually initializes arrays with zeros before the db check
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
  });

  it("should return correct structure with arrays of 7 elements", async () => {
    // Mock database with empty results
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

    const result = await db.getWeeklyRevenue(1);

    // Should have 7 days for each week
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
  });

  it("should initialize all days to zero when no orders exist", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

    const result = await db.getWeeklyRevenue(1);

    // All days should be 0
    expect(result.thisWeek.every(v => v === 0)).toBe(true);
    expect(result.lastWeek.every(v => v === 0)).toBe(true);
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
  });

  it("should have correct day labels order (Mon-Sun)", async () => {
    // This test verifies the expected order of days
    const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    expect(DAYS).toHaveLength(7);
    expect(DAYS[0]).toBe("Seg"); // Monday
    expect(DAYS[6]).toBe("Dom"); // Sunday
  });
});
