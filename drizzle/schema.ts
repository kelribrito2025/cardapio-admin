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
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isOpen: boolean("isOpen").default(false).notNull(),
  menuSlug: varchar("menuSlug", { length: 100 }).unique(),
  whatsapp: varchar("whatsapp", { length: 30 }),
  instagram: varchar("instagram", { length: 100 }),
  acceptsCash: boolean("acceptsCash").default(true).notNull(),
  acceptsCard: boolean("acceptsCard").default(true).notNull(),
  acceptsPix: boolean("acceptsPix").default(false).notNull(),
  pixKey: varchar("pixKey", { length: 255 }),
  acceptsBoleto: boolean("acceptsBoleto").default(false).notNull(),
  allowsDelivery: boolean("allowsDelivery").default(true).notNull(),
  allowsPickup: boolean("allowsPickup").default(true).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("reviewCount").default(0).notNull(),
  publicNote: varchar("publicNote", { length: 100 }),
  publicNoteCreatedAt: timestamp("publicNoteCreatedAt"),
  noteStyle: varchar("noteStyle", { length: 50 }).default("default"),
  noteExpiresAt: timestamp("noteExpiresAt"),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  // Tempo de entrega
  deliveryTimeEnabled: boolean("deliveryTimeEnabled").default(false).notNull(),
  deliveryTimeMin: int("deliveryTimeMin").default(20),
  deliveryTimeMax: int("deliveryTimeMax").default(60),
  // Pedido mínimo
  minimumOrderEnabled: boolean("minimumOrderEnabled").default(false).notNull(),
  minimumOrderValue: decimal("minimumOrderValue", { precision: 10, scale: 2 }).default("0"),
  // Taxa de entrega
  deliveryFeeType: mysqlEnum("deliveryFeeType", ["free", "fixed", "byNeighborhood"]).default("free").notNull(),
  deliveryFeeFixed: decimal("deliveryFeeFixed", { precision: 10, scale: 2 }).default("0"),
  // Controle de fechamento manual
  manuallyClosed: boolean("manuallyClosed").default(false).notNull(),
  manuallyClosedAt: timestamp("manuallyClosedAt"),
  // Cartão Fidelidade
  loyaltyEnabled: boolean("loyaltyEnabled").default(false).notNull(),
  loyaltyStampsRequired: int("loyaltyStampsRequired").default(6),
  loyaltyCouponType: mysqlEnum("loyaltyCouponType", ["fixed", "percentage", "free_delivery"]).default("fixed"),
  loyaltyCouponValue: decimal("loyaltyCouponValue", { precision: 10, scale: 2 }).default("10"),
  loyaltyMinOrderValue: decimal("loyaltyMinOrderValue", { precision: 10, scale: 2 }).default("0"),
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
  imageUrl: text("imageUrl"),
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
  cancellationReason: text("cancellationReason"),
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

