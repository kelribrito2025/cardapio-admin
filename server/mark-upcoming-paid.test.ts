import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db module before importing routers
vi.mock("./db", () => ({
  updateExpense: vi.fn().mockResolvedValue(undefined),
  createExpense: vi.fn().mockResolvedValue(42),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("finance.markUpcomingAsPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new expense for a recurring item", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.finance.markUpcomingAsPaid({
      establishmentId: 1,
      recurringId: 10,
      frequency: "monthly",
      description: "Aluguel ponto",
      categoryId: 3,
      amount: "2300.00",
      paymentMethod: "cash",
      dueDate: "2026-03-19",
      type: "expense",
    });

    expect(result).toEqual({
      success: true,
      action: "created",
      expenseId: 42,
    });
    expect(db.createExpense).toHaveBeenCalledOnce();
    expect(db.createExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        establishmentId: 1,
        categoryId: 3,
        description: "Aluguel ponto",
        amount: "2300.00",
        paymentMethod: "cash",
      })
    );
  });

  it("updates the date for a one-time expense", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.finance.markUpcomingAsPaid({
      establishmentId: 1,
      recurringId: 5,
      frequency: "once",
      description: "Compra avulsa",
      categoryId: 2,
      amount: "400.00",
      paymentMethod: "pix",
      dueDate: "2026-02-25",
      type: "expense",
    });

    expect(result).toEqual({
      success: true,
      action: "updated",
    });
    expect(db.updateExpense).toHaveBeenCalledOnce();
    expect(db.updateExpense).toHaveBeenCalledWith(5, expect.objectContaining({
      date: expect.any(Date),
    }));
  });

  it("validates paymentMethod enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.finance.markUpcomingAsPaid({
        establishmentId: 1,
        recurringId: 10,
        frequency: "monthly",
        description: "Test",
        categoryId: 3,
        amount: "100.00",
        paymentMethod: "bitcoin" as any,
        dueDate: "2026-03-19",
        type: "expense",
      })
    ).rejects.toThrow();
  });
});
