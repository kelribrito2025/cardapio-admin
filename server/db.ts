import { eq, desc, asc, and, like, sql, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { notifyNewOrder, notifyOrderUpdate, notifyOrderStatusUpdate } from "./_core/sse";
import { sendOrderReadySMS, isValidPhoneNumber } from "./_core/sms";
import { 
  InsertUser, users, 
  establishments, InsertEstablishment, Establishment,
  categories, InsertCategory, Category,
  products, InsertProduct, Product,
  complementGroups, InsertComplementGroup,
  complementItems, InsertComplementItem,
  orders, InsertOrder, Order,
  orderItems, InsertOrderItem,
  stockCategories, InsertStockCategory, StockCategory,
  stockItems, InsertStockItem, StockItem,
  stockMovements, InsertStockMovement, StockMovement,
  coupons, InsertCoupon, Coupon,
  reviews, InsertReview, Review,
  businessHours, InsertBusinessHours, BusinessHours,
  neighborhoodFees, InsertNeighborhoodFee, NeighborhoodFee,
  loyaltyCards, InsertLoyaltyCard, LoyaltyCard,
  loyaltyStamps, InsertLoyaltyStamp, LoyaltyStamp
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const openId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: 'email',
    lastSignedIn: new Date(),
  });
  
  return getUserByEmail(data.email);
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ============ ESTABLISHMENT FUNCTIONS ============
export async function getEstablishmentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(establishments).where(eq(establishments.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEstablishmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(establishments).where(eq(establishments.id, id)).limit(1);
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

export async function savePublicNote(id: number, note: string, noteStyle?: string, validityDays?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const days = validityDays || 7;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  await db.update(establishments).set({ 
    publicNote: note,
    publicNoteCreatedAt: now,
    noteStyle: noteStyle || "default",
    noteExpiresAt: expiresAt,
  }).where(eq(establishments.id, id));
}

export async function removePublicNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(establishments).set({ 
    publicNote: null,
    publicNoteCreatedAt: null,
  }).where(eq(establishments.id, id));
}

export async function getEstablishmentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(establishments).where(eq(establishments.menuSlug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function isSlugAvailable(slug: string, excludeEstablishmentId?: number) {
  const db = await getDb();
  if (!db) return false;
  
  const conditions = [eq(establishments.menuSlug, slug)];
  if (excludeEstablishmentId) {
    conditions.push(sql`${establishments.id} != ${excludeEstablishmentId}`);
  }
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(establishments)
    .where(and(...conditions));
  
  return (result[0]?.count ?? 0) === 0;
}

export async function getPublicMenuData(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Get establishment by slug
  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment) return null;
  
  // Get categories
  const menuCategories = await db.select().from(categories)
    .where(and(
      eq(categories.establishmentId, establishment.id),
      eq(categories.isActive, true)
    ))
    .orderBy(asc(categories.sortOrder));
  
  // Get active products
  const menuProducts = await db.select().from(products)
    .where(and(
      eq(products.establishmentId, establishment.id),
      eq(products.status, 'active')
    ))
    .orderBy(asc(products.sortOrder));
  
  return {
    establishment,
    categories: menuCategories,
    products: menuProducts,
  };
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
  
  // Buscar o maior sortOrder existente para este estabelecimento
  const existingCategories = await db.select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.establishmentId, data.establishmentId))
    .orderBy(desc(categories.sortOrder))
    .limit(1);
  
  const maxSortOrder = existingCategories.length > 0 ? existingCategories[0].sortOrder : -1;
  const newSortOrder = maxSortOrder + 1;
  
  const result = await db.insert(categories).values({
    ...data,
    sortOrder: newSortOrder,
  });
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
  const newProductId = result[0].insertId;
  
  // Duplicar grupos de complementos
  const groups = await getComplementGroupsByProduct(id);
  for (const group of groups) {
    const { id: groupId, productId: _, createdAt: __, ...groupData } = group;
    const newGroupResult = await db.insert(complementGroups).values({
      ...groupData,
      productId: newProductId,
    });
    const newGroupId = newGroupResult[0].insertId;
    
    // Duplicar itens do grupo
    const items = await getComplementItemsByGroup(groupId);
    for (const item of items) {
      const { id: itemId, groupId: _, createdAt: __, ...itemData } = item;
      await db.insert(complementItems).values({
        ...itemData,
        groupId: newGroupId,
      });
    }
  }
  
  return newProductId;
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
  
  // Buscar grupos
  const groups = await db.select().from(complementGroups)
    .where(eq(complementGroups.productId, productId))
    .orderBy(asc(complementGroups.sortOrder));
  
  // Buscar itens de cada grupo
  const groupsWithItems = await Promise.all(
    groups.map(async (group) => {
      const items = await db.select().from(complementItems)
        .where(eq(complementItems.groupId, group.id))
        .orderBy(asc(complementItems.sortOrder));
      return {
        ...group,
        items,
      };
    })
  );
  
  return groupsWithItems;
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

export async function updateOrderStatus(id: number, status: "new" | "preparing" | "ready" | "completed" | "cancelled", cancellationReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Partial<Order> = { status };
  if (status === "completed" || status === "cancelled") {
    updateData.completedAt = new Date();
  }
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
  
  // Buscar pedido atualizado para notificar via SSE
  const updatedOrder = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (updatedOrder.length > 0) {
    const order = updatedOrder[0];
    // Notificar o dashboard do restaurante
    notifyOrderUpdate(order.establishmentId, { id, status, updatedAt: new Date(), cancellationReason });
    
    // Notificar o cliente via SSE usando o orderNumber
    if (order.orderNumber) {
      notifyOrderStatusUpdate(order.orderNumber, {
        id,
        orderNumber: order.orderNumber,
        status,
        updatedAt: new Date(),
        cancellationReason
      });
    }
    
    // Enviar SMS quando o status mudar para "ready" (pedido pronto/saindo para entrega)
    if (status === "ready" && order.customerPhone && isValidPhoneNumber(order.customerPhone)) {
      // Buscar configurações do estabelecimento (nome e smsEnabled)
      const establishmentResult = await db.select({ 
        name: establishments.name,
        smsEnabled: establishments.smsEnabled 
      })
        .from(establishments)
        .where(eq(establishments.id, order.establishmentId))
        .limit(1);
      
      if (establishmentResult.length > 0) {
        const { name: restaurantName, smsEnabled } = establishmentResult[0];
        
        // Só enviar SMS se a funcionalidade estiver ativada nas configurações
        if (smsEnabled) {
          // Enviar SMS de forma assíncrona (não bloqueia o fluxo)
          // Passa o deliveryType para diferenciar a mensagem entre entrega e retirada
          sendOrderReadySMS(order.customerPhone, restaurantName, order.deliveryType)
            .then(result => {
              if (result.success) {
                console.log(`[SMS] SMS enviado com sucesso para pedido ${order.orderNumber} (${order.deliveryType})`);
              } else {
                console.warn(`[SMS] Falha ao enviar SMS para pedido ${order.orderNumber}: ${result.error}`);
              }
            })
            .catch(err => {
              console.error(`[SMS] Erro ao enviar SMS para pedido ${order.orderNumber}:`, err);
            });
        } else {
          console.log(`[SMS] SMS desativado nas configurações do estabelecimento. Pedido ${order.orderNumber} não notificado.`);
        }
      }
    }
    
    // Adicionar carimbo de fidelidade quando o pedido é completado
    if (status === "completed" && order.customerPhone) {
      try {
        // Verificar se fidelidade está ativa para o estabelecimento
        const estResult = await db.select({
          loyaltyEnabled: establishments.loyaltyEnabled,
          loyaltyMinOrderValue: establishments.loyaltyMinOrderValue,
          loyaltyStampsRequired: establishments.loyaltyStampsRequired,
        }).from(establishments).where(eq(establishments.id, order.establishmentId)).limit(1);
        
        if (estResult.length > 0 && estResult[0].loyaltyEnabled) {
          const { loyaltyMinOrderValue, loyaltyStampsRequired } = estResult[0];
          const minValue = loyaltyMinOrderValue ? Number(loyaltyMinOrderValue) : 0;
          const orderTotal = Number(order.total);
          
          // Verificar se o pedido atinge o valor mínimo
          if (orderTotal >= minValue) {
            // Normalizar telefone do pedido para busca
            const customerPhoneNormalized = order.customerPhone.replace(/[^0-9]/g, '');
            
            // Buscar ou criar cartão de fidelidade do cliente
            // Busca tanto pelo telefone normalizado quanto pelo original para compatibilidade
            const existingCard = await db.select().from(loyaltyCards)
              .where(and(
                eq(loyaltyCards.establishmentId, order.establishmentId),
                or(
                  eq(loyaltyCards.customerPhone, customerPhoneNormalized),
                  eq(loyaltyCards.customerPhone, order.customerPhone)
                )
              ))
              .limit(1);
            
            let cardId: number;
            if (existingCard.length > 0) {
              cardId = existingCard[0].id;
              console.log(`[Fidelidade] Cartão encontrado para ${order.customerPhone} (ID: ${cardId})`);
            } else {
              // Criar cartão de fidelidade para o cliente
              // Gera uma senha temporária baseada nos últimos 4 dígitos do telefone
              const tempPassword = customerPhoneNormalized.slice(-4);
              const bcrypt = await import('bcryptjs');
              const password4Hash = await bcrypt.hash(tempPassword, 10);
              
              // Sempre salvar com telefone normalizado
              const newCard = await db.insert(loyaltyCards).values({
                establishmentId: order.establishmentId,
                customerPhone: customerPhoneNormalized,
                customerName: order.customerName,
                password4Hash,
                stamps: 0,
                totalStampsEarned: 0,
                couponsEarned: 0,
              });
              cardId = newCard[0].insertId;
              console.log(`[Fidelidade] Cartão criado automaticamente para ${customerPhoneNormalized}. Senha temporária: ${tempPassword}`);
            }
            
            // Verificar se já existe carimbo para este pedido
            const existingStamp = await db.select().from(loyaltyStamps)
              .where(and(
                eq(loyaltyStamps.loyaltyCardId, cardId),
                eq(loyaltyStamps.orderNumber, order.orderNumber || '')
              ))
              .limit(1);
            
            if (existingStamp.length === 0) {
              // Adicionar carimbo
              await db.insert(loyaltyStamps).values({
                loyaltyCardId: cardId,
                orderId: id,
                orderNumber: order.orderNumber || '',
                orderTotal: order.total,
              });
              
              // Atualizar contador de carimbos no cartão
              const currentCard = await db.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1);
              if (currentCard.length > 0) {
                const newStamps = currentCard[0].stamps + 1;
                const newTotalStampsEarned = currentCard[0].totalStampsEarned + 1;
                
                // Verificar se completou o cartão
                const stampsRequired = loyaltyStampsRequired || 6;
                if (newStamps >= stampsRequired) {
                  // Gerar código único para o cupom de fidelidade (max 15 chars)
                  const couponCode = `FID${Date.now().toString(36).slice(-8).toUpperCase()}`;
                  
                  // Buscar configurações de fidelidade do estabelecimento
                  const estSettings = await db.select({
                    couponType: establishments.loyaltyCouponType,
                    couponValue: establishments.loyaltyCouponValue,
                    minOrderValue: establishments.loyaltyMinOrderValue,
                  }).from(establishments).where(eq(establishments.id, order.establishmentId));
                  
                  const couponType = estSettings[0]?.couponType || 'fixed';
                  const couponValue = estSettings[0]?.couponValue || '10';
                  const minOrderValue = estSettings[0]?.minOrderValue || '0';
                  
                  // Criar cupom de fidelidade na tabela coupons
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 30); // Válido por 30 dias
                  
                  const newCoupon = await db.insert(coupons).values({
                    establishmentId: order.establishmentId,
                    code: couponCode,
                    type: couponType === 'free_delivery' ? 'fixed' : couponType as 'percentage' | 'fixed',
                    value: couponType === 'free_delivery' ? '0' : couponValue,
                    minOrderValue: minOrderValue,
                    quantity: 1,
                    usedCount: 0,
                    endDate: expiresAt,
                    status: 'active',
                  });
                  
                  const couponId = newCoupon[0].insertId;
                  
                  // Resetar carimbos, incrementar cupons ganhos e vincular cupom ativo
                  await db.update(loyaltyCards).set({
                    stamps: 0,
                    totalStampsEarned: newTotalStampsEarned,
                    couponsEarned: currentCard[0].couponsEarned + 1,
                    activeCouponId: couponId,
                  }).where(eq(loyaltyCards.id, cardId));
                  
                  console.log(`[Fidelidade] Cliente ${order.customerPhone} completou cartão e ganhou cupom ${couponCode}!`);
                } else {
                  await db.update(loyaltyCards).set({
                    stamps: newStamps,
                    totalStampsEarned: newTotalStampsEarned,
                  }).where(eq(loyaltyCards.id, cardId));
                  
                  console.log(`[Fidelidade] Carimbo adicionado para ${order.customerPhone}. Total: ${newStamps}/${stampsRequired}`);
                }
              }
            }
          }
        }
      } catch (loyaltyError) {
        console.error('[Fidelidade] Erro ao processar carimbo:', loyaltyError);
        // Não interrompe o fluxo principal
      }
    }
  }
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
  
  const recentOrders = await db.select().from(orders)
    .where(eq(orders.establishmentId, establishmentId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  
  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    recentOrders.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  return ordersWithItems;
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


// ============ STOCK CATEGORY FUNCTIONS ============
export async function getStockCategoriesByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(stockCategories)
    .where(eq(stockCategories.establishmentId, establishmentId))
    .orderBy(asc(stockCategories.sortOrder));
}

export async function createStockCategory(data: InsertStockCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(stockCategories).values(data);
  return result[0].insertId;
}

export async function updateStockCategory(id: number, data: Partial<InsertStockCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(stockCategories).set(data).where(eq(stockCategories.id, id));
}

export async function deleteStockCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(stockCategories).where(eq(stockCategories.id, id));
}