// Reviews table (avaliações do restaurante)
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(), // Para identificar cliente único
  rating: int("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;


// Business hours (horários de funcionamento)
export const businessHours = mysqlTable("businessHours", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  isActive: boolean("isActive").default(true).notNull(), // Toggle ON/OFF
  openTime: varchar("openTime", { length: 5 }), // Formato HH:MM (ex: "18:00")
  closeTime: varchar("closeTime", { length: 5 }), // Formato HH:MM (ex: "23:00")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = typeof businessHours.$inferInsert;


// Taxas de entrega por bairro
export const neighborhoodFees = mysqlTable("neighborhoodFees", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NeighborhoodFee = typeof neighborhoodFees.$inferSelect;
export type InsertNeighborhoodFee = typeof neighborhoodFees.$inferInsert;


// Cartão de Fidelidade - Configurações do estabelecimento
// (campos adicionados na tabela establishments via migration)

// Cartões de fidelidade dos clientes
export const loyaltyCards = mysqlTable("loyaltyCards", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  password4Hash: varchar("password4Hash", { length: 255 }).notNull(), // Hash da senha de 4 dígitos
  stamps: int("stamps").default(0).notNull(), // Número atual de carimbos
  totalStampsEarned: int("totalStampsEarned").default(0).notNull(), // Total de carimbos já ganhos (histórico)
  couponsEarned: int("couponsEarned").default(0).notNull(), // Total de cupons já ganhos
  activeCouponId: int("activeCouponId"), // Cupom ativo disponível para uso (legado, manter para compatibilidade)
  activeCouponIds: json("activeCouponIds").$type<number[]>(), // Array de IDs de cupons ativos disponíveis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyCard = typeof loyaltyCards.$inferSelect;
export type InsertLoyaltyCard = typeof loyaltyCards.$inferInsert;

// Histórico de carimbos (stamps) do cartão fidelidade
export const loyaltyStamps = mysqlTable("loyaltyStamps", {
  id: int("id").autoincrement().primaryKey(),
  loyaltyCardId: int("loyaltyCardId").notNull(),
  orderId: int("orderId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  orderTotal: decimal("orderTotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyStamp = typeof loyaltyStamps.$inferSelect;
export type InsertLoyaltyStamp = typeof loyaltyStamps.$inferInsert;


// Impressoras térmicas para impressão automática de pedidos
export const printers = mysqlTable("printers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome identificador (ex: "Cozinha", "Balcão")
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(), // IP da impressora na rede local
  port: int("port").default(9100).notNull(), // Porta padrão ESC/POS
  printerType: varchar("printerType", { length: 20 }).default("all").notNull(), // Tipo: all, kitchen, counter, bar
  categoryIds: text("categoryIds"), // JSON array de IDs de categorias para esta impressora
  isActive: boolean("isActive").default(true).notNull(), // Se a impressora está ativa
  isDefault: boolean("isDefault").default(false).notNull(), // Se é a impressora padrão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Printer = typeof printers.$inferSelect;
export type InsertPrinter = typeof printers.$inferInsert;

// Configurações de impressão do estabelecimento
export const printerSettings = mysqlTable("printerSettings", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  autoPrintEnabled: boolean("autoPrintEnabled").default(false).notNull(), // Impressão automática ativada
  printOnNewOrder: boolean("printOnNewOrder").default(true).notNull(), // Imprimir ao receber novo pedido
  printOnStatusChange: boolean("printOnStatusChange").default(false).notNull(), // Imprimir ao mudar status
  copies: int("copies").default(1).notNull(), // Número de cópias
  showLogo: boolean("showLogo").default(true).notNull(), // Mostrar logo no cupom
  logoUrl: text("logoUrl"), // URL do logo personalizado (se diferente do estabelecimento)
  showQrCode: boolean("showQrCode").default(false).notNull(), // Mostrar QR Code no cupom
  headerMessage: text("headerMessage"), // Mensagem personalizada no cabeçalho
  footerMessage: text("footerMessage"), // Mensagem personalizada no rodapé
  paperWidth: varchar("paperWidth", { length: 10 }).default("80mm").notNull(), // Largura do papel: 58mm ou 80mm
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrinterSettings = typeof printerSettings.$inferSelect;
export type InsertPrinterSettings = typeof printerSettings.$inferInsert;


// Push Subscriptions para notificações PWA
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(), // URL do endpoint de push
  p256dh: text("p256dh").notNull(), // Chave pública do cliente
  auth: text("auth").notNull(), // Chave de autenticação
  userAgent: text("userAgent"), // User agent do dispositivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;


// Configuração de integração com WhatsApp via UAZAPI
export const whatsappConfig = mysqlTable("whatsappConfig", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  subdomain: varchar("subdomain", { length: 100 }), // Legado - não usado mais
  token: varchar("token", { length: 500 }), // Legado - não usado mais
  instanceId: varchar("instanceId", { length: 100 }), // ID da instância UAZAPI (criada automaticamente)
  instanceToken: varchar("instanceToken", { length: 500 }), // Token da instância (gerado automaticamente)
  status: mysqlEnum("status", ["disconnected", "connecting", "connected"]).default("disconnected").notNull(),
  connectedPhone: varchar("connectedPhone", { length: 30 }), // Número conectado
  lastQrCode: text("lastQrCode"), // Último QR code gerado (base64)
  qrCodeExpiresAt: timestamp("qrCodeExpiresAt"), // Quando o QR code expira
  // Configurações de notificação
  notifyOnNewOrder: boolean("notifyOnNewOrder").default(true).notNull(), // Notificar cliente quando pedido é criado
  notifyOnPreparing: boolean("notifyOnPreparing").default(true).notNull(), // Notificar quando pedido está sendo preparado
  notifyOnReady: boolean("notifyOnReady").default(true).notNull(), // Notificar quando pedido está pronto
  notifyOnCompleted: boolean("notifyOnCompleted").default(false).notNull(), // Notificar quando pedido é finalizado
  notifyOnCancelled: boolean("notifyOnCancelled").default(true).notNull(), // Notificar quando pedido é cancelado
  // Templates de mensagem personalizados
  templateNewOrder: text("templateNewOrder"), // Template para novo pedido
  templatePreparing: text("templatePreparing"), // Template para preparando
  templateReady: text("templateReady"), // Template para pronto
  templateCompleted: text("templateCompleted"), // Template para finalizado
  templateCancelled: text("templateCancelled"), // Template para cancelado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;
