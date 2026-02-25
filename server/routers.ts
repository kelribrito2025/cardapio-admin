import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { mindiStoragePut } from "./mindiStorage";
import { processImage, processSingleImage, generateBlurPlaceholder } from "./imageProcessor";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { eq, asc } from "drizzle-orm";
import { sendOrderReadySMS, isValidPhoneNumber } from "./_core/sms";
import { ifoodRouter } from "./ifoodRouter";
import { adminRouter } from "./adminRouter";

import { buildDriverDeliveryMessage } from './driverMessage';
import { botApiKeys } from '../drizzle/schema';
import crypto from 'crypto';

export const appRouter = router({
  system: systemRouter,
  ifood: ifoodRouter,
  admin: adminRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Register with email/password
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está cadastrado.",
          });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Create user
        const user = await db.createUserWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
        });
        
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar usuário.",
          });
        }
        
        // Login automático após criar conta
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        return { success: true, userId: user.id };
      }),
    
    // Login with email/password
    loginWithEmail: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }
        
        // Verify password
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos.",
          });
        }
        
        // Update last signed in
        await db.updateUserLastSignedIn(user.id);
        
        // Create JWT token using SDK to match expected format
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email?.split('@')[0] || 'User',
          expiresInMs: input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        });
        
        return { success: true };
      }),
    
    // Forgot password (placeholder - sends notification to owner)
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ input }) => {
        // Check if user exists
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists or not for security
          return { success: true };
        }
        
        // In a real app, send password reset email
        // For now, just return success
        return { success: true };
      }),
  }),

  // ============ ESTABLISHMENT ============
  establishment: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getEstablishmentByUserId(ctx.user.id);
    }),
    
    getOpenStatus: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getEstablishmentOpenStatus(input.establishmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        logo: z.string().optional(),
        logoBlur: z.string().nullable().optional(),
        coverImage: z.string().optional(),
        coverBlur: z.string().nullable().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        menuSlug: z.string().optional(),
        whatsapp: z.string().optional(),
        instagram: z.string().optional(),
        // Novos campos do onboarding Step 2
        address: z.string().optional(), // Endereço completo (será parseado para street)
        openingTime: z.string().optional(), // Horário de abertura (HH:MM)
        closingTime: z.string().optional(), // Horário de fechamento (HH:MM)
        acceptsPix: z.boolean().optional(),
        acceptsCash: z.boolean().optional(),
        acceptsCard: z.boolean().optional(),
        deliveryTimeMin: z.number().optional(),
        deliveryTimeMax: z.number().optional(),
        deliveryTimeEnabled: z.boolean().optional(),
        minimumOrderEnabled: z.boolean().optional(),
        minimumOrderValue: z.string().optional(),
        deliveryFeeType: z.enum(["free", "fixed", "byNeighborhood"]).optional(),
        deliveryFeeFixed: z.string().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
        timezone: z.string().optional(), // IANA timezone detectado do navegador
        ownerDisplayName: z.string().max(11).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Separar campos que vão para businessHours
        const { address, openingTime, closingTime, ...establishmentData } = input;
        
        // Se tiver endereço, colocar no campo street
        const dataToSave = {
          ...establishmentData,
          street: address || establishmentData.street,
          userId: ctx.user.id,
        };
        
        const id = await db.createEstablishment(dataToSave);
        
        // Criar categoria e item de teste padrão para novos estabelecimentos
        try {
          const categoryId = await db.createCategory({
            establishmentId: id,
            name: 'Categoria teste',
            sortOrder: 0,
          });
          
          await db.createProduct({
            establishmentId: id,
            categoryId: categoryId,
            name: 'Item de teste',
            description: 'Este é apenas um item de teste. Edite para adicionar um produto real do seu restaurante.',
            price: '10.00',
            sortOrder: 0,
          });
        } catch (error) {
          // Não falhar a criação do estabelecimento se a criação do item de teste falhar
          console.error('Erro ao criar categoria/item de teste:', error);
        }
        
        // Criar horários de funcionamento se fornecidos
        if (openingTime && closingTime) {
          try {
            // Criar horários para todos os dias da semana (0=Domingo a 6=Sábado)
            const businessHoursData = [];
            for (let day = 0; day <= 6; day++) {
              businessHoursData.push({
                dayOfWeek: day,
                isActive: true,
                openTime: openingTime,
                closeTime: closingTime,
              });
            }
            await db.saveBusinessHours(id, businessHoursData);
          } catch (error) {
            console.error('Erro ao criar horários de funcionamento:', error);
          }
        }
        
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        logo: z.string().nullable().optional(),
        logoBlur: z.string().nullable().optional(),
        coverImage: z.string().nullable().optional(),
        coverBlur: z.string().nullable().optional(),
        street: z.string().nullable().optional(),
        number: z.string().nullable().optional(),
        complement: z.string().nullable().optional(),
        neighborhood: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        latitude: z.string().nullable().optional(),
        longitude: z.string().nullable().optional(),
        menuSlug: z.string().nullable().optional(),
        whatsapp: z.string().nullable().optional(),
        instagram: z.string().nullable().optional(),
        acceptsCash: z.boolean().optional(),
        acceptsCard: z.boolean().optional(),
        acceptsPix: z.boolean().optional(),
        pixKey: z.string().nullable().optional(),
        acceptsBoleto: z.boolean().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
        allowsDineIn: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        deliveryTimeEnabled: z.boolean().optional(),
        deliveryTimeMin: z.number().optional(),
        deliveryTimeMax: z.number().optional(),
        minimumOrderEnabled: z.boolean().optional(),
        minimumOrderValue: z.string().optional(),
        deliveryFeeType: z.enum(["free", "fixed", "byNeighborhood"]).optional(),
        deliveryFeeFixed: z.string().optional(),
        timezone: z.string().optional(),
        reviewsEnabled: z.boolean().optional(),
        fakeReviewCount: z.number().min(0).max(250).optional(),
        ownerDisplayName: z.string().max(11).nullable().optional(),
        autoAcceptOrders: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Validate slug uniqueness if provided
        if (data.menuSlug) {
          const isAvailable = await db.isSlugAvailable(data.menuSlug, id);
          if (!isAvailable) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este link já está em uso por outro restaurante.",
            });
          }
        }
        
        await db.updateEstablishment(id, data);
        return { success: true };
      }),
    
    checkSlugAvailability: publicProcedure
      .input(z.object({
        slug: z.string().min(1),
        excludeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const isAvailable = await db.isSlugAvailable(input.slug, input.excludeId);
        return { available: isAvailable };
      }),
    
    // Informações do trial
    getTrialInfo: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return null;
      
      const isTrial = establishment.planType === 'trial';
      if (!isTrial || !establishment.trialStartDate) {
        return { isTrial: false, trialExpired: false, daysRemaining: 0, planType: establishment.planType };
      }
      
      const now = new Date();
      const trialStart = new Date(establishment.trialStartDate);
      const trialEnd = new Date(trialStart.getTime() + establishment.trialDays * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      
      return {
        isTrial: true,
        daysRemaining,
        trialDays: establishment.trialDays,
        trialStartDate: establishment.trialStartDate,
        trialExpired: daysRemaining === 0,
        planType: establishment.planType,
      };
    }),

    // Ativar plano após pagamento
    activatePlan: protectedProcedure
      .input(z.object({
        planType: z.enum(['basic', 'pro', 'enterprise']),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        await db.activatePlan(establishment.id, input.planType);
        return { success: true };
      }),

    toggleOpen: protectedProcedure
      .input(z.object({
        id: z.number(),
        isOpen: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleEstablishmentOpen(input.id, input.isOpen);
        return { success: true };
      }),
    
    // Nova mutation para fechamento manual com reabertura automática
    setManualClose: protectedProcedure
      .input(z.object({
        id: z.number(),
        close: z.boolean(), // true = fechar manualmente, false = abrir
      }))
      .mutation(async ({ input }) => {
        await db.setManualClose(input.id, input.close);
        return { success: true };
      }),
    
    // Salvar nota pública temporária
    savePublicNote: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().max(80, "A nota deve ter no máximo 80 caracteres"),
        noteStyle: z.string().optional(),
        validityDays: z.number().min(1).max(7).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.savePublicNote(input.id, input.note, input.noteStyle, input.validityDays);
        return { success: true };
      }),
    
    // Remover nota pública
    removePublicNote: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.removePublicNote(input.id);
        return { success: true };
      }),
    
    // Buscar horários de funcionamento
    getBusinessHours: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessHoursByEstablishment(input.establishmentId);
      }),
    
    // Salvar horários de funcionamento
    saveBusinessHours: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        hours: z.array(z.object({
          dayOfWeek: z.number().min(0).max(6),
          isActive: z.boolean(),
          openTime: z.string().nullable(),
          closeTime: z.string().nullable(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.saveBusinessHours(input.establishmentId, input.hours);
        return { success: true };
      }),
    
    // ============ CONTA E SEGURANÇA ============
    
    // Obter dados da conta
    getAccountData: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const accountData = await db.getEstablishmentAccountData(input.establishmentId);
        // Incluir e-mail do usuário da plataforma
        return {
          ...accountData,
          userEmail: ctx.user.email,
          userName: ctx.user.name,
        };
      }),
    
    // Atualizar dados da conta
    updateAccountData: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome do estabelecimento é obrigatório").optional(),
        email: z.string().email("Email inválido").nullable().optional(),
        cnpj: z.string().nullable().optional(),
        responsibleName: z.string().nullable().optional(),
        responsiblePhone: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { establishmentId, ...data } = input;
        await db.updateEstablishmentAccountData(establishmentId, data);
        
        // Se o nome do responsável foi alterado, atualizar também o nome do usuário
        if (input.responsibleName) {
          await db.updateUserName(ctx.user.id, input.responsibleName);
        }
        
        return { success: true };
      }),
    
    // Alterar senha
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
        confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se as senhas coincidem
        if (input.newPassword !== input.confirmPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nova senha e confirmação não coincidem.",
          });
        }
        
        // Buscar usuário com hash da senha
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não possui senha cadastrada.",
          });
        }
        
        // Verificar senha atual
        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta.",
          });
        }
        
        // Atualizar senha
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(ctx.user.id, newPasswordHash);
        
        return { success: true };
      }),
    
    // Toggle 2FA por e-mail
    toggleTwoFactor: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        enabled: z.boolean(),
        email: z.string().email("Email inválido").optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTwoFactorSettings(input.establishmentId, input.enabled, input.email);
        return { success: true };
      }),
  }),

  // ============ CATEGORIES ============
  category: router({
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getCategoriesByEstablishment(input.establishmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const newId = await db.duplicateCategory(input.id);
        return { id: newId };
      }),

    reorder: protectedProcedure
      .input(z.array(z.object({
        id: z.number(),
        sortOrder: z.number(),
      })))
      .mutation(async ({ input }) => {
        await db.reorderCategories(input);
        return { success: true };
      }),
  }),

  // ============ MENU VIEWS ============
  menuViews: router({
    // Procedure pública para registrar sessão do cardápio
    registerSession: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.registerMenuSession(input.sessionId, input.establishmentId);
        
        // Incrementar contagem do mapa de calor usando timezone do estabelecimento
        const tz = await db.getEstablishmentTimezone(input.establishmentId);
        const localTime = db.getLocalDate(tz);
        const dayOfWeek = localTime.getDay();
        const hour = localTime.getHours();
        await db.incrementMenuViewHourly(input.establishmentId, dayOfWeek, hour);
        
        return { success: true };
      }),
    
    // Procedure protegida para contar visualizações ativas
    getActiveViewers: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { activeViewers: 0 };
        const count = await db.getActiveViewers(establishment.id);
        return { activeViewers: count };
      }),
    
    // Procedure protegida para buscar estatísticas de visualizações
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return {
            totalViews: 0,
            uniqueVisitors: 0,
            previousTotalViews: 0,
            previousUniqueVisitors: 0,
            dailyViews: [],
            percentageChange: 0,
          };
        }
        return db.getMenuViewsStats(establishment.id);
      }),
    
    // Procedure protegida para buscar histórico de visualizações
    getHistory: protectedProcedure
      .input(z.object({
        days: z.number().optional().default(7),
      }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return [];
        return db.getMenuViewsHistory(establishment.id, input.days);
      }),
    
    // Procedure protegida para buscar dados do mapa de calor
    getHeatmap: protectedProcedure
      .input(z.object({ period: z.enum(['today', 'week', 'month']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return {
            data: [],
            maxCount: 0,
            totalViews: 0,
            periodViews: 0,
            previousPeriodViews: 0,
            viewsChange: 0,
          };
        }
        return db.getMenuViewsHeatmapWithPeriod(establishment.id, input?.period ?? 'today');
      }),
  }),

  // ============ PRODUCTS ============
  product: router({
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        hasStock: z.boolean().optional(),
        orderBy: z.enum(["name", "price", "salesCount"]).optional(),
        orderDir: z.enum(["asc", "desc"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { establishmentId, ...filters } = input;
        return db.getProductsByEstablishment(establishmentId, filters);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string(),
        images: z.array(z.string()).optional(),
        blurPlaceholder: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProduct(input);
        // Criar automaticamente item de estoque quando controle de estoque está ativado
        if (input.hasStock) {
          try {
            await db.createStockItem({
              establishmentId: input.establishmentId,
              name: input.name,
              currentQuantity: input.stockQuantity ? String(input.stockQuantity) : "0",
              minQuantity: "0",
              unit: "unidade",
              linkedProductId: id,
            });
          } catch (e) {
            console.error("Erro ao criar item de estoque automaticamente:", e);
          }
        }
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        price: z.string().optional(),
        images: z.array(z.string()).nullable().optional(),
        blurPlaceholder: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Verificar se o produto já tinha estoque ativado antes
        const existingProduct = await db.getProductById(id);
        await db.updateProduct(id, data);
        // Se desativou controle de estoque, remover item de estoque vinculado
        if (input.hasStock === false) {
          try {
            const existingStockItem = await db.getStockItemByLinkedProductId(id);
            if (existingStockItem) {
              await db.deleteStockItem(existingStockItem.id);
              console.log(`[Estoque] Removido item de estoque vinculado ao produto ${id}`);
            }
          } catch (e) {
            console.error("Erro ao remover item de estoque automaticamente:", e);
          }
        }
        // Se ativou controle de estoque, verificar se já existe item de estoque vinculado
        if (input.hasStock && existingProduct) {
          try {
            const existingStockItem = await db.getStockItemByLinkedProductId(id);
            if (!existingStockItem) {
              // Criar item de estoque vinculado ao produto
              await db.createStockItem({
                establishmentId: existingProduct.establishmentId,
                name: input.name || existingProduct.name,
                currentQuantity: input.stockQuantity ? String(input.stockQuantity) : "0",
                minQuantity: "0",
                unit: "unidade",
                linkedProductId: id,
              });
            } else {
              // Atualizar quantidade do item de estoque existente
              await db.updateStockItem(existingStockItem.id, {
                currentQuantity: input.stockQuantity ? String(input.stockQuantity) : existingStockItem.currentQuantity,
                name: input.name || existingStockItem.name,
              });
            }
          } catch (e) {
            console.error("Erro ao criar/atualizar item de estoque automaticamente:", e);
          }
        }
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
    
    toggleStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "paused"]),
      }))
      .mutation(async ({ input }) => {
        await db.toggleProductStatus(input.id, input.status);
        return { success: true };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const newId = await db.duplicateProduct(input.id);
        return { id: newId };
      }),
    
    reorder: protectedProcedure
      .input(z.array(z.object({
        id: z.number(),
        sortOrder: z.number(),
      })))
      .mutation(async ({ input }) => {
        await db.reorderProducts(input);
        return { success: true };
      }),
  }),

  // ============ COMPLEMENTS ============
  complement: router({
    listGroups: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        // Verificar se o produto é um combo
        const product = await db.getProductById(input.productId);
        
        // Se for combo, buscar TANTO comboGroups QUANTO complementGroups (importados dos itens)
        if (product?.isCombo) {
          // 1. Buscar comboGroups (grupos definidos na criação do combo)
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          const convertedComboGroups = comboGroupsData.map(group => ({
            id: group.id,
            productId: group.productId,
            name: group.name,
            minQuantity: group.isRequired ? 1 : 0,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            items: group.items.map(item => ({
              id: item.id,
              groupId: group.id,
              name: item.productName || 'Produto',
              price: item.productPrice || '0',
              imageUrl: item.productImages?.[0] || null,
              isActive: item.productStatus === 'active',
              priceMode: (Number(item.productPrice) > 0 ? 'normal' : 'free') as 'normal' | 'free',
              sortOrder: item.sortOrder,
              availabilityType: 'always' as const,
              availableDays: null,
              availableHours: null,
              badgeText: null,
              createdAt: group.createdAt,
              updatedAt: group.updatedAt,
            })),
          }));

          // 2. Buscar complementGroups (importados dos itens que tinham complementos)
          const complementGroupsData = await db.getComplementGroupsByProduct(input.productId);
          const complementGroupsWithItems = await Promise.all(
            complementGroupsData.map(async (group) => {
              const items = await db.getComplementItemsByGroup(group.id, input.productId);
              return { ...group, items };
            })
          );

          // 3. Combinar ambos os tipos de grupos
          return [...convertedComboGroups, ...complementGroupsWithItems];
        }
        
        // Se NÃO for combo, buscar complementos normais
        const groups = await db.getComplementGroupsByProduct(input.productId);
        const groupsWithItems = await Promise.all(
          groups.map(async (group) => {
            const items = await db.getComplementItemsByGroup(group.id, input.productId);
            return {
              ...group,
              items,
            };
          })
        );
        return groupsWithItems;
      }),
    
    listItems: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        return db.getComplementItemsByGroup(input.groupId);
      }),
    
    createGroup: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().min(1),
        minQuantity: z.number().default(0),
        maxQuantity: z.number().default(1),
        isRequired: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createComplementGroup(input);
        return { id };
      }),
    
    updateGroup: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        minQuantity: z.number().optional(),
        maxQuantity: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Cada grupo é independente por produto - sem sincronização global
        await db.updateComplementGroup(id, data);
        return { success: true };
      }),
    
    deleteGroup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComplementGroup(input.id);
        return { success: true };
      }),
    
    createItem: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        name: z.string().min(1),
        price: z.string().default("0"),
        imageUrl: z.string().nullable().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createComplementItem(input);
        return { id };
      }),
    
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        price: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        priceMode: z.enum(["normal", "free"]).optional(),
        sortOrder: z.number().optional(),
        badgeText: z.string().nullable().optional(),
        availabilityType: z.enum(["always", "scheduled"]).optional(),
        availableDays: z.array(z.number()).nullable().optional(),
        availableHours: z.array(z.object({
          day: z.number(),
          startTime: z.string(),
          endTime: z.string(),
        })).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Cada complemento é independente por grupo - sem sincronização global
        await db.updateComplementItem(id, data);
        return { success: true };
      }),
    
    // Listar todos os complementos do estabelecimento (para gestão global)
    listAllByEstablishment: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getAllComplementItemsByEstablishment(input.establishmentId);
      }),
    
    // Atualizar status (ativo/pausado) de um complemento
    toggleActive: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateComplementItem(input.id, { isActive: input.isActive });
        return { success: true };
      }),
    
    // Atualizar modo de preço (normal/grátis) de um complemento
    togglePriceMode: protectedProcedure
      .input(z.object({
        id: z.number(),
        priceMode: z.enum(["normal", "free"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateComplementItem(input.id, { priceMode: input.priceMode });
        return { success: true };
      }),
    
    // Atualizar complemento (com groupId = apenas no grupo específico, sem groupId = propaga para todos)
    updateGlobal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        complementName: z.string(),
        groupIds: z.array(z.number()).optional(),
        newName: z.string().optional(),
        isActive: z.boolean().optional(),
        priceMode: z.enum(["normal", "free"]).optional(),
        price: z.string().optional(),
        availabilityType: z.enum(["always", "scheduled"]).optional(),
        availableDays: z.array(z.number()).nullable().optional(),
        availableHours: z.array(z.object({
          day: z.number(),
          startTime: z.string(),
          endTime: z.string(),
        })).nullable().optional(),
        badgeText: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { establishmentId, complementName, groupIds, newName, ...data } = input;
        const updateData = { ...data, ...(newName ? { name: newName } : {}) };
        await db.updateComplementItemsByName(establishmentId, complementName, updateData, groupIds);
        return { success: true };
      }),
    
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComplementItem(input.id);
        return { success: true };
      }),
    
    // ---- Global Group Management ----
    
    // List all unique groups across all products of an establishment
    listAllGroups: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getAllComplementGroupsByEstablishment(input.establishmentId);
      }),
    
    // Pause/activate a group globally by name
    toggleGroupActive: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleComplementGroupByName(input.establishmentId, input.groupName, input.isActive);
        return { success: true };
      }),
    
    // Delete a group globally by name
    deleteGroupByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteComplementGroupByName(input.establishmentId, input.groupName);
        return { success: true };
      }),
    
    // Update group rules (min, max, required, name) globally by name
    updateGroupRules: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        newName: z.string().optional(),
        minQuantity: z.number().optional(),
        maxQuantity: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { establishmentId, groupName, newName, ...data } = input;
        const updateData = { ...data, ...(newName ? { name: newName } : {}) };
        await db.updateComplementGroupRulesByName(establishmentId, groupName, updateData);
        return { success: true };
      }),
    
    // Delete a complement item by name across all groups
    deleteItemByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        itemName: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteComplementItemByName(input.establishmentId, input.itemName);
        return { success: true };
      }),
    
    // Get global template prices for comparison ("Personalizado" badge)
    getGlobalTemplatePrices: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getGlobalTemplatePrices(input.establishmentId);
      }),
    
    // Add a complement item to all groups with a specific name
    addItemToGroupByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        name: z.string().min(1),
        price: z.string().default("0"),
      }))
      .mutation(async ({ input }) => {
        const count = await db.addComplementItemToGroupByName(
          input.establishmentId,
          input.groupName,
          { name: input.name, price: input.price }
        );
        return { success: true, groupsAffected: count };
      }),

    // Add an exclusive item to a specific product within a group
    addExclusiveItem: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        productId: z.number(),
        name: z.string().min(1),
        price: z.string().default("0"),
      }))
      .mutation(async ({ input }) => {
        const result = await db.addExclusiveComplementItem(
          input.establishmentId,
          input.groupName,
          input.productId,
          { name: input.name, price: input.price }
        );
        return { success: true, ...result };
      }),

    // Remove an exclusive item
    removeExclusiveItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeExclusiveComplementItem(input.itemId);
        return { success: true };
      }),
  }),

  // ============ ORDERS ============
  order: router({
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
      }))
      .query(async ({ input }) => {
        return db.getOrdersByEstablishment(input.establishmentId, input.status);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderNumber: z.string(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]).default("delivery"),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto"]).default("cash"),
        subtotal: z.string(),
        deliveryFee: z.string().default("0"),
        discount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        total: z.string(),
        changeAmount: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["pending_confirmation", "new", "preparing", "ready", "completed", "cancelled"]).optional(),
        source: z.enum(["internal", "ifood", "rappi", "ubereats", "pdv"]).optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, couponId, ...orderData } = input;
        const result = await db.createOrderWithNumber(orderData, items.map(item => ({
          ...item,
          orderId: 0, // Will be set in db function
        })));
        
        // Incrementar uso do cupom se foi aplicado
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }
        
        return result;
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month']).optional() }))
      .query(async ({ input }) => {
        return db.getDashboardStats(input.establishmentId, input.period ?? 'today');
      }),
    
    weeklyStats: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getWeeklyStats(input.establishmentId);
      }),
    
    recentOrders: protectedProcedure
      .input(z.object({ 
        establishmentId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getRecentOrders(input.establishmentId, input.limit);
      }),
    
    lowStock: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getLowStockProducts(input.establishmentId);
      }),
    
    weeklyRevenue: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month']).optional() }))
      .query(async ({ input }) => {
        return db.getRevenueByPeriod(input.establishmentId, input.period ?? 'week');
      }),
    
    conversionRate: protectedProcedure
      .input(z.object({ establishmentId: z.number(), period: z.enum(['today', 'week', 'month']).optional() }))
      .query(async ({ input }) => {
        return db.getConversionRate(input.establishmentId, input.period ?? 'today');
      }),
  }),

  // ============ STOCK ============
  stock: router({
    // Stock Categories
    listCategories: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStockCategoriesByEstablishment(input.establishmentId);
      }),
    
    createCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createStockCategory(input);
        return { id };
      }),
    
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStockCategory(id, data);
        return { success: true };
      }),
    
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStockCategory(input.id);
        return { success: true };
      }),
    
    // Stock Items
    listItems: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["ok", "low", "critical", "out_of_stock"]).optional(),
      }))
      .query(async ({ input }) => {
        const { establishmentId, ...filters } = input;
        return db.getStockItemsByEstablishment(establishmentId, filters);
      }),
    
    getItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getStockItemById(input.id);
      }),
    
    createItem: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1),
        currentQuantity: z.string().default("0"),
        minQuantity: z.string().default("0"),
        maxQuantity: z.string().nullable().optional(),
        unit: z.enum(["kg", "g", "L", "ml", "unidade", "pacote", "caixa", "dúzia"]).default("unidade"),
        costPerUnit: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createStockItem(input);
        return { id };
      }),
    
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().nullable().optional(),
        name: z.string().min(1).optional(),
        currentQuantity: z.string().optional(),
        minQuantity: z.string().optional(),
        maxQuantity: z.string().nullable().optional(),
        unit: z.enum(["kg", "g", "L", "ml", "unidade", "pacote", "caixa", "dúzia"]).optional(),
        costPerUnit: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStockItem(id, data);
        return { success: true };
      }),
    
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStockItem(input.id);
        return { success: true };
      }),
    
    markOutOfStock: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateStockItem(input.id, { currentQuantity: "0", status: "out_of_stock" });
        return { success: true };
      }),
    
    // Stock Movements
    addMovement: protectedProcedure
      .input(z.object({
        stockItemId: z.number(),
        type: z.enum(["entry", "exit", "adjustment", "loss"]),
        quantity: z.string(),
        reason: z.string().optional(),
        orderId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addStockMovement({
          ...input,
          userId: ctx.user.id,
          previousQuantity: "0", // Will be calculated in db function
          newQuantity: "0", // Will be calculated in db function
        });
        return { id };
      }),
    
    listMovements: protectedProcedure
      .input(z.object({
        stockItemId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        return db.getStockMovementsByItem(input.stockItemId, input.limit);
      }),
    
    outOfStockCount: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getOutOfStockCount(input.establishmentId);
      }),

    recentMovements: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ input }) => {
        return db.getRecentStockMovements(input.establishmentId, input.limit);
      }),
    
    summary: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStockSummary(input.establishmentId);
      }),
  }),

  // ============ PUBLIC MENU ============
  publicMenu: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.getPublicMenuData(input.slug);
      }),
    
    // Buscar horários de funcionamento públicos
    getBusinessHours: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getBusinessHoursForPublicMenu(input.establishmentId);
      }),
    
    getProductComplements: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        // Verificar se o produto é um combo
        const product = await db.getProductById(input.productId);
        if (!product) return [];
        
        // Se for combo, buscar TANTO comboGroups QUANTO complementGroups (importados dos itens)
        if (product.isCombo) {
          // 1. Buscar comboGroups (grupos definidos na criação do combo)
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          const convertedComboGroups = comboGroupsData.map(group => ({
            id: group.id,
            productId: group.productId,
            name: group.name,
            minQuantity: group.isRequired ? 1 : 0,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            items: group.items
              .filter(item => item.productStatus === 'active')
              .map(item => ({
                id: item.id,
                groupId: group.id,
                name: item.productName || 'Produto',
                price: item.productPrice || '0',
                imageUrl: item.productImages?.[0] || null,
                isActive: item.productStatus === 'active',
                priceMode: (Number(item.productPrice) > 0 ? 'normal' : 'free') as 'normal' | 'free',
                sortOrder: item.sortOrder,
                availabilityType: 'always' as const,
                availableDays: null,
                availableHours: null,
                badgeText: null,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
              })),
          }));

          // 2. Buscar complementGroups (importados dos itens que tinham complementos)
          const complementGroupsData = await db.getComplementGroupsByProduct(input.productId);
          const complementGroupsWithItems = await Promise.all(
            complementGroupsData
              .filter(group => group.isActive !== false) // Filtrar grupos pausados
              .map(async (group) => {
                const items = await db.getComplementItemsByGroup(group.id);
                return { ...group, items: items.filter(item => item.isActive) };
              })
          );

          // 3. Combinar ambos os tipos de grupos
          return [...convertedComboGroups, ...complementGroupsWithItems];
        }
        
        // Se NÃO for combo, buscar complementos normais
        const groups = await db.getComplementGroupsByProduct(input.productId);
        
        // Obter timezone do estabelecimento
        const tz = await db.getEstablishmentTimezone(product.establishmentId);
        const localTime = db.getLocalDate(tz);
        const currentDay = localTime.getDay();
        const currentTime = localTime.toTimeString().slice(0, 5);
        
        // Função para verificar se um complemento está disponível agora
        const isComplementAvailable = (item: {
          isActive: boolean;
          availabilityType: string | null;
          availableDays: number[] | null;
          availableHours: { day: number; startTime: string; endTime: string }[] | null;
        }) => {
          // Se não está ativo, não está disponível
          if (!item.isActive) return false;
          
          // Se é "always" ou não tem tipo definido, está sempre disponível
          if (!item.availabilityType || item.availabilityType === 'always') return true;
          
          // Se é "scheduled", verificar dias e horários
          if (item.availabilityType === 'scheduled') {
            // Verificar se o dia atual está nos dias disponíveis
            if (!item.availableDays || !item.availableDays.includes(currentDay)) {
              return false;
            }
            
            // Verificar se o horário atual está em algum intervalo configurado para o dia
            if (item.availableHours && item.availableHours.length > 0) {
              const dayHours = item.availableHours.filter(h => h.day === currentDay);
              if (dayHours.length === 0) return false;
              
              return dayHours.some(h => {
                return currentTime >= h.startTime && currentTime <= h.endTime;
              });
            }
            
            // Se tem dias mas não tem horários configurados, considera o dia inteiro
            return true;
          }
          
          return true;
        };
        
        const groupsWithItems = await Promise.all(
          groups
            .filter(group => group.isActive !== false) // Filtrar grupos pausados
            .map(async (group) => {
              const items = await db.getComplementItemsByGroup(group.id);
              return {
                ...group,
                items: items.filter(item => isComplementAvailable(item)),
              };
            })
        );
        return groupsWithItems;
      }),
    
    // Buscar taxas de entrega por bairro
    getNeighborhoodFees: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getNeighborhoodFeesByEstablishment(input.establishmentId);
      }),
    
    // Create order from public menu
    createOrder: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerPhone: z.string().min(1, "Telefone é obrigatório"),
        customerAddress: z.string().optional(),
        deliveryType: z.enum(["delivery", "pickup", "dine_in"]),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto", "card_online"]),
        subtotal: z.string(),
        deliveryFee: z.string().optional(),
        discount: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
        changeAmount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        loyaltyCardId: z.number().optional(),
        isScheduled: z.boolean().optional(),
        scheduledAt: z.string().optional(),
        cashbackAmount: z.string().optional(),
        cashbackCustomerPhone: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, couponId, loyaltyCardId, isScheduled, scheduledAt, cashbackAmount, cashbackCustomerPhone, ...orderData } = input;
        
        console.log('[CreateOrder] Iniciando criação de pedido:', {
          establishmentId: orderData.establishmentId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryType: orderData.deliveryType,
          paymentMethod: orderData.paymentMethod,
          itemsCount: items.length,
          total: orderData.total,
        });
        
        // Verificar se o estabelecimento está aberto
        const establishment = await db.getEstablishmentById(orderData.establishmentId);
        if (!establishment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estabelecimento não encontrado',
          });
        }
        
        // Verificar se o estabelecimento está aberto (cálculo dinâmico baseado em horários de funcionamento)
        const storeStatus = await db.getEstablishmentOpenStatus(orderData.establishmentId);
        
        if (!storeStatus.isOpen) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'O estabelecimento está fechado no momento. Não é possível realizar pedidos.',
          });
        }
        
        // Validar disponibilidade dos complementos usando timezone do estabelecimento
        const orderTz = establishment.timezone || 'America/Sao_Paulo';
        const orderLocalTime = db.getLocalDate(orderTz);
        const currentDay = orderLocalTime.getDay();
        const currentTime = orderLocalTime.toTimeString().slice(0, 5);
        
        for (const item of items) {
          if (item.complements && item.complements.length > 0) {
            // Buscar grupos de complementos do produto
            const groups = await db.getComplementGroupsByProduct(item.productId);
            for (const group of groups) {
              const complementItems = await db.getComplementItemsByGroup(group.id);
              
              for (const complement of item.complements) {
                const dbComplement = complementItems.find(c => c.name === complement.name);
                if (dbComplement) {
                  // Verificar se o complemento está disponível
                  if (!dbComplement.isActive) {
                    throw new TRPCError({
                      code: 'BAD_REQUEST',
                      message: `O complemento "${complement.name}" não está mais disponível.`,
                    });
                  }
                  
                  if (dbComplement.availabilityType === 'scheduled') {
                    const availableDays = dbComplement.availableDays as number[] | null;
                    const availableHours = dbComplement.availableHours as { day: number; startTime: string; endTime: string }[] | null;
                    
                    if (availableDays && !availableDays.includes(currentDay)) {
                      throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `O complemento "${complement.name}" não está disponível hoje.`,
                      });
                    }
                    
                    if (availableHours && availableHours.length > 0) {
                      const dayHours = availableHours.filter(h => h.day === currentDay);
                      const isInTimeRange = dayHours.some(h => currentTime >= h.startTime && currentTime <= h.endTime);
                      
                      if (!isInTimeRange) {
                        throw new TRPCError({
                          code: 'BAD_REQUEST',
                          message: `O complemento "${complement.name}" não está disponível neste horário.`,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        try {
          const result = await db.createPublicOrder(
          {
            establishmentId: orderData.establishmentId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress || null,
            deliveryType: orderData.deliveryType,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            deliveryFee: orderData.deliveryFee || "0",
            discount: orderData.discount || "0",
            total: orderData.total,
            notes: orderData.notes || null,
            changeAmount: orderData.changeAmount || null,
            couponCode: orderData.couponCode || null,
            isScheduled: isScheduled || false,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            movedToQueue: false,
            orderNumber: "", // Will be generated in db function
          },
          items.map(item => ({
            orderId: 0, // Will be set in db function
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: (item.complements || []).map(c => ({ ...c, quantity: c.quantity || 1 })),
            notes: item.notes || null,
          }))
        );
        
        // Increment coupon usage if coupon was used
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }
        
        // Processar uso de cashback se foi utilizado
        if (cashbackAmount && cashbackCustomerPhone && result && parseFloat(cashbackAmount) > 0) {
          try {
            const cashbackUsed = parseFloat(cashbackAmount);
            // Validar saldo no backend
            const balance = await db.getCashbackBalance(orderData.establishmentId, cashbackCustomerPhone);
            if (balance && parseFloat(balance.balance) >= cashbackUsed) {
              await db.debitCashback({
                establishmentId: orderData.establishmentId,
                customerPhone: cashbackCustomerPhone,
                amount: cashbackUsed.toFixed(2),
                orderId: result.orderId,
              });
              console.log('[CreateOrder] Cashback utilizado:', cashbackUsed, 'para pedido:', result.orderId);
            } else {
              console.warn('[CreateOrder] Saldo de cashback insuficiente:', balance?.balance, 'necessário:', cashbackUsed);
            }
          } catch (error) {
            console.error('[CreateOrder] Erro ao processar cashback:', error);
            // Não lançar erro para não impedir o pedido
          }
        }
        
        // Consumir cupom de fidelidade e resetar cartão se foi usado
        if (loyaltyCardId && result) {
          try {
            // Limpar o cupom ativo e resetar os carimbos do cartão
            await db.consumeLoyaltyCardCoupon(loyaltyCardId);
            console.log('[CreateOrder] Cupom de fidelidade consumido, cartão resetado:', loyaltyCardId);
          } catch (error) {
            console.error('[CreateOrder] Erro ao consumir cupom de fidelidade:', error);
            // Não lançar erro para não impedir o pedido
          }
        }
        
        console.log('[CreateOrder] Pedido criado com sucesso:', result);
        
        // Adicionar pedido à fila de impressão automática
        console.log('[CreateOrder] Verificando impressão automática para pedido:', result?.orderId, 'estabelecimento:', orderData.establishmentId);
        if (result && result.orderId) {
          try {
            // Verificar se impressão automática está ativada
            const printerSettingsData = await db.getPrinterSettings(orderData.establishmentId);
            console.log('[CreateOrder] Configurações de impressão:', printerSettingsData?.autoPrintEnabled, printerSettingsData);
            if (printerSettingsData?.autoPrintEnabled) {
              await db.addToPrintQueue({
                establishmentId: orderData.establishmentId,
                orderId: result.orderId,
                copies: 1
              });
              console.log('[CreateOrder] Pedido adicionado à fila de impressão:', result.orderId);
            }
          } catch (printError) {
            console.error('[CreateOrder] Erro ao adicionar à fila de impressão:', printError);
            // Não lançar erro para não impedir o pedido
          }
        }
        
        return result;
        } catch (error) {
          console.error('[CreateOrder] Erro ao criar pedido:', error);
          console.error('[CreateOrder] Dados do pedido:', {
            establishmentId: orderData.establishmentId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            deliveryType: orderData.deliveryType,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            total: orderData.total,
            itemsCount: items.length,
          });
          throw error;
        }
      }),
    
    // Get order by number (for tracking) - legacy, returns most recent match
    getOrderByNumber: publicProcedure
      .input(z.object({
        orderNumber: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getPublicOrderByNumber(input.orderNumber, input.establishmentId);
      }),
    
    // Get order by unique ID (for tracking - preferred over getOrderByNumber)
    getOrderById: publicProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getPublicOrderById(input.orderId);
      }),
    
    // Get orders by phone (for order history)
    getOrdersByPhone: publicProcedure
      .input(z.object({
        phone: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getOrdersByPhone(input.phone, input.establishmentId);
      }),
    
    // Validate coupon for checkout
    validateCoupon: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        code: z.string().min(1, "Código do cupom é obrigatório"),
        orderValue: z.number().min(0),
        deliveryType: z.enum(["delivery", "pickup", "self_service"]),
      }))
      .query(async ({ input }) => {
        return db.validateCoupon(
          input.establishmentId,
          input.code.toUpperCase(),
          input.orderValue,
          input.deliveryType
        );
      }),

    // Check if customer can review (last review > 30 days ago)
    canReview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerPhone: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const lastReview = await db.getLastReviewByCustomer(
          input.establishmentId,
          input.customerPhone
        );
        
        if (!lastReview) {
          return { canReview: true, lastReviewDate: null };
        }
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const canReview = new Date(lastReview.createdAt) < thirtyDaysAgo;
        return { 
          canReview, 
          lastReviewDate: lastReview.createdAt,
          daysUntilNextReview: canReview ? 0 : Math.ceil((new Date(lastReview.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
        };
      }),

    // Create review from public menu
    createReview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderId: z.number().optional(),
        customerName: z.string().min(1, "Nome é obrigatório"),
        customerPhone: z.string().min(1, "Telefone é obrigatório"),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se pode avaliar (30 dias desde última avaliação)
        const lastReview = await db.getLastReviewByCustomer(
          input.establishmentId,
          input.customerPhone
        );
        
        if (lastReview) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (new Date(lastReview.createdAt) >= thirtyDaysAgo) {
            throw new Error("Você já avaliou este restaurante nos últimos 30 dias.");
          }
        }
        
        // Normalizar telefone removendo caracteres especiais
        const normalizedPhone = input.customerPhone.replace(/[^0-9]/g, '');
        
        const reviewId = await db.createReview({
          establishmentId: input.establishmentId,
          orderId: input.orderId || null,
          customerName: input.customerName,
          customerPhone: normalizedPhone,
          rating: input.rating,
          comment: input.comment || null,
        });
        return { success: true, reviewId };
      }),

    // Get reviews for establishment
    getReviews: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getReviewsByEstablishment(input.establishmentId, input.limit || 50);
      }),
  }),
  
  // ============ ORDERS (ADMIN) ============
  orders: router({
    // List all orders for admin
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getAllOrdersByEstablishment(input.establishmentId, {
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        });
      }),
    
    // Get active orders (new, preparing, ready)
    getActive: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getActiveOrdersByEstablishment(input.establishmentId);
      }),
    
    // Get single order with items
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    
    // Update order status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]),
        cancellationReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status, input.cancellationReason);
        
        // Enviar notificação via WhatsApp
        try {
          const order = await db.getOrderById(input.id);
          if (order && order.customerPhone) {
            const config = await db.getWhatsappConfig(order.establishmentId);
            if (config && config.status === 'connected') {
              // Verificar se deve notificar para este status
              const shouldNotify = 
                (input.status === 'preparing' && config.notifyOnPreparing) ||
                (input.status === 'ready' && config.notifyOnReady) ||
                (input.status === 'out_for_delivery' && (config.notifyOnOutForDelivery !== false)) ||
                (input.status === 'completed' && config.notifyOnCompleted) ||
                (input.status === 'cancelled' && config.notifyOnCancelled);
              
              if (shouldNotify && config.instanceToken) {
                const { sendOrderStatusNotification } = await import('./_core/uazapi');
                const establishment = await db.getEstablishmentById(order.establishmentId);
                const orderItems = await db.getOrderItems(order.id);
                
                // Buscar info de cashback se o pedido for completed
                let cashbackInfo: { cashbackEarned: string; cashbackTotal: string } | null = null;
                if (input.status === 'completed' && order.customerPhone) {
                  try {
                    const estData = await db.getEstablishmentById(order.establishmentId);
                    if (estData?.cashbackEnabled && estData?.rewardProgramType === 'cashback') {
                      // Buscar a transação de crédito gerada para este pedido
                      const cashbackTx = await db.getCashbackTransactionByOrderId(order.id);
                      if (cashbackTx && parseFloat(cashbackTx.amount) > 0) {
                        // Buscar saldo atualizado do cliente
                        const balance = await db.getCashbackBalance(order.establishmentId, order.customerPhone);
                        cashbackInfo = {
                          cashbackEarned: cashbackTx.amount,
                          cashbackTotal: balance?.balance || '0.00',
                        };
                      }
                    }
                  } catch (cbErr) {
                    console.error('[WhatsApp] Erro ao buscar cashback info:', cbErr);
                  }
                }
                
                await sendOrderStatusNotification(
                  config.instanceToken,
                  order.customerPhone,
                  input.status as 'new' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled',
                  {
                    customerName: order.customerName || 'Cliente',
                    orderNumber: order.orderNumber,
                    establishmentName: establishment?.name || 'Restaurante',
                    template: input.status === 'preparing' ? config.templatePreparing :
                              input.status === 'ready' ? (
                                (order.deliveryType === 'pickup' || order.deliveryType === 'dine_in') 
                                  ? (config.templateReadyPickup || config.templateReady) 
                                  : config.templateReady
                              ) :
                              input.status === 'out_for_delivery' ? (config.templateOutForDelivery || null) :
                              input.status === 'completed' ? config.templateCompleted :
                              input.status === 'cancelled' ? config.templateCancelled : null,
                    deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                    cancellationReason: input.cancellationReason || order.cancellationReason,
                    orderItems: orderItems.map(item => ({
                      productName: item.productName,
                      quantity: item.quantity ?? 1,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                      complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                      notes: item.notes,
                    })),
                    orderTotal: order.total,
                    paymentMethod: order.paymentMethod,
                    cashbackInfo,
                  }
                );
              }
            }
          }
        } catch (error) {
          console.error('[WhatsApp] Erro ao enviar notificação:', error);
          // Não falhar a mutação por erro no WhatsApp
        }

        // Acionamento automático do entregador quando timing = on_accepted
        if (input.status === 'preparing') {
          try {
            const order = await db.getOrderById(input.id);
            if (order && order.deliveryType === 'delivery' && !order.deliveryNotified) {
              const timing = await db.getDriverNotifyTiming(order.establishmentId);
              if (timing === 'on_accepted') {
                const establishment = await db.getEstablishmentByUserId((await db.getEstablishmentById(order.establishmentId))?.userId || 0);
                const estId = order.establishmentId;
                const activeDrivers = await db.getActiveDriversByEstablishment(estId);
                
                if (activeDrivers.length === 1) {
                  // Auto-assign single driver and notify
                  const driver = activeDrivers[0];
                  const deliveryFee = parseFloat(order.deliveryFee || '0');
                  let repasseValue = 0;
                  if (driver.repasseStrategy === 'neighborhood') repasseValue = deliveryFee;
                  else if (driver.repasseStrategy === 'fixed') repasseValue = parseFloat(driver.fixedValue || '0');
                  else if (driver.repasseStrategy === 'percentage') repasseValue = deliveryFee * (parseFloat(driver.percentageValue || '0') / 100);

                  const existingDelivery = await db.getDeliveryByOrderId(input.id);
                  if (!existingDelivery) {
                    const deliveryId = await db.createDelivery({
                      establishmentId: estId,
                      orderId: input.id,
                      driverId: driver.id,
                      deliveryFee: String(deliveryFee),
                      repasseValue: String(repasseValue.toFixed(2)),
                      paymentStatus: 'pending',
                      whatsappSent: false,
                    });

                    const config = await db.getWhatsappConfig(estId);
                    if (config && config.instanceToken && config.status === 'connected') {
                      const message = buildDriverDeliveryMessage(order, deliveryFee);
                      const { sendTextMessage } = await import('./_core/uazapi');
                      await sendTextMessage(config.instanceToken, driver.whatsapp, message);
                      await db.markDeliveryWhatsappSent(deliveryId);
                    }
                    await db.markOrderDeliveryNotified(input.id);
                    console.log(`[Driver Notify] Entregador ${driver.name} acionado automaticamente (on_accepted) para pedido ${order.orderNumber}`);
                  }
                } else if (activeDrivers.length > 1) {
                  // Múltiplos entregadores: retornar lista para seleção no frontend (não fazer broadcast)
                  console.log(`[Driver Notify] ${activeDrivers.length} entregadores disponíveis (on_accepted) para pedido ${order.orderNumber} - aguardando seleção`);
                  return {
                    success: true,
                    action: 'choose_driver_on_accept',
                    orderId: input.id,
                    drivers: activeDrivers.map(d => ({
                      id: d.id,
                      name: d.name,
                      whatsapp: d.whatsapp,
                    })),
                  };
                }
              }
            }
          } catch (error) {
            console.error('[Driver Notify] Erro ao acionar entregador no aceite:', error);
          }
        }
        
        return { success: true };
      }),

    // Smart driver assignment: mark as ready and auto-assign driver
    markReadyAndAssign: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        driverId: z.number().optional(), // If provided, assign this specific driver
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento n\u00e3o encontrado' });

        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });

        // Only apply driver assignment for delivery orders
        // Pickup and dine_in orders don't need a driver
        if (order.deliveryType !== 'delivery') {
          await db.updateOrderStatus(input.orderId, 'ready');
          return { action: 'marked_ready', driverId: null, whatsappSent: false };
        }

        // Check if delivery already exists
        const existingDelivery = await db.getDeliveryByOrderId(input.orderId);
        if (existingDelivery) {
          // Se já foi atribuído (ex: on_accepted), marcar como saiu para entrega e enviar template "Pronto (Delivery)" ao cliente
          if (order.deliveryNotified) {
            await db.updateOrderStatus(input.orderId, 'out_for_delivery');
            
            // Enviar notificação ao cliente usando o template "Pronto (Delivery)"
            try {
              if (order.customerPhone) {
                const config = await db.getWhatsappConfig(establishment.id);
                if (config && config.status === 'connected' && config.notifyOnReady && config.instanceToken) {
                  const { sendOrderStatusNotification } = await import('./_core/uazapi');
                  const est = await db.getEstablishmentById(order.establishmentId);
                  const orderItems = await db.getOrderItems(order.id);
                  await sendOrderStatusNotification(
                    config.instanceToken,
                    order.customerPhone,
                    'ready',
                    {
                      customerName: order.customerName || 'Cliente',
                      orderNumber: order.orderNumber,
                      establishmentName: est?.name || 'Restaurante',
                      template: config.templateReady,
                      deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                      cancellationReason: null,
                      orderItems: orderItems.map(item => ({
                        productName: item.productName,
                        quantity: item.quantity ?? 1,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                        notes: item.notes,
                      })),
                      orderTotal: order.total,
                      paymentMethod: order.paymentMethod,
                    }
                  );
                }
              }
            } catch (error) {
              console.error('[WhatsApp] Erro ao notificar cliente (Pronto Delivery - on_accepted):', error);
            }
            
            return { action: 'assigned', driverId: existingDelivery.driverId, whatsappSent: true, deliveryId: existingDelivery.id };
          }
          throw new TRPCError({ code: 'CONFLICT', message: 'Pedido já possui entregador atribuído' });
        }

        // Get active drivers
        const activeDrivers = await db.getActiveDriversByEstablishment(establishment.id);

        let driverId = input.driverId;

        // If no specific driver provided, check logic
        if (!driverId) {
          if (activeDrivers.length === 0) {
            // No active drivers: mark as out_for_delivery and send WhatsApp notification to customer
            await db.updateOrderStatus(input.orderId, 'out_for_delivery');
            
            // Send WhatsApp notification to customer about out_for_delivery
            let customerNotified = false;
            try {
              if (order.customerPhone) {
                const config = await db.getWhatsappConfig(establishment.id);
                if (config && config.status === 'connected' && config.instanceToken && (config.notifyOnOutForDelivery !== false)) {
                  const { sendOrderStatusNotification } = await import('./_core/uazapi');
                  const est = await db.getEstablishmentById(order.establishmentId);
                  const orderItems = await db.getOrderItems(order.id);
                  await sendOrderStatusNotification(
                    config.instanceToken,
                    order.customerPhone,
                    'out_for_delivery',
                    {
                      customerName: order.customerName || 'Cliente',
                      orderNumber: order.orderNumber,
                      establishmentName: est?.name || 'Restaurante',
                      template: config.templateOutForDelivery || null,
                      deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                      cancellationReason: null,
                      orderItems: orderItems.map(item => ({
                        productName: item.productName,
                        quantity: item.quantity ?? 1,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                        notes: item.notes,
                      })),
                      orderTotal: order.total,
                      paymentMethod: order.paymentMethod,
                    }
                  );
                  customerNotified = true;
                }
              }
            } catch (error) {
              console.error('[WhatsApp] Erro ao notificar cliente sobre saiu para entrega:', error);
            }
            
            return { action: 'marked_ready', driverId: null, whatsappSent: customerNotified };
          } else if (activeDrivers.length === 1) {
            // Only 1 active driver: auto-assign
            driverId = activeDrivers[0].id;
          } else {
            // 2+ active drivers: return list for modal selection
            // First mark as ready
            await db.updateOrderStatus(input.orderId, 'ready');
            return {
              action: 'choose_driver',
              drivers: activeDrivers.map(d => ({
                id: d.id,
                name: d.name,
                whatsapp: d.whatsapp,
              })),
              driverId: null,
              whatsappSent: false,
            };
          }
        }

        // Assign driver and change status to out_for_delivery
        const driver = await db.getDriverById(driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador n\u00e3o encontrado' });

        const deliveryFee = parseFloat(order.deliveryFee || '0');

        // Calculate repasse
        let repasseValue = 0;
        if (driver.repasseStrategy === 'neighborhood') {
          repasseValue = deliveryFee;
        } else if (driver.repasseStrategy === 'fixed') {
          repasseValue = parseFloat(driver.fixedValue || '0');
        } else if (driver.repasseStrategy === 'percentage') {
          const pct = parseFloat(driver.percentageValue || '0');
          repasseValue = deliveryFee * (pct / 100);
        }

        // Create delivery record
        const deliveryId = await db.createDelivery({
          establishmentId: establishment.id,
          orderId: input.orderId,
          driverId,
          deliveryFee: String(deliveryFee),
          repasseValue: String(repasseValue.toFixed(2)),
          paymentStatus: 'pending',
          whatsappSent: false,
        });

        // Update order status to out_for_delivery
        await db.updateOrderStatus(input.orderId, 'out_for_delivery');

        // Send WhatsApp notification to driver (skip if already notified on_accepted)
        let whatsappSent = false;
        const alreadyNotified = order.deliveryNotified;
        if (!alreadyNotified) {
          try {
            const config = await db.getWhatsappConfig(establishment.id);
            if (config && config.instanceToken && config.status === 'connected') {
              const message = buildDriverDeliveryMessage(order, deliveryFee);

              const { sendTextMessage } = await import('./_core/uazapi');
              await sendTextMessage(config.instanceToken, driver.whatsapp, message);
              await db.markDeliveryWhatsappSent(deliveryId);
              whatsappSent = true;
            }
          } catch (error) {
            console.error('[Driver WhatsApp] Erro ao enviar notificação:', error);
          }
          await db.markOrderDeliveryNotified(input.orderId);
        } else {
          whatsappSent = true; // Já foi enviado no aceite
        }

        // Also send customer notification for "ready" status
        try {
          if (order.customerPhone) {
            const config = await db.getWhatsappConfig(establishment.id);
            if (config && config.status === 'connected' && config.notifyOnReady && config.instanceToken) {
              const { sendOrderStatusNotification } = await import('./_core/uazapi');
              const est = await db.getEstablishmentById(order.establishmentId);
              const orderItems = await db.getOrderItems(order.id);
              await sendOrderStatusNotification(
                config.instanceToken,
                order.customerPhone,
                'ready',
                {
                  customerName: order.customerName || 'Cliente',
                  orderNumber: order.orderNumber,
                  establishmentName: est?.name || 'Restaurante',
                  template: ((order.deliveryType as string) === 'pickup' || (order.deliveryType as string) === 'dine_in')
                    ? (config.templateReadyPickup || config.templateReady)
                    : config.templateReady,
                  deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                  cancellationReason: null,
                  orderItems: orderItems.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity ?? 1,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    complements: item.complements as Array<{ name: string; price: number; quantity: number }> | string | null,
                    notes: item.notes,
                  })),
                  orderTotal: order.total,
                  paymentMethod: order.paymentMethod,
                }
              );
            }
          }
        } catch (error) {
          console.error('[WhatsApp] Erro ao notificar cliente:', error);
        }

        return { action: 'assigned', driverId, whatsappSent, deliveryId };
      }),

    // Get active drivers count for smart assignment UI
    getActiveDriversForAssignment: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { count: 0, drivers: [] };
        const drivers = await db.getActiveDriversByEstablishment(establishment.id);
        return {
          count: drivers.length,
          drivers: drivers.map(d => ({ id: d.id, name: d.name, whatsapp: d.whatsapp })),
        };
      }),
  }),

  // ============ COUPONS ============
  coupon: router({
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "expired", "exhausted"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { establishmentId, ...filters } = input;
        return db.getCouponsByEstablishment(establishmentId, filters);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCouponById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        code: z.string().min(1).max(15),
        type: z.enum(["percentage", "fixed"]),
        value: z.string(),
        maxDiscount: z.string().nullable().optional(),
        minOrderValue: z.string().nullable().optional(),
        quantity: z.number().nullable().optional(),
        startDate: z.date().nullable().optional(),
        endDate: z.date().nullable().optional(),
        activeDays: z.array(z.string()).nullable().optional(),
        validOrigins: z.array(z.string()).nullable().optional(),
        startTime: z.string().nullable().optional(),
        endTime: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if code already exists
        const existing = await db.getCouponByCode(input.establishmentId, input.code);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um cupom com este código.",
          });
        }
        
        const id = await db.createCoupon(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1).max(15).optional(),
        type: z.enum(["percentage", "fixed"]).optional(),
        value: z.string().optional(),
        maxDiscount: z.string().nullable().optional(),
        minOrderValue: z.string().nullable().optional(),
        quantity: z.number().nullable().optional(),
        startDate: z.date().nullable().optional(),
        endDate: z.date().nullable().optional(),
        activeDays: z.array(z.string()).nullable().optional(),
        validOrigins: z.array(z.string()).nullable().optional(),
        startTime: z.string().nullable().optional(),
        endTime: z.string().nullable().optional(),
        status: z.enum(["active", "inactive", "expired", "exhausted"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Check if code already exists (if updating code)
        if (data.code) {
          const coupon = await db.getCouponById(id);
          if (coupon) {
            const existing = await db.getCouponByCode(coupon.establishmentId, data.code);
            if (existing && existing.id !== id) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Já existe um cupom com este código.",
              });
            }
          }
        }
        
        await db.updateCoupon(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCoupon(input.id);
        return { success: true };
      }),
    
    toggleStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ input }) => {
        await db.toggleCouponStatus(input.id, input.status);
        return { success: true };
      }),
    
    validate: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        code: z.string(),
        orderValue: z.number(),
        deliveryType: z.enum(["delivery", "pickup", "self_service"]),
      }))
      .query(async ({ input }) => {
        return db.validateCoupon(
          input.establishmentId,
          input.code,
          input.orderValue,
          input.deliveryType
        );
      }),
  }),

  // ============ LOYALTY (FIDELIDADE) ============
  loyalty: router({
    // Configurações de fidelidade do estabelecimento (admin)
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        return {
          loyaltyEnabled: establishment.loyaltyEnabled,
          loyaltyStampsRequired: establishment.loyaltyStampsRequired,
          loyaltyCouponType: establishment.loyaltyCouponType,
          loyaltyCouponValue: establishment.loyaltyCouponValue,
          loyaltyMinOrderValue: establishment.loyaltyMinOrderValue,
        };
      }),
    
    // Salvar configurações de fidelidade (admin)
    saveSettings: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        loyaltyEnabled: z.boolean(),
        loyaltyStampsRequired: z.number().min(1).max(20),
        loyaltyCouponType: z.enum(["fixed", "percentage", "free_delivery"]),
        loyaltyCouponValue: z.string(),
        loyaltyMinOrderValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { establishmentId, ...settings } = input;
        await db.updateEstablishment(establishmentId, settings);
        return { success: true };
      }),
    
    // Login/Cadastro do cliente no cartão fidelidade (público)
    customerLogin: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
        password4: z.string().length(4),
      }))
      .mutation(async ({ input }) => {
        // Normalizar telefone para busca
        const normalizedPhone = input.phone.replace(/[^0-9]/g, '');
        console.log(`[Fidelidade Login] Tentando login: ${input.phone} -> ${normalizedPhone}`);
        
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, normalizedPhone);
        
        if (!card) {
          console.log(`[Fidelidade Login] Cartão não encontrado para ${normalizedPhone}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cartão não encontrado. Cadastre-se primeiro.",
          });
        }
        
        console.log(`[Fidelidade Login] Cartão encontrado: ID ${card.id}, telefone ${card.customerPhone}`);
        
        // Verificar senha
        const isValid = await bcrypt.compare(input.password4, card.password4Hash);
        console.log(`[Fidelidade Login] Senha válida: ${isValid}`);
        
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha incorreta.",
          });
        }
        
        return { success: true, cardId: card.id };
      }),
    
    // Cadastro do cliente no cartão fidelidade (público)
    customerRegister: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
        password4: z.string().length(4),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se já existe cartão
        const existingCard = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        
        if (existingCard) {
          // Se já existe mas não tem senha, atualizar com a senha
          if (!existingCard.password4Hash) {
            const hash = await bcrypt.hash(input.password4, 10);
            await db.updateLoyaltyCard(existingCard.id, {
              password4Hash: hash,
              customerName: input.name || existingCard.customerName,
            });
            return { success: true, cardId: existingCard.id };
          }
          
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este telefone já possui um cartão fidelidade.",
          });
        }
        
        // Criar novo cartão
        const hash = await bcrypt.hash(input.password4, 10);
        const cardId = await db.createLoyaltyCard({
          establishmentId: input.establishmentId,
          customerPhone: input.phone,
          customerName: input.name,
          password4Hash: hash,
        });
        
        return { success: true, cardId };
      }),
    
    // Buscar dados do cartão do cliente (público)
    getCustomerCard: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
      }))
      .query(async ({ input }) => {
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        if (!card) return null;
        
        // Buscar configurações do estabelecimento
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) return null;
        
        // Buscar histórico de carimbos
        const stamps = await db.getLoyaltyStamps(card.id);
        
        // Buscar múltiplos cupons ativos se houver
        let activeCoupons: Array<{
          id: number;
          code: string;
          type: string;
          value: string;
          expiresAt: string | null;
        }> = [];
        
        // Primeiro verificar o novo campo activeCouponIds (array)
        if (card.activeCouponIds && Array.isArray(card.activeCouponIds) && card.activeCouponIds.length > 0) {
          for (const couponId of card.activeCouponIds) {
            const coupon = await db.getCouponById(couponId);
            if (coupon && coupon.status === 'active') {
              activeCoupons.push({
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                expiresAt: coupon.endDate ? coupon.endDate.toISOString() : null,
              });
            }
          }
        } else if (card.activeCouponId) {
          // Fallback para o campo legado (single coupon)
          const coupon = await db.getCouponById(card.activeCouponId);
          if (coupon && coupon.status === 'active') {
            activeCoupons.push({
              id: coupon.id,
              code: coupon.code,
              type: coupon.type,
              value: coupon.value,
              expiresAt: coupon.endDate ? coupon.endDate.toISOString() : null,
            });
          }
        }
        
        return {
          card: {
            id: card.id,
            customerName: card.customerName,
            stamps: card.stamps,
            totalStampsEarned: card.totalStampsEarned,
            couponsEarned: card.couponsEarned,
          },
          settings: {
            stampsRequired: establishment.loyaltyStampsRequired || 6,
            couponType: establishment.loyaltyCouponType,
            couponValue: establishment.loyaltyCouponValue,
          },
          stamps: stamps.map(s => ({
            id: s.id,
            orderNumber: s.orderNumber,
            orderTotal: s.orderTotal,
            createdAt: s.createdAt,
          })),
          // Manter compatibilidade com o campo antigo (primeiro cupom)
          activeCoupon: activeCoupons.length > 0 ? {
            id: activeCoupons[0].id,
            code: activeCoupons[0].code,
            type: activeCoupons[0].type,
            value: activeCoupons[0].value,
            expiresAt: activeCoupons[0].expiresAt,
          } : null,
          // Novo campo com todos os cupons
          activeCoupons: activeCoupons,
        };
      }),
    
    // Verificar se fidelidade está ativa no estabelecimento (público)
    isEnabled: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        return {
          enabled: establishment?.loyaltyEnabled || false,
          stampsRequired: establishment?.loyaltyStampsRequired || 6,
        };
      }),
    
    // Listar todos os cartões do estabelecimento (admin)
    listCards: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getLoyaltyCardsByEstablishment(input.establishmentId);
      }),
    
    // Resetar carimbos quando usuário visualiza o cupom ganho (público)
    viewCouponAndResetStamps: publicProcedure
      .input(z.object({ 
        establishmentId: z.number(), 
        phone: z.string(),
        password: z.string()
      }))
      .mutation(async ({ input }) => {
        console.log(`[Fidelidade] viewCouponAndResetStamps chamado - phone: ${input.phone}, establishmentId: ${input.establishmentId}`);
        
        // Verificar login do cliente
        const card = await db.getLoyaltyCardByPhone(input.establishmentId, input.phone);
        console.log(`[Fidelidade] Cartão encontrado:`, card ? { id: card.id, stamps: card.stamps, activeCouponId: card.activeCouponId } : 'NÃO ENCONTRADO');
        
        if (!card) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cartão não encontrado' });
        }
        
        // Verificar senha
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(input.password, card.password4Hash);
        console.log(`[Fidelidade] Senha válida: ${isValid}`);
        
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta' });
        }
        
        // Verificar se tem cupom ativo (cartão foi completado)
        console.log(`[Fidelidade] activeCouponId: ${card.activeCouponId}`);
        if (!card.activeCouponId) {
          console.log(`[Fidelidade] Nenhum cupom ativo - não vai resetar`);
          return { success: false, message: 'Nenhum cupom disponível para visualizar' };
        }
        
        // Resetar os carimbos e deletar histórico de carimbos
        console.log(`[Fidelidade] Chamando resetLoyaltyStampsOnCouponView para cartão ${card.id}`);
        await db.resetLoyaltyStampsOnCouponView(card.id);
        
        console.log(`[Fidelidade] Carimbos resetados com sucesso para cliente ${input.phone}`);
        
        return { success: true, message: 'Carimbos resetados com sucesso' };
      }),
  }),

  // ============ UPLOAD ============
  upload: router({
    image: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
        folder: z.string().optional(),
        singleVersion: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { base64, mimeType, folder = "products", singleVersion = false } = input;
        const buffer = Buffer.from(base64, "base64");
        const id = nanoid();

        if (singleVersion) {
          // Logos, capas, QR codes — versão otimizada + thumbnail + blur placeholder
          const processed = await processSingleImage(buffer);
          const blurDataUrl = await generateBlurPlaceholder(buffer);
          const mainFileName = `${folder}/${id}.webp`;
          const thumbFileName = `${folder}/${id}_thumb.webp`;

          // Gerar thumbnail (400px) para uso em listagens/srcset
          const thumbBuffer = await processSingleImage(buffer, 400, 75);

          const [mainResult] = await Promise.all([
            mindiStoragePut(mainFileName, processed.buffer, "image/webp"),
            mindiStoragePut(thumbFileName, thumbBuffer.buffer, "image/webp"),
          ]);

          return { url: mainResult.url, blurDataUrl };
        }

        // Produtos — gerar main (1200px) + thumb (400px) + blur placeholder
        const processed = await processImage(buffer);
        const mainFileName = `${folder}/${id}.webp`;
        const thumbFileName = `${folder}/${id}_thumb.webp`;

        const [mainResult, thumbResult] = await Promise.all([
          mindiStoragePut(mainFileName, processed.mainBuffer, "image/webp"),
          mindiStoragePut(thumbFileName, processed.thumbBuffer, "image/webp"),
        ]);

        return { url: mainResult.url, thumbUrl: thumbResult.url, blurDataUrl: processed.blurDataUrl };
      }),
  }),

  // ============ NEIGHBORHOOD FEES (TAXAS POR BAIRRO) ============
  neighborhoodFees: router({
    // Listar taxas por bairro de um estabelecimento
    list: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getNeighborhoodFeesByEstablishment(input.establishmentId);
      }),
    
    // Criar nova taxa por bairro (admin)
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        neighborhood: z.string().min(1, "Nome do bairro é obrigatório"),
        fee: z.string().min(0, "Taxa é obrigatória"),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNeighborhoodFee(input);
        return { id };
      }),
    
    // Atualizar taxa por bairro (admin)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        neighborhood: z.string().min(1).optional(),
        fee: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateNeighborhoodFee(id, data);
        return { success: true };
      }),
    
    // Deletar taxa por bairro (admin)
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteNeighborhoodFee(input.id);
        return { success: true };
      }),
    
    // Deletar todas as taxas de um estabelecimento (admin)
    deleteAll: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteAllNeighborhoodFees(input.establishmentId);
        return { success: true };
      }),
  }),

  // ============ PRINTERS ============
  printer: router({
    // Listar impressoras do estabelecimento
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getPrintersByEstablishment(input.establishmentId);
      }),
    
    // Buscar impressora por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPrinterById(input.id);
      }),
    
    // Criar nova impressora
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        ipAddress: z.string().min(1, "Endereço IP é obrigatório"),
        port: z.number().optional(),
        printerType: z.enum(['all', 'kitchen', 'counter', 'bar']).optional(),
        categoryIds: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPrinter(input);
        return { id };
      }),
    
    // Atualizar impressora
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        ipAddress: z.string().optional(),
        port: z.number().optional(),
        printerType: z.enum(['all', 'kitchen', 'counter', 'bar']).optional(),
        categoryIds: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePrinter(id, data);
        return { success: true };
      }),
    
    // Deletar impressora
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePrinter(input.id);
        return { success: true };
      }),
    
    // Buscar configurações de impressão
    getSettings: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const settings = await db.getPrinterSettings(input.establishmentId);
        // Retornar objeto padrão se não houver configurações salvas
        return settings || {
          id: 0,
          establishmentId: input.establishmentId,
          autoPrintEnabled: false,
          printOnNewOrder: true,
          printOnStatusChange: false,
          copies: 1,
          showLogo: true,
          logoUrl: null,
          showQrCode: false,
          headerMessage: null,
          footerMessage: null,
          paperWidth: '80mm',
          posPrinterEnabled: false,
          posPrinterLinkcode: null,
          posPrinterNumber: 1,
          directPrintEnabled: false,
          directPrintIp: null,
          directPrintPort: 9100,
          fontSize: 12,
          fontWeight: 500,
          titleFontSize: 16,
          titleFontWeight: 700,
          itemFontSize: 12,
          itemFontWeight: 700,
          obsFontSize: 11,
          obsFontWeight: 500,
          showDividers: false,
          defaultPrintMethod: 'normal' as const,
          printerApiKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    
    // Salvar configurações de impressão
    saveSettings: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        autoPrintEnabled: z.boolean().optional(),
        printOnNewOrder: z.boolean().optional(),
        printOnStatusChange: z.boolean().optional(),
        copies: z.number().min(1).max(5).optional(),
        showLogo: z.boolean().optional(),
        logoUrl: z.string().nullable().optional(),
        showQrCode: z.boolean().optional(),
        qrCodeUrl: z.string().nullable().optional(),
        headerMessage: z.string().nullable().optional(),
        footerMessage: z.string().nullable().optional(),
        paperWidth: z.enum(['58mm', '80mm']).optional(),
        posPrinterEnabled: z.boolean().optional(),
        posPrinterLinkcode: z.string().nullable().optional(),
        posPrinterNumber: z.number().min(1).max(10).optional(),
        directPrintEnabled: z.boolean().optional(),
        directPrintIp: z.string().nullable().optional(),
        directPrintPort: z.number().min(1).max(65535).optional(),
        fontSize: z.number().min(8).max(24).optional(),
        fontWeight: z.number().min(300).max(900).optional(),
        titleFontSize: z.number().min(10).max(32).optional(),
        titleFontWeight: z.number().min(300).max(900).optional(),
        itemFontSize: z.number().min(8).max(24).optional(),
        itemFontWeight: z.number().min(300).max(900).optional(),
        obsFontSize: z.number().min(8).max(20).optional(),
        obsFontWeight: z.number().min(300).max(900).optional(),
        showDividers: z.boolean().optional(),
        boxPadding: z.number().min(4).max(20).optional(),
        itemBorderStyle: z.enum(['rounded', 'dashed']).optional(),
        defaultPrintMethod: z.enum(['normal', 'android']).optional(),
        htmlPrintEnabled: z.boolean().optional(),
        beepOnPrint: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertPrinterSettings(input);
        return { success: true };
      }),
    
    // Gerar nova API key para integração com app de impressora
    generateApiKey: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ input }) => {
        const apiKey = await db.generatePrinterApiKey(input.establishmentId);
        return { apiKey };
      }),
    
    // Revogar API key da impressora
    revokeApiKey: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ input }) => {
        await db.revokePrinterApiKey(input.establishmentId);
        return { success: true };
      }),
    
    // Testar conexão com impressão direta via rede
    testDirectPrint: protectedProcedure
      .input(z.object({
        ip: z.string(),
        port: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { testPrinterConnection } = await import('./escposPrinter');
        return testPrinterConnection({ ip: input.ip, port: input.port || 9100 });
      }),
    
    // Testar conexão com POSPrinterDriver
    testPOSPrinter: protectedProcedure
      .input(z.object({
        linkcode: z.string(),
        printerNumber: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { testPOSPrinterConnection } = await import('./posPrinterDriver');
        return testPOSPrinterConnection(input.linkcode, input.printerNumber || 1);
      }),
    
    // Buscar impressora padrão
    getDefault: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getDefaultPrinter(input.establishmentId);
      }),
    
    // Imprimir pedido manualmente (retorna dados para o cliente enviar à impressora)
    printOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        printerId: z.number().optional(), // Se não informado, usa a impressora padrão
      }))
      .mutation(async ({ input }) => {
        // Buscar dados do pedido
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pedido não encontrado",
          });
        }
        
        // Buscar itens do pedido
        const orderItems = await db.getOrderItems(input.orderId);
        
        // Buscar impressora
        let printer;
        if (input.printerId) {
          printer = await db.getPrinterById(input.printerId);
        } else {
          printer = await db.getDefaultPrinter(order.establishmentId);
        }
        
        if (!printer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nenhuma impressora configurada",
          });
        }
        
        if (!printer.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Impressora está desativada",
          });
        }
        
        // Buscar configurações de impressão
        const settings = await db.getPrinterSettings(order.establishmentId);
        
        // Buscar estabelecimento para o nome
        const establishment = await db.getEstablishmentById(order.establishmentId);
        
        // Retornar dados para o cliente enviar à impressora
        return {
          printer: {
            ip: printer.ipAddress,
            port: printer.port || 9100,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            deliveryType: order.deliveryType,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            couponCode: order.couponCode,
            createdAt: order.createdAt,
            items: orderItems.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
              complements: item.complements,
            })),
          },
          settings: {
            copies: settings?.copies || 1,
            showLogo: settings?.showLogo ?? true,
            showQrCode: settings?.showQrCode ?? false,
            footerMessage: settings?.footerMessage || null,
          },
          establishment: {
            name: establishment?.name || 'Estabelecimento',
          },
        };
      }),
    
    // Testar conexão com impressora via TCP
    testConnection: protectedProcedure
      .input(z.object({
        ipAddress: z.string().min(1, "Endereço IP é obrigatório"),
        port: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const net = await import('net');
        const port = input.port || 9100;
        
        return new Promise<{ success: boolean; message: string }>((resolve) => {
          const socket = new net.Socket();
          const timeout = 5000; // 5 segundos de timeout
          
          socket.setTimeout(timeout);
          
          socket.on('connect', () => {
            socket.destroy();
            resolve({ 
              success: true, 
              message: `Conexão estabelecida com sucesso em ${input.ipAddress}:${port}` 
            });
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            resolve({ 
              success: false, 
              message: `Tempo limite excedido ao conectar em ${input.ipAddress}:${port}` 
            });
          });
          
          socket.on('error', (err: Error) => {
            socket.destroy();
            let errorMessage = `Erro ao conectar em ${input.ipAddress}:${port}`;
            
            if (err.message.includes('ECONNREFUSED')) {
              errorMessage = `Conexão recusada em ${input.ipAddress}:${port}. Verifique se a impressora está ligada e acessível.`;
            } else if (err.message.includes('EHOSTUNREACH')) {
              errorMessage = `Host inacessível: ${input.ipAddress}. Verifique o endereço IP.`;
            } else if (err.message.includes('ENETUNREACH')) {
              errorMessage = `Rede inacessível. Verifique sua conexão de rede.`;
            } else if (err.message.includes('ENOTFOUND')) {
              errorMessage = `Endereço não encontrado: ${input.ipAddress}`;
            }
            
            resolve({ 
              success: false, 
              message: errorMessage 
            });
          });
          
          socket.connect(port, input.ipAddress);
        });
      }),
    
    // ============ PRINT QUEUE (API para App Android) ============
    
    // Buscar pedidos pendentes na fila de impressão (polling)
    queue: router({
      // Buscar pedidos pendentes para impressão
      pending: publicProcedure
        .input(z.object({ 
          establishmentId: z.number(),
          apiKey: z.string().optional() // Para autenticação do app Android
        }))
        .query(async ({ input }) => {
          const jobs = await db.getPendingPrintJobs(input.establishmentId);
          return jobs;
        }),
      
      // Buscar dados completos de um job para impressão
      getJob: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          apiKey: z.string().optional()
        }))
        .query(async ({ input }) => {
          const result = await db.getPrintJobWithOrder(input.jobId);
          if (!result) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Job não encontrado'
            });
          }
          
          // Buscar configurações de impressão
          const settings = await db.getPrinterSettings(result.job.establishmentId);
          const establishment = await db.getEstablishmentById(result.job.establishmentId);
          
          return {
            job: result.job,
            order: result.order,
            items: result.items,
            settings: {
              copies: settings?.copies || 1,
              showLogo: settings?.showLogo ?? true,
              logoUrl: settings?.logoUrl || establishment?.logo,
              showQrCode: settings?.showQrCode ?? false,
              headerMessage: settings?.headerMessage,
              footerMessage: settings?.footerMessage,
              paperWidth: settings?.paperWidth || '80mm',
            },
            establishment: {
              name: establishment?.name || 'Estabelecimento',
              logo: establishment?.logo,
              whatsapp: establishment?.whatsapp,
            },
          };
        }),
      
      // Marcar job como impresso
      markPrinted: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          apiKey: z.string().optional()
        }))
        .mutation(async ({ input }) => {
          await db.updatePrintJobStatus(input.jobId, 'completed');
          return { success: true };
        }),
      
      // Marcar job como falha
      markFailed: publicProcedure
        .input(z.object({ 
          jobId: z.number(),
          errorMessage: z.string().optional(),
          apiKey: z.string().optional()
        }))
        .mutation(async ({ input }) => {
          await db.updatePrintJobStatus(input.jobId, 'failed', input.errorMessage);
          return { success: true };
        }),
      
      // Adicionar pedido à fila manualmente
      add: protectedProcedure
        .input(z.object({
          establishmentId: z.number(),
          orderId: z.number(),
          printerId: z.number().optional(),
          copies: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const id = await db.addToPrintQueue(input);
          return { id };
        }),
      
      // Buscar histórico de impressões
      history: protectedProcedure
        .input(z.object({ 
          establishmentId: z.number(),
          limit: z.number().optional()
        }))
        .query(async ({ input }) => {
          return db.getPrintHistory(input.establishmentId, input.limit);
        }),
    }),
  }),
  
  // ============ PUSH NOTIFICATIONS ============
  push: router({
    // Obter chave pública VAPID para o cliente
    getVapidPublicKey: publicProcedure
      .query(async () => {
        const { getVapidPublicKey } = await import('./_core/webPush');
        return { publicKey: getVapidPublicKey() };
      }),
    
    // Registrar subscription de push
    subscribe: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Usuário não autenticado',
          });
        }
        
        const id = await db.upsertPushSubscription({
          establishmentId: input.establishmentId,
          userId,
          endpoint: input.subscription.endpoint,
          p256dh: input.subscription.keys.p256dh,
          auth: input.subscription.keys.auth,
          userAgent: input.userAgent,
        });
        
        console.log(`[Push] Subscription registrada para estabelecimento ${input.establishmentId}, usuário ${userId}`);
        
        return { success: true, id };
      }),
    
    // Cancelar subscription de push
    unsubscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.deletePushSubscription(input.endpoint);
        console.log('[Push] Subscription removida');
        return { success: true };
      }),
    
    // Listar subscriptions do estabelecimento (para debug/admin)
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getPushSubscriptionsByEstablishment(input.establishmentId);
      }),
    
    // Enviar notificação de teste
    sendTest: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendPushNotification } = await import('./_core/webPush');
        const subscriptions = await db.getPushSubscriptionsByEstablishment(input.establishmentId);
        
        if (subscriptions.length === 0) {
          return { success: false, message: 'Nenhuma subscription encontrada' };
        }
        
        let sent = 0;
        let failed = 0;
        
        for (const sub of subscriptions) {
          try {
            const success = await sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              {
                title: '🔔 Teste de Notificação',
                body: 'Esta é uma notificação de teste do sistema de pedidos.',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: 'test-notification',
                vibrate: [200, 100, 200],
              }
            );
            
            if (success) {
              sent++;
            } else {
              // Subscription inválida, remover
              await db.deletePushSubscriptionById(sub.id);
              failed++;
            }
          } catch (error) {
            console.error('[Push] Erro ao enviar notificação de teste:', error);
            failed++;
          }
        }
        
        return { 
          success: sent > 0, 
          message: `Enviadas: ${sent}, Falhas: ${failed}`,
          sent,
          failed,
        };
      }),
  }),
  
  // ============ WHATSAPP INTEGRATION ============
  whatsapp: router({
    // Obter configuração do WhatsApp
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        
        const config = await db.getWhatsappConfig(establishment.id);
        return config || null;
      }),
    
    // Salvar configurações de notificação (sem precisar de subdomain/token)
    saveNotificationSettings: protectedProcedure
      .input(z.object({
        requireOrderConfirmation: z.boolean().optional(),
        notifyOnNewOrder: z.boolean().optional(),
        notifyOnPreparing: z.boolean().optional(),
        notifyOnReady: z.boolean().optional(),
        notifyOnCompleted: z.boolean().optional(),
        notifyOnCancelled: z.boolean().optional(),
        notifyOnReservation: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Confirmação via botões está temporariamente bloqueada
        input.requireOrderConfirmation = false;
        
        // Se está ativando confirmação via botões, configurar webhook automaticamente
        if (input.requireOrderConfirmation) {
          const whatsappConfig = await db.getWhatsappConfig(establishment.id);
          if (whatsappConfig?.instanceToken) {
            const { configureWebhook } = await import('./_core/uazapi');
            // Usar a URL do app publicado
            const appUrl = process.env.VITE_APP_URL || 'https://mindi.manus.space';
            const webhookUrl = `${appUrl}/api/webhook/whatsapp/${establishment.id}`;
            
            try {
              const result = await configureWebhook(whatsappConfig.instanceToken, webhookUrl);
              console.log('[WhatsApp] Webhook configurado automaticamente:', { establishmentId: establishment.id, webhookUrl, success: result.success });
            } catch (error) {
              console.error('[WhatsApp] Erro ao configurar webhook:', error);
              // Não falhar a operação, apenas logar o erro
            }
          }
        }
        
        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          requireOrderConfirmation: input.requireOrderConfirmation,
          notifyOnNewOrder: input.notifyOnNewOrder,
          notifyOnPreparing: input.notifyOnPreparing,
          notifyOnReady: input.notifyOnReady,
          notifyOnCompleted: input.notifyOnCompleted,
          notifyOnCancelled: input.notifyOnCancelled,
          notifyOnReservation: input.notifyOnReservation,
        });
        
        return { success: true };
      }),
    
    // Conectar instância ao WhatsApp (gera QR code automaticamente)
    connect: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const { isUazapiConfigured, getOrCreateInstance, connectInstance } = await import('./_core/uazapi');
        
        // Verificar se UAZAPI está configurado
        if (!isUazapiConfigured()) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'WhatsApp não configurado no sistema' });
        }
        
        // Obter ou criar instância para este estabelecimento
        let config = await db.getWhatsappConfig(establishment.id);
        
        if (!config || !config.instanceToken) {
          // Criar nova instância
          const instanceResult = await getOrCreateInstance(establishment.id, establishment.name);
          
          if (!instanceResult.success) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: instanceResult.message || 'Erro ao criar instância' });
          }
          
          // Salvar instância no banco
          await db.upsertWhatsappConfig({
            establishmentId: establishment.id,
            instanceId: instanceResult.instanceId,
            instanceToken: instanceResult.instanceToken,
          });
          
          config = await db.getWhatsappConfig(establishment.id);
        }
        
        if (!config?.instanceToken) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Token da instância não encontrado' });
        }
        
        // Conectar instância
        const result = await connectInstance(config.instanceToken);
        
        // Atualizar status no banco
        await db.updateWhatsappStatus(
          establishment.id, 
          result.status,
          null,
          result.qrcode || null
        );
        
        return result;
      }),
    
    // Verificar status da conexão
    getStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken) {
          return { success: false, status: 'disconnected' as const, message: 'Não configurado' };
        }
        
        const { getInstanceStatus } = await import('./_core/uazapi');
        const result = await getInstanceStatus(config.instanceToken);
        
        // Atualizar status no banco
        if (result.status !== config.status || result.phone !== config.connectedPhone) {
          await db.updateWhatsappStatus(
            establishment.id,
            result.status,
            result.phone || null,
            result.qrcode || null
          );
        }
        
        return result;
      }),
    
    // Desconectar instância
    disconnect: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp não configurado' });
        }
        
        const { disconnectInstance } = await import('./_core/uazapi');
        const result = await disconnectInstance(config.instanceToken);
        
        // Atualizar status no banco
        await db.updateWhatsappStatus(establishment.id, 'disconnected', null, null);
        
        return result;
      }),
    
    // Enviar mensagem de teste
    sendTest: protectedProcedure
      .input(z.object({
        phone: z.string().min(10, "Telefone inválido"),
        message: z.string().min(1, "Mensagem é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'WhatsApp não configurado' });
        }
        
        const { sendTextMessage } = await import('./_core/uazapi');
        return await sendTextMessage(config.instanceToken, input.phone, input.message);
      }),
    
    // Salvar templates de mensagem
    saveTemplates: protectedProcedure
      .input(z.object({
        templateNewOrder: z.string().nullable().optional(),
        templatePreparing: z.string().nullable().optional(),
        templateReady: z.string().nullable().optional(),
        templateReadyPickup: z.string().nullable().optional(),
        templateCompleted: z.string().nullable().optional(),
        templateCancelled: z.string().nullable().optional(),
        templateReservation: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        await db.upsertWhatsappConfig({
          establishmentId: establishment.id,
          templateNewOrder: input.templateNewOrder,
          templatePreparing: input.templatePreparing,
          templateReady: input.templateReady,
          templateReadyPickup: input.templateReadyPickup,
          templateCompleted: input.templateCompleted,
          templateCancelled: input.templateCancelled,
          templateReservation: input.templateReservation,
        });
        
        return { success: true };
      }),
  }),
  
  // ============ CAMPANHAS SMS ============
  campanhas: router({
    // Buscar clientes únicos que fizeram pedidos
    getClientes: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const clientes = await db.getUniqueCustomers(establishment.id);
        return clientes;
      }),
    
    // Buscar clientes filtrados por critérios
    getClientesFiltrados: protectedProcedure
      .input(z.object({
        inactiveDays: z.number().min(0).optional(),
        minOrders: z.number().min(0).optional(),
        usedCoupon: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const clientes = await db.getFilteredCustomers(establishment.id, input || undefined);
        return clientes;
      }),

    // Buscar saldo SMS do estabelecimento
    getSaldo: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
      
      const balance = await db.getOrCreateSmsBalance(establishment.id);
      const lastDispatch = await db.getLastSmsDispatch(establishment.id);
      
      return {
        saldo: parseFloat(balance.balance as string),
        custoPorSms: parseFloat(balance.costPerSms as string),
        smsDisponiveis: Math.floor(parseFloat(balance.balance as string) / parseFloat(balance.costPerSms as string)),
        ultimoDisparo: lastDispatch?.createdAt || null,
      };
    }),
    
    // Buscar histórico de transações SMS
    getTransacoes: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        return await db.getSmsTransactions(establishment.id, input?.limit || 50);
      }),
    
    // Enviar SMS em massa para múltiplos destinatários
    enviarSMS: protectedProcedure
      .input(z.object({
        mensagem: z.string().min(1).max(160),
        destinatarios: z.array(z.string()).min(1),
        nomeCampanha: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Verificar saldo antes de enviar
        const saldoCheck = await db.debitSmsBalance(
          establishment.id,
          input.destinatarios.length,
          input.nomeCampanha || `Campanha ${establishment.name}`
        );
        
        if (!saldoCheck.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: saldoCheck.message,
          });
        }
        
        const { sendSMS } = await import('./_core/sms');
        
        const resultados: { numero: string; sucesso: boolean; erro?: string }[] = [];
        let enviados = 0;
        let falhas = 0;
        
        console.log(`[Campanhas] Iniciando envio de SMS para ${input.destinatarios.length} destinatários`);
        console.log(`[Campanhas] Mensagem: ${input.mensagem}`);
        
        for (const numero of input.destinatarios) {
          try {
            console.log(`[Campanhas] Enviando SMS para ${numero}...`);
            const resultado = await sendSMS({
              to: numero,
              message: input.mensagem,
              campaignName: input.nomeCampanha || `Campanha ${establishment.name}`,
            });
            
            if (resultado.success) {
              enviados++;
              resultados.push({ numero, sucesso: true });
              console.log(`[Campanhas] SMS enviado com sucesso para ${numero}`);
            } else {
              falhas++;
              resultados.push({ numero, sucesso: false, erro: resultado.error });
              console.error(`[Campanhas] Falha ao enviar SMS para ${numero}: ${resultado.error}`);
            }
          } catch (error) {
            falhas++;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            resultados.push({ numero, sucesso: false, erro: errorMessage });
            console.error(`[Campanhas] Erro ao enviar SMS para ${numero}:`, error);
          }
        }
        
        // Se houve falhas, devolver créditos proporcionais
        if (falhas > 0) {
          const balance = await db.getOrCreateSmsBalance(establishment.id);
          const costPerSms = parseFloat(balance.costPerSms as string);
          const refundAmount = falhas * costPerSms;
          await db.addSmsCredit(
            establishment.id,
            refundAmount,
            `Estorno de ${falhas} SMS não enviados`
          );
          console.log(`[Campanhas] Estorno de R$ ${refundAmount.toFixed(2)} por ${falhas} SMS não enviados`);
        }
        
        console.log(`[Campanhas] Envio concluído: ${enviados} enviados, ${falhas} falhas`);
        
        return {
          total: input.destinatarios.length,
          enviados,
          falhas,
          resultados,
        };
      }),

    // Agendar campanha SMS
    agendarCampanha: protectedProcedure
      .input(z.object({
        mensagem: z.string().min(1).max(160),
        destinatarios: z.array(z.object({
          phone: z.string(),
          name: z.string(),
        })).min(1),
        nomeCampanha: z.string().optional(),
        scheduledAt: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const scheduledDate = new Date(input.scheduledAt);
        if (scheduledDate <= new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A data de agendamento deve ser no futuro' });
        }
        
        // Verificar saldo antes de agendar
        const balance = await db.getOrCreateSmsBalance(establishment.id);
        const costPerSms = parseFloat(balance.costPerSms as string);
        const totalCost = input.destinatarios.length * costPerSms;
        const currentBalance = parseFloat(balance.balance as string);
        
        if (currentBalance < totalCost) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Saldo insuficiente. Necessário R$ ${totalCost.toFixed(2)}, disponível R$ ${currentBalance.toFixed(2)}`,
          });
        }
        
        const campaignId = await db.createScheduledCampaign({
          establishmentId: establishment.id,
          campaignName: input.nomeCampanha || `Campanha agendada ${establishment.name}`,
          message: input.mensagem,
          recipients: input.destinatarios,
          recipientCount: input.destinatarios.length,
          scheduledAt: scheduledDate,
          costPerSms,
          totalCost,
        });
        
        return { id: campaignId, scheduledAt: scheduledDate };
      }),

    // Listar campanhas agendadas
    listarAgendadas: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        return await db.getScheduledCampaigns(establishment.id);
      }),

    // Cancelar campanha agendada
    cancelarAgendada: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const cancelled = await db.cancelScheduledCampaign(input.id, establishment.id);
        if (!cancelled) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campanha não encontrada ou já processada' });
        }
        
        return { success: true };
      }),

    // Listar pacotes de recarga SMS
    getPackages: protectedProcedure
      .query(async () => {
        const { SMS_PACKAGES } = await import("./stripe");
        return SMS_PACKAGES;
      }),

    // Criar sessão de checkout Stripe para recarga
    createCheckout: protectedProcedure
      .input(z.object({
        packageId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento n\u00e3o encontrado' });
        
        const { createSmsCheckoutSession } = await import("./stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const result = await createSmsCheckoutSession({
          packageId: input.packageId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe n\u00e3o configurado. Configure as chaves em Configura\u00e7\u00f5es > Pagamento.' });
        }
        
        return result;
      }),

    // Criar sessão de checkout Stripe com valor personalizado
    createCustomCheckout: protectedProcedure
      .input(z.object({
        amountInCents: z.number().min(100, "Valor mínimo: R$ 1,00").max(100000, "Valor máximo: R$ 1.000,00"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const { createCustomSmsCheckoutSession, COST_PER_SMS } = await import("./stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const amountInReais = input.amountInCents / 100;
        const smsCount = Math.floor(amountInReais / COST_PER_SMS);
        
        if (smsCount < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor insuficiente para pelo menos 1 SMS' });
        }
        
        const result = await createCustomSmsCheckoutSession({
          amountInCents: input.amountInCents,
          smsCount,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado. Configure as chaves em Configurações > Pagamento.' });
        }
        
        return { ...result, smsCount };
      }),
  }),

  // ============ TABLE SPACES (ESPA\u00c7OS) ============
  tableSpaces: router({
    // Listar espaços do estabelecimento
    list: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return [];
      return db.getTableSpaces(establishment.id);
    }),

    // Criar espaço
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        const id = await db.createTableSpace({
          establishmentId: establishment.id,
          name: input.name,
        });
        
        return { id };
      }),

    // Atualizar espaço
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTableSpace(id, data);
        return { success: true };
      }),

    // Deletar espaço
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTableSpace(input.id);
        return { success: true };
      }),
  }),

  // ============ TABLES (MESAS) ============
  tables: router({
    // Listar mesas do estabelecimento
    list: protectedProcedure.query(async ({ ctx }) => {
      const establishment = await db.getEstablishmentByUserId(ctx.user.id);
      if (!establishment) return [];
      return db.getTablesWithTabs(establishment.id);
    }),

    // Buscar mesa por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const table = await db.getTableById(input.id);
        if (!table) return null;
        const tab = await db.getActiveTabByTable(table.id);
        const items = tab ? await db.getTabItems(tab.id) : [];
        return { ...table, tab, items };
      }),

    // Criar nova mesa
    create: protectedProcedure
      .input(z.object({
        number: z.number(),
        name: z.string().optional(),
        capacity: z.number().optional(),
        spaceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Buscar o maior sortOrder existente para que a nova mesa fique no final
        const existingTables = await db.getTablesByEstablishment(establishment.id);
        const maxSortOrder = existingTables.length > 0
          ? Math.max(...existingTables.map(t => t.sortOrder ?? 0))
          : -1;
        
        const id = await db.createTable({
          establishmentId: establishment.id,
          number: input.number,
          name: input.name,
          capacity: input.capacity || 4,
          spaceId: input.spaceId,
          sortOrder: maxSortOrder + 1,
        });
        
        return { id };
      }),

    // Atualizar mesa
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        number: z.number().optional(),
        name: z.string().optional(),
        capacity: z.number().optional(),
        spaceId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTable(input.id, {
          number: input.number,
          name: input.name,
          capacity: input.capacity,
          spaceId: input.spaceId,
        });
        return { success: true };
      }),

    // Deletar mesa
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTable(input.id);
        return { success: true };
      }),

    // Abrir mesa (criar comanda)
    open: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        guests: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        const result = await db.openTable(establishment.id, input.tableId, input.guests || 1);
        return result;
      }),

    // Fechar mesa
    close: protectedProcedure
      .input(z.object({
        tableId: z.number(),
        paymentMethod: z.string(),
        paidAmount: z.number(),
        changeAmount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.closeTable(input.tableId, input.paymentMethod, input.paidAmount, input.changeAmount || 0);
        return { success: true };
      }),

    // Atualizar status da mesa
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["free", "occupied", "reserved", "requesting_bill"]),
        guests: z.number().optional(),
        reservedName: z.string().optional(),
        reservedPhone: z.string().optional(),
        reservedFor: z.string().optional(), // ISO string
        reservedGuests: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reservationData = input.status === "reserved" ? {
          reservedName: input.reservedName,
          reservedPhone: input.reservedPhone,
          reservedFor: input.reservedFor ? new Date(input.reservedFor) : null,
          reservedGuests: input.reservedGuests,
        } : undefined;
        await db.updateTableStatus(input.id, input.status, input.guests, reservationData);
        
        // Enviar WhatsApp de confirmação de reserva se telefone preenchido
        if (input.status === "reserved" && input.reservedPhone) {
          try {
            const establishment = await db.getEstablishmentByUserId(ctx.user.id);
            if (establishment) {
              const whatsappConfig = await db.getWhatsappConfig(establishment.id);
              if (whatsappConfig?.instanceToken && whatsappConfig.notifyOnReservation) {
                const { sendTextMessage } = await import('./_core/uazapi');
                
                // Buscar dados da mesa para pegar o número
                const table = await db.getTableById(input.id);
                const tableNumber = table?.number || input.id;
                
                // Gerar mensagem a partir do template ou usar padrão
                const defaultTemplate = `Olá *{{cliente}}*! \ud83d\udc4b\ud83c\udffb\n\nSua reserva na *Mesa {{mesa}}* foi confirmada!\n\n\ud83d\udcc5 Horário: *{{horario}}*\n\ud83d\udc65 Pessoas: *{{pessoas}}*\n\n⚠️ *Obs:* Em caso de atraso, a mesa poderá ser ocupada.\n\nAguardamos você! \ud83d\ude0a\n\n*${establishment.name}*`;
                
                let message = whatsappConfig.templateReservation || defaultTemplate;
                
                // Substituir variáveis
                message = message
                  .replace(/\{\{mesa\}\}/g, String(tableNumber))
                  .replace(/\{\{cliente\}\}/g, input.reservedName || 'Cliente')
                  .replace(/\{\{horario\}\}/g, input.reservedFor ? new Date(input.reservedFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: establishment?.timezone || 'America/Sao_Paulo' }) : 'Não informado')
                  .replace(/\{\{pessoas\}\}/g, input.reservedGuests ? String(input.reservedGuests) : 'Não informado');
                
                await sendTextMessage(whatsappConfig.instanceToken, input.reservedPhone, message);
                console.log(`[WhatsApp] Confirmação de reserva enviada para ${input.reservedPhone} - Mesa ${tableNumber}`);
              }
            }
          } catch (error) {
            console.error('[WhatsApp] Erro ao enviar confirmação de reserva:', error);
            // Não falhar a operação, apenas logar o erro
          }
        }
        
        return { success: true };
      }),

    // Criar múltiplas mesas de uma vez
    createBatch: protectedProcedure
      .input(z.object({
        startNumber: z.number(),
        count: z.number(),
        capacity: z.number().optional(),
        spaceId: z.number().optional(),
        spaceName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Se foi fornecido um nome de espaço, criar ou buscar o espaço
        let spaceId = input.spaceId;
        if (input.spaceName && !spaceId) {
          // Verificar se já existe um espaço com esse nome
          const existingSpace = await db.getTableSpaceByName(establishment.id, input.spaceName);
          if (existingSpace) {
            spaceId = existingSpace.id;
          } else {
            // Criar novo espaço
            spaceId = await db.createTableSpace({
              establishmentId: establishment.id,
              name: input.spaceName,
            });
          }
        }
        
        // Buscar o maior sortOrder existente para que novas mesas fiquem no final
        const existingTables = await db.getTablesByEstablishment(establishment.id);
        const maxSortOrder = existingTables.length > 0
          ? Math.max(...existingTables.map(t => t.sortOrder ?? 0))
          : -1;
        
        const ids: number[] = [];
        for (let i = 0; i < input.count; i++) {
          const id = await db.createTable({
            establishmentId: establishment.id,
            number: input.startNumber + i,
            capacity: input.capacity || 4,
            sortOrder: maxSortOrder + 1 + i,
            spaceId: spaceId,
          });
          ids.push(id);
        }
        
        return { ids, count: ids.length, spaceId };
      }),

    // Juntar mesas (merge)
    merge: protectedProcedure
      .input(z.object({
        sourceTableId: z.number(), // Mesa que está sendo arrastada
        targetTableId: z.number(), // Mesa de destino
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: "NOT_FOUND", message: "Estabelecimento não encontrado" });
        
        // Buscar as duas mesas
        const sourceTable = await db.getTableById(input.sourceTableId);
        const targetTable = await db.getTableById(input.targetTableId);
        
        if (!sourceTable || !targetTable) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mesa não encontrada" });
        }
        
        // Verificar se alguma das mesas já está juntada a outra
        if (sourceTable.mergedIntoId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta mesa já está juntada a outra" });
        }
        if (targetTable.mergedIntoId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A mesa de destino já está juntada a outra" });
        }
        
        // Determinar qual mesa será a principal (menor número)
        const primaryTable = sourceTable.number < targetTable.number ? sourceTable : targetTable;
        const secondaryTable = sourceTable.number < targetTable.number ? targetTable : sourceTable;
        
        // Coletar todos os números de mesas para o displayNumber
        const existingMergedIds: number[] = primaryTable.mergedTableIds 
          ? JSON.parse(primaryTable.mergedTableIds) 
          : [];
        
        // Adicionar a mesa secundária e suas mesas já juntadas
        const secondaryMergedIds: number[] = secondaryTable.mergedTableIds 
          ? JSON.parse(secondaryTable.mergedTableIds) 
          : [];
        
        const allMergedIds = [...existingMergedIds, secondaryTable.id, ...secondaryMergedIds];
        
        // Coletar todos os números para o displayNumber
        const allNumbers = [primaryTable.number];
        for (const id of allMergedIds) {
          const t = await db.getTableById(id);
          if (t) allNumbers.push(t.number);
        }
        allNumbers.sort((a, b) => a - b);
        const displayNumber = allNumbers.join('-');
        
        // Transferir itens da comanda da mesa secundária para a principal
        const sourceTab = await db.getActiveTabByTable(secondaryTable.id);
        let targetTab = await db.getActiveTabByTable(primaryTable.id);
        
        if (sourceTab) {
          // Se a mesa principal não tem comanda, criar uma
          if (!targetTab) {
            const result = await db.openTable(establishment.id, primaryTable.id, 1);
            targetTab = await db.getTabById(result.tabId);
          }
          
          if (targetTab) {
            // Transferir itens
            const sourceItems = await db.getTabItems(sourceTab.id);
            if (sourceItems.length > 0) {
              await db.addItemsToTab(targetTab.id, sourceItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                complements: item.complements || undefined,
                notes: item.notes || undefined,
              })));
            }
            
            // Fechar a comanda da mesa secundária (cancelar)
            await db.cancelTab(sourceTab.id);
          }
        }
        
        // Atualizar a mesa principal com os IDs das mesas juntadas
        await db.updateTableMerge(primaryTable.id, {
          mergedTableIds: JSON.stringify(allMergedIds),
          displayNumber,
          status: 'occupied',
          occupiedAt: primaryTable.occupiedAt || new Date(),
        });
        
        // Marcar a mesa secundária como juntada
        await db.updateTableMerge(secondaryTable.id, {
          mergedIntoId: primaryTable.id,
          mergedTableIds: null,
          displayNumber: null,
        });
        
        // Marcar mesas que estavam juntadas à secundária como juntadas à principal
        for (const id of secondaryMergedIds) {
          await db.updateTableMerge(id, {
            mergedIntoId: primaryTable.id,
          });
        }
        
        return { 
          success: true, 
          primaryTableId: primaryTable.id,
          displayNumber,
        };
      }),

    // Separar mesas (split)
    split: protectedProcedure
      .input(z.object({
        tableId: z.number(), // Mesa combinada a ser separada
      }))
      .mutation(async ({ input }) => {
        const table = await db.getTableById(input.tableId);
        if (!table) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Mesa não encontrada" });
        }
        
        // Verificar se é uma mesa combinada
        if (!table.mergedTableIds) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta mesa não está combinada" });
        }
        
        const mergedIds: number[] = JSON.parse(table.mergedTableIds);
        
        // Limpar a mesa principal
        await db.updateTableMerge(table.id, {
          mergedTableIds: null,
          displayNumber: null,
        });
        
        // Liberar todas as mesas que estavam juntadas
        for (const id of mergedIds) {
          await db.updateTableMerge(id, {
            mergedIntoId: null,
            status: 'free',
          });
        }
        
        return { success: true };
      }),
  }),

  // ============ TABS (COMANDAS) ============
  tabs: router({
    // Buscar comanda por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const tab = await db.getTabById(input.id);
        if (!tab) return null;
        const items = await db.getTabItems(tab.id);
        return { ...tab, items };
      }),

    // Buscar comanda ativa de uma mesa
    getByTable: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .query(async ({ input }) => {
        const tab = await db.getActiveTabByTable(input.tableId);
        if (!tab) return null;
        const items = await db.getTabItems(tab.id);
        return { ...tab, items };
      }),

    // Adicionar itens à comanda
    addItems: protectedProcedure
      .input(z.object({
        tabId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Adicionar itens à comanda
        await db.addItemsToTab(input.tabId, input.items);
        
        // Buscar a comanda para obter informações da mesa
        const tab = await db.getTabById(input.tabId);
        if (!tab) {
          return { success: true };
        }
        
        // Buscar a mesa para obter o número
        if (!tab.tableId) {
          return { success: true };
        }
        const table = await db.getTableById(tab.tableId);
        if (!table) {
          return { success: true };
        }
        
        // Buscar o estabelecimento
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) {
          return { success: true };
        }
        
        // Calcular o total dos itens
        const subtotal = input.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        
        // Gerar número do pedido
        const orderNumber = Date.now().toString().slice(-6);
        
        // Usar displayNumber para mesas combinadas, senão usar o número normal
        const tableDisplayName = table.displayNumber || String(table.number);
        
        // Criar o pedido na tabela orders
        await db.createOrder({
          establishmentId: establishment.id,
          orderNumber,
          customerName: `Mesa ${tableDisplayName}`,
          customerPhone: "",
          customerAddress: "",
          deliveryType: "dine_in",
          paymentMethod: "cash",
          subtotal: subtotal.toFixed(2),
          deliveryFee: "0.00",
          discount: "0.00",
          total: subtotal.toFixed(2),
          notes: `Comanda da Mesa ${tableDisplayName}`,
          status: "preparing",
          source: "pdv",
        }, input.items.map(item => ({
          orderId: 0, // Será preenchido pela função createOrder
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          complements: item.complements || [],
          notes: item.notes,
        })));
        
        return { success: true };
      }),

    // Atualizar item da comanda
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().optional(),
        status: z.enum(["pending", "preparing", "ready", "delivered", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, quantity, ...rest } = input;
        
        // Se a quantidade mudou, recalcular o totalPrice
        if (quantity !== undefined) {
          // Buscar o item atual para calcular o novo totalPrice
          const currentItem = await db.getTabItemById(id);
          if (currentItem) {
            const unitPrice = parseFloat(currentItem.unitPrice);
            const complementsTotal = (currentItem.complements || []).reduce(
              (sum: number, c: any) => sum + (parseFloat(c.price) || 0) * (c.quantity || 1), 0
            );
            const newTotalPrice = ((unitPrice + complementsTotal) * quantity).toFixed(2);
            await db.updateTabItem(id, { ...rest, quantity, totalPrice: newTotalPrice });
          } else {
            await db.updateTabItem(id, { ...rest, quantity });
          }
        } else {
          await db.updateTabItem(id, rest);
        }
        return { success: true };
      }),

    // Cancelar item da comanda
    cancelItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.cancelTabItem(input.id);
        return { success: true };
      }),

    // Atualizar comanda (desconto, taxa de serviço, etc)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        discount: z.string().optional(),
        serviceCharge: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTab(id, data);
        // Recalcular totais
        await db.recalculateTabTotals(id);
        return { success: true };
      }),

    // Pedir conta (mudar status para requesting_bill)
    requestBill: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateTableStatus(input.tableId, "requesting_bill");
        const tab = await db.getActiveTabByTable(input.tableId);
        if (tab) {
          await db.updateTab(tab.id, { status: "requesting_bill" });
        }
        return { success: true };
      }),
  }),

  // ============ STRIPE CONNECT - PAGAMENTO ONLINE ============
  stripeConnect: router({
    // Criar connected account para o restaurante
    createAccount: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Verificar se já tem uma conta Stripe Connect
        if (establishment.stripeAccountId) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Estabelecimento já possui uma conta Stripe Connect' });
        }
        
        const { createConnectedAccount } = await import("./stripeConnect");
        const { accountId } = await createConnectedAccount({
          displayName: establishment.name,
          contactEmail: establishment.email || ctx.user.email || '',
        });
        
        // Salvar o accountId no estabelecimento
        await db.updateEstablishment(establishment.id, {
          stripeAccountId: accountId,
        });
        
        return { accountId };
      }),
    
    // Gerar link de onboarding
    createOnboardingLink: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        if (!establishment.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Crie uma conta Stripe Connect primeiro' });
        }
        
        const { createAccountLink } = await import("./stripeConnect");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const { url } = await createAccountLink({
          accountId: establishment.stripeAccountId,
          returnUrl: `${origin}/configuracoes?stripe=return&tab=pagamento-online`,
          refreshUrl: `${origin}/configuracoes?stripe=refresh&tab=pagamento-online`,
        });
        
        return { url };
      }),
    
    // Verificar status da conta
    getAccountStatus: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        if (!establishment.stripeAccountId) {
          return {
            hasAccount: false,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            onboardingComplete: false,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        }
        
        try {
          const { getAccountStatus } = await import("./stripeConnect");
          const status = await getAccountStatus(establishment.stripeAccountId);
          
          // Atualizar status de onboarding no banco se mudou
          const isComplete = status.chargesEnabled && status.detailsSubmitted;
          if (isComplete !== establishment.stripeOnboardingComplete) {
            await db.updateEstablishment(establishment.id, {
              stripeOnboardingComplete: isComplete,
            });
          }
          
          return {
            hasAccount: true,
            ...status,
            onboardingComplete: isComplete,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        } catch (error) {
          console.error('[Stripe Connect] Erro ao buscar status:', error);
          return {
            hasAccount: true,
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
            onboardingComplete: false,
            onlinePaymentEnabled: establishment.onlinePaymentEnabled,
          };
        }
      }),
    
    // Ativar/desativar pagamento online
    toggleOnlinePayment: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Só pode ativar se o onboarding está completo
        if (input.enabled) {
          if (!establishment.stripeAccountId || !establishment.stripeOnboardingComplete) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Complete o cadastro no Stripe antes de ativar o pagamento online.',
            });
          }
        }
        
        await db.updateEstablishment(establishment.id, {
          onlinePaymentEnabled: input.enabled,
        });
        
        return { success: true, enabled: input.enabled };
      }),
    
    // Abrir dashboard do Stripe Express
    getDashboardLink: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment?.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Conta Stripe Connect não encontrada' });
        }
        
        const { createDashboardLink } = await import("./stripeConnect");
        const { url } = await createDashboardLink(establishment.stripeAccountId);
        return { url };
      }),
    
    // Criar checkout session para pedido online (endpoint público)
    createOrderCheckout: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        customerAddress: z.string().optional(),
        deliveryFee: z.string().default("0"),
        discount: z.string().default("0"),
        subtotal: z.string(),
        total: z.string(),
        notes: z.string().optional(),
        changeAmount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        loyaltyCardId: z.number().optional(),
        cashbackAmount: z.string().optional(),
        cashbackCustomerPhone: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        }
        
        if (!establishment.onlinePaymentEnabled || !establishment.stripeAccountId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pagamento online não está disponível para este estabelecimento' });
        }
        
        // Verificar se o estabelecimento está aberto (cálculo dinâmico baseado em horários de funcionamento)
        const storeStatusForCheckout = await db.getEstablishmentOpenStatus(input.establishmentId);
        
        if (!storeStatusForCheckout.isOpen) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'O estabelecimento está fechado' });
        }
        
        const { createOrderCheckoutSession } = await import("./stripeConnect");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        // Preparar items para o checkout
        const orderItems = input.items.map(item => {
          const complementsTotal = (item.complements || []).reduce(
            (sum, c) => sum + c.price * (c.quantity || 1), 0
          );
          const unitPriceInCents = Math.round((parseFloat(item.unitPrice) + complementsTotal) * 100);
          
          const complementsDesc = (item.complements || []).length > 0
            ? ` (${(item.complements || []).map(c => c.name).join(', ')})`
            : '';
          
          return {
            name: item.productName,
            quantity: item.quantity,
            priceInCents: unitPriceInCents,
            description: complementsDesc || undefined,
          };
        });
        
        const deliveryFeeInCents = Math.round(parseFloat(input.deliveryFee || '0') * 100);
        
        // Salvar dados do pedido para usar no webhook
        const orderDataObj = {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress || '',
          deliveryType: 'delivery',
          paymentMethod: 'card_online',
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee || '0',
          discount: input.discount || '0',
          total: input.total,
          notes: input.notes || '',
          changeAmount: input.changeAmount || '',
          couponCode: input.couponCode || '',
          couponId: input.couponId || null,
          loyaltyCardId: input.loyaltyCardId || null,
          items: input.items,
        };
        
        const menuSlug = establishment.menuSlug || '';
        
        const result = await createOrderCheckoutSession({
          connectedAccountId: establishment.stripeAccountId,
          orderItems,
          deliveryFeeInCents,
          customerEmail: undefined,
          customerName: input.customerName,
          establishmentId: establishment.id,
          establishmentName: establishment.name,
          orderData: JSON.stringify({ type: 'pending_db' }), // Dados reais salvos no banco
          successUrl: `${origin}/menu/${menuSlug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/menu/${menuSlug}?payment=cancelled`,
        });
        
        // Salvar dados completos do pedido no banco (evita limite de 500 chars do metadata Stripe)
        await db.savePendingOnlineOrder(result.sessionId, establishment.id, orderDataObj);
        
        return result;
      }),

    // Verificar status do pagamento de checkout session (endpoint público)
    checkPaymentStatus: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
      }))
      .query(async ({ input }) => {
        try {
          const { getCheckoutSessionStatus } = await import("./stripeConnect");
          const result = await getCheckoutSessionStatus(input.sessionId);
          
          // Se pagamento confirmado, buscar dados do pedido criado
          if (result.status === 'complete' && result.paymentStatus === 'paid') {
            const pendingOrder = await db.getPendingOnlineOrder(input.sessionId);
            if (pendingOrder && pendingOrder.status === 'completed') {
              return {
                ...result,
                orderNumber: pendingOrder.resultOrderNumber || undefined,
                orderId: pendingOrder.resultOrderId || undefined,
              };
            }
          }
          
          return result;
        } catch (error) {
          console.error('[checkPaymentStatus] Erro:', error);
          return { status: 'open' as const, paymentStatus: 'unpaid' };
        }
      }),
  }),

  // ============ PLANS (PLANOS) ============
  plans: router({
    // Criar sessão de checkout Stripe para upgrade de plano
    createCheckout: protectedProcedure
      .input(z.object({
        planId: z.string(),
        isAnnual: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const { createPlanCheckoutSession } = await import("./stripe");
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, '') || '';
        
        const result = await createPlanCheckoutSession({
          planId: input.planId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          establishmentId: establishment.id,
          origin,
          isAnnual: input.isAnnual,
          stripeCustomerId: establishment.stripeCustomerId,
        });
        
        if (!result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe não configurado.' });
        }
        
        return result;
      }),
  }),

  pdvCustomer: router({
    // Buscar cliente PDV por telefone
    findByPhone: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(8), // Mínimo 8 dígitos
      }))
      .query(async ({ input }) => {
        const customer = await db.getPdvCustomerByPhone(input.establishmentId, input.phone);
        return customer;
      }),

    // Salvar/atualizar cliente PDV
    upsert: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(8),
        name: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        reference: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertPdvCustomer(input);
      }),
  }),

  // ============ REVIEWS ADMIN ============
  reviewsAdmin: router({
    // Métricas de avaliações
    metrics: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getReviewMetrics(input.establishmentId);
      }),

    // Listar avaliações com filtro
    list: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        filter: z.enum(['all', 'pending', 'responded']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getReviewsAdmin(input.establishmentId, {
          filter: input.filter || 'all',
          limit: input.limit,
          offset: input.offset,
        });
      }),

    // Contar total de avaliações (para paginação)
    count: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        filter: z.enum(['all', 'pending', 'responded']).optional(),
      }))
      .query(async ({ input }) => {
        return db.getReviewsAdminCount(input.establishmentId, input.filter || 'all');
      }),

    // Responder avaliação
    respond: protectedProcedure
      .input(z.object({
        reviewId: z.number(),
        establishmentId: z.number(),
        responseText: z.string().min(1, "Resposta não pode ser vazia").max(1000, "Resposta muito longa"),
      }))
      .mutation(async ({ input }) => {
        await db.respondToReview(input.reviewId, input.establishmentId, input.responseText);
        return { success: true };
      }),

    // Marcar como lidas
    markAsRead: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        reviewIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await db.markReviewsAsRead(input.establishmentId, input.reviewIds);
        return { success: true };
      }),

    // Contar não lidas (para badge)
    unreadCount: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getUnreadReviewCount(input.establishmentId);
      }),
  }),

  // ============================================================
  // COMBO
  // ============================================================
  combo: router({
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string(),
        images: z.array(z.string()).optional(),
        groups: z.array(z.object({
          name: z.string().min(1),
          isRequired: z.boolean(),
          maxQuantity: z.number().min(1),
          sortOrder: z.number(),
          items: z.array(z.object({
            productId: z.number(),
            sortOrder: z.number(),
          })),
        })),
      }))
      .mutation(async ({ input }) => {
        return db.createCombo(input);
      }),

    getGroups: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return db.getComboGroupsByProductId(input.productId);
      }),

    delete: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCombo(input.productId);
        return { success: true };
      }),

    searchProducts: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.searchProductsForCombo(input.establishmentId, input.search, input.limit);
      }),
   }),

  // ============ ENTREGADORES (DRIVERS) ============
  driver: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const allDrivers = await db.getDriversByEstablishment(establishment.id);
        
        // Enrich each driver with 7-day stats and pending total
        const enriched = await Promise.all(
          allDrivers.map(async (driver) => {
            const last7 = await db.getDriverDeliveriesLast7Days(driver.id);
            const pendingTotal = await db.getDriverPendingTotal(driver.id);
            return {
              ...driver,
              deliveriesLast7Days: last7.count,
              repasseLast7Days: last7.totalRepasse,
              pendingTotal,
            };
          })
        );
        
        return enriched;
      }),

    metrics: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getDriverMetrics(establishment.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const driver = await db.getDriverById(input.id);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        return driver;
      }),

    getDetailMetrics: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return db.getDriverDetailMetrics(input.driverId);
      }),

    getDeliveries: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return db.getDeliveriesByDriverWithOrders(input.driverId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email().optional().or(z.literal('')),
        whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
        isActive: z.boolean().default(true),
        repasseStrategy: z.enum(['neighborhood', 'fixed', 'percentage']).default('neighborhood'),
        fixedValue: z.string().optional(),
        percentageValue: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const id = await db.createDriver({
          establishmentId: establishment.id,
          name: input.name,
          email: input.email || null,
          whatsapp: input.whatsapp,
          isActive: input.isActive,
          repasseStrategy: input.repasseStrategy,
          fixedValue: input.fixedValue || null,
          percentageValue: input.percentageValue || null,
        });
        
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal('')),
        whatsapp: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        repasseStrategy: z.enum(['neighborhood', 'fixed', 'percentage']).optional(),
        fixedValue: z.string().optional().nullable(),
        percentageValue: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDriver(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDriver(input.id);
        return { success: true };
      }),

    // Assign a driver to an order (create delivery record)
    assignToOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        driverId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Check if delivery already exists for this order
        const existing = await db.getDeliveryByOrderId(input.orderId);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Este pedido já possui um entregador atribuído' });
        
        const driver = await db.getDriverById(input.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        
        const deliveryFee = parseFloat(order.deliveryFee || '0');
        
        // Calculate repasse based on strategy
        let repasseValue = 0;
        if (driver.repasseStrategy === 'neighborhood') {
          repasseValue = deliveryFee; // Same as delivery fee
        } else if (driver.repasseStrategy === 'fixed') {
          repasseValue = parseFloat(driver.fixedValue || '0');
        } else if (driver.repasseStrategy === 'percentage') {
          const pct = parseFloat(driver.percentageValue || '0');
          repasseValue = deliveryFee * (pct / 100);
        }
        
        const deliveryId = await db.createDelivery({
          establishmentId: establishment.id,
          orderId: input.orderId,
          driverId: input.driverId,
          deliveryFee: String(deliveryFee),
          repasseValue: String(repasseValue.toFixed(2)),
          paymentStatus: 'pending',
          whatsappSent: false,
        });
        
        // Auto-send WhatsApp notification to driver (skip if already notified)
        let whatsappSent = false;
        const alreadyNotified = order.deliveryNotified;
        if (!alreadyNotified) {
          try {
            if (driver.isActive) {
              const config = await db.getWhatsappConfig(establishment.id);
              if (config && config.instanceToken && config.status === 'connected') {
                const message = buildDriverDeliveryMessage(order, deliveryFee);
                
                const { sendTextMessage } = await import('./_core/uazapi');
                await sendTextMessage(config.instanceToken, driver.whatsapp, message);
                await db.markDeliveryWhatsappSent(deliveryId);
                whatsappSent = true;
              }
            }
          } catch (error) {
            console.error('[Driver WhatsApp] Erro ao enviar notificação automática:', error);
          }
          await db.markOrderDeliveryNotified(input.orderId);
        } else {
          whatsappSent = true; // Já notificado no aceite
        }
        
        return { deliveryId, whatsappSent };
      }),

    // Mark delivery as paid
    markAsPaid: protectedProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Get delivery details before marking as paid
        const delivery = await db.getDeliveryById(input.deliveryId);
        if (!delivery) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entrega não encontrada' });
        
        // Get driver info for description
        const driver = await db.getDriverById(delivery.driverId);
        const driverName = driver?.name || 'Entregador';
        
        // Get establishment
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        // Mark delivery as paid
        await db.markDeliveryAsPaid(input.deliveryId);
        
        // Register as expense in Finanças
        const repasseValue = parseFloat(delivery.repasseValue || '0');
        if (repasseValue > 0) {
          const categoryId = await db.getOrCreateEntregadoresCategory(establishment.id);
          await db.createExpense({
            establishmentId: establishment.id,
            categoryId,
            description: `Repasse entrega - ${driverName} (Pedido #${delivery.orderId})`,
            amount: repasseValue.toFixed(2),
            paymentMethod: 'pix',
            date: new Date(),
          });
        }
        
        return { success: true };
      }),

    // Send WhatsApp notification to driver
    sendWhatsappNotification: protectedProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input }) => {
        // Get delivery by ID using a helper
        const del = await db.getDeliveryById(input.deliveryId);
        
        if (!del) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entrega não encontrada' });
        if (del.whatsappSent) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Notificação já foi enviada' });
        
        const driver = await db.getDriverById(del.driverId);
        if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: 'Entregador não encontrado' });
        
        const order = await db.getOrderById(del.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
        
        const establishment = await db.getEstablishmentById(order.establishmentId);
        const config = await db.getWhatsappConfig(order.establishmentId);
        
        if (!config || !config.instanceToken || config.status !== 'connected') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está conectado' });
        }
        
        const message = buildDriverDeliveryMessage(order);
        
        try {
          const { sendTextMessage } = await import('./_core/uazapi');
          await sendTextMessage(config.instanceToken, driver.whatsapp, message);
          await db.markDeliveryWhatsappSent(input.deliveryId);
          return { success: true };
        } catch (error) {
          console.error('[Driver WhatsApp] Erro ao enviar:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao enviar mensagem WhatsApp' });
        }
      }),

    // Get active drivers for assignment dropdown
    listActive: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getActiveDriversByEstablishment(establishment.id);
      }),

    // Check if a WhatsApp number is valid
    checkWhatsApp: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
        const config = await db.getWhatsappConfig(establishment.id);
        if (!config || !config.instanceToken || config.status !== 'connected') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'WhatsApp não está conectado. Configure na página de Configurações.' });
        }
        
        const { checkWhatsAppNumber } = await import('./_core/uazapi');
        const result = await checkWhatsAppNumber(config.instanceToken, input.phone);
        
        return {
          exists: result.exists,
          verifiedName: result.verifiedName,
          error: result.error,
        };
      }),

    // Get delivery info for an order
    getByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const delivery = await db.getDeliveryByOrderId(input.orderId);
        if (!delivery) return null;
        const driver = await db.getDriverById(delivery.driverId);
        return { ...delivery, driver };
      }),

    // Get driver notify timing setting
    getNotifyTiming: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const timing = await db.getDriverNotifyTiming(establishment.id);
        return { timing };
      }),

    // Update driver notify timing setting
    updateNotifyTiming: protectedProcedure
      .input(z.object({ timing: z.enum(["on_accepted", "on_ready"]) }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.updateDriverNotifyTiming(establishment.id, input.timing);
        return { success: true };
      }),
  }),

  // ============ SCHEDULING (AGENDAMENTO) ============
  scheduling: router({
    // Buscar configurações de agendamento
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const config = await db.getSchedulingConfig(establishment.id);
        return config;
      }),

    // Atualizar configurações de agendamento
    updateConfig: protectedProcedure
      .input(z.object({
        schedulingEnabled: z.boolean().optional(),
        schedulingMinAdvance: z.number().min(15).max(1440).optional(),
        schedulingMaxDays: z.number().min(1).max(30).optional(),
        schedulingInterval: z.number().refine(v => [15, 30, 60].includes(v!), { message: 'Intervalo deve ser 15, 30 ou 60 minutos' }).optional(),
        schedulingMoveMinutes: z.number().min(5).max(120).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.updateSchedulingConfig(establishment.id, input);
        return { success: true };
      }),

    // Buscar configurações de agendamento (público - por slug)
    getPublicConfig: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const dbi = await db.getDb();
        if (!dbi) return null;
        const { establishments: est } = await import('../drizzle/schema');
        const [estab] = await dbi.select({
          schedulingEnabled: est.schedulingEnabled,
          schedulingMinAdvance: est.schedulingMinAdvance,
          schedulingMaxDays: est.schedulingMaxDays,
          schedulingInterval: est.schedulingInterval,
        }).from(est).where(eq(est.menuSlug, input.slug)).limit(1);
        return estab || null;
      }),

    // Buscar horários de funcionamento públicos (por slug)
    getPublicBusinessHours: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const dbi = await db.getDb();
        if (!dbi) return [];
        const { establishments: est, businessHours: bh } = await import('../drizzle/schema');
        const [estab] = await dbi.select({ id: est.id }).from(est).where(eq(est.menuSlug, input.slug)).limit(1);
        if (!estab) return [];
        const hours = await dbi.select().from(bh).where(eq(bh.establishmentId, estab.id)).orderBy(asc(bh.dayOfWeek));
        return hours;
      }),

    // Buscar pedidos agendados por data
    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        const orders = await db.getScheduledOrdersByDate(establishment.id, input.date);
        // Buscar itens de cada pedido
        const dbi = await db.getDb();
        if (!dbi) return [];
        const { orderItems: oi } = await import('../drizzle/schema');
        const result = [];
        for (const order of orders) {
          const items = await dbi.select().from(oi).where(eq(oi.orderId, order.id));
          result.push({ ...order, items });
        }
        return result;
      }),

    // Buscar pedidos agendados por range de datas
    getByRange: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getScheduledOrdersByRange(establishment.id, input.startDate, input.endDate);
      }),

    // Contagem de pedidos agendados pendentes (para badge na sidebar)
    pendingCount: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return { count: 0 };
        const count = await db.getScheduledPendingCount(establishment.id);
        return { count };
      }),

    // Contagem de pedidos por mês (para calendário)
    getMonthCounts: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        return db.getScheduledOrderCountsByMonth(establishment.id, input.year, input.month);
      }),

    // Aceitar pedido agendado antecipadamente
    accept: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.acceptScheduledOrder(input.orderId);
        return { success: true };
      }),

    // Cancelar pedido agendado
    cancel: protectedProcedure
      .input(z.object({ orderId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.cancelScheduledOrder(input.orderId, input.reason);
        return { success: true };
      }),

    // Reagendar pedido
    reschedule: protectedProcedure
      .input(z.object({ orderId: z.number(), scheduledAt: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        await db.rescheduleOrder(input.orderId, new Date(input.scheduledAt));
        return { success: true };
      }),
  }),

  // ============ FINANÇAS ============
  finance: router({
    // Categorias de despesa
    listCategories: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getExpenseCategories(input.establishmentId);
      }),
    
    createCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createExpenseCategory(input);
        return { id };
      }),
    
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateExpenseCategory(id, data);
        return { success: true };
      }),
    
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await db.deleteExpenseCategory(input.id);
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),
    
    // Despesas
    listExpenses: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.number().optional(),
        paymentMethod: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { establishmentId, ...filters } = input;
        return db.getExpenses(establishmentId, filters);
      }),
    
    createExpense: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        categoryId: z.number(),
        description: z.string().min(1),
        amount: z.string(),
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createExpense({
          ...input,
          date: new Date(input.date),
        });
        return { id };
      }),
    
    updateExpense: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]).optional(),
        date: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, date, ...data } = input;
        await db.updateExpense(id, {
          ...data,
          ...(date ? { date: new Date(date) } : {}),
        });
        return { success: true };
      }),
    
    deleteExpense: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteExpense(input.id);
        return { success: true };
      }),
    
    // Resumo financeiro
    summary: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getFinanceSummary(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),
    
    // Gráfico de evolução
    chart: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['week', 'month']).optional(),
      }))
      .query(async ({ input }) => {
        return db.getFinanceChart(input.establishmentId, input.period ?? 'week');
      }),
    
    // Despesas por categoria
    expensesByCategory: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month']).optional(),
      }))
      .query(async ({ input }) => {
        return db.getExpensesByCategory(input.establishmentId, input.period ?? 'month');
      }),
    
    // Meta mensal
    getGoal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getMonthlyGoal(input.establishmentId, input.month, input.year);
      }),
    
    setGoal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
        targetProfit: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.upsertMonthlyGoal(input);
        return { id };
      }),

    // Metas financeiras personalizadas (múltiplas)
    listGoals: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.listFinancialGoals(input.establishmentId, input.month, input.year);
      }),

    createGoalCustom: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        month: z.number(),
        year: z.number(),
        name: z.string().min(1),
        targetValue: z.string(),
        type: z.enum(["profit", "revenue", "savings", "custom"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createFinancialGoal(input);
        return { id };
      }),

    updateGoalCustom: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        name: z.string().min(1).optional(),
        targetValue: z.string().optional(),
        type: z.enum(["profit", "revenue", "savings", "custom"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, establishmentId, ...data } = input;
        await db.updateFinancialGoal(id, establishmentId, data);
        return { success: true };
      }),

    deleteGoalCustom: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteFinancialGoal(input.id, input.establishmentId);
        return { success: true };
      }),

    // Receitas diárias (faturamento consolidado por dia)
    listDailyRevenue: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { establishmentId, ...filters } = input;
        return db.getDailyRevenue(establishmentId, filters);
      }),

    // Lançamentos futuros (próximas ocorrências de recorrentes)
    upcomingRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getUpcomingRecurringExpenses(input.establishmentId);
      }),

    // Marcar lançamento futuro como pago
    markUpcomingAsPaid: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        recurringId: z.number(),
        frequency: z.string(), // 'once' | 'weekly' | 'monthly' | 'yearly'
        description: z.string(),
        categoryId: z.number(),
        amount: z.string(),
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        dueDate: z.string(), // ISO date string
        type: z.string(), // 'expense' | 'revenue'
      }))
      .mutation(async ({ input }) => {
        if (input.frequency === 'once') {
          // One-time future expense: update date to today and add paid marker in notes
          await db.updateExpense(input.recurringId, {
            date: new Date(),
            notes: `Pago via lançamento futuro (avulso #${input.recurringId}, venc:${input.dueDate})`,
          });
          return { success: true, action: 'updated' as const, expenseId: input.recurringId, originalDate: input.dueDate };
        } else {
          // Recurring: create a new expense entry for this occurrence
          const id = await db.createExpense({
            establishmentId: input.establishmentId,
            categoryId: input.categoryId,
            description: input.description,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            date: new Date(input.dueDate),
            notes: `Pago via lançamento futuro (recorrência #${input.recurringId}, venc:${input.dueDate})`,
          });
          return { success: true, action: 'created' as const, expenseId: id, originalDate: null };
        }
      }),

    // Desfazer marcação de pago
    undoMarkAsPaid: protectedProcedure
      .input(z.object({
        expenseId: z.number(),
        action: z.enum(['created', 'updated']),
        originalDate: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        if (input.action === 'created') {
          // Delete the expense that was created
          await db.deleteExpense(input.expenseId);
          return { success: true };
        } else if (input.action === 'updated' && input.originalDate) {
          // Restore the original date and clear paid notes
          await db.updateExpense(input.expenseId, {
            date: new Date(input.originalDate),
            notes: '',
          });
          return { success: true };
        }
        return { success: false };
      }),

    // Despesas Recorrentes
    listRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.listRecurringExpenses(input.establishmentId);
      }),

    createRecurring: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["expense", "revenue"]),
        description: z.string(),
        categoryId: z.number(),
        amount: z.string(),
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]),
        frequency: z.enum(["weekly", "monthly", "yearly"]),
        executionDay: z.number(),
        executionMonth: z.number().optional(),
        generateAsPending: z.boolean(),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRecurringExpense({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          notes: input.notes ?? null,
        });
        return { id };
      }),

    updateRecurring: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        amount: z.string().optional(),
        paymentMethod: z.enum(["cash", "pix", "card", "transfer"]).optional(),
        frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
        executionDay: z.number().optional(),
        executionMonth: z.number().nullable().optional(),
        generateAsPending: z.boolean().optional(),
        endDate: z.string().nullable().optional(),
        active: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, establishmentId, endDate, ...data } = input;
        const updateData: any = { ...data };
        if (endDate !== undefined) {
          updateData.endDate = endDate ? new Date(endDate) : null;
        }
        await db.updateRecurringExpense(id, establishmentId, updateData);
        return { success: true };
      }),

    recurringHistory: protectedProcedure
      .input(z.object({
        recurringExpenseId: z.number(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getRecurringExpenseHistory(input.recurringExpenseId, input.establishmentId);
      }),

    deleteRecurring: protectedProcedure
      .input(z.object({
        id: z.number(),
        establishmentId: z.number(),
        deleteFutureExpenses: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.deleteFutureExpenses) {
          // Deactivate instead of deleting, so history is preserved
          await db.deactivateRecurringExpense(input.id, input.establishmentId);
        } else {
          await db.deleteRecurringExpense(input.id, input.establishmentId);
        }
        return { success: true };
      }),

    processRecurring: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ input }) => {
        return db.processRecurringExpenses(input.establishmentId);
      }),

    getMonthlyComparison: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getMonthlyComparison(input.establishmentId);
      }),

    revenueByChannel: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getRevenueByChannel(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),

    revenueByPaymentMethod: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getRevenueByPaymentMethod(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),

    paymentMethodDaily: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        period: z.enum(['today', 'week', 'month', 'custom']).optional(),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getPaymentMethodDailyBreakdown(input.establishmentId, input.period ?? 'today', input.customStart, input.customEnd);
      }),
  }),

  // ============ CASHBACK ============
  cashback: router({
    // Buscar configurações de cashback do estabelecimento (admin)
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) return null;
        return {
          rewardProgramType: establishment.rewardProgramType || 'none',
          cashbackEnabled: establishment.cashbackEnabled || false,
          cashbackPercent: establishment.cashbackPercent || '0',
          cashbackApplyMode: establishment.cashbackApplyMode || 'all',
          cashbackCategoryIds: establishment.cashbackCategoryIds || [],
          cashbackAllowPartialUse: establishment.cashbackAllowPartialUse ?? true,
          loyaltyEnabled: establishment.loyaltyEnabled || false,
        };
      }),

    // Salvar configurações de programa de recompensas (admin)
    saveConfig: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        rewardProgramType: z.enum(['none', 'loyalty', 'cashback']),
        cashbackPercent: z.string().optional(),
        cashbackApplyMode: z.enum(['all', 'categories']).optional(),
        cashbackCategoryIds: z.array(z.number()).optional(),
        cashbackAllowPartialUse: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { establishmentId, rewardProgramType, ...cashbackSettings } = input;
        
        const updateData: any = { rewardProgramType };
        
        if (rewardProgramType === 'cashback') {
          updateData.cashbackEnabled = true;
          updateData.loyaltyEnabled = false;
          if (cashbackSettings.cashbackPercent !== undefined) updateData.cashbackPercent = cashbackSettings.cashbackPercent;
          if (cashbackSettings.cashbackApplyMode !== undefined) updateData.cashbackApplyMode = cashbackSettings.cashbackApplyMode;
          if (cashbackSettings.cashbackCategoryIds !== undefined) updateData.cashbackCategoryIds = cashbackSettings.cashbackCategoryIds;
          if (cashbackSettings.cashbackAllowPartialUse !== undefined) updateData.cashbackAllowPartialUse = cashbackSettings.cashbackAllowPartialUse;
        } else if (rewardProgramType === 'loyalty') {
          updateData.cashbackEnabled = false;
          updateData.loyaltyEnabled = true;
        } else {
          updateData.cashbackEnabled = false;
          updateData.loyaltyEnabled = false;
        }
        
        await db.updateEstablishment(establishmentId, updateData);
        return { success: true };
      }),

    // Buscar saldo de cashback do cliente (público - requer telefone)
    getBalance: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
      }))
      .query(async ({ input }) => {
        const balance = await db.getCashbackBalance(input.establishmentId, input.phone);
        if (!balance) return { balance: '0.00', totalEarned: '0.00', totalUsed: '0.00' };
        return {
          balance: balance.balance,
          totalEarned: balance.totalEarned,
          totalUsed: balance.totalUsed,
        };
      }),

    // Buscar histórico de transações de cashback do cliente (público)
    getTransactions: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const transactions = await db.getCashbackTransactions(input.establishmentId, input.phone, input.limit || 50);
        return transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          orderNumber: tx.orderNumber,
          description: tx.description,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          createdAt: tx.createdAt,
        }));
      }),

    // Verificar se cashback está ativo no estabelecimento (público)
    isEnabled: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const establishment = await db.getEstablishmentById(input.establishmentId);
        return {
          enabled: establishment?.cashbackEnabled && establishment?.rewardProgramType === 'cashback',
          percent: establishment?.cashbackPercent || '0',
          applyMode: establishment?.cashbackApplyMode || 'all',
          categoryIds: establishment?.cashbackCategoryIds || [],
          allowPartialUse: false, // Sempre exigir uso total
        };
      }),

    // Validar e aplicar cashback no pedido (público)
    validateUsage: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        phone: z.string().min(10),
        amount: z.string(), // Valor que o cliente quer usar
        orderTotal: z.string(), // Total do pedido
      }))
      .mutation(async ({ input }) => {
        const balance = await db.getCashbackBalance(input.establishmentId, input.phone);
        if (!balance) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Saldo de cashback não encontrado' });
        }
        
        const currentBalance = Number(balance.balance);
        const requestedAmount = Number(input.amount);
        const orderTotal = Number(input.orderTotal);
        
        // Verificar configurações
        const establishment = await db.getEstablishmentById(input.establishmentId);
        if (!establishment?.cashbackEnabled || establishment?.rewardProgramType !== 'cashback') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cashback não está ativo' });
        }
        
        // Sempre exigir uso total do saldo: o valor solicitado deve ser o saldo total
        // (o frontend envia o saldo completo, e o backend aplica no máximo o valor do pedido)
        const effectiveAmount = Math.min(currentBalance, orderTotal);
        
        return {
          valid: true,
          effectiveAmount: effectiveAmount.toFixed(2),
          remainingBalance: (currentBalance - effectiveAmount).toFixed(2),
          newOrderTotal: (orderTotal - effectiveAmount).toFixed(2),
        };
      }),

    // Calcular cashback previsto para itens do carrinho (público)
    calculatePreview: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          totalPrice: z.string(),
        })),
      }))
      .query(async ({ input }) => {
        const result = await db.calculateCashbackForOrder(input.establishmentId, input.items);
        return {
          cashbackAmount: result.cashbackAmount.toFixed(2),
          eligibleTotal: result.eligibleTotal.toFixed(2),
        };
      }),
  }),

  // ============ BOT API KEYS MANAGEMENT ============
  botApiKeys: router({
    list: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];
        return dbInstance.select().from(botApiKeys)
          .where(eq(botApiKeys.establishmentId, input.establishmentId))
          .orderBy(botApiKeys.createdAt);
      }),

    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const apiKey = `bot_${crypto.randomBytes(32).toString('hex')}`;
        const result = await dbInstance.insert(botApiKeys).values({
          establishmentId: input.establishmentId,
          name: input.name,
          apiKey,
          isActive: true,
          requestCount: 0,
        });
        return { id: result[0].insertId, apiKey, name: input.name };
      }),

    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        await dbInstance.update(botApiKeys)
          .set({ isActive: input.isActive })
          .where(eq(botApiKeys.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        await dbInstance.delete(botApiKeys)
          .where(eq(botApiKeys.id, input.id));
        return { success: true };
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        await dbInstance.update(botApiKeys)
          .set({ name: input.name })
          .where(eq(botApiKeys.id, input.id));
        return { success: true };
      }),

    createGlobal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
        const apiKey = `bot_global_${crypto.randomBytes(32).toString('hex')}`;
        const result = await dbInstance.insert(botApiKeys).values({
          establishmentId: input.establishmentId,
          name: input.name,
          apiKey,
          isActive: true,
          isGlobal: true,
          requestCount: 0,
        });
        return { id: result[0].insertId, apiKey, name: input.name };
      }),
  }),
});
export type AppRouter = typeof appRouter;
