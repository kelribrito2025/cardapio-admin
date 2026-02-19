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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("printer.generateApiKey", () => {
  it("generates an API key with pk_ prefix", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.printer.generateApiKey({ establishmentId: 1 });

    expect(result).toBeDefined();
    expect(result.apiKey).toBeDefined();
    expect(typeof result.apiKey).toBe("string");
    expect(result.apiKey.startsWith("pk_")).toBe(true);
    expect(result.apiKey.length).toBe(35); // pk_ + 32 chars
  });

  it("generates different keys on subsequent calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.printer.generateApiKey({ establishmentId: 1 });
    const result2 = await caller.printer.generateApiKey({ establishmentId: 1 });

    expect(result1.apiKey).not.toBe(result2.apiKey);
  });
});

describe("printer.revokeApiKey", () => {
  it("revokes the API key successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First generate a key
    await caller.printer.generateApiKey({ establishmentId: 1 });

    // Then revoke it
    const result = await caller.printer.revokeApiKey({ establishmentId: 1 });
    expect(result).toEqual({ success: true });

    // Verify the key is gone
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBeNull();
  });
});

describe("printer.getSettings includes printerApiKey", () => {
  it("returns printerApiKey in settings after generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate a key
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    // Get settings and verify key is included
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBe(apiKey);
  });
});
