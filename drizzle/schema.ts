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
  allowsDineIn: boolean("allowsDineIn").default(false).notNull(),
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
  // Controle de abertura manual (fora do horário)
  manuallyOpened: boolean("manuallyOpened").default(false).notNull(),
  manuallyOpenedAt: timestamp("manuallyOpenedAt"),
  // Cartão Fidelidade
  loyaltyEnabled: boolean("loyaltyEnabled").default(false).notNull(),
  loyaltyStampsRequired: int("loyaltyStampsRequired").default(6),
  loyaltyCouponType: mysqlEnum("loyaltyCouponType", ["fixed", "percentage", "free_delivery"]).default("fixed"),
  loyaltyCouponValue: decimal("loyaltyCouponValue", { precision: 10, scale: 2 }).default("10"),
  loyaltyMinOrderValue: decimal("loyaltyMinOrderValue", { precision: 10, scale: 2 }).default("0"),
  // Dados da Conta
  email: varchar("email", { length: 320 }),
  cnpj: varchar("cnpj", { length: 20 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  responsiblePhone: varchar("responsiblePhone", { length: 30 }),
  // Stripe Connect - Pagamento Online
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // ID da connected account no Stripe
  onlinePaymentEnabled: boolean("onlinePaymentEnabled").default(false).notNull(), // Se pagamento online está ativo
  stripeOnboardingComplete: boolean("stripeOnboardingComplete").default(false).notNull(), // Se onboarding foi concluído
  // Segurança
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorEmail: varchar("twoFactorEmail", { length: 320 }),
  // Timezone (IANA)
  timezone: varchar("timezone", { length: 100 }).default("America/Sao_Paulo").notNull(),
  // Plano / Trial
  planType: mysqlEnum("planType", ["trial", "free", "basic", "pro", "enterprise"]).default("trial").notNull(),
  trialStartDate: timestamp("trialStartDate").defaultNow(),
  trialDays: int("trialDays").default(15).notNull(),
  // Stripe Subscription
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual"]),
  planExpiresAt: timestamp("planExpiresAt"),
  planActivatedAt: timestamp("planActivatedAt"),
  // Configuração de acionamento do entregador
  driverNotifyTiming: mysqlEnum("driverNotifyTiming", ["on_accepted", "on_ready"]).default("on_ready").notNull(),
  // Avaliações
  ownerDisplayName: varchar("ownerDisplayName", { length: 11 }),
  reviewsEnabled: boolean("reviewsEnabled").default(true).notNull(),
  fakeReviewCount: int("fakeReviewCount").default(355),
  // Agendamento de pedidos
  schedulingEnabled: boolean("schedulingEnabled").default(false).notNull(), // Habilitar agendamento
  schedulingMinAdvance: int("schedulingMinAdvance").default(60).notNull(), // Antecedência mínima em minutos (ex: 60 = 1h)
  schedulingMaxDays: int("schedulingMaxDays").default(7).notNull(), // Antecedência máxima em dias (ex: 7 dias)
  schedulingInterval: int("schedulingInterval").default(30).notNull(), // Intervalo entre horários em minutos (15, 30, 60)
  schedulingMoveMinutes: int("schedulingMoveMinutes").default(30).notNull(), // Minutos antes para mover para fila normal
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
  hasStock: boolean("hasStock").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  printerId: int("printerId"), // ID da impressora/setor para este produto (ex: Cozinha, Sushi Bar)
  isCombo: boolean("isCombo").default(false).notNull(), // Se é um combo (produto composto por grupos de itens)
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
  isActive: boolean("isActive").default(true).notNull(),
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
  // Complementos Globais - novos campos
  priceMode: mysqlEnum("priceMode", ["normal", "free"]).default("normal").notNull(), // normal = preço base, free = grátis
  sortOrder: int("sortOrder").default(0).notNull(),
  // Disponibilidade por dias e horários
  availabilityType: mysqlEnum("availabilityType", ["always", "scheduled"]).default("always").notNull(), // always = sempre disponível, scheduled = dias/horários específicos
  availableDays: json("availableDays").$type<number[]>(), // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  availableHours: json("availableHours").$type<{ day: number; startTime: string; endTime: string }[]>(), // Horários por dia
  badgeText: varchar("badgeText", { length: 50 }), // Texto do badge customizável (ex: "Novo", "Novidade", "Promoção")
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
  status: mysqlEnum("status", ["pending_confirmation", "new", "preparing", "ready", "out_for_delivery", "completed", "cancelled", "scheduled"]).default("pending_confirmation").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["delivery", "pickup", "dine_in"]).default("delivery").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "pix", "boleto", "card_online"]).default("cash").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  couponCode: varchar("couponCode", { length: 50 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }),
  cancellationReason: text("cancellationReason"),
  // Campos para pedidos externos (iFood, Rappi, etc)
  source: mysqlEnum("source", ["internal", "ifood", "rappi", "ubereats", "pdv"]).default("internal").notNull(),
  externalId: varchar("externalId", { length: 100 }), // ID do pedido na plataforma externa
  externalDisplayId: varchar("externalDisplayId", { length: 50 }), // ID de exibição (ex: #1234)
  externalStatus: varchar("externalStatus", { length: 50 }), // Status original da plataforma
  externalData: json("externalData").$type<Record<string, unknown>>(), // Dados completos do pedido externo
  // Controle de notificação ao entregador (evitar duplicatas)
  deliveryNotified: boolean("deliveryNotified").default(false).notNull(),
  // Agendamento de pedidos
  isScheduled: boolean("isScheduled").default(false).notNull(), // Se é um pedido agendado
  scheduledAt: timestamp("scheduledAt"), // Data/hora agendada para o pedido
  movedToQueue: boolean("movedToQueue").default(false).notNull(), // Se já foi movido para a fila principal
  movedToQueueAt: timestamp("movedToQueueAt"), // Quando foi movido para a fila
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
  complements: json("complements").$type<{ name: string; price: number; quantity: number }[]>(),
  notes: text("notes"),
  printerId: int("printerId"), // ID da impressora/setor deste item (copiado do produto)
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
  linkedProductId: int("linkedProductId"),
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
  // Resposta do restaurante
  responseText: text("responseText"), // Texto da resposta pública
  responseDate: timestamp("responseDate"), // Data da resposta
  // Controle de visualização
  isRead: boolean("isRead").default(false).notNull(), // Se foi visualizada pelo restaurante
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
  qrCodeUrl: text("qrCodeUrl"), // URL da imagem do QR Code para pagamento
  headerMessage: text("headerMessage"), // Mensagem personalizada no cabeçalho
  footerMessage: text("footerMessage"), // Mensagem personalizada no rodapé
  paperWidth: varchar("paperWidth", { length: 10 }).default("80mm").notNull(), // Largura do papel: 58mm ou 80mm
  // POSPrinterDriver - Impressão automática via servidor
  posPrinterEnabled: boolean("posPrinterEnabled").default(false).notNull(), // Usar POSPrinterDriver
  posPrinterLinkcode: varchar("posPrinterLinkcode", { length: 100 }), // Código de link do terminal
  posPrinterNumber: int("posPrinterNumber").default(1).notNull(), // Número da impressora (1, 2, 3...)
  // Impressão Direta via Rede Local (Socket TCP)
  directPrintEnabled: boolean("directPrintEnabled").default(false).notNull(), // Usar impressão direta
  directPrintIp: varchar("directPrintIp", { length: 50 }), // IP da impressora
  directPrintPort: int("directPrintPort").default(9100).notNull(), // Porta da impressora
  // Configurações de fonte para impressão térmica
  fontSize: int("fontSize").default(12).notNull(), // Tamanho da fonte geral
  fontWeight: int("fontWeight").default(500).notNull(), // Peso da fonte geral
  titleFontSize: int("titleFontSize").default(16).notNull(), // Tamanho da fonte de títulos
  titleFontWeight: int("titleFontWeight").default(700).notNull(), // Peso da fonte de títulos
  itemFontSize: int("itemFontSize").default(12).notNull(), // Tamanho da fonte de itens
  itemFontWeight: int("itemFontWeight").default(700).notNull(), // Peso da fonte de itens
  obsFontSize: int("obsFontSize").default(11).notNull(), // Tamanho da fonte de observações
  obsFontWeight: int("obsFontWeight").default(500).notNull(), // Peso da fonte de observações
  showDividers: boolean("showDividers").default(false).notNull(), // Mostrar divisores
  boxPadding: int("boxPadding").default(12).notNull(), // Espaçamento interno das caixas com bordas redondas
  itemBorderStyle: varchar("itemBorderStyle", { length: 20 }).default("rounded").notNull(), // Estilo de borda dos itens: rounded ou dashed
  // Preferência de impressão padrão ao aceitar pedidos
  defaultPrintMethod: mysqlEnum("defaultPrintMethod", ["normal", "android"]).default("normal").notNull(), // Método de impressão favorito
  // Modo de impressão HTML vs ESC/POS
  htmlPrintEnabled: boolean("htmlPrintEnabled").default(true).notNull(), // Usar layout HTML (mais flexível) ou ESC/POS (compatível)
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
  requireOrderConfirmation: boolean("requireOrderConfirmation").default(false).notNull(), // Exigir confirmação do cliente via botões do WhatsApp
  notifyOnNewOrder: boolean("notifyOnNewOrder").default(true).notNull(), // Notificar cliente quando pedido é criado
  notifyOnPreparing: boolean("notifyOnPreparing").default(true).notNull(), // Notificar quando pedido está sendo preparado
  notifyOnReady: boolean("notifyOnReady").default(true).notNull(), // Notificar quando pedido está pronto
  notifyOnCompleted: boolean("notifyOnCompleted").default(true).notNull(), // Notificar quando pedido é finalizado
  notifyOnCancelled: boolean("notifyOnCancelled").default(true).notNull(), // Notificar quando pedido é cancelado
  // Templates de mensagem personalizados
  templateNewOrder: text("templateNewOrder"), // Template para novo pedido
  templatePreparing: text("templatePreparing"), // Template para preparando
  templateReady: text("templateReady"), // Template para pronto (delivery)
  templateReadyPickup: text("templateReadyPickup"), // Template para pronto (retirada/consumo no local)
  templateCompleted: text("templateCompleted"), // Template para finalizado
  templateCancelled: text("templateCancelled"), // Template para cancelado
  // Reserva de mesa
  notifyOnReservation: boolean("notifyOnReservation").default(true).notNull(), // Enviar confirmação de reserva por WhatsApp
  templateReservation: text("templateReservation"), // Template para reserva de mesa
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;


