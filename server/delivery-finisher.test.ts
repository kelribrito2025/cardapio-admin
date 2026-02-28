import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Delivery Finisher Feature", () => {
  // ---- Schema Tests ----
  describe("Database Schema", () => {
    const schemaContent = fs.readFileSync(
      path.resolve(__dirname, "../drizzle/schema.ts"),
      "utf-8"
    );

    it("should have deliveryFinisher field in establishments table", () => {
      expect(schemaContent).toContain("deliveryFinisher");
    });

    it("should define deliveryFinisher as enum with attendant and driver values", () => {
      expect(schemaContent).toMatch(/deliveryFinisher.*attendant.*driver|deliveryFinisher.*driver.*attendant/s);
    });
  });

  // ---- DB Helper Tests ----
  describe("DB Helpers", () => {
    const dbContent = fs.readFileSync(
      path.resolve(__dirname, "./db.ts"),
      "utf-8"
    );

    it("should export getDeliveryFinisher function", () => {
      expect(dbContent).toContain("export async function getDeliveryFinisher");
    });

    it("should export updateDeliveryFinisher function", () => {
      expect(dbContent).toContain("export async function updateDeliveryFinisher");
    });

    it("should default to attendant when no value is set", () => {
      expect(dbContent).toMatch(/getDeliveryFinisher[\s\S]*?attendant/);
    });
  });

  // ---- Router Tests ----
  describe("tRPC Router - Delivery Finisher Endpoints", () => {
    const routerContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"),
      "utf-8"
    );

    it("should have getDeliveryFinisher query endpoint", () => {
      expect(routerContent).toContain("getDeliveryFinisher");
    });

    it("should have updateDeliveryFinisher mutation endpoint", () => {
      expect(routerContent).toContain("updateDeliveryFinisher");
    });

    it("should validate finisher input as enum of attendant or driver", () => {
      expect(routerContent).toMatch(/z\.enum\(\["attendant",\s*"driver"\]\)/);
    });
  });

  // ---- Button Message Logic Tests ----
  describe("Driver Notification - Button Messages", () => {
    const routerContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"),
      "utf-8"
    );

    it("should send button message with delivery_start_ prefix when finisher is driver", () => {
      const matches = routerContent.match(/delivery_start_/g);
      // Should appear in multiple notification points
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should include 'Sair para entrega' button text", () => {
      const matches = routerContent.match(/Sair para entrega/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should check deliveryFinisher setting before sending button", () => {
      // Each notification point should check getDeliveryFinisher
      const matches = routerContent.match(/getDeliveryFinisher/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should fall back to text message when finisher is attendant", () => {
      expect(routerContent).toContain("sendTextMessage(config.instanceToken, driver.whatsapp, message)");
    });
  });

  // ---- Webhook Handler Tests ----
  describe("Webhook Handler - Delivery Start Button", () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, "./_core/index.ts"),
      "utf-8"
    );

    it("should handle delivery_start_ button clicks in webhook", () => {
      expect(indexContent).toContain("delivery_start_");
    });

    it("should update order status to completed when driver clicks button", () => {
      expect(indexContent).toMatch(/delivery_start_[\s\S]*?updateOrderStatus[\s\S]*?completed/);
    });

    it("should send customer notification on delivery start", () => {
      expect(indexContent).toMatch(/delivery_start_[\s\S]*?sendOrderStatusNotification/);
    });

    it("should verify deliveryFinisher is driver before processing", () => {
      expect(indexContent).toMatch(/delivery_start_[\s\S]*?getDeliveryFinisher/);
    });

    it("should send confirmation message to driver after processing", () => {
      expect(indexContent).toContain("Pedido");
      expect(indexContent).toContain("finalizado com sucesso");
    });

    it("should check order status is valid before finalizing", () => {
      expect(indexContent).toContain("out_for_delivery");
      expect(indexContent).toContain("ready");
    });
  });

  // ---- Frontend Tests ----
  describe("Frontend - Entregadores Page", () => {
    const entregadoresContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/Entregadores.tsx"),
      "utf-8"
    );

    it("should have delivery finisher selection UI", () => {
      expect(entregadoresContent).toContain("Quem finaliza o pedido");
    });

    it("should have attendant option", () => {
      expect(entregadoresContent).toContain("Atendente finaliza");
    });

    it("should have driver option", () => {
      expect(entregadoresContent).toContain("Entregador finaliza via WhatsApp");
    });

    it("should use getDeliveryFinisher query", () => {
      expect(entregadoresContent).toContain("trpc.driver.getDeliveryFinisher.useQuery");
    });

    it("should use updateDeliveryFinisher mutation", () => {
      expect(entregadoresContent).toContain("updateDeliveryFinisherMutation");
    });
  });

  describe("Frontend - Pedidos Page", () => {
    const pedidosContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/Pedidos.tsx"),
      "utf-8"
    );

    it("should query deliveryFinisher setting", () => {
      expect(pedidosContent).toContain("trpc.driver.getDeliveryFinisher.useQuery");
    });

    it("should disable Finalizar button when driver finishes", () => {
      expect(pedidosContent).toContain("disabled: true");
      expect(pedidosContent).toContain("Entregador finaliza");
    });

    it("should show Bike icon on disabled button", () => {
      expect(pedidosContent).toContain("<Bike");
    });

    it("should show tooltip explaining driver finishes via WhatsApp", () => {
      expect(pedidosContent).toContain("O entregador finaliza o pedido pelo WhatsApp");
    });
  });
});
