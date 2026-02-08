/**
 * Admin Router
 * Endpoints exclusivos para a área administrativa global.
 * Autenticação separada do sistema de restaurantes.
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import * as adminDb from "./adminDb";

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_JWT_SECRET = ENV.cookieSecret + "_admin";

// Helper: create admin JWT
function createAdminToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, role: "admin" },
    ADMIN_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Helper: verify admin JWT from request
function getAdminFromRequest(req: any): { userId: number; email: string } | null {
  try {
    const cookies = req.headers.cookie?.split(";").reduce((acc: any, c: string) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>) || {};

    const token = cookies[ADMIN_COOKIE_NAME];
    if (!token) return null;

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    if (decoded.role !== "admin") return null;

    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

// Admin-only procedure middleware
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const admin = getAdminFromRequest(ctx.req);
  if (!admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo necessário." });
  }
  return next({
    ctx: { ...ctx, admin },
  });
});

export const adminRouter = router({
  // ============ AUTH ============
  auth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const admin = await adminDb.getAdminByEmail(input.email);
        if (!admin || !admin.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const isValid = await bcrypt.compare(input.password, admin.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
        }

        const token = createAdminToken(admin.id, admin.email!);

        ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: ENV.isProduction,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });

        return { success: true, name: admin.name };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
      return { success: true };
    }),

    me: publicProcedure.query(({ ctx }) => {
      const admin = getAdminFromRequest(ctx.req);
      if (!admin) return null;
      return admin;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: adminProcedure
      .input(z.object({
        period: z.enum(["today", "7days", "30days", "all"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminDashboardStats(input?.period ?? "all");
      }),
  }),

  // ============ RESTAURANTS ============
  restaurants: router({
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        planFilter: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminRestaurantsList(input);
      }),

    detail: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const detail = await adminDb.getAdminRestaurantDetail(input.id);
        if (!detail) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante não encontrado." });
        }
        return detail;
      }),

    changePlan: adminProcedure
      .input(z.object({
        id: z.number(),
        planType: z.enum(["trial", "basic", "pro", "enterprise"]),
      }))
      .mutation(async ({ input }) => {
        await adminDb.adminChangePlan(input.id, input.planType);
        return { success: true };
      }),

    toggleMenu: adminProcedure
      .input(z.object({
        id: z.number(),
        isOpen: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await adminDb.adminToggleMenu(input.id, input.isOpen);
        return { success: true };
      }),

    extendTrial: adminProcedure
      .input(z.object({
        id: z.number(),
        extraDays: z.number().min(1).max(90),
      }))
      .mutation(async ({ input }) => {
        await adminDb.adminExtendTrial(input.id, input.extraDays);
        return { success: true };
      }),

    resetTrial: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDb.adminResetTrial(input.id);
        return { success: true };
      }),

    forceExpire: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDb.adminForceExpireTrial(input.id);
        return { success: true };
      }),
  }),

  // ============ TRIALS ============
  trials: router({
    list: adminProcedure
      .input(z.object({
        filter: z.enum(["all", "active", "expiring_3days", "expiring_1day", "expired"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminDb.getAdminTrialsList(input?.filter ?? "all");
      }),

    extend: adminProcedure
      .input(z.object({
        id: z.number(),
        extraDays: z.number().min(1).max(90),
      }))
      .mutation(async ({ input }) => {
        await adminDb.adminExtendTrial(input.id, input.extraDays);
        return { success: true };
      }),

    resetTrial: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDb.adminResetTrial(input.id);
        return { success: true };
      }),

    forceExpire: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await adminDb.adminForceExpireTrial(input.id);
        return { success: true };
      }),

    convertToPaid: adminProcedure
      .input(z.object({
        id: z.number(),
        planType: z.enum(["basic", "pro", "enterprise"]),
      }))
      .mutation(async ({ input }) => {
        await adminDb.adminChangePlan(input.id, input.planType);
        return { success: true };
      }),
  }),
});

export type AdminRouter = typeof adminRouter;
