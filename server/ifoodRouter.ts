/**
 * iFood Router - Endpoints para integração com iFood
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { 
  validateIfoodCredentials, 
  getIfoodOrderDetails,
  confirmIfoodOrder,
  startIfoodOrderPreparation,
  readyToPickupIfoodOrder,
  dispatchIfoodOrder,
  requestIfoodOrderCancellation,
  getIfoodCancellationReasons,
  acknowledgeIfoodEvent,
  type IfoodOrder,
  type IfoodEvent
} from "./ifood";

// Mapeamento de tipo de pedido iFood para interno
function mapIfoodOrderType(orderType: string): "delivery" | "pickup" | "dine_in" {
  switch (orderType) {
    case "DELIVERY":
      return "delivery";
    case "TAKEOUT":
      return "pickup";
    case "DINE_IN":
    case "INDOOR":
      return "dine_in";
    default:
      return "delivery";
  }
}

// Mapeamento de método de pagamento iFood para interno
function mapIfoodPaymentMethod(methods: any[]): "cash" | "card" | "pix" | "boleto" {
  if (!methods || methods.length === 0) return "card";
  
  const method = methods[0].method?.toUpperCase() || "";
  
  if (method.includes("CASH") || method.includes("DINHEIRO")) return "cash";
  if (method.includes("PIX")) return "pix";
  if (method.includes("BOLETO")) return "boleto";
  return "card";
}

// Converter pedido iFood para formato interno
async function convertIfoodOrderToInternal(ifoodOrder: IfoodOrder, establishmentId: number) {
  // Montar endereço
  let customerAddress = "";
  if (ifoodOrder.delivery?.deliveryAddress) {
    const addr = ifoodOrder.delivery.deliveryAddress;
    customerAddress = `${addr.streetName}, ${addr.streetNumber}`;
    if (addr.complement) customerAddress += ` - ${addr.complement}`;
    customerAddress += ` - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
    if (addr.postalCode) customerAddress += ` - CEP: ${addr.postalCode}`;
    if (addr.reference) customerAddress += ` (Ref: ${addr.reference})`;
  }

  // Gerar número do pedido
  const orderNumber = `IF${ifoodOrder.displayId || ifoodOrder.id.substring(0, 8).toUpperCase()}`;

  // Converter itens
  const items = ifoodOrder.items.map(item => ({
    productId: 0, // Produto externo, não mapeado
    productName: item.name,
    quantity: item.quantity,
    unitPrice: (item.unitPrice / 100).toFixed(2), // iFood envia em centavos
    totalPrice: (item.totalPrice / 100).toFixed(2),
    complements: item.options?.map(opt => ({
      name: `${opt.groupName}: ${opt.name}`,
      price: opt.price / 100,
      quantity: opt.quantity
    })) || [],
    notes: item.observations || null
  }));

  return {
    establishmentId,
    orderNumber,
    customerName: ifoodOrder.customer?.name || "Cliente iFood",
    customerPhone: ifoodOrder.customer?.phone?.number || null,
    customerAddress,
    status: "new" as const,
    deliveryType: mapIfoodOrderType(ifoodOrder.orderType),
    paymentMethod: mapIfoodPaymentMethod(ifoodOrder.payments?.methods || []),
    subtotal: (ifoodOrder.total.subTotal / 100).toFixed(2),
    deliveryFee: (ifoodOrder.total.deliveryFee / 100).toFixed(2),
    discount: (ifoodOrder.total.benefits / 100).toFixed(2),
    total: (ifoodOrder.total.orderAmount / 100).toFixed(2),
    notes: ifoodOrder.extraInfo || ifoodOrder.delivery?.observations || null,
    changeAmount: ifoodOrder.payments?.methods?.[0]?.changeFor 
      ? (ifoodOrder.payments.methods[0].changeFor / 100).toFixed(2) 
      : null,
    source: "ifood" as const,
    externalId: ifoodOrder.id,
    externalDisplayId: ifoodOrder.displayId,
    externalStatus: "PLACED",
    externalData: ifoodOrder as unknown as Record<string, unknown>,
    items
  };
}

export const ifoodRouter = router({
  // Verificar status da integração
  status: protectedProcedure.query(async () => {
    const result = await validateIfoodCredentials();
    return {
      configured: true,
      connected: result.valid,
      error: result.error
    };
  }),

  // Listar pedidos do iFood
  listOrders: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      status: z.enum(["pending_confirmation", "new", "preparing", "ready", "completed", "cancelled"]).optional()
    }))
    .query(async ({ input }) => {
      const orders = await db.getOrdersBySource(input.establishmentId, "ifood", input.status);
      return orders;
    }),

  // Confirmar pedido no iFood
  confirmOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await confirmIfoodOrder(input.externalId);
        await db.updateOrderStatus(input.orderId, "new");
        await db.updateOrderExternalStatus(input.orderId, "CONFIRMED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao confirmar pedido no iFood"
        });
      }
    }),

  // Iniciar preparo no iFood
  startPreparation: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await startIfoodOrderPreparation(input.externalId);
        await db.updateOrderStatus(input.orderId, "preparing");
        await db.updateOrderExternalStatus(input.orderId, "PREPARATION_STARTED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao iniciar preparo no iFood"
        });
      }
    }),

  // Marcar como pronto no iFood
  markReady: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await readyToPickupIfoodOrder(input.externalId);
        await db.updateOrderStatus(input.orderId, "ready");
        await db.updateOrderExternalStatus(input.orderId, "READY_TO_PICKUP");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao marcar pronto no iFood"
        });
      }
    }),

  // Despachar pedido no iFood
  dispatch: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await dispatchIfoodOrder(input.externalId);
        await db.updateOrderExternalStatus(input.orderId, "DISPATCHED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao despachar pedido no iFood"
        });
      }
    }),

  // Buscar motivos de cancelamento
  getCancellationReasons: protectedProcedure
    .input(z.object({
      externalId: z.string()
    }))
    .query(async ({ input }) => {
      try {
        const reasons = await getIfoodCancellationReasons(input.externalId);
        return reasons;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar motivos de cancelamento"
        });
      }
    }),

  // Cancelar pedido no iFood
  cancelOrder: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      externalId: z.string(),
      cancellationCode: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        await requestIfoodOrderCancellation(input.externalId, input.cancellationCode);
        await db.updateOrderStatus(input.orderId, "cancelled");
        await db.updateOrderExternalStatus(input.orderId, "CANCELLED");
        if (input.reason) {
          await db.updateOrderCancellationReason(input.orderId, input.reason);
        }
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao cancelar pedido no iFood"
        });
      }
    }),

  // Processar evento de webhook (chamado internamente)
  processWebhookEvent: publicProcedure
    .input(z.object({
      event: z.any()
    }))
    .mutation(async ({ input }) => {
      const event = input.event as IfoodEvent;
      
      console.log(`[iFood Webhook] Evento recebido: ${event.code} - Pedido: ${event.orderId}`);
      
      try {
        // Processar diferentes tipos de eventos
        switch (event.code) {
          case "PLC": // Pedido colocado (novo pedido)
            // Buscar detalhes do pedido
            const orderDetails = await getIfoodOrderDetails(event.orderId);
            
            // TODO: Identificar o establishmentId correto baseado no merchantId
            // Por enquanto, usar um valor fixo ou buscar do banco
            const establishmentId = 30001; // Placeholder
            
            // Converter e salvar pedido
            const orderData = await convertIfoodOrderToInternal(orderDetails, establishmentId);
            const newOrder = await db.createOrderFromIfood(orderData);
            
            console.log(`[iFood Webhook] Novo pedido criado: ${newOrder?.id}`);
            break;
            
          case "CFM": // Pedido confirmado
            await db.updateOrderExternalStatusByExternalId(event.orderId, "CONFIRMED");
            break;
            
          case "CAN": // Pedido cancelado
            await db.updateOrderStatusByExternalId(event.orderId, "cancelled");
            await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLED");
            break;
            
          case "DSP": // Pedido despachado
            await db.updateOrderExternalStatusByExternalId(event.orderId, "DISPATCHED");
            break;
            
          case "CON": // Pedido concluído
            await db.updateOrderStatusByExternalId(event.orderId, "completed");
            await db.updateOrderExternalStatusByExternalId(event.orderId, "CONCLUDED");
            break;
            
          default:
            console.log(`[iFood Webhook] Evento não tratado: ${event.code}`);
        }
        
        // Enviar acknowledgment
        await acknowledgeIfoodEvent(event.id);
        
        return { success: true };
      } catch (error) {
        console.error(`[iFood Webhook] Erro ao processar evento:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao processar evento do iFood"
        });
      }
    })
});
