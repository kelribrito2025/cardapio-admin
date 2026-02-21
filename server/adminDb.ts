/**
 * Admin Database Functions
 * Funções de banco de dados exclusivas para a área administrativa global.
 */
import { eq, sql, and, gte, lte, desc, asc, count, like, or } from "drizzle-orm";
import { getDb } from "./db";
import { users, establishments } from "../drizzle/schema";

// ============ ADMIN AUTH ============

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, "admin")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ADMIN DASHBOARD STATS ============

export async function getAdminDashboardStats(period: "today" | "7days" | "30days" | "all" = "all") {
  const db = await getDb();
  if (!db) return null;

  // Calculate date filter
  let dateFilter: Date | null = null;
  const now = new Date();
  if (period === "today") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "7days") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30days") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Total new registrations
  const newRegistrationsQuery = dateFilter
    ? db.select({ count: count() }).from(establishments).where(gte(establishments.createdAt, dateFilter))
    : db.select({ count: count() }).from(establishments);
  const [newRegistrations] = await newRegistrationsQuery;

  // Restaurants in trial (active, not expired)
  const [inTrial] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
      )
    );

  // Restaurants with paid plans
  const [paidPlans] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro"),
        eq(establishments.planType, "enterprise")
      )
    );

  // Expired trials
  const [expiredTrials] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
      )
    );

  return {
    newRegistrations: newRegistrations?.count ?? 0,
    inTrial: inTrial?.count ?? 0,
    paidPlans: paidPlans?.count ?? 0,
    expiredTrials: expiredTrials?.count ?? 0,
  };
}

// ============ ADMIN RESTAURANTS ============