// ============ STOCK ITEM FUNCTIONS ============
export async function getStockItemsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    status?: "ok" | "low" | "critical" | "out_of_stock";
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(stockItems.establishmentId, establishmentId)];
  
  if (filters?.search) {
    conditions.push(like(stockItems.name, `%${filters.search}%`));
  }
  if (filters?.categoryId) {
    conditions.push(eq(stockItems.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(stockItems.status, filters.status));
  }
  
  return db.select().from(stockItems)
    .where(and(...conditions))
    .orderBy(asc(stockItems.name));
}

export async function getStockItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(stockItems).where(eq(stockItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStockItem(data: InsertStockItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate initial status based on quantity
  const status = calculateStockStatus(
    Number(data.currentQuantity || 0),
    Number(data.minQuantity || 0),
    data.maxQuantity ? Number(data.maxQuantity) : undefined
  );
  
  const result = await db.insert(stockItems).values({ ...data, status });
  return result[0].insertId;
}

export async function updateStockItem(id: number, data: Partial<InsertStockItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If quantity is being updated, recalculate status
  if (data.currentQuantity !== undefined || data.minQuantity !== undefined) {
    const existing = await getStockItemById(id);
    if (existing) {
      const currentQty = data.currentQuantity !== undefined ? Number(data.currentQuantity) : Number(existing.currentQuantity);
      const minQty = data.minQuantity !== undefined ? Number(data.minQuantity) : Number(existing.minQuantity);
      const maxQty = data.maxQuantity !== undefined ? Number(data.maxQuantity) : (existing.maxQuantity ? Number(existing.maxQuantity) : undefined);
      data.status = calculateStockStatus(currentQty, minQty, maxQty);
    }
  }
  
  await db.update(stockItems).set(data).where(eq(stockItems.id, id));
}

export async function deleteStockItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Also delete all movements for this item
  await db.delete(stockMovements).where(eq(stockMovements.stockItemId, id));
  await db.delete(stockItems).where(eq(stockItems.id, id));
}

function calculateStockStatus(
  currentQty: number,
  minQty: number,
  maxQty?: number
): "ok" | "low" | "critical" | "out_of_stock" {
  if (currentQty <= 0) return "out_of_stock";
  if (currentQty <= minQty * 0.5) return "critical";
  if (currentQty <= minQty) return "low";
  return "ok";
}

// ============ STOCK MOVEMENT FUNCTIONS ============
export async function addStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current item
  const item = await getStockItemById(data.stockItemId);
  if (!item) throw new Error("Stock item not found");
  
  const previousQty = Number(item.currentQuantity);
  let newQty: number;
  const movementQty = Number(data.quantity);
  
  if (data.type === "entry") {
    newQty = previousQty + movementQty;
  } else if (data.type === "exit" || data.type === "loss") {
    newQty = Math.max(0, previousQty - movementQty);
  } else {
    // adjustment - quantity is the new absolute value
    newQty = movementQty;
  }
  
  // Insert movement record
  const result = await db.insert(stockMovements).values({
    ...data,
    previousQuantity: previousQty.toString(),
    newQuantity: newQty.toString(),
  });
  
  // Update item quantity and status
  const status = calculateStockStatus(newQty, Number(item.minQuantity), item.maxQuantity ? Number(item.maxQuantity) : undefined);
  await db.update(stockItems)
    .set({ currentQuantity: newQty.toString(), status })
    .where(eq(stockItems.id, data.stockItemId));
  
  return result[0].insertId;
}