// Fila de impressão para app Android
export const printQueue = mysqlTable("printQueue", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  printerId: int("printerId"), // Impressora específica (null = impressora padrão)
  status: mysqlEnum("status", ["pending", "printing", "completed", "failed"]).default("pending").notNull(),
  copies: int("copies").default(1).notNull(),
  errorMessage: text("errorMessage"), // Mensagem de erro se falhou
  printedAt: timestamp("printedAt"), // Quando foi impresso
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrintQueue = typeof printQueue.$inferSelect;
export type InsertPrintQueue = typeof printQueue.$inferInsert;

// Configuração de integração com iFood (Fluxo OAuth Distribuído)
export const ifoodConfig = mysqlTable("ifoodConfig", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  // Tokens OAuth (obtidos via fluxo distribuído)
  accessToken: text("accessToken"), // Token de acesso atual
  refreshToken: text("refreshToken"), // Token para renovar acesso
  tokenExpiresAt: timestamp("tokenExpiresAt"), // Quando o token expira
  // Código de verificação temporário (usado durante autorização)
  authorizationCodeVerifier: varchar("authorizationCodeVerifier", { length: 255 }),
  userCode: varchar("userCode", { length: 50 }), // Código exibido para o usuário
  userCodeExpiresAt: timestamp("userCodeExpiresAt"), // Quando o código expira
  // Informações da loja no iFood
  merchantId: varchar("merchantId", { length: 100 }), // ID da loja no iFood (UUID)
  merchantName: varchar("merchantName", { length: 255 }), // Nome da loja no iFood
  // Status
  isActive: boolean("isActive").default(false).notNull(), // Integração ativa
  isConnected: boolean("isConnected").default(false).notNull(), // Conectado ao iFood
  lastTokenRefresh: timestamp("lastTokenRefresh"), // Último refresh do token
  // Configurações de comportamento
  autoAcceptOrders: boolean("autoAcceptOrders").default(false).notNull(), // Aceitar pedidos automaticamente
  notifyOnNewOrder: boolean("notifyOnNewOrder").default(true).notNull(), // Notificar sobre novos pedidos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IfoodConfig = typeof ifoodConfig.$inferSelect;
export type InsertIfoodConfig = typeof ifoodConfig.$inferInsert;


// Menu sessions for tracking active viewers
export const menuSessions = mysqlTable("menu_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  establishmentId: int("establishmentId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MenuSession = typeof menuSessions.$inferSelect;
export type InsertMenuSession = typeof menuSessions.$inferInsert;

// Menu views daily aggregation for historical data
export const menuViewsDaily = mysqlTable("menu_views_daily", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  viewCount: int("viewCount").default(0).notNull(),
  uniqueVisitors: int("uniqueVisitors").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuViewsDaily = typeof menuViewsDaily.$inferSelect;
export type InsertMenuViewsDaily = typeof menuViewsDaily.$inferInsert;


// Menu views hourly aggregation for heatmap
export const menuViewsHourly = mysqlTable("menu_views_hourly", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: int("hour").notNull(), // 0-23
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuViewsHourly = typeof menuViewsHourly.$inferSelect;
export type InsertMenuViewsHourly = typeof menuViewsHourly.$inferInsert;


// SMS Balance - Saldo de SMS por estabelecimento
export const smsBalance = mysqlTable("sms_balance", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 4 }).default("0").notNull(), // Saldo em reais (4 casas para suportar R$ 0,097/SMS)
  costPerSms: decimal("costPerSms", { precision: 10, scale: 4 }).default("0.0970").notNull(), // Custo por SMS (padrão R$ 0,097)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsBalance = typeof smsBalance.$inferSelect;
export type InsertSmsBalance = typeof smsBalance.$inferInsert;

// SMS Transactions - Histórico de transações de SMS (créditos e débitos)
export const smsTransactions = mysqlTable("sms_transactions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["credit", "debit"]).notNull(), // credit = recarga, debit = envio
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(), // Valor da transação (4 casas para precisão)
  smsCount: int("smsCount").default(0).notNull(), // Quantidade de SMS (para débitos)
  balanceBefore: decimal("balanceBefore", { precision: 10, scale: 4 }).notNull(), // Saldo antes
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 4 }).notNull(), // Saldo depois
  description: varchar("description", { length: 255 }), // Descrição da transação
  campaignName: varchar("campaignName", { length: 255 }), // Nome da campanha (para débitos)
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // ID do pagamento Stripe (para recargas via cartão)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsTransaction = typeof smsTransactions.$inferSelect;
export type InsertSmsTransaction = typeof smsTransactions.$inferInsert;


// Espaços/Locais do estabelecimento (ex: Salão, Varanda, Área Externa)
export const tableSpaces = mysqlTable("tableSpaces", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Nome do espaço (ex: "Salão", "Varanda")
  sortOrder: int("sortOrder").default(0).notNull(), // Ordem de exibição
  isActive: boolean("isActive").default(true).notNull(), // Se o espaço está ativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TableSpace = typeof tableSpaces.$inferSelect;
export type InsertTableSpace = typeof tableSpaces.$inferInsert;

// Mesas do estabelecimento
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  spaceId: int("spaceId"), // ID do espaço onde a mesa está localizada
  number: int("number").notNull(), // Número da mesa
  name: varchar("name", { length: 100 }), // Nome opcional (ex: "Mesa VIP", "Varanda")
  capacity: int("capacity").default(4).notNull(), // Capacidade de pessoas
  status: mysqlEnum("status", ["free", "occupied", "reserved", "requesting_bill"]).default("free").notNull(),
  currentGuests: int("currentGuests").default(0).notNull(), // Quantidade atual de pessoas
  occupiedAt: timestamp("occupiedAt"), // Quando a mesa foi ocupada
  reservedFor: timestamp("reservedFor"), // Horário da reserva (se reservada)
  reservedName: varchar("reservedName", { length: 255 }), // Nome da reserva
  reservedPhone: varchar("reservedPhone", { length: 30 }), // Telefone da reserva
  reservedGuests: int("reservedGuests"), // Quantidade de pessoas da reserva
  isActive: boolean("isActive").default(true).notNull(), // Se a mesa está ativa
  sortOrder: int("sortOrder").default(0).notNull(), // Ordem de exibição
  // Campos para mesas combinadas
  mergedIntoId: int("mergedIntoId"), // ID da mesa principal quando esta mesa foi juntada a outra
  mergedTableIds: text("mergedTableIds"), // JSON array com IDs das mesas que foram juntadas a esta (ex: "[2,3]")
  displayNumber: varchar("displayNumber", { length: 50 }), // Número de exibição para mesas combinadas (ex: "1-3")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

// Comandas (vinculadas a mesas ou avulsas)
export const tabs = mysqlTable("tabs", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  tableId: int("tableId"), // Mesa vinculada (null para comanda avulsa)
  tabNumber: varchar("tabNumber", { length: 50 }).notNull(), // Número da comanda
  customerName: varchar("customerName", { length: 255 }), // Nome do cliente
  customerPhone: varchar("customerPhone", { length: 30 }), // Telefone do cliente
  status: mysqlEnum("status", ["open", "requesting_bill", "closed", "cancelled"]).default("open").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  serviceCharge: decimal("serviceCharge", { precision: 10, scale: 2 }).default("0").notNull(), // Taxa de serviço (10%)
  total: decimal("total", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // Forma de pagamento ao fechar
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0").notNull(), // Valor pago
  changeAmount: decimal("changeAmount", { precision: 10, scale: 2 }).default("0").notNull(), // Troco
  notes: text("notes"), // Observações gerais
  openedAt: timestamp("openedAt").defaultNow().notNull(), // Quando a comanda foi aberta
  closedAt: timestamp("closedAt"), // Quando foi fechada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tab = typeof tabs.$inferSelect;
export type InsertTab = typeof tabs.$inferInsert;

// Itens da comanda
export const tabItems = mysqlTable("tabItems", {
  id: int("id").autoincrement().primaryKey(),
  tabId: int("tabId").notNull(), // Comanda vinculada
  productId: int("productId").notNull(), // Produto
  productName: varchar("productName", { length: 255 }).notNull(), // Nome do produto (snapshot)
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // Preço unitário
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(), // Preço total (qty * unit + complementos)
  complements: json("complements").$type<Array<{ name: string; price: number; quantity: number }>>(), // Complementos
  notes: text("notes"), // Observações do item
  status: mysqlEnum("status", ["pending", "preparing", "ready", "delivered", "cancelled"]).default("pending").notNull(),
  orderedAt: timestamp("orderedAt").defaultNow().notNull(), // Quando foi pedido
  deliveredAt: timestamp("deliveredAt"), // Quando foi entregue
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TabItem = typeof tabItems.$inferSelect;
export type InsertTabItem = typeof tabItems.$inferInsert;

// Campanhas SMS agendadas
export const scheduledCampaigns = mysqlTable("scheduled_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  recipients: json("recipients").notNull(), // Array de { phone: string, name?: string }
  recipientCount: int("recipientCount").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(), // Data/hora para disparo
  status: mysqlEnum("status", ["pending", "sent", "cancelled", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"), // Quando foi efetivamente disparada
  successCount: int("successCount").default(0).notNull(), // SMS enviados com sucesso
  failCount: int("failCount").default(0).notNull(), // SMS que falharam
  costPerSms: decimal("costPerSms", { precision: 10, scale: 4 }).default("0.097").notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledCampaign = typeof scheduledCampaigns.$inferSelect;
export type InsertScheduledCampaign = typeof scheduledCampaigns.$inferInsert;

// Pedidos online pendentes de pagamento (dados salvos antes do checkout Stripe)
export const pendingOnlineOrders = mysqlTable("pending_online_orders", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(), // Stripe checkout session ID
  establishmentId: int("establishmentId").notNull(),
  orderData: json("orderData").notNull(), // JSON completo com dados do pedido e itens
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  resultOrderId: int("resultOrderId"), // ID do pedido criado após pagamento
  resultOrderNumber: varchar("resultOrderNumber", { length: 50 }), // Número do pedido criado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PendingOnlineOrder = typeof pendingOnlineOrders.$inferSelect;
export type InsertPendingOnlineOrder = typeof pendingOnlineOrders.$inferInsert;


// Clientes PDV - salvar dados de clientes para reaproveitamento no PDV
export const pdvCustomers = mysqlTable("pdv_customers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  phone: varchar("phone", { length: 30 }).notNull(), // Telefone como identificador principal (somente dígitos)
  name: varchar("name", { length: 255 }),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 50 }),
  complement: varchar("complement", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdvCustomer = typeof pdvCustomers.$inferSelect;
export type InsertPdvCustomer = typeof pdvCustomers.$inferInsert;


// Combo Groups - Grupos dentro de um combo (ex: "Escolha seu lanche", "Escolha sua bebida")
export const comboGroups = mysqlTable("comboGroups", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // ID do produto-combo pai
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Escolha seu lanche"
  isRequired: boolean("isRequired").default(true).notNull(), // Obrigatório ou opcional
  maxQuantity: int("maxQuantity").default(1).notNull(), // Quantidade máxima que o cliente pode escolher
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComboGroup = typeof comboGroups.$inferSelect;
export type InsertComboGroup = typeof comboGroups.$inferInsert;

// Combo Group Items - Itens vinculados a cada grupo do combo
export const comboGroupItems = mysqlTable("comboGroupItems", {
  id: int("id").autoincrement().primaryKey(),
  comboGroupId: int("comboGroupId").notNull(), // ID do grupo
  productId: int("productId").notNull(), // ID do produto vinculado
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComboGroupItem = typeof comboGroupItems.$inferSelect;
export type InsertComboGroupItem = typeof comboGroupItems.$inferInsert;

// Delivery drivers
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Repasse strategy: "neighborhood" = valor por bairro, "fixed" = valor fixo, "percentage" = percentual da taxa
  repasseStrategy: mysqlEnum("repasseStrategy", ["neighborhood", "fixed", "percentage"]).default("neighborhood").notNull(),
  fixedValue: decimal("fixedValue", { precision: 10, scale: 2 }),
  percentageValue: decimal("percentageValue", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

// Deliveries (link between orders and drivers)
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  orderId: int("orderId").notNull(),
  driverId: int("driverId").notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).notNull(),
  repasseValue: decimal("repasseValue", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  whatsappSentAt: timestamp("whatsappSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;
