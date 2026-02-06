import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock das dependências antes de importar o módulo
vi.mock("./db", () => ({
  getPrinterSettings: vi.fn(),
  getOrdersByEstablishment: vi.fn(),
  updateOrderStatus: vi.fn(),
  getEstablishmentById: vi.fn(),
  getEstablishmentsWithNewOrders: vi.fn(),
}));

vi.mock("./_core/sse", () => ({
  notifyOrderUpdate: vi.fn(),
}));

import { invalidateAutoAcceptCache, startAutoAcceptLoop, stopAutoAcceptLoop } from "./autoAccept";

describe("Auto-Accept Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopAutoAcceptLoop();
  });

  it("should export startAutoAcceptLoop function", () => {
    expect(typeof startAutoAcceptLoop).toBe("function");
  });

  it("should export stopAutoAcceptLoop function", () => {
    expect(typeof stopAutoAcceptLoop).toBe("function");
  });

  it("should export invalidateAutoAcceptCache function", () => {
    expect(typeof invalidateAutoAcceptCache).toBe("function");
  });

  it("should start and stop the loop without errors", () => {
    startAutoAcceptLoop();
    // Starting again should not throw
    startAutoAcceptLoop();
    stopAutoAcceptLoop();
    // Stopping again should not throw
    stopAutoAcceptLoop();
  });

  it("should invalidate cache without errors", () => {
    invalidateAutoAcceptCache(1);
    invalidateAutoAcceptCache(999);
  });
});
