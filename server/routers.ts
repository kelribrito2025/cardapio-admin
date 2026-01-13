import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
        acceptsCash: z.boolean().optional(),
        acceptsCard: z.boolean().optional(),
        acceptsPix: z.boolean().optional(),
        acceptsBoleto: z.boolean().optional(),
        allowsDelivery: z.boolean().optional(),
        allowsPickup: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEstablishment(id, data);
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
        prepTime: z.number().nullable().optional(),
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
        prepTime: z.number().nullable().optional(),
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
