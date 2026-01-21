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
      .mutation(async ({ input }) => {
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
        
        return { success: true, userId: user?.id };
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
        menuSlug: z.string().optional(),
        whatsapp: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createEstablishment({
          ...input,
          userId: ctx.user.id,
        });
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
    
    // Salvar nota pública temporária
    savePublicNote: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().max(80, "A nota deve ter no máximo 80 caracteres"),
      }))
      .mutation(async ({ input }) => {
        await db.savePublicNote(input.id, input.note);
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
        return db.getComplementGroupsByProduct(input.productId);
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
        isActive: z.boolean().optional(),
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
        const { items, couponId, ...orderData } = input;
        
        console.log('[CreateOrder] Iniciando criação de pedido:', {
          establishmentId: orderData.establishmentId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryType: orderData.deliveryType,
          paymentMethod: orderData.paymentMethod,
          itemsCount: items.length,
          total: orderData.total,
        });
        
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
        
        console.log('[CreateOrder] Pedido criado com sucesso:', result);
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
        
        const reviewId = await db.createReview({
          establishmentId: input.establishmentId,
          orderId: input.orderId || null,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
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
});

export type AppRouter = typeof appRouter;
