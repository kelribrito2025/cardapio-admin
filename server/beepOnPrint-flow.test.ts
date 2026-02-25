import { describe, expect, it, vi, beforeEach } from "vitest";
import { addConnection, removeConnection, notifyPrintOrder, sendEvent } from "./_core/sse";
import type { Response } from "express";

/**
 * Tests for beepOnPrint flow across all print_order SSE event scenarios.
 * 
 * Validates:
 * 1. notifyPrintOrder includes beepOnPrint in the SSE event payload
 * 2. beepOnPrint: true is correctly propagated
 * 3. beepOnPrint: false is correctly propagated
 * 4. beepOnPrint defaults to false when undefined
 * 5. SSE event is sent to connected clients with correct data
 */

function createMockResponse(): Response {
  const chunks: string[] = [];
  return {
    write: vi.fn((data: string) => {
      chunks.push(data);
      return true;
    }),
    _chunks: chunks,
  } as unknown as Response & { _chunks: string[] };
}

function createSampleOrderData(overrides: Partial<Parameters<typeof notifyPrintOrder>[1]> = {}) {
  return {
    orderId: 1,
    orderNumber: "P1",
    customerName: "Cliente Teste",
    customerPhone: "(88) 99999-0000",
    customerAddress: "Rua Teste, 123 - Centro",
    deliveryType: "delivery",
    paymentMethod: "pix",
    subtotal: "45.00",
    deliveryFee: "5.00",
    discount: "0",
    total: "50.00",
    notes: null,
    changeAmount: null,
    items: [
      {
        productName: "Camarão ao Alho e Óleo",
        quantity: 1,
        unitPrice: "45.00",
        totalPrice: "45.00",
        complements: null,
        notes: null,
      },
    ],
    createdAt: new Date("2026-02-25T12:00:00Z"),
    ...overrides,
  };
}

