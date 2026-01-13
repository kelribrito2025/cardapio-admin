import { eq, desc, asc, and, like, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  establishments, InsertEstablishment, Establishment,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  complementGroups, InsertComplementGroup,
  complementItems, InsertComplementItem,
  orders, InsertOrder, Order,
  orderItems, InsertOrderItem
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ESTABLISHMENT FUNCTIONS ============
export async function getEstablishmentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(establishments).where(eq(establishments.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEstablishment(data: InsertEstablishment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(establishments).values(data);
  return result[0].insertId;
}

export async function updateEstablishment(id: number, data: Partial<InsertEstablishment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(establishments).set(data).where(eq(establishments.id, id));
}

export async function toggleEstablishmentOpen(id: number, isOpen: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(establishments).set({ isOpen }).where(eq(establishments.id, id));
}

// ============ CATEGORY FUNCTIONS ============
export async function getCategoriesByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(categories)
    .where(eq(categories.establishmentId, establishmentId))
    .orderBy(asc(categories.sortOrder));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(categories).where(eq(categories.id, id));
}

export async function reorderCategories(categoryOrders: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const { id, sortOrder } of categoryOrders) {
    await db.update(categories).set({ sortOrder }).where(eq(categories.id, id));
  }
}

export async function reorderProducts(productOrders: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const { id, sortOrder } of productOrders) {
    await db.update(products).set({ sortOrder }).where(eq(products.id, id));
  }
}

// ============ PRODUCT FUNCTIONS ============
export async function getProductsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    status?: "active" | "paused" | "archived";
    hasStock?: boolean;
    orderBy?: "name" | "price" | "salesCount";
    orderDir?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  
  const conditions = [eq(products.establishmentId, establishmentId)];
  
  if (filters?.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(products.status, filters.status));
  }
  if (filters?.hasStock !== undefined) {
    conditions.push(eq(products.hasStock, filters.hasStock));
  }
  
  const whereClause = and(...conditions);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;
  
  // Build order by
  let orderByClause;
  const dir = filters?.orderDir === "desc" ? desc : asc;
  switch (filters?.orderBy) {
    case "name":
      orderByClause = dir(products.name);
      break;
    case "price":
      orderByClause = dir(products.price);
      break;
    case "salesCount":
      orderByClause = desc(products.salesCount);
      break;
    default:
      orderByClause = asc(products.sortOrder);
  }
  
  let query = db.select().from(products).where(whereClause).orderBy(orderByClause);
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as typeof query;
  }
  
  const productList = await query;
  return { products: productList, total };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(products).where(eq(products.id, id));
}

export async function toggleProductStatus(id: number, status: "active" | "paused") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set({ status }).where(eq(products.id, id));
}

export async function duplicateProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const original = await getProductById(id);
  if (!original) throw new Error("Product not found");
  
  const { id: _, createdAt, updatedAt, ...productData } = original;
  const newProduct = {
    ...productData,
    name: `${original.name} (cópia)`,
  };
  
  const result = await db.insert(products).values(newProduct);
  return result[0].insertId;
}

export async function getLowStockProducts(establishmentId: number, threshold: number = 5) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.hasStock, false)
    ))
    .orderBy(asc(products.stockQuantity));
}

// ============ COMPLEMENT FUNCTIONS ============
export async function getComplementGroupsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(complementGroups)
    .where(eq(complementGroups.productId, productId))
    .orderBy(asc(complementGroups.sortOrder));
}

export async function getComplementItemsByGroup(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(complementItems)
    .where(eq(complementItems.groupId, groupId))
    .orderBy(asc(complementItems.sortOrder));
}

export async function createComplementGroup(data: InsertComplementGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(complementGroups).values(data);
  return result[0].insertId;
}

export async function updateComplementGroup(id: number, data: Partial<InsertComplementGroup>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(complementGroups).set(data).where(eq(complementGroups.id, id));
}

export async function deleteComplementGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(complementItems).where(eq(complementItems.groupId, id));
  await db.delete(complementGroups).where(eq(complementGroups.id, id));
}

export async function createComplementItem(data: InsertComplementItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(complementItems).values(data);
  return result[0].insertId;
}

export async function updateComplementItem(id: number, data: Partial<InsertComplementItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(complementItems).set(data).where(eq(complementItems.id, id));
}

export async function deleteComplementItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(complementItems).where(eq(complementItems.id, id));
}

// ============ ORDER FUNCTIONS ============
export async function getOrdersByEstablishment(
  establishmentId: number,
  status?: "new" | "preparing" | "ready" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(orders.establishmentId, establishmentId)];
  if (status) {
    conditions.push(eq(orders.status, status));
  }
  
  return db.select().from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrder(data: InsertOrder, items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orders).values(data);
  const orderId = result[0].insertId;
  
  if (items.length > 0) {
    const itemsWithOrderId = items.map(item => ({ ...item, orderId }));
    await db.insert(orderItems).values(itemsWithOrderId);
  }
  
  return orderId;
}