export async function getAdminRestaurantsList(filters?: {
  search?: string;
  planFilter?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { restaurants: [], total: 0 };

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions: any[] = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(establishments.name, `%${filters.search}%`),
        like(establishments.email, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`)
      )
    );
  }
  if (filters?.planFilter && filters.planFilter !== "all") {
    if (filters.planFilter === "expired") {
      conditions.push(
        and(
          eq(establishments.planType, "trial"),
          sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
        )
      );
    } else if (filters.planFilter === "active_trial") {
      conditions.push(
        and(
          eq(establishments.planType, "trial"),
          sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
        )
      );
    } else {
      conditions.push(eq(establishments.planType, filters.planFilter as any));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count (join with users for email search fallback)
  const [totalResult] = await db
    .select({ count: count() })
    .from(establishments)
    .leftJoin(users, eq(establishments.userId, users.id))
    .where(whereClause);

  // Get restaurants with user info (join with users to get email fallback)
  const restaurants = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      email: sql<string | null>`COALESCE(${establishments.email}, ${users.email})`.as('email'),
      logo: establishments.logo,
      menuSlug: establishments.menuSlug,
      isOpen: establishments.isOpen,
      manuallyClosed: establishments.manuallyClosed,
      planType: establishments.planType,
      trialStartDate: establishments.trialStartDate,
      trialDays: establishments.trialDays,
      createdAt: establishments.createdAt,
      userId: establishments.userId,
      whatsapp: establishments.whatsapp,
      city: establishments.city,
      state: establishments.state,
    })
    .from(establishments)
    .leftJoin(users, eq(establishments.userId, users.id))
    .where(whereClause)
    .orderBy(desc(establishments.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with trial status
  const enriched = restaurants.map((r) => {
    let trialStatus: "active" | "expiring_soon" | "expired" | "not_trial" = "not_trial";
    let daysRemaining: number | null = null;

    if (r.planType === "trial" && r.trialStartDate) {
      const expirationDate = new Date(r.trialStartDate.getTime() + r.trialDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const msRemaining = expirationDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      if (msRemaining <= 0) {
        trialStatus = "expired";
        daysRemaining = 0;
      } else if (daysRemaining <= 3) {
        trialStatus = "expiring_soon";
      } else {
        trialStatus = "active";
      }
    }

    return {
      ...r,
      trialStatus,
      daysRemaining,
    };
  });

  return {
    restaurants: enriched,
    total: totalResult?.count ?? 0,
  };
}

export async function getAdminRestaurantDetail(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [restaurant] = await db
    .select()
    .from(establishments)
    .where(eq(establishments.id, id))
    .limit(1);

  if (!restaurant) return null;

  // Get owner user info
  const [owner] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, restaurant.userId))
    .limit(1);

  // Calculate trial info
  let trialStatus: "active" | "expiring_soon" | "expired" | "not_trial" = "not_trial";
  let daysRemaining: number | null = null;
  let expirationDate: Date | null = null;

  if (restaurant.planType === "trial" && restaurant.trialStartDate) {
    expirationDate = new Date(restaurant.trialStartDate.getTime() + restaurant.trialDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    if (msRemaining <= 0) {
      trialStatus = "expired";
      daysRemaining = 0;
    } else if (daysRemaining <= 3) {
      trialStatus = "expiring_soon";
    } else {
      trialStatus = "active";
    }
  }

  // Count admins (users that have an establishment with same userId)
  const adminCount = owner ? 1 : 0;

  // Plan price mapping
  const planPriceMap: Record<string, number> = {
    trial: 0,
    free: 0,
    basic: 79.90,
    pro: 149.90,
    enterprise: 299.90,
  };
  const planPrice = planPriceMap[restaurant.planType] ?? 0;

  // Plan labels
  const planLabelMap: Record<string, string> = {
    trial: "Teste",
    free: "Gratuito",
    basic: "Essencial",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  const planLabel = planLabelMap[restaurant.planType] ?? restaurant.planType;

  return {
    ...restaurant,
    owner: owner || null,
    trialStatus,
    daysRemaining,
    expirationDate,
    adminCount,
    planPrice,
    planLabel,
  };
}

// ============ ADMIN ACTIONS ============

export async function adminChangePlan(establishmentId: number, planType: "trial" | "basic" | "pro" | "enterprise") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (planType === "trial") {
    // Reset trial
    await db.update(establishments).set({
      planType: "trial",
      trialStartDate: new Date(),
      trialDays: 15,
    }).where(eq(establishments.id, establishmentId));
  } else {
    await db.update(establishments).set({
      planType,
      trialStartDate: null,
    }).where(eq(establishments.id, establishmentId));
  }
}

export async function adminToggleMenu(establishmentId: number, isOpen: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    isOpen,
    manuallyClosed: !isOpen,
    manuallyClosedAt: !isOpen ? new Date() : null,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminExtendTrial(establishmentId: number, extraDays: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    trialDays: sql`${establishments.trialDays} + ${extraDays}`,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminResetTrial(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(establishments).set({
    planType: "trial",
    trialStartDate: new Date(),
    trialDays: 15,
  }).where(eq(establishments.id, establishmentId));
}

export async function adminForceExpireTrial(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Set trial start to 16 days ago so it's already expired
  const pastDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
  await db.update(establishments).set({
    planType: "trial",
    trialStartDate: pastDate,
    trialDays: 15,
    isOpen: false,
    manuallyClosed: true,
  }).where(eq(establishments.id, establishmentId));
}

// ============ ADMIN TRIALS ============

export async function getAdminTrialsList(filter: "all" | "active" | "expiring_3days" | "expiring_1day" | "expired" = "all") {
  const db = await getDb();
  if (!db) return [];

  let whereClause;
  if (filter === "active") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
    );
  } else if (filter === "expiring_3days") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`,
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= DATE_ADD(NOW(), INTERVAL 3 DAY)`
    );
  } else if (filter === "expiring_1day") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`,
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= DATE_ADD(NOW(), INTERVAL 1 DAY)`
    );
  } else if (filter === "expired") {
    whereClause = and(
      eq(establishments.planType, "trial"),
      sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
    );
  } else {
    whereClause = eq(establishments.planType, "trial");
  }

  const trials = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      email: establishments.email,
      isOpen: establishments.isOpen,
      planType: establishments.planType,
      trialStartDate: establishments.trialStartDate,
      trialDays: establishments.trialDays,
      createdAt: establishments.createdAt,
    })
    .from(establishments)
    .where(whereClause)
    .orderBy(asc(sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY)`));

  return trials.map((r) => {
    let daysRemaining = 0;
    let hoursRemaining = 0;
    let status: "active" | "expiring_soon" | "expired" = "active";

    if (r.trialStartDate) {
      const expirationDate = new Date(r.trialStartDate.getTime() + r.trialDays * 24 * 60 * 60 * 1000);
      const msRemaining = expirationDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      hoursRemaining = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1000)));

      if (msRemaining <= 0) {
        status = "expired";
      } else if (daysRemaining <= 3) {
        status = "expiring_soon";
      }
    }

    return {
      ...r,
      daysRemaining,
      hoursRemaining,
      status,
    };
  });
}

// ============ SEED ADMIN ============

export async function seedAdminUser(email: string, passwordHash: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if admin already exists
  const existing = await getAdminByEmail(email);
  if (existing) {
    console.log("[Seed] Admin user already exists:", email);
    return existing;
  }

  const openId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await db.insert(users).values({
    openId,
    name,
    email,
    passwordHash,
    loginMethod: "email",
    role: "admin",
  });

  const created = await getAdminByEmail(email);
  console.log("[Seed] Admin user created:", email);
  return created;
}

// ============ ADMIN IMPERSONATION ============

export async function getRestaurantOwnerOpenId(establishmentId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const [restaurant] = await db
    .select({ userId: establishments.userId })
    .from(establishments)
    .where(eq(establishments.id, establishmentId))
    .limit(1);

  if (!restaurant) return null;

  const [owner] = await db
    .select({ openId: users.openId })
    .from(users)
    .where(eq(users.id, restaurant.userId))
    .limit(1);

  return owner?.openId || null;
}

// ============ ADMIN UPDATE SUBSCRIPTION STATUS ============