export async function getStockMovementsByItem(stockItemId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(stockMovements)
    .where(eq(stockMovements.stockItemId, stockItemId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

export async function getRecentStockMovements(establishmentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with stockItems to filter by establishment
  const items = await db.select({ id: stockItems.id })
    .from(stockItems)
    .where(eq(stockItems.establishmentId, establishmentId));
  
  if (items.length === 0) return [];
  
  const itemIds = items.map(i => i.id);
  
  // Get movements for these items
  const movements = await db.select({
    movement: stockMovements,
    itemName: stockItems.name,
    itemUnit: stockItems.unit
  })
    .from(stockMovements)
    .innerJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id))
    .where(sql`${stockMovements.stockItemId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
  
  return movements;
}

export async function getStockSummary(establishmentId: number) {
  const db = await getDb();
  if (!db) return { total: 0, ok: 0, low: 0, critical: 0, outOfStock: 0 };
  
  const items = await db.select().from(stockItems)
    .where(and(
      eq(stockItems.establishmentId, establishmentId),
      eq(stockItems.isActive, true)
    ));
  
  return {
    total: items.length,
    ok: items.filter(i => i.status === "ok").length,
    low: items.filter(i => i.status === "low").length,
    critical: items.filter(i => i.status === "critical").length,
    outOfStock: items.filter(i => i.status === "out_of_stock").length,
  };
}


// ============ PUBLIC ORDER FUNCTIONS ============
export async function createPublicOrder(data: InsertOrder, items: InsertOrderItem[]) {
  console.log('[DB:createPublicOrder] Iniciando...');
  
  const db = await getDb();
  if (!db) {
    console.error('[DB:createPublicOrder] Database não disponível');
    throw new Error("Database not available");
  }
  
  // Generate order number with format #P1, #P2, etc. (sem zeros à esquerda)
  // Get the next order number from the database
  const lastOrderResult = await db.select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.establishmentId, data.establishmentId))
    .orderBy(desc(orders.id))
    .limit(1);
  
  let nextNumber = 1;
  if (lastOrderResult.length > 0 && lastOrderResult[0].orderNumber) {
    const lastNumber = lastOrderResult[0].orderNumber;
    // Extract number from format #P1, #P2, etc.
    const match = lastNumber.match(/#P(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  // Formato simplificado: #P1, #P2, #P3... (sem zeros à esquerda)
  const orderNumber = `#P${nextNumber}`;
  console.log('[DB:createPublicOrder] Order number gerado:', orderNumber);
  
  try {
    console.log('[DB:createPublicOrder] Inserindo pedido no banco...');
    const result = await db.insert(orders).values({
      ...data,
      orderNumber,
      status: "new",
    });
    const orderId = result[0].insertId;
    console.log('[DB:createPublicOrder] Pedido inserido com ID:', orderId);
    
    if (items.length > 0) {
      console.log('[DB:createPublicOrder] Inserindo', items.length, 'itens...');
      const itemsWithOrderId = items.map(item => ({ ...item, orderId }));
      await db.insert(orderItems).values(itemsWithOrderId);
      console.log('[DB:createPublicOrder] Itens inseridos com sucesso');
    }
    
    // Notificar via SSE sobre novo pedido
    const newOrder = {
      id: orderId,
      orderNumber,
      establishmentId: data.establishmentId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      deliveryType: data.deliveryType,
      paymentMethod: data.paymentMethod,
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      discount: data.discount || "0",
      couponCode: data.couponCode || null,
      total: data.total,
      notes: data.notes,
      changeAmount: data.changeAmount,
      status: "new",
      createdAt: new Date(),
      items: items.map((item, index) => ({
        id: index + 1,
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        complements: item.complements,
        notes: item.notes,
      })),
    };
    notifyNewOrder(data.establishmentId, newOrder);
    
    console.log('[DB:createPublicOrder] Pedido criado com sucesso:', { orderId, orderNumber });
    return { orderId, orderNumber };
  } catch (error) {
    console.error('[DB:createPublicOrder] Erro ao criar pedido:', error);
    console.error('[DB:createPublicOrder] Dados recebidos:', {
      establishmentId: data.establishmentId,
      customerName: data.customerName,
      deliveryType: data.deliveryType,
      paymentMethod: data.paymentMethod,
      itemsCount: items.length,
    });
    throw error;
  }
}

export async function getPublicOrderByNumber(orderNumber: string, establishmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders)
    .where(and(
      eq(orders.orderNumber, orderNumber),
      eq(orders.establishmentId, establishmentId)
    ))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  
  return { ...order, items };
}

export async function getOrdersByPhone(phone: string, establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(orders)
    .where(and(
      eq(orders.customerPhone, phone),
      eq(orders.establishmentId, establishmentId)
    ))
    .orderBy(desc(orders.createdAt))
    .limit(20);
  
  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  return ordersWithItems;
}

export async function getAllOrdersByEstablishment(
  establishmentId: number,
  filters?: {
    status?: "new" | "preparing" | "ready" | "completed" | "cancelled";
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  
  const conditions = [eq(orders.establishmentId, establishmentId)];
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  
  const whereClause = and(...conditions);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;
  
  // Get orders
  let query = db.select().from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as typeof query;
  }
  
  const ordersList = await query;
  
  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    ordersList.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  return { orders: ordersWithItems, total };
}

export async function getActiveOrdersByEstablishment(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(orders)
    .where(and(
      eq(orders.establishmentId, establishmentId),
      sql`${orders.status} IN ('new', 'preparing', 'ready')`
    ))
    .orderBy(desc(orders.createdAt));
  
  // Buscar itens de cada pedido
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );
  
  return ordersWithItems;
}


