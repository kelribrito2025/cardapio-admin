/**
 * iFood Router - Endpoints para integração com iFood
 * Fluxo OAuth Distribuído - Cliente apenas autoriza, não precisa de credenciais
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { 
  generateUserCode,
  exchangeAuthorizationCode,
  getMerchants,
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
      // Verificar se o código de usuário ainda é válido
      const userCodeValid = config.userCode && config.userCodeExpiresAt && 
        new Date(config.userCodeExpiresAt) > new Date();
      
      return {
        isConnected: config.isConnected,
        isActive: config.isActive,
        merchantId: config.merchantId,
        merchantName: config.merchantName,
        autoAcceptOrders: config.autoAcceptOrders,
        notifyOnNewOrder: config.notifyOnNewOrder,
        // Código de usuário para autorização (se ainda válido)
        userCode: userCodeValid ? config.userCode : null,
        userCodeExpiresAt: userCodeValid ? config.userCodeExpiresAt : null,
      };
    }
    
    return {
      isConnected: false,
      isActive: false,
      merchantId: null,
      merchantName: null,
      autoAcceptOrders: false,
      notifyOnNewOrder: true,
      userCode: null,
      userCodeExpiresAt: null,
    };
  }),

  // Iniciar processo de conexão - Gera código para o usuário inserir no Partner Portal
  startConnection: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    
    const establishment = await db.getEstablishmentByUserId(ctx.user.id);
    if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
    
    try {
      // Gerar código de usuário via API do iFood
      const result = await generateUserCode();
      
      // Salvar código e verifier no banco
      await db.saveIfoodUserCode(
        establishment.id,
        result.userCode,
        result.authorizationCodeVerifier,
        result.expiresIn
      );
      
      return {
        success: true,
        userCode: result.userCode,
        verificationUrl: result.verificationUrl,
        verificationUrlComplete: result.verificationUrlComplete,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      console.error("[iFood] Erro ao gerar código de usuário:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao iniciar conexão com iFood'
      });
    }
  }),

  // Completar conexão - Trocar código de autorização por tokens
  completeConnection: protectedProcedure
    .input(z.object({
      authorizationCode: z.string().min(1, "Código de autorização é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      // Buscar configuração com o verifier
      const config = await db.getIfoodConfig(establishment.id);
      if (!config?.authorizationCodeVerifier) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Processo de conexão não iniciado. Clique em "Conectar iFood" primeiro.'
        });
      }
      
      try {
        // Trocar código de autorização por tokens
        const tokens = await exchangeAuthorizationCode(
          input.authorizationCode,
          config.authorizationCodeVerifier
        );
        
        // Salvar tokens no banco
        await db.saveIfoodOAuthTokens(
          establishment.id,
          tokens.accessToken,
          tokens.refreshToken,
          tokens.expiresIn
        );
        
        // Buscar informações do merchant
        try {
          const merchants = await getMerchants(establishment.id);
          if (merchants && merchants.length > 0) {
            const merchant = merchants[0];
            await db.saveIfoodMerchantInfo(
              establishment.id,
              merchant.id,
              merchant.name
            );
          }
        } catch (merchantError) {
          console.warn("[iFood] Não foi possível buscar informações do merchant:", merchantError);
        }
        
        return { success: true, message: 'Conexão estabelecida com sucesso!' };
      } catch (error) {
        console.error("[iFood] Erro ao completar conexão:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Erro ao completar conexão com iFood'
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
      if (!config?.isConnected) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conecte ao iFood primeiro antes de ativar a integração'
        });
      }
      
      await db.updateIfoodConfigStatus(establishment.id, input.isActive);
      
      return { success: true };
    }),

  // Atualizar configurações de comportamento
  updateSettings: protectedProcedure
    .input(z.object({
      autoAcceptOrders: z.boolean().optional(),
      notifyOnNewOrder: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      // Atualizar apenas os campos fornecidos
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const updateData: Record<string, boolean> = {};
      if (input.autoAcceptOrders !== undefined) updateData.autoAcceptOrders = input.autoAcceptOrders;
      if (input.notifyOnNewOrder !== undefined) updateData.notifyOnNewOrder = input.notifyOnNewOrder;
      
      if (Object.keys(updateData).length > 0) {
        // Usar SQL direto para atualizar
        const config = await db.getIfoodConfig(establishment.id);
        if (config) {
          // Atualização via função existente
          await db.updateIfoodConfigStatus(establishment.id, config.isActive);
        }
      }
      
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
      configured: true,
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
