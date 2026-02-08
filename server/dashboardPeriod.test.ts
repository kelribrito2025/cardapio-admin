import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Dashboard Stats with Period Filter", () => {
  it("getDashboardStats should accept 'today' period and return correct shape with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "today");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(result).toHaveProperty("avgTicketChange");
    expect(result).toHaveProperty("lowStockChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.avgTicket).toBe("number");
    expect(typeof result.lowStockCount).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
    expect(typeof result.revenueChange).toBe("number");
    expect(typeof result.avgTicketChange).toBe("number");
    expect(typeof result.lowStockChange).toBe("number");
  });

  it("getDashboardStats should accept 'week' period with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "week");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
    expect(typeof result.revenueChange).toBe("number");
  });

  it("getDashboardStats should accept 'month' period with change indicators", async () => {
    const result = await db.getDashboardStats(30001, "month");
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("avgTicket");
    expect(result).toHaveProperty("lowStockCount");
    expect(result).toHaveProperty("ordersChange");
    expect(result).toHaveProperty("revenueChange");
    expect(result).toHaveProperty("avgTicketChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.revenue).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
  });

  it("getDashboardStats should default to 'today' when no period specified", async () => {
    const result = await db.getDashboardStats(30001);
    expect(result).toHaveProperty("ordersCount");
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("ordersChange");
    expect(typeof result.ordersCount).toBe("number");
    expect(typeof result.ordersChange).toBe("number");
  });

  it("week period should return >= today period values", async () => {
    const todayResult = await db.getDashboardStats(30001, "today");
    const weekResult = await db.getDashboardStats(30001, "week");
    expect(weekResult.ordersCount).toBeGreaterThanOrEqual(todayResult.ordersCount);
    expect(weekResult.revenue).toBeGreaterThanOrEqual(todayResult.revenue);
  });

  it("month period should return >= week period values", async () => {
    const weekResult = await db.getDashboardStats(30001, "week");
    const monthResult = await db.getDashboardStats(30001, "month");
    expect(monthResult.ordersCount).toBeGreaterThanOrEqual(weekResult.ordersCount);
    expect(monthResult.revenue).toBeGreaterThanOrEqual(weekResult.revenue);
  });

  it("should return zeros for non-existent establishment", async () => {
    const result = await db.getDashboardStats(999999, "today");
    expect(result.ordersCount).toBe(0);
    expect(result.revenue).toBe(0);
    expect(result.avgTicket).toBe(0);
    expect(result.ordersChange).toBe(0);
    expect(result.revenueChange).toBe(0);
    expect(result.avgTicketChange).toBe(0);
    expect(result.lowStockChange).toBe(0);
  });
});