// ============ GET ORDERS BY ORDER NUMBERS ============
export async function getOrdersByOrderNumbers(orderNumbers: string[]) {
  const db = await getDb();
  if (!db) return [];
  
  if (orderNumbers.length === 0) return [];
  
  const result = await db.select().from(orders)
    .where(sql`${orders.orderNumber} IN (${sql.join(orderNumbers.map(n => sql`${n}`), sql`, `)})`);
  
  return result;
}

// ============ COUPON FUNCTIONS ============
export async function getCouponsByEstablishment(
  establishmentId: number,
  filters?: {
    search?: string;
    status?: "active" | "inactive" | "expired" | "exhausted";
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) return { coupons: [], total: 0 };
  
  const conditions = [eq(coupons.establishmentId, establishmentId)];
  
  if (filters?.search) {
    conditions.push(like(coupons.code, `%${filters.search}%`));
  }
  if (filters?.status) {
    conditions.push(eq(coupons.status, filters.status));
  }
  
  const whereClause = and(...conditions);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(coupons)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;
  
  // Get coupons
  let query = db.select().from(coupons)
    .where(whereClause)
    .orderBy(desc(coupons.createdAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }
  
  const couponsList = await query;
  
  return { coupons: couponsList, total };
}

export async function getCouponById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCouponByCode(establishmentId: number, code: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(coupons)
    .where(and(
      eq(coupons.establishmentId, establishmentId),
      eq(coupons.code, code.toUpperCase())
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCoupon(data: InsertCoupon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure code is uppercase
  const couponData = {
    ...data,
    code: data.code.toUpperCase(),
  };
  
  const result = await db.insert(coupons).values(couponData);
  return result[0].insertId;
}

export async function updateCoupon(id: number, data: Partial<InsertCoupon>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure code is uppercase if provided
  const updateData = data.code 
    ? { ...data, code: data.code.toUpperCase() }
    : data;
  
  await db.update(coupons).set(updateData).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function toggleCouponStatus(id: number, status: "active" | "inactive") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(coupons).set({ status }).where(eq(coupons.id, id));
}

export async function incrementCouponUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.id, id));
  
  // Check if coupon is exhausted
  const coupon = await getCouponById(id);
  if (coupon && coupon.quantity && coupon.usedCount >= coupon.quantity) {
    await db.update(coupons)
      .set({ status: "exhausted" })
      .where(eq(coupons.id, id));
  }
}

export async function validateCoupon(
  establishmentId: number,
  code: string,
  orderValue: number,
  deliveryType: "delivery" | "pickup" | "self_service"
) {
  const coupon = await getCouponByCode(establishmentId, code);
  
  if (!coupon) {
    return { valid: false, error: "Cupom não encontrado" };
  }
  
  if (coupon.status !== "active") {
    const statusMessages: Record<string, string> = {
      inactive: "Cupom desativado",
      expired: "Cupom expirado",
      exhausted: "Cupom esgotado",
    };
    return { valid: false, error: statusMessages[coupon.status] || "Cupom inválido" };
  }
  
  // Check quantity
  if (coupon.quantity && coupon.usedCount >= coupon.quantity) {
    return { valid: false, error: "Cupom esgotado" };
  }
  
  // Check minimum order value
  if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
    return { 
      valid: false, 
      error: `Valor mínimo do pedido: R$ ${Number(coupon.minOrderValue).toFixed(2).replace('.', ',')}` 
    };
  }
  
  // Check date validity
  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return { valid: false, error: "Cupom ainda não está válido" };
  }
  if (coupon.endDate) {
    // Ajustar endDate para o final do dia (23:59:59)
    const endOfDay = new Date(coupon.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now > endOfDay) {
      return { valid: false, error: "Cupom expirado" };
    }
  }
  
  // Check active days
  if (coupon.activeDays && coupon.activeDays.length > 0) {
    const dayNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const today = dayNames[now.getDay()];
    if (!coupon.activeDays.includes(today)) {
      return { valid: false, error: "Cupom não válido hoje" };
    }
  }
  
  // Check valid origins
  if (coupon.validOrigins && coupon.validOrigins.length > 0) {
    const originMap: Record<string, string> = {
      delivery: "delivery",
      pickup: "retirada",
      self_service: "autoatendimento",
    };
    const originName = originMap[deliveryType];
    if (!coupon.validOrigins.includes(originName) && !coupon.validOrigins.includes(deliveryType)) {
      return { valid: false, error: "Cupom não válido para este tipo de entrega" };
    }
  }
  
  // Check time validity
  if (coupon.startTime && coupon.endTime) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < coupon.startTime || currentTime > coupon.endTime) {
      return { valid: false, error: `Cupom válido apenas das ${coupon.startTime} às ${coupon.endTime}` };
    }
  }
  
  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = orderValue * (Number(coupon.value) / 100);
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }
  } else {
    discount = Number(coupon.value);
  }
  
  return { 
    valid: true, 
    coupon,
    discount: Math.min(discount, orderValue),
  };
}