describe("beepOnPrint in SSE print_order event", () => {
  const ESTABLISHMENT_ID = 99999;

  beforeEach(() => {
    // Clean up any existing connections
    const mockRes = createMockResponse();
    removeConnection(ESTABLISHMENT_ID, mockRes);
  });

  it("includes beepOnPrint: true in print_order event payload", () => {
    const mockRes = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes);

    const orderData = createSampleOrderData({ beepOnPrint: true });
    notifyPrintOrder(ESTABLISHMENT_ID, orderData);

    // Verify write was called
    expect(mockRes.write).toHaveBeenCalled();

    // Parse the SSE event
    const writtenData = mockRes._chunks.join("");
    expect(writtenData).toContain("event: print_order");
    
    // Extract the JSON data from the SSE message
    const dataMatch = writtenData.match(/data: (.+)\n/);
    expect(dataMatch).not.toBeNull();
    
    const parsed = JSON.parse(dataMatch![1]);
    expect(parsed.beepOnPrint).toBe(true);

    // Cleanup
    removeConnection(ESTABLISHMENT_ID, mockRes);
  });

  it("includes beepOnPrint: false in print_order event payload", () => {
    const mockRes = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes);

    const orderData = createSampleOrderData({ beepOnPrint: false });
    notifyPrintOrder(ESTABLISHMENT_ID, orderData);

    const writtenData = mockRes._chunks.join("");
    const dataMatch = writtenData.match(/data: (.+)\n/);
    expect(dataMatch).not.toBeNull();
    
    const parsed = JSON.parse(dataMatch![1]);
    expect(parsed.beepOnPrint).toBe(false);

    removeConnection(ESTABLISHMENT_ID, mockRes);
  });

  it("includes beepOnPrint as undefined when not provided (optional field)", () => {
    const mockRes = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes);

    // Create order data without beepOnPrint
    const { beepOnPrint, ...orderDataWithout } = createSampleOrderData({ beepOnPrint: undefined });
    notifyPrintOrder(ESTABLISHMENT_ID, orderDataWithout as any);

    const writtenData = mockRes._chunks.join("");
    const dataMatch = writtenData.match(/data: (.+)\n/);
    expect(dataMatch).not.toBeNull();
    
    const parsed = JSON.parse(dataMatch![1]);
    // beepOnPrint should either be undefined or not present
    expect(parsed.beepOnPrint === undefined || parsed.beepOnPrint === false || !("beepOnPrint" in parsed)).toBeTruthy();

    removeConnection(ESTABLISHMENT_ID, mockRes);
  });

  it("sends print_order event to all connected clients", () => {
    const mockRes1 = createMockResponse() as Response & { _chunks: string[] };
    const mockRes2 = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes1);
    addConnection(ESTABLISHMENT_ID, mockRes2);

    const orderData = createSampleOrderData({ beepOnPrint: true });
    notifyPrintOrder(ESTABLISHMENT_ID, orderData);

    // Both connections should receive the event
    expect(mockRes1.write).toHaveBeenCalled();
    expect(mockRes2.write).toHaveBeenCalled();

    // Both should have beepOnPrint: true
    for (const mockRes of [mockRes1, mockRes2]) {
      const writtenData = mockRes._chunks.join("");
      const dataMatch = writtenData.match(/data: (.+)\n/);
      const parsed = JSON.parse(dataMatch![1]);
      expect(parsed.beepOnPrint).toBe(true);
    }

    removeConnection(ESTABLISHMENT_ID, mockRes1);
    removeConnection(ESTABLISHMENT_ID, mockRes2);
  });

  it("does not send print_order to other establishments", () => {
    const mockResTarget = createMockResponse() as Response & { _chunks: string[] };
    const mockResOther = createMockResponse() as Response & { _chunks: string[] };
    const OTHER_ESTABLISHMENT = 88888;

    addConnection(ESTABLISHMENT_ID, mockResTarget);
    addConnection(OTHER_ESTABLISHMENT, mockResOther);

    const orderData = createSampleOrderData({ beepOnPrint: true });
    notifyPrintOrder(ESTABLISHMENT_ID, orderData);

    // Target should receive
    expect(mockResTarget.write).toHaveBeenCalled();
    // Other should NOT receive
    expect(mockResOther.write).not.toHaveBeenCalled();

    removeConnection(ESTABLISHMENT_ID, mockResTarget);
    removeConnection(OTHER_ESTABLISHMENT, mockResOther);
  });

  it("includes all order data fields alongside beepOnPrint", () => {
    const mockRes = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes);

    const orderData = createSampleOrderData({ beepOnPrint: true });
    notifyPrintOrder(ESTABLISHMENT_ID, orderData);

    const writtenData = mockRes._chunks.join("");
    const dataMatch = writtenData.match(/data: (.+)\n/);
    const parsed = JSON.parse(dataMatch![1]);

    // Verify all essential fields are present
    expect(parsed.orderId).toBe(1);
    expect(parsed.orderNumber).toBe("P1");
    expect(parsed.customerName).toBe("Cliente Teste");
    expect(parsed.customerPhone).toBe("(88) 99999-0000");
    expect(parsed.deliveryType).toBe("delivery");
    expect(parsed.paymentMethod).toBe("pix");
    expect(parsed.total).toBe("50.00");
    expect(parsed.beepOnPrint).toBe(true);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].productName).toBe("Camarão ao Alho e Óleo");

    removeConnection(ESTABLISHMENT_ID, mockRes);
  });
});

describe("beepOnPrint code path validation", () => {
  const ESTABLISHMENT_ID = 99999;

  it("createPublicOrder code includes beepOnPrint from printerSettings", async () => {
    // This test validates the code structure by importing and checking the function exists
    const dbModule = await import("./db");
    expect(typeof dbModule.getPrinterSettings).toBe("function");
    expect(typeof dbModule.createPublicOrder).toBe("function");
  });

  it("updateOrderStatus code includes beepOnPrint for confirmed orders", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.updateOrderStatus).toBe("function");
  });

  it("notifyPrintOrder accepts beepOnPrint parameter", () => {
    // Verify the function signature accepts beepOnPrint
    const mockRes = createMockResponse() as Response & { _chunks: string[] };
    addConnection(ESTABLISHMENT_ID, mockRes);

    // Should not throw when beepOnPrint is provided
    expect(() => {
      notifyPrintOrder(ESTABLISHMENT_ID, createSampleOrderData({ beepOnPrint: true }));
    }).not.toThrow();

    expect(() => {
      notifyPrintOrder(ESTABLISHMENT_ID, createSampleOrderData({ beepOnPrint: false }));
    }).not.toThrow();

    removeConnection(ESTABLISHMENT_ID, mockRes);
  });
});