export async function updateOrderStatus(id: number, status: "new" | "preparing" | "ready" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Partial<Order> = { status };
  if (status === "completed" || status === "cancelled") {
    updateData.completedAt = new Date();
  }
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

// ============ DASHBOARD/STATS FUNCTIONS ============
export async function getDashboardStats(establishmentId: number) {
  const db = await getDb();
  if (!db) return { ordersToday: 0, revenueToday: 0, avgTicket: 0, lowStockCount: 0 };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Orders today
  const ordersResult = await db.select({ 
    count: sql<number>`count(*)`,
    total: sql<number>`COALESCE(SUM(total), 0)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      gte(orders.createdAt, today),
      eq(orders.status, "completed")
    ));
  
  const ordersToday = ordersResult[0]?.count ?? 0;
  const revenueToday = Number(ordersResult[0]?.total ?? 0);
  const avgTicket = ordersToday > 0 ? revenueToday / ordersToday : 0;
  
  // Low stock count
  const lowStockResult = await db.select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(
      eq(products.establishmentId, establishmentId),
      eq(products.hasStock, false)
    ));
  
  const lowStockCount = lowStockResult[0]?.count ?? 0;
  
  return { ordersToday, revenueToday, avgTicket, lowStockCount };
}

export async function getWeeklyStats(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const result = await db.select({
    date: sql<string>`DATE(createdAt)`,
    orders: sql<number>`count(*)`,
    revenue: sql<number>`COALESCE(SUM(total), 0)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      gte(orders.createdAt, sevenDaysAgo),
      eq(orders.status, "completed")
    ))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);
  
  return result;
}

export async function getRecentOrders(establishmentId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(orders)
    .where(eq(orders.establishmentId, establishmentId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getWeeklyRevenue(establishmentId: number) {
  const db = await getDb();
  if (!db) return { thisWeek: [], lastWeek: [], thisWeekTotal: 0, lastWeekTotal: 0 };
  
  // Get current date and calculate week boundaries
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate start of current week (Monday)
  const thisWeekStart = new Date(now);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  thisWeekStart.setDate(now.getDate() - daysFromMonday);
  thisWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate start of last week (Monday of previous week)
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  
  // Calculate end of last week (Sunday of previous week)
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);
  
  // Query for this week's data
  const thisWeekResult = await db.select({
    dayOfWeek: sql<number>`DAYOFWEEK(createdAt)`,
    revenue: sql<number>`COALESCE(SUM(total), 0)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      gte(orders.createdAt, thisWeekStart),
      eq(orders.status, "completed")
    ))
    .groupBy(sql`DAYOFWEEK(createdAt)`);
  
  // Query for last week's data
  const lastWeekResult = await db.select({
    dayOfWeek: sql<number>`DAYOFWEEK(createdAt)`,
    revenue: sql<number>`COALESCE(SUM(total), 0)`
  })
    .from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      gte(orders.createdAt, lastWeekStart),
      lte(orders.createdAt, lastWeekEnd),
      eq(orders.status, "completed")
    ))
    .groupBy(sql`DAYOFWEEK(createdAt)`);
  
  // Map MySQL DAYOFWEEK (1=Sunday, 2=Monday, ..., 7=Saturday) to our format (0=Mon, 1=Tue, ..., 6=Sun)
  const mapDayOfWeek = (mysqlDay: number) => {
    // MySQL: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    // Our format: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    return mysqlDay === 1 ? 6 : mysqlDay - 2;
  };
  
  // Initialize arrays with zeros for each day (Mon-Sun)
  const thisWeek = [0, 0, 0, 0, 0, 0, 0];
  const lastWeek = [0, 0, 0, 0, 0, 0, 0];
  
  // Fill in the data
  for (const row of thisWeekResult) {
    const dayIndex = mapDayOfWeek(row.dayOfWeek);
    if (dayIndex >= 0 && dayIndex < 7) {
      thisWeek[dayIndex] = Number(row.revenue);
    }
  }
  
  for (const row of lastWeekResult) {
    const dayIndex = mapDayOfWeek(row.dayOfWeek);
    if (dayIndex >= 0 && dayIndex < 7) {
      lastWeek[dayIndex] = Number(row.revenue);
    }
  }
  
  const thisWeekTotal = thisWeek.reduce((sum, val) => sum + val, 0);
  const lastWeekTotal = lastWeek.reduce((sum, val) => sum + val, 0);
  
  return { thisWeek, lastWeek, thisWeekTotal, lastWeekTotal };
}