// ============ REVIEW FUNCTIONS ============
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviews).values(data);
  
  // Update establishment rating and review count
  await updateEstablishmentRating(data.establishmentId);
  
  return result[0].insertId;
}

export async function getReviewsByEstablishment(establishmentId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(reviews)
    .where(eq(reviews.establishmentId, establishmentId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

// Get last review by customer phone for 30-day limit check
export async function getLastReviewByCustomer(establishmentId: number, customerPhone: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Normalizar telefone removendo caracteres especiais
  const normalizedPhone = customerPhone.replace(/[^0-9]/g, '');
  
  // Buscar tanto pelo telefone normalizado quanto pelo original (para compatibilidade com dados antigos)
  const result = await db.select().from(reviews)
    .where(
      and(
        eq(reviews.establishmentId, establishmentId),
        or(
          eq(reviews.customerPhone, normalizedPhone),
          eq(reviews.customerPhone, customerPhone)
        )
      )
    )
    .orderBy(desc(reviews.createdAt))
    .limit(1);
  
  return result[0] || null;
}

export async function updateEstablishmentRating(establishmentId: number) {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Calculate average rating and count
    const result = await db.select({
      avgRating: sql<number>`AVG(rating)`,
      count: sql<number>`COUNT(*)`
    }).from(reviews).where(eq(reviews.establishmentId, establishmentId));
    
    // MySQL returns AVG as string, need to parse it
    const rawAvgRating = result[0]?.avgRating;
    const rawCount = result[0]?.count;
    
    // Parse values - MySQL may return string or number
    const avgRating = typeof rawAvgRating === 'string' ? parseFloat(rawAvgRating) : (rawAvgRating ?? 0);
    const count = typeof rawCount === 'string' ? parseInt(rawCount) : (rawCount ?? 0);
    
    // Ensure avgRating is a valid number before calling toFixed
    const ratingValue = !isNaN(avgRating) ? avgRating : 0;
    
    console.log('Updating establishment rating:', { establishmentId, avgRating: ratingValue.toFixed(1), count });
    
    // Update establishment
    await db.update(establishments).set({
      rating: ratingValue.toFixed(1),
      reviewCount: count
    }).where(eq(establishments.id, establishmentId));
  } catch (error) {
    console.error('Error updating establishment rating:', error);
    // Don't throw - let the review creation succeed even if rating update fails
  }
}



// ============ BUSINESS HOURS FUNCTIONS ============
export async function getBusinessHoursByEstablishment(establishmentId: number): Promise<BusinessHours[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(businessHours)
    .where(eq(businessHours.establishmentId, establishmentId))
    .orderBy(asc(businessHours.dayOfWeek));
}

export async function saveBusinessHours(establishmentId: number, hours: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing hours for this establishment
  await db.delete(businessHours).where(eq(businessHours.establishmentId, establishmentId));
  
  // Insert new hours
  for (const hour of hours) {
    await db.insert(businessHours).values({
      establishmentId,
      dayOfWeek: hour.dayOfWeek,
      isActive: hour.isActive,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
    });
  }
}

export async function getBusinessHoursForPublicMenu(establishmentId: number): Promise<BusinessHours[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(businessHours)
    .where(eq(businessHours.establishmentId, establishmentId))
    .orderBy(asc(businessHours.dayOfWeek));
}


// ============ NEIGHBORHOOD FEES FUNCTIONS ============
export async function getNeighborhoodFeesByEstablishment(establishmentId: number): Promise<NeighborhoodFee[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(neighborhoodFees)
    .where(eq(neighborhoodFees.establishmentId, establishmentId))
    .orderBy(asc(neighborhoodFees.neighborhood));
}

export async function createNeighborhoodFee(data: InsertNeighborhoodFee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(neighborhoodFees).values(data);
  return result[0].insertId;
}

export async function updateNeighborhoodFee(id: number, data: Partial<InsertNeighborhoodFee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(neighborhoodFees).set(data).where(eq(neighborhoodFees.id, id));
}

export async function deleteNeighborhoodFee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(neighborhoodFees).where(eq(neighborhoodFees.id, id));
}

export async function deleteAllNeighborhoodFees(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(neighborhoodFees).where(eq(neighborhoodFees.establishmentId, establishmentId));
}


// ============ ESTABLISHMENT STATUS FUNCTIONS ============

/**
 * Calcula o próximo horário de abertura baseado nos horários configurados
 * Retorna null se não houver horário configurado
 */
export function getNextOpeningTime(businessHoursData: BusinessHours[], currentDate: Date = new Date()): { dayOfWeek: number; openTime: string; isToday: boolean; isTomorrow: boolean } | null {
  if (!businessHoursData || businessHoursData.length === 0) return null;
  
  const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = currentDate.toTimeString().slice(0, 5); // HH:MM
  
  // Procurar nos próximos 7 dias
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDayOfWeek + i) % 7;
    const dayHours = businessHoursData.find(h => h.dayOfWeek === checkDay);
    
    if (dayHours && dayHours.isActive && dayHours.openTime) {
      // Se for hoje, verificar se o horário de abertura ainda não passou
      if (i === 0) {
        if (dayHours.openTime > currentTime) {
          return {
            dayOfWeek: checkDay,
            openTime: dayHours.openTime,
            isToday: true,
            isTomorrow: false
          };
        }
        // Se já passou o horário de abertura hoje, verificar se ainda está dentro do horário de funcionamento
        if (dayHours.closeTime && currentTime < dayHours.closeTime) {
          // Ainda está aberto, não precisa retornar próximo horário
          continue;
        }
      } else {
        return {
          dayOfWeek: checkDay,
          openTime: dayHours.openTime,
          isToday: false,
          isTomorrow: i === 1
        };
      }
    }
  }
  
  return null;
}

