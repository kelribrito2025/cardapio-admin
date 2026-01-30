import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { sendOrderReadySMS, isValidPhoneNumber } from "./_core/sms";

export const appRouter = router({
  system: systemRouter,
  
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
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        logo: z.string().optional(),
        coverImage: z.string().optional(),
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
        coverImage: z.string().nullable().optional(),
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
        smsEnabled: z.boolean().optional(),
        deliveryTimeEnabled: z.boolean().optional(),
        deliveryTimeMin: z.number().optional(),
        deliveryTimeMax: z.number().optional(),
        minimumOrderEnabled: z.boolean().optional(),
        minimumOrderValue: z.string().optional(),
        deliveryFeeType: z.enum(["free", "fixed", "byNeighborhood"]).optional(),
        deliveryFeeFixed: z.string().optional(),
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
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(), // Setor/Impressora para este produto
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProduct(input);
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
        status: z.enum(["active", "paused", "archived"]).optional(),
        stockQuantity: z.number().nullable().optional(),
        hasStock: z.boolean().optional(),
        printerId: z.number().nullable().optional(), // Setor/Impressora para este produto
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
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
        const groups = await db.getComplementGroupsByProduct(input.productId);
        const groupsWithItems = await Promise.all(
          groups.map(async (group) => {
            const items = await db.getComplementItemsByGroup(group.id);
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
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateComplementItem(id, data);
        return { success: true };
      }),
    
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComplementItem(input.id);
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
        deliveryType: z.enum(["delivery", "pickup"]).default("delivery"),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto"]).default("cash"),
        subtotal: z.string(),
        deliveryFee: z.string().default("0"),
        total: z.string(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, ...orderData } = input;
        const id = await db.createOrder(orderData, items.map(item => ({
          ...item,
          orderId: 0, // Will be set in db function
        })));
        return { id };
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getDashboardStats(input.establishmentId);
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
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getWeeklyRevenue(input.establishmentId);
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
        const groups = await db.getComplementGroupsByProduct(input.productId);
        const groupsWithItems = await Promise.all(
          groups.map(async (group) => {
            const items = await db.getComplementItemsByGroup(group.id);
            return {
              ...group,
              items: items.filter(item => item.isActive),
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
        deliveryType: z.enum(["delivery", "pickup"]),
        paymentMethod: z.enum(["cash", "card", "pix", "boleto"]),
        subtotal: z.string(),
        deliveryFee: z.string().optional(),
        discount: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
        changeAmount: z.string().optional(),
        couponCode: z.string().optional(),
        couponId: z.number().optional(),
        loyaltyCardId: z.number().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
          complements: z.array(z.object({
            name: z.string(),
            price: z.number(),
          })).optional(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, couponId, loyaltyCardId, ...orderData } = input;
        
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
        
        if (!establishment.isOpen) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'O estabelecimento está fechado no momento. Não é possível realizar pedidos.',
          });
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
            orderNumber: "", // Will be generated in db function
          },
          items.map(item => ({
            orderId: 0, // Will be set in db function
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements || [],
            notes: item.notes || null,
          }))
        );
        
        // Increment coupon usage if coupon was used
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
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
    
    // Get order by number (for tracking)
    getOrderByNumber: publicProcedure
      .input(z.object({
        orderNumber: z.string(),
        establishmentId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getPublicOrderByNumber(input.orderNumber, input.establishmentId);
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
        status: z.enum(["new", "preparing", "ready", "completed", "cancelled"]),
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
                (input.status === 'completed' && config.notifyOnCompleted) ||
                (input.status === 'cancelled' && config.notifyOnCancelled);
              
              if (shouldNotify && config.instanceToken) {
                const { sendOrderStatusNotification } = await import('./_core/uazapi');
                const establishment = await db.getEstablishmentById(order.establishmentId);
                const orderItems = await db.getOrderItems(order.id);
                
                await sendOrderStatusNotification(
                  config.instanceToken,
                  order.customerPhone,
                  input.status,
                  {
                    customerName: order.customerName || 'Cliente',
                    orderNumber: order.orderNumber,
                    establishmentName: establishment?.name || 'Restaurante',
                    template: input.status === 'preparing' ? config.templatePreparing :
                              input.status === 'ready' ? config.templateReady :
                              input.status === 'completed' ? config.templateCompleted :
                              input.status === 'cancelled' ? config.templateCancelled : null,
                    deliveryType: order.deliveryType as 'delivery' | 'pickup' | null,
                    cancellationReason: input.cancellationReason || order.cancellationReason,
                    orderItems: orderItems.map(item => ({
                      productName: item.productName,
                      quantity: item.quantity ?? 1,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                      complements: item.complements as Array<{ name: string; price: number }> | string | null,
                      notes: item.notes,
                    })),
                    orderTotal: order.total,
                  }
                );
              }
            }
          }
        } catch (error) {
          console.error('[WhatsApp] Erro ao enviar notificação:', error);
          // Não falhar a mutação por erro no WhatsApp
        }
        
        return { success: true };
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
      }))
      .mutation(async ({ input }) => {
        const { base64, mimeType, folder = "products" } = input;
        
        // Extract extension from mime type
        const ext = mimeType.split("/")[1] || "jpg";
        const fileName = `${folder}/${nanoid()}.${ext}`;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64, "base64");
        
        // Upload to S3
        const { url } = await storagePut(fileName, buffer, mimeType);
        
        return { url };
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
          showDividers: true,
          defaultPrintMethod: 'normal' as const,
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
      }))
      .mutation(async ({ input }) => {
        await db.upsertPrinterSettings(input);
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
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const establishment = await db.getEstablishmentByUserId(ctx.user.id);
        if (!establishment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estabelecimento não encontrado' });
        
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
        templateCompleted: z.string().nullable().optional(),
        templateCancelled: z.string().nullable().optional(),
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
          templateCompleted: input.templateCompleted,
          templateCancelled: input.templateCancelled,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
