import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// User table (from template)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Establishment settings
export const establishments = mysqlTable("establishments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: text("logo"),
  coverImage: text("coverImage"),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 50 }),
  complement: varchar("complement", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  isOpen: boolean("isOpen").default(false).notNull(),
  menuSlug: varchar("menuSlug", { length: 100 }).unique(),
  whatsapp: varchar("whatsapp", { length: 30 }),
  instagram: varchar("instagram", { length: 100 }),
  acceptsCash: boolean("acceptsCash").default(true).notNull(),
  acceptsCard: boolean("acceptsCard").default(true).notNull(),
  acceptsPix: boolean("acceptsPix").default(false).notNull(),
  acceptsBoleto: boolean("acceptsBoleto").default(false).notNull(),
  allowsDelivery: boolean("allowsDelivery").default(true).notNull(),
  allowsPickup: boolean("allowsPickup").default(true).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("reviewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = typeof establishments.$inferInsert;

// Product categories
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Products
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: json("images").$type<string[]>(),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  stockQuantity: int("stockQuantity"),
  hasStock: boolean("hasStock").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product complements/add-ons groups
export const complementGroups = mysqlTable("complementGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  minQuantity: int("minQuantity").default(0).notNull(),
  maxQuantity: int("maxQuantity").default(1).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplementGroup = typeof complementGroups.$inferSelect;
export type InsertComplementGroup = typeof complementGroups.$inferInsert;

// Complement items
export const complementItems = mysqlTable("complementItems", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplementItem = typeof complementItems.$inferSelect;
export type InsertComplementItem = typeof complementItems.$inferInsert;

// Orders
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 30 }),
  customerAddress: text("customerAddress"),
  status: mysqlEnum("status", ["new", "preparing", "ready", "completed", "cancelled"]).default("new").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["delivery", "pickup"]).default("delivery").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "pix", "boleto"]).default("cash").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  couponCode: varchar("couponCode", { length: 50 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order items
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  complements: json("complements").$type<{ name: string; price: number }[]>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;


// Stock item categories
export const stockCategories = mysqlTable("stockCategories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockCategory = typeof stockCategories.$inferSelect;
export type InsertStockCategory = typeof stockCategories.$inferInsert;

// Stock items (ingredients and supplies)
export const stockItems = mysqlTable("stockItems", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  currentQuantity: decimal("currentQuantity", { precision: 10, scale: 2 }).default("0").notNull(),
  minQuantity: decimal("minQuantity", { precision: 10, scale: 2 }).default("0").notNull(),
  maxQuantity: decimal("maxQuantity", { precision: 10, scale: 2 }),
  unit: mysqlEnum("unit", ["kg", "g", "L", "ml", "unidade", "pacote", "caixa", "dúzia"]).default("unidade").notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["ok", "low", "critical", "out_of_stock"]).default("ok").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

// Stock movements (history of entries and exits)
export const stockMovements = mysqlTable("stockMovements", {
  id: int("id").autoincrement().primaryKey(),
  stockItemId: int("stockItemId").notNull(),
  type: mysqlEnum("type", ["entry", "exit", "adjustment", "loss"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  previousQuantity: decimal("previousQuantity", { precision: 10, scale: 2 }).notNull(),
  newQuantity: decimal("newQuantity", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  orderId: int("orderId"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;


// Coupons
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  code: varchar("code", { length: 15 }).notNull(),
  type: mysqlEnum("type", ["percentage", "fixed"]).default("percentage").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }),
  quantity: int("quantity"),
  usedCount: int("usedCount").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  activeDays: json("activeDays").$type<string[]>(),
  validOrigins: json("validOrigins").$type<string[]>(),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  status: mysqlEnum("status", ["active", "inactive", "expired", "exhausted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;