export async function adminUpdateSubscriptionStatus(
  establishmentId: number,
  status: "trial" | "active" | "suspended" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const planMap: Record<string, string> = {
    trial: "trial",
    active: "basic",
    suspended: "trial",
    cancelled: "trial",
  };

  const updates: Record<string, any> = {};

  if (status === "trial") {
    updates.planType = "trial";
    updates.trialStartDate = new Date();
    updates.trialDays = 15;
  } else if (status === "active") {
    // Keep current planType if already paid, otherwise set to basic
    const [est] = await db.select({ planType: establishments.planType }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    if (est && ["basic", "pro", "enterprise"].includes(est.planType)) {
      // Already on a paid plan, just ensure it's active
      updates.isOpen = true;
      updates.manuallyClosed = false;
    } else {
      updates.planType = "basic";
      updates.trialStartDate = null;
      updates.isOpen = true;
      updates.manuallyClosed = false;
    }
  } else if (status === "suspended") {
    updates.isOpen = false;
    updates.manuallyClosed = true;
    updates.manuallyClosedAt = new Date();
  } else if (status === "cancelled") {
    updates.planType = "trial";
    updates.isOpen = false;
    updates.manuallyClosed = true;
    updates.manuallyClosedAt = new Date();
    // Set trial to already expired
    updates.trialStartDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
    updates.trialDays = 15;
  }

  await db.update(establishments).set(updates).where(eq(establishments.id, establishmentId));
}

// ============ ADMIN UPDATE CONTACT ============

export async function adminUpdateContact(
  establishmentId: number,
  data: { responsibleName?: string; responsiblePhone?: string; email?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, any> = {};
  if (data.responsibleName !== undefined) updates.responsibleName = data.responsibleName;
  if (data.responsiblePhone !== undefined) updates.responsiblePhone = data.responsiblePhone;
  if (data.email !== undefined) updates.email = data.email;

  if (Object.keys(updates).length > 0) {
    await db.update(establishments).set(updates).where(eq(establishments.id, establishmentId));
  }
}

// ============ ADMIN REPORTS ============

export async function getAdminReportsData() {
  const db = await getDb();
  if (!db) return null;

  // Total de restaurantes
  const [totalResult] = await db
    .select({ count: count() })
    .from(establishments);
  const totalRestaurants = totalResult?.count ?? 0;

  // Restaurantes com plano pago (basic, pro, enterprise)
  const [paidResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro"),
        eq(establishments.planType, "enterprise")
      )
    );
  const paidRestaurants = paidResult?.count ?? 0;

  // Restaurantes em trial ativo
  const [activeTrialResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) > NOW()`
      )
    );
  const activeTrials = activeTrialResult?.count ?? 0;

  // Trials expirados
  const [expiredTrialResult] = await db
    .select({ count: count() })
    .from(establishments)
    .where(
      and(
        eq(establishments.planType, "trial"),
        sql`DATE_ADD(${establishments.trialStartDate}, INTERVAL ${establishments.trialDays} DAY) <= NOW()`
      )
    );
  const expiredTrials = expiredTrialResult?.count ?? 0;

  // Receita mensal estimada (baseada nos planos ativos)
  // basic = R$29, pro = R$59, enterprise = R$99
  const planPrices: Record<string, number> = {
    basic: 29,
    pro: 59,
    enterprise: 99,
  };

  const paidBreakdown = await db
    .select({
      planType: establishments.planType,
      count: count(),
    })
    .from(establishments)
    .where(
      or(
        eq(establishments.planType, "basic"),
        eq(establishments.planType, "pro"),
        eq(establishments.planType, "enterprise")
      )
    )
    .groupBy(establishments.planType);

  let monthlyRevenue = 0;
  const planDistribution: Record<string, number> = {};
  for (const row of paidBreakdown) {
    const price = planPrices[row.planType] ?? 0;
    monthlyRevenue += price * row.count;
    planDistribution[row.planType] = row.count;
  }

  // Taxa de conversão: (pagos / (pagos + trials expirados)) * 100
  const totalTrialCompleted = paidRestaurants + expiredTrials;
  const conversionRate = totalTrialCompleted > 0
    ? (paidRestaurants / totalTrialCompleted) * 100
    : 0;

  // Receita anual projetada
  const annualRevenue = monthlyRevenue * 12;

  // Ticket médio por restaurante ativo
  const ticketMedio = paidRestaurants > 0
    ? monthlyRevenue / paidRestaurants
    : 0;

  // Churn rate: expirados / total * 100
  const churnRate = totalRestaurants > 0
    ? (expiredTrials / totalRestaurants) * 100
    : 0;

  // Distribuição por status para gráfico donut
  const statusDistribution = {
    ativos: paidRestaurants,
    emTeste: activeTrials,
    expirados: expiredTrials,
  };

  return {
    totalRestaurants,
    monthlyRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    activeRestaurants: paidRestaurants,
    annualRevenue,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    churnRate: Math.round(churnRate * 10) / 10,
    statusDistribution,
    planDistribution,
    activeTrials,
    expiredTrials,
  };
}
