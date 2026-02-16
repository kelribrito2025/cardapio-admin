import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("finance", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  // Use a high establishment ID to avoid conflicts with real data
  const testEstablishmentId = 99999;

  describe("listCategories", () => {
    it("returns an array of expense categories (with defaults seeded)", async () => {
      const categories = await caller.finance.listCategories({
        establishmentId: testEstablishmentId,
      });
      expect(Array.isArray(categories)).toBe(true);
      // Default categories should be seeded
      expect(categories.length).toBeGreaterThanOrEqual(8);
      // Check that each category has the expected shape
      const first = categories[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("color");
      expect(first).toHaveProperty("isDefault");
    });
  });

  describe("createCategory", () => {
    it("creates a new expense category and returns its id", async () => {
      const result = await caller.finance.createCategory({
        establishmentId: testEstablishmentId,
        name: "Teste Vitest",
        color: "#ff0000",
      });
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });
  });

  describe("summary", () => {
    it("returns finance summary with expected fields for today", async () => {
      const summary = await caller.finance.summary({
        establishmentId: testEstablishmentId,
        period: "today",
      });
      expect(summary).toHaveProperty("revenue");
      expect(summary).toHaveProperty("expensesTotal");
      expect(summary).toHaveProperty("profit");
      expect(summary).toHaveProperty("avgTicket");
      expect(summary).toHaveProperty("ordersCount");
      expect(summary).toHaveProperty("revenueChange");
      expect(summary).toHaveProperty("expensesChange");
      expect(summary).toHaveProperty("profitChange");
      expect(summary).toHaveProperty("avgTicketChange");
      expect(typeof summary.revenue).toBe("number");
      expect(typeof summary.expensesTotal).toBe("number");
      expect(typeof summary.profit).toBe("number");
    });

    it("returns finance summary for week period", async () => {
      const summary = await caller.finance.summary({
        establishmentId: testEstablishmentId,
        period: "week",
      });
      expect(summary).toHaveProperty("revenue");
      expect(typeof summary.profit).toBe("number");
    });

    it("returns finance summary for month period", async () => {
      const summary = await caller.finance.summary({
        establishmentId: testEstablishmentId,
        period: "month",
      });
      expect(summary).toHaveProperty("revenue");
      expect(typeof summary.profit).toBe("number");
    });
  });

  describe("chart", () => {
    it("returns chart data as array for week", async () => {
      const chart = await caller.finance.chart({
        establishmentId: testEstablishmentId,
        period: "week",
      });
      expect(Array.isArray(chart)).toBe(true);
      expect(chart.length).toBe(7);
      if (chart.length > 0) {
        expect(chart[0]).toHaveProperty("date");
        expect(chart[0]).toHaveProperty("label");
        expect(chart[0]).toHaveProperty("revenue");
        expect(chart[0]).toHaveProperty("expenses");
        expect(chart[0]).toHaveProperty("profit");
      }
    });

    it("returns chart data for month", async () => {
      const chart = await caller.finance.chart({
        establishmentId: testEstablishmentId,
        period: "month",
      });
      expect(Array.isArray(chart)).toBe(true);
      expect(chart.length).toBeGreaterThan(0);
    });
  });

  describe("expense CRUD", () => {
    let createdExpenseId: number;

    it("creates an expense", async () => {
      // First get categories to use a valid categoryId
      const categories = await caller.finance.listCategories({
        establishmentId: testEstablishmentId,
      });
      const categoryId = categories[0]?.id;
      expect(categoryId).toBeDefined();

      const result = await caller.finance.createExpense({
        establishmentId: testEstablishmentId,
        categoryId: categoryId!,
        description: "Teste despesa vitest",
        amount: "150.50",
        paymentMethod: "pix",
        date: new Date().toISOString(),
      });
      expect(result).toHaveProperty("id");
      createdExpenseId = result.id!;
    });

    it("lists expenses and finds the created one", async () => {
      const result = await caller.finance.listExpenses({
        establishmentId: testEstablishmentId,
        search: "Teste despesa vitest",
      });
      expect(result.items.length).toBeGreaterThan(0);
      const found = result.items.find((e) => e.id === createdExpenseId);
      expect(found).toBeDefined();
      expect(found?.description).toBe("Teste despesa vitest");
    });

    it("updates the expense", async () => {
      const result = await caller.finance.updateExpense({
        id: createdExpenseId,
        description: "Teste despesa atualizada",
        amount: "200.00",
      });
      expect(result).toEqual({ success: true });
    });

    it("deletes the expense", async () => {
      const result = await caller.finance.deleteExpense({
        id: createdExpenseId,
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("expensesByCategory", () => {
    it("returns expenses grouped by category", async () => {
      const result = await caller.finance.expensesByCategory({
        establishmentId: testEstablishmentId,
        period: "month",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("monthly goal", () => {
    it("sets and retrieves a monthly goal", async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const setResult = await caller.finance.setGoal({
        establishmentId: testEstablishmentId,
        month,
        year,
        targetProfit: "15000",
      });
      expect(setResult).toHaveProperty("id");

      const goal = await caller.finance.getGoal({
        establishmentId: testEstablishmentId,
        month,
        year,
      });
      expect(goal).not.toBeNull();
      expect(Number(goal!.targetProfit)).toBe(15000);
    });
  });
});
