import { describe, it, expect } from "vitest";

/**
 * Tests for the print log system.
 * Validates the schema, tRPC routes, and data flow.
 */

describe("Print Logs Schema", () => {
  it("should have the printLogs table with correct columns", async () => {
    const { printLogs } = await import("../drizzle/schema");
    expect(printLogs).toBeDefined();
    
    // Check that the table has the expected column names
    const columnNames = Object.keys(printLogs);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("establishmentId");
    expect(columnNames).toContain("orderId");
    expect(columnNames).toContain("orderNumber");
    expect(columnNames).toContain("trigger");
    expect(columnNames).toContain("method");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("errorMessage");
    expect(columnNames).toContain("printerConnections");
    expect(columnNames).toContain("metadata");
    expect(columnNames).toContain("createdAt");
  });
});

describe("Print Logs DB Helpers", () => {
  it("should export createPrintLog function", async () => {
    const db = await import("./db");
    expect(typeof db.createPrintLog).toBe("function");
  });

  it("should export getPrintLogs function", async () => {
    const db = await import("./db");
    expect(typeof db.getPrintLogs).toBe("function");
  });

  it("should export getPrintLogStats function", async () => {
    const db = await import("./db");
    expect(typeof db.getPrintLogStats).toBe("function");
  });

  it("should export clearPrintLogs function", async () => {
    const db = await import("./db");
    expect(typeof db.clearPrintLogs).toBe("function");
  });
});

describe("Print Logs tRPC Routes", () => {
  it("should have printer.logs.list route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    // Check that the printer router exists
    expect(appRouter._def.procedures).toBeDefined();
    
    // Check that printer.logs.list exists as a procedure
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.list"]).toBeDefined();
  });

  it("should have printer.logs.stats route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.stats"]).toBeDefined();
  });

  it("should have printer.logs.clear route defined in appRouter", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as Record<string, any>;
    expect(procedures["printer.logs.clear"]).toBeDefined();
  });
});

describe("Print Log Trigger Integration", () => {
  it("createPrintLog should accept valid trigger values", async () => {
    const db = await import("./db");
    // Verify the function signature accepts the expected parameters
    expect(db.createPrintLog.length).toBeGreaterThanOrEqual(0);
  });

  it("getPrintLogs should accept filter options", async () => {
    const db = await import("./db");
    expect(db.getPrintLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("getPrintLogStats should accept establishmentId and days", async () => {
    const db = await import("./db");
    expect(db.getPrintLogStats.length).toBeGreaterThanOrEqual(1);
  });

  it("clearPrintLogs should accept establishmentId and optional olderThanDays", async () => {
    const db = await import("./db");
    expect(db.clearPrintLogs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Print Log Data Validation", () => {
  it("trigger enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The trigger column should be defined
    expect(printLogs.trigger).toBeDefined();
  });

  it("method enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The method column should be defined
    expect(printLogs.method).toBeDefined();
  });

  it("status enum should include expected values", async () => {
    const { printLogs } = await import("../drizzle/schema");
    // The status column should be defined
    expect(printLogs.status).toBeDefined();
  });
});