/**
 * Verifica se deve reabrir automaticamente baseado no fechamento manual e horários configurados
 */
export function shouldAutoReopen(manuallyClosedAt: Date | null, businessHoursData: BusinessHours[], currentDate: Date = new Date()): boolean {
  if (!manuallyClosedAt) return false;
  
  const currentDayOfWeek = currentDate.getDay();
  const currentTime = currentDate.toTimeString().slice(0, 5);
  
  // Encontrar o horário de hoje
  const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDayOfWeek);
  
  if (!todayHours || !todayHours.isActive || !todayHours.openTime) return false;
  
  // Verificar se o horário de abertura de hoje já passou desde o fechamento manual
  const closedTime = manuallyClosedAt.getTime();
  const openTimeToday = new Date(currentDate);
  const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
  openTimeToday.setHours(openHour, openMin, 0, 0);
  
  // Se o fechamento foi antes do horário de abertura de hoje e agora já passou o horário de abertura
  if (closedTime < openTimeToday.getTime() && currentDate.getTime() >= openTimeToday.getTime()) {
    return true;
  }
  
  // Se o fechamento foi em um dia anterior e hoje tem horário de abertura
  const closedDate = new Date(manuallyClosedAt);
  closedDate.setHours(0, 0, 0, 0);
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  if (closedDate.getTime() < today.getTime() && currentTime >= todayHours.openTime) {
    return true;
  }
  
  return false;
}

