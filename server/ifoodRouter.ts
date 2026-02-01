/**
 * iFood Router - Endpoints para integração com iFood
 * Modelo Centralizado - Restaurante só precisa informar o Merchant ID
 * As credenciais OAuth são gerenciadas pelo sistema (variáveis de ambiente)
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { 
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

export const ifoodRouter = router({
  // Buscar configuração/status do iFood do estabelecimento
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
    
    const config = await db.getIfoodConfig(establishment.id);
    
    if (config) {
      return {
        isConnected: config.isConnected,
        isActive: config.isActive,
        merchantId: config.merchantId,
        merchantName: config.merchantName,
        autoAcceptOrders: config.autoAcceptOrders,
        notifyOnNewOrder: config.notifyOnNewOrder,
      };
    }
    
    return {
      isConnected: false,
      isActive: false,
      merchantId: null,
      merchantName: null,
      autoAcceptOrders: false,
      notifyOnNewOrder: true,
    };
  }),

  // Salvar Merchant ID - Modelo Centralizado
  // O restaurante só precisa informar o Merchant ID
  // As credenciais OAuth são do sistema (IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET)
  saveMerchantId: protectedProcedure
    .input(z.object({
      merchantId: z.string().min(1, "Merchant ID é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      try {
        // Salvar o Merchant ID e marcar como conectado
        await db.saveIfoodMerchantInfo(
          establishment.id,
          input.merchantId,
          null // Nome será preenchido depois se necessário
        );
        
        // Marcar como conectado e ativo
        await db.updateIfoodConfigStatus(establishment.id, true);
        
        return { success: true, message: 'Merchant ID salvo com sucesso!' };
      } catch (error) {
        console.error("[iFood] Erro ao salvar Merchant ID:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao salvar Merchant ID'
        });
      }
    }),

  // Desconectar iFood
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
    
    await db.disconnectIfood(establishment.id);
    
    return { success: true };
  }),

  // Ativar/desativar integração (após conectado)
  toggleActive: protectedProcedure
    .input(z.object({
      isActive: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.merchantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Configure o Merchant ID primeiro'
        });
      }
      
      await db.updateIfoodConfigStatus(establishment.id, input.isActive);
      
      return { success: true };
    }),

  // Verificar status da integração
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { configured: false, connected: false, active: false, error: 'Não autenticado' };
    }
    
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) {
      return { configured: false, connected: false, active: false, error: 'Estabelecimento não encontrado' };
    }
    
    const config = await db.getIfoodConfig(establishment.id);
    if (!config) {
      return { configured: false, connected: false, active: false, error: null };
    }
    
    return {
      configured: !!config.merchantId,
      connected: config.isConnected,
      active: config.isActive,
      merchantName: config.merchantName,
      error: null
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
        await db.updateOrderExternalStatus(input.orderId, "IN_PREPARATION");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao iniciar preparo no iFood"
        });
      }
    }),

  // Marcar como pronto no iFood
  readyToPickup: protectedProcedure
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
      cancellationCode: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        await requestIfoodOrderCancellation(input.externalId, input.cancellationCode);
        await db.updateOrderStatus(input.orderId, "cancelled");
        await db.updateOrderExternalStatus(input.orderId, "CANCELLED");
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao cancelar pedido no iFood"
        });
      }
    }),
});
