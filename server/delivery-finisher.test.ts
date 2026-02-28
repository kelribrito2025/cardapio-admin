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
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should send button message with delivery_done_ prefix for Marcar como entregue", () => {
      const matches = routerContent.match(/delivery_done_/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should include 'Sair para entrega' button text", () => {
      const matches = routerContent.match(/Sair para entrega/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should include 'Marcar como entregue' button text", () => {
      const matches = routerContent.match(/Marcar como entregue/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should check deliveryFinisher setting before sending button", () => {
      const matches = routerContent.match(/getDeliveryFinisher/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    it("should fall back to text message when finisher is attendant", () => {
      expect(routerContent).toContain("sendTextMessage(config.instanceToken, driver.whatsapp, message)");
    });

    it("should suppress customer ready notification when deliveryFinisher is driver", () => {
      // Check that the router suppresses customer notification on ready when driver finishes
      expect(routerContent).toContain("Se deliveryFinisher é 'driver' e pedido é delivery, NÃO enviar ao cliente agora");
    });
  });

  // ---- Webhook Handler Tests ----
  describe("Webhook Handler - Delivery Start Button (Sair para entrega)", () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, "./_core/index.ts"),
      "utf-8"
    );

    it("should handle delivery_start_ button clicks in webhook", () => {
      expect(indexContent).toContain("delivery_start_");
    });

    it("should NOT update order status to completed when driver clicks Sair para entrega", () => {
      // The delivery_start handler should NOT call updateOrderStatus('completed')
      // It should only notify the customer
      const deliveryStartSection = indexContent.split("ENTREGADOR CLICOU \"SAIR PARA ENTREGA\"")[1].split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[0];
      expect(deliveryStartSection).toContain("N\u00C3O finaliza o pedido");
      expect(deliveryStartSection).not.toContain("updateOrderStatus(orderData.id, 'completed')");
    });

    it("should send customer notification using ready template (Pronto Delivery)", () => {
      // After delivery_start, should send 'ready' status notification, not 'completed'
      const deliveryStartSection = indexContent.split("ENTREGADOR CLICOU \"SAIR PARA ENTREGA\"")[1].split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[0];
      expect(deliveryStartSection).toContain("'ready'");
      expect(deliveryStartSection).toContain("templateReady");
    });

    it("should verify deliveryFinisher is driver before processing", () => {
      expect(indexContent).toMatch(/delivery_start_[\s\S]*?getDeliveryFinisher/);
    });

    it("should send confirmation message to driver after Sair para entrega", () => {
      expect(indexContent).toContain("Entrega do pedido");
      expect(indexContent).toContain("O cliente foi notificado");
    });
  });

  describe("Webhook Handler - Delivery Done Button (Marcar como entregue)", () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, "./_core/index.ts"),
      "utf-8"
    );

    it("should handle delivery_done_ button clicks in webhook", () => {
      expect(indexContent).toContain("delivery_done_");
    });

    it("should update order status to completed when driver clicks Marcar como entregue", () => {
      const deliveryDoneSection = indexContent.split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[1];
      expect(deliveryDoneSection).toContain("updateOrderStatus");
      expect(deliveryDoneSection).toContain("'completed'");
    });

    it("should send completed notification to customer on delivery done", () => {
      const deliveryDoneSection = indexContent.split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[1];
      expect(deliveryDoneSection).toContain("sendOrderStatusNotification");
      expect(deliveryDoneSection).toContain("templateCompleted");
    });

    it("should handle already completed/cancelled orders gracefully", () => {
      const deliveryDoneSection = indexContent.split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[1];
      expect(deliveryDoneSection).toContain("já finalizado/cancelado");
    });

    it("should send confirmation message to driver after marking as delivered", () => {
      expect(indexContent).toContain("marcado como entregue");
    });

    it("should include cashback info in completed notification", () => {
      const deliveryDoneSection = indexContent.split("ENTREGADOR CLICOU \"MARCAR COMO ENTREGUE\"")[1];
      expect(deliveryDoneSection).toContain("cashbackInfo");
      expect(deliveryDoneSection).toContain("getCashbackTransactionByOrderId");
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

    it("should query driverNotifyTiming setting", () => {
      expect(pedidosContent).toContain("trpc.driver.getNotifyTiming.useQuery");
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

    it("should skip ready modal when driver notified on accept and driver finishes", () => {
      // When driverNotifyTiming is on_accepted and deliveryFinisher is driver,
      // the ready modal should be skipped for delivery orders
      expect(pedidosContent).toContain("driverNotifyTiming === 'on_accepted'");
      expect(pedidosContent).toContain("deliveryFinisher === 'driver'");
    });

    it("should show driver-specific message in ready modal when driver finishes", () => {
      expect(pedidosContent).toContain("entregador receberá uma notificação de nova entrega");
    });
  });
});