/**
 * Calcula o status completo do estabelecimento considerando:
 * 1. Fechamento manual (prioridade)
 * 2. Reabertura automática no próximo horário configurado
 * 3. Horários de funcionamento
 */
export async function getEstablishmentOpenStatus(establishmentId: number): Promise<{
  isOpen: boolean;
  manuallyClosed: boolean;
  nextOpeningTime: { dayOfWeek: number; openTime: string; isToday: boolean; isTomorrow: boolean } | null;
  shouldAutoReopen: boolean;
}> {
  const db = await getDb();
  if (!db) {
    return { isOpen: false, manuallyClosed: false, nextOpeningTime: null, shouldAutoReopen: false };
  }
  
  // Buscar dados do estabelecimento
  const [establishment] = await db.select().from(establishments).where(eq(establishments.id, establishmentId));
  if (!establishment) {
    return { isOpen: false, manuallyClosed: false, nextOpeningTime: null, shouldAutoReopen: false };
  }
  
  // Buscar horários de funcionamento
  const hours = await getBusinessHoursByEstablishment(establishmentId);
  
  const currentDate = new Date();
  const currentDayOfWeek = currentDate.getDay();
  const currentTime = currentDate.toTimeString().slice(0, 5);
  
  // Verificar se está dentro do horário de funcionamento
  const todayHours = hours.find(h => h.dayOfWeek === currentDayOfWeek);
  const isWithinSchedule = todayHours?.isActive && 
    todayHours.openTime && 
    todayHours.closeTime && 
    currentTime >= todayHours.openTime && 
    currentTime < todayHours.closeTime;
  
  // Calcular próximo horário de abertura
  const nextOpening = getNextOpeningTime(hours, currentDate);
  
  // Verificar se deve reabrir automaticamente
  const autoReopen = shouldAutoReopen(
    establishment.manuallyClosedAt ? new Date(establishment.manuallyClosedAt) : null,
    hours,
    currentDate
  );
  
  // Lógica de status:
  // 1. Se manuallyClosed E não deve reabrir automaticamente → Fechado
  // 2. Se manuallyClosed E deve reabrir automaticamente → Aberto (se dentro do horário)
  // 3. Se não manuallyClosed → Segue horário normal
  
  let isOpen = false;
  let manuallyClosed = establishment.manuallyClosed;
  
  if (manuallyClosed && autoReopen) {
    // Deve reabrir automaticamente
    manuallyClosed = false;
    isOpen = isWithinSchedule || false;
  } else if (manuallyClosed) {
    // Permanece fechado manualmente
    isOpen = false;
  } else {
    // Segue horário normal (isOpen do banco indica se o toggle está ligado)
    isOpen = establishment.isOpen && (isWithinSchedule || false);
  }
  
  return {
    isOpen,
    manuallyClosed,
    nextOpeningTime: nextOpening,
    shouldAutoReopen: autoReopen
  };
}

/**
 * Atualiza o status de fechamento manual do estabelecimento
 */
export async function setManualClose(establishmentId: number, close: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (close) {
    // Fechar manualmente
    await db.update(establishments)
      .set({ 
        manuallyClosed: true, 
        manuallyClosedAt: new Date(),
        isOpen: false 
      })
      .where(eq(establishments.id, establishmentId));
  } else {
    // Abrir manualmente
    await db.update(establishments)
      .set({ 
        manuallyClosed: false, 
        manuallyClosedAt: null,
        isOpen: true 
      })
      .where(eq(establishments.id, establishmentId));
  }
}

/**
 * Limpa o status de fechamento manual (usado quando reabre automaticamente)
 */
export async function clearManualClose(establishmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(establishments)
    .set({ 
      manuallyClosed: false, 
      manuallyClosedAt: null 
    })
    .where(eq(establishments.id, establishmentId));
}


// ============ LOYALTY CARD FUNCTIONS ============

/**
 * Normaliza número de telefone removendo caracteres especiais
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Busca cartão de fidelidade por telefone e estabelecimento
 * Busca tanto pelo telefone normalizado quanto pelo original para compatibilidade
 */
