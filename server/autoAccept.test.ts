import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock das dependências antes de importar o módulo
vi.mock("./db", () => ({
  getPrinterSettings: vi.fn(),
  getOrdersByEstablishment: vi.fn(),
  updateOrderStatus: vi.fn(),
  getEstablishmentById: vi.fn(),
  getEstablishmentsWithNewOrders: vi.fn(),
  getActivePrinters: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn(),
  getOrderItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("./_core/sse", () => ({
  notifyOrderUpdate: vi.fn(),
}));

vi.mock("./escposPrinter", () => ({
  printOrderDirect: vi.fn().mockResolvedValue({ success: true, message: "OK" }),
  printOrderToMultiplePrinters: vi.fn().mockResolvedValue({
    success: true,
    results: [{ ip: "192.168.1.100", success: true, message: "OK" }],
  }),
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

  it("should handle multiple start/stop cycles", () => {
    for (let i = 0; i < 5; i++) {
      startAutoAcceptLoop();
      stopAutoAcceptLoop();
    }
  });
});
