import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module using importOriginal to preserve all other exports
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    updateTableStatus: vi.fn().mockResolvedValue(undefined),
  };
});

import { updateTableStatus } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("tables.updateStatus - reservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reserve a table with name, phone, and time", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tables.updateStatus({
      id: 1,
      status: "reserved",
      reservedName: "Maria Silva",
      reservedPhone: "(11) 99999-0000",
      reservedFor: "2026-02-06T19:00:00.000Z",
    });

    expect(result).toEqual({ success: true });
    expect(updateTableStatus).toHaveBeenCalledWith(
      1,
      "reserved",
      undefined,
      {
        reservedName: "Maria Silva",
        reservedPhone: "(11) 99999-0000",
        reservedFor: expect.any(Date),
      }
    );
  });

  it("should reserve a table without optional fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tables.updateStatus({
      id: 2,
      status: "reserved",
    });

    expect(result).toEqual({ success: true });
    expect(updateTableStatus).toHaveBeenCalledWith(
      2,
      "reserved",
      undefined,
      {
        reservedName: undefined,
        reservedPhone: undefined,
        reservedFor: null,
      }
    );
  });

  it("should cancel a reservation by setting status to free", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tables.updateStatus({
      id: 1,
      status: "free",
    });

    expect(result).toEqual({ success: true });
    expect(updateTableStatus).toHaveBeenCalledWith(
      1,
      "free",
      undefined,
      undefined
    );
  });

  it("should not pass reservation data when status is not reserved", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tables.updateStatus({
      id: 1,
      status: "occupied",
      guests: 4,
    });

    expect(result).toEqual({ success: true });
    expect(updateTableStatus).toHaveBeenCalledWith(
      1,
      "occupied",
      4,
      undefined
    );
  });

  it("should reject invalid status values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.tables.updateStatus({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });
});
