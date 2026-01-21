import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Response } from "express";
import {
  addConnection,
  removeConnection,
  sendEvent,
  notifyNewOrder,
  notifyOrderUpdate,
  getConnectionCount,
  getTotalConnections,
} from "./_core/sse";

// Mock Response object
function createMockResponse(): Response {
  const res = {
    write: vi.fn().mockReturnValue(true),
  } as unknown as Response;
  return res;
}

describe("SSE Module", () => {
  beforeEach(() => {
    // Reset connections between tests by removing all
    // This is a workaround since we don't export a reset function
  });

  describe("addConnection", () => {
    it("should add a connection for an establishment", () => {
      const res = createMockResponse();
      const establishmentId = 1;

      addConnection(establishmentId, res);

      expect(getConnectionCount(establishmentId)).toBeGreaterThanOrEqual(1);
    });

    it("should allow multiple connections for the same establishment", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const establishmentId = 100;

      addConnection(establishmentId, res1);
      addConnection(establishmentId, res2);

      expect(getConnectionCount(establishmentId)).toBeGreaterThanOrEqual(2);
    });
  });

  describe("removeConnection", () => {
    it("should remove a connection", () => {
      const res = createMockResponse();
      const establishmentId = 200;

      addConnection(establishmentId, res);
      const countBefore = getConnectionCount(establishmentId);
      
      removeConnection(establishmentId, res);
      const countAfter = getConnectionCount(establishmentId);

      expect(countAfter).toBeLessThan(countBefore);
    });

    it("should handle removing non-existent connection gracefully", () => {
      const res = createMockResponse();
      const establishmentId = 999;

      // Should not throw
      expect(() => removeConnection(establishmentId, res)).not.toThrow();
    });
  });

  describe("sendEvent", () => {
    it("should send event to all connections of an establishment", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const establishmentId = 300;

      addConnection(establishmentId, res1);
      addConnection(establishmentId, res2);

      sendEvent(establishmentId, "test_event", { message: "hello" });

      expect(res1.write).toHaveBeenCalled();
      expect(res2.write).toHaveBeenCalled();
    });

    it("should format event correctly", () => {
      const res = createMockResponse();
      const establishmentId = 301;
      const eventType = "test_event";
      const data = { foo: "bar" };

      addConnection(establishmentId, res);
      sendEvent(establishmentId, eventType, data);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining(`event: ${eventType}`)
      );
      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data))
      );
    });

    it("should not throw when no connections exist", () => {
      expect(() => sendEvent(9999, "test", {})).not.toThrow();
    });
  });

  describe("notifyNewOrder", () => {
    it("should send new_order event", () => {
      const res = createMockResponse();
      const establishmentId = 400;
      const order = {
        id: 1,
        orderNumber: "#TEST123",
        total: "50.00",
      };

      addConnection(establishmentId, res);
      notifyNewOrder(establishmentId, order);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("event: new_order")
      );
    });
  });

  describe("notifyOrderUpdate", () => {
    it("should send order_update event", () => {
      const res = createMockResponse();
      const establishmentId = 500;
      const update = {
        id: 1,
        status: "preparing",
      };

      addConnection(establishmentId, res);
      notifyOrderUpdate(establishmentId, update);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("event: order_update")
      );
    });
  });

  describe("getTotalConnections", () => {
    it("should return total number of connections across all establishments", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const res3 = createMockResponse();

      addConnection(600, res1);
      addConnection(601, res2);
      addConnection(601, res3);

      const total = getTotalConnections();
      expect(total).toBeGreaterThanOrEqual(3);
    });
  });
});


// ==================== TESTES PARA SSE DE CLIENTES ====================
import {
  addCustomerConnection,
  removeCustomerConnection,
  sendCustomerEvent,
  notifyCustomerOrderUpdate,
  getCustomerConnectionCount,
} from "./_core/sse";

describe("SSE Customer Module", () => {
  describe("addCustomerConnection", () => {
    it("should add a connection for a customer phone", () => {
      const res = createMockResponse();
      const phone = "11999990001";

      addCustomerConnection(phone, res);

      expect(getCustomerConnectionCount(phone)).toBeGreaterThanOrEqual(1);
    });

    it("should allow multiple connections for the same phone", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const phone = "11999990002";

      addCustomerConnection(phone, res1);
      addCustomerConnection(phone, res2);

      expect(getCustomerConnectionCount(phone)).toBeGreaterThanOrEqual(2);
    });
  });

  describe("removeCustomerConnection", () => {
    it("should remove a customer connection", () => {
      const res = createMockResponse();
      const phone = "11999990003";

      addCustomerConnection(phone, res);
      const countBefore = getCustomerConnectionCount(phone);
      
      removeCustomerConnection(phone, res);
      const countAfter = getCustomerConnectionCount(phone);

      expect(countAfter).toBeLessThan(countBefore);
    });

    it("should handle removing non-existent connection gracefully", () => {
      const res = createMockResponse();
      const phone = "11999999999";

      // Should not throw
      expect(() => removeCustomerConnection(phone, res)).not.toThrow();
    });
  });

  describe("sendCustomerEvent", () => {
    it("should send event to all connections of a customer", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const phone = "11999990004";

      addCustomerConnection(phone, res1);
      addCustomerConnection(phone, res2);

      sendCustomerEvent(phone, "test_event", { message: "hello" });

      expect(res1.write).toHaveBeenCalled();
      expect(res2.write).toHaveBeenCalled();
    });

    it("should format event correctly", () => {
      const res = createMockResponse();
      const phone = "11999990005";
      const eventType = "order_status_update";
      const data = { orderNumber: "#60001", status: "preparing" };

      addCustomerConnection(phone, res);
      sendCustomerEvent(phone, eventType, data);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining(`event: ${eventType}`)
      );
      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data))
      );
    });

    it("should not throw when no connections exist", () => {
      expect(() => sendCustomerEvent("00000000000", "test", {})).not.toThrow();
    });
  });

  describe("notifyCustomerOrderUpdate", () => {
    it("should send order_status_update event to customer", () => {
      const res = createMockResponse();
      const phone = "11999990006";
      const orderUpdate = {
        id: 1,
        orderNumber: "#60001",
        status: "preparing",
        updatedAt: new Date(),
      };

      addCustomerConnection(phone, res);
      notifyCustomerOrderUpdate(phone, orderUpdate);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("event: order_status_update")
      );
      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("#60001")
      );
    });

    it("should include cancellation reason when provided", () => {
      const res = createMockResponse();
      const phone = "11999990007";
      const orderUpdate = {
        id: 2,
        orderNumber: "#60002",
        status: "cancelled",
        cancellationReason: "Produto indisponível",
        updatedAt: new Date(),
      };

      addCustomerConnection(phone, res);
      notifyCustomerOrderUpdate(phone, orderUpdate);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("Produto indisponível")
      );
    });
  });

  describe("getCustomerConnectionCount", () => {
    it("should return 0 for non-existent phone", () => {
      expect(getCustomerConnectionCount("00000000001")).toBe(0);
    });

    it("should return correct count for existing phone", () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const phone = "11999990008";

      addCustomerConnection(phone, res1);
      addCustomerConnection(phone, res2);

      expect(getCustomerConnectionCount(phone)).toBeGreaterThanOrEqual(2);
    });
  });
});