export async function getLoyaltyCardByPhone(establishmentId: number, phone: string): Promise<LoyaltyCard | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const normalizedPhone = normalizePhone(phone);
  
  // Buscar pelo telefone normalizado OU pelo telefone original (para compatibilidade)
  const result = await db.select().from(loyaltyCards)
    .where(and(
      eq(loyaltyCards.establishmentId, establishmentId),
      or(
        eq(loyaltyCards.customerPhone, normalizedPhone),
        eq(loyaltyCards.customerPhone, phone)
      )
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Cria um novo cartão de fidelidade
 * Sempre salva o telefone normalizado (apenas números)
 */
export async function createLoyaltyCard(data: {
  establishmentId: number;
  customerPhone: string;
  customerName?: string;
  password4Hash: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Normalizar telefone antes de salvar
  const normalizedPhone = normalizePhone(data.customerPhone);
  
  const result = await db.insert(loyaltyCards).values({
    establishmentId: data.establishmentId,
    customerPhone: normalizedPhone,
    customerName: data.customerName || null,
    password4Hash: data.password4Hash,
    stamps: 0,
    totalStampsEarned: 0,
    couponsEarned: 0,
  });
  
  return result[0].insertId;
}

/**
 * Atualiza o cartão de fidelidade
 */
export async function updateLoyaltyCard(id: number, data: Partial<InsertLoyaltyCard>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(loyaltyCards).set(data).where(eq(loyaltyCards.id, id));
}

/**
 * Adiciona um carimbo ao cartão de fidelidade
 */
export async function addLoyaltyStamp(data: {
  loyaltyCardId: number;
  orderId: number;
  orderNumber: string;
  orderTotal: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Inserir registro do carimbo
  await db.insert(loyaltyStamps).values({
    loyaltyCardId: data.loyaltyCardId,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    orderTotal: data.orderTotal,
  });
  
  // Incrementar contador de carimbos no cartão
  await db.update(loyaltyCards)
    .set({
      stamps: sql`${loyaltyCards.stamps} + 1`,
      totalStampsEarned: sql`${loyaltyCards.totalStampsEarned} + 1`,
    })
    .where(eq(loyaltyCards.id, data.loyaltyCardId));
}

/**
 * Busca histórico de carimbos do cartão
 */
export async function getLoyaltyStamps(loyaltyCardId: number): Promise<LoyaltyStamp[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(loyaltyStamps)
    .where(eq(loyaltyStamps.loyaltyCardId, loyaltyCardId))
    .orderBy(desc(loyaltyStamps.createdAt));
}

/**
 * Reseta os carimbos do cartão quando cupom é liberado
 */
export async function resetLoyaltyStamps(loyaltyCardId: number, couponId?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(loyaltyCards)
    .set({
      stamps: 0,
      couponsEarned: sql`${loyaltyCards.couponsEarned} + 1`,
      activeCouponId: couponId || null,
    })
    .where(eq(loyaltyCards.id, loyaltyCardId));
}

/**
 * Limpa o cupom ativo do cartão (quando usado)
 */
export async function clearActiveCoupon(loyaltyCardId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(loyaltyCards)
    .set({ activeCouponId: null })
    .where(eq(loyaltyCards.id, loyaltyCardId));
}

/**
 * Busca cartão de fidelidade por ID
 */
export async function getLoyaltyCardById(id: number): Promise<LoyaltyCard | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(loyaltyCards)
    .where(eq(loyaltyCards.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Busca todos os cartões de fidelidade de um estabelecimento
 */
export async function getLoyaltyCardsByEstablishment(establishmentId: number): Promise<LoyaltyCard[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(loyaltyCards)
    .where(eq(loyaltyCards.establishmentId, establishmentId))
    .orderBy(desc(loyaltyCards.updatedAt));
}

/**
 * Verifica se o pedido já gerou carimbo
 */
export async function hasStampForOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(loyaltyStamps)
    .where(eq(loyaltyStamps.orderId, orderId));
  
  return (result[0]?.count ?? 0) > 0;
}

/**
 * Processa carimbo de fidelidade para um pedido entregue
 */
export async function processLoyaltyStampForOrder(
  establishmentId: number,
  orderId: number,
  orderNumber: string,
  orderTotal: string,
  customerPhone: string
): Promise<{ stampAdded: boolean; couponUnlocked: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se fidelidade está ativa no estabelecimento
  const establishment = await getEstablishmentById(establishmentId);
  if (!establishment || !establishment.loyaltyEnabled) {
    return { stampAdded: false, couponUnlocked: false, message: "Fidelidade não está ativa" };
  }
  
  // Verificar valor mínimo do pedido
  const minOrderValue = Number(establishment.loyaltyMinOrderValue) || 0;
  if (minOrderValue > 0 && Number(orderTotal) < minOrderValue) {
    return { stampAdded: false, couponUnlocked: false, message: `Pedido abaixo do valor mínimo de R$ ${minOrderValue.toFixed(2)}` };
  }
  
  // Verificar se já existe carimbo para este pedido
  const alreadyHasStamp = await hasStampForOrder(orderId);
  if (alreadyHasStamp) {
    return { stampAdded: false, couponUnlocked: false, message: "Pedido já gerou carimbo" };
  }
  
  // Buscar ou criar cartão de fidelidade
  let loyaltyCard = await getLoyaltyCardByPhone(establishmentId, customerPhone);
  if (!loyaltyCard) {
    // Criar cartão automaticamente (sem senha por enquanto)
    const cardId = await createLoyaltyCard({
      establishmentId,
      customerPhone,
      password4Hash: "", // Será definido quando cliente acessar
    });
    loyaltyCard = await getLoyaltyCardById(cardId);
  }
  
  if (!loyaltyCard) {
    return { stampAdded: false, couponUnlocked: false, message: "Erro ao criar cartão de fidelidade" };
  }
  
  // Adicionar carimbo
  await addLoyaltyStamp({
    loyaltyCardId: loyaltyCard.id,
    orderId,
    orderNumber,
    orderTotal,
  });
  
  // Verificar se atingiu a quantidade necessária para cupom
  const requiredStamps = establishment.loyaltyStampsRequired || 6;
  const newStampCount = loyaltyCard.stamps + 1;
  
  if (newStampCount >= requiredStamps) {
    // Criar cupom de fidelidade
    const couponCode = `FIDELIDADE${Date.now().toString(36).toUpperCase()}`;
    const couponType = establishment.loyaltyCouponType === 'percentage' ? 'percentage' : 'fixed';
    const couponValue = establishment.loyaltyCouponValue || "10";
    
    const couponResult = await db.insert(coupons).values({
      establishmentId,
      code: couponCode,
      type: couponType,
      value: couponValue,
      quantity: 1,
      usedCount: 0,
      status: 'active',
    });
    
    // Resetar carimbos e vincular cupom
    await resetLoyaltyStamps(loyaltyCard.id, couponResult[0].insertId);
    
    return { 
      stampAdded: true, 
      couponUnlocked: true, 
      message: `Parabéns! Você ganhou um cupom de ${couponType === 'percentage' ? `${couponValue}%` : `R$ ${Number(couponValue).toFixed(2)}`} de desconto!` 
    };
  }
  
  return { 
    stampAdded: true, 
    couponUnlocked: false, 
    message: `Carimbo adicionado! Faltam ${requiredStamps - newStampCount} para ganhar seu cupom.` 
  };
}
