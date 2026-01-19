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
