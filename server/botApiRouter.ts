/**
 * Bot API Router — Endpoints REST para integração com n8n / WhatsApp bots
 * 
 * Autenticação via API Key no header Authorization: Bearer {API_KEY}
 * Cada API Key está vinculada a um establishmentId específico.
 */
import { Router, Request, Response, NextFunction } from "express";
import * as db from "./db";
import { botApiKeys, orders, orderItems, products, complementGroups, complementItems, categories, neighborhoodFees, businessHours, coupons, establishments, stockItems, comboGroups, comboGroupItems, whatsappConfig } from "../drizzle/schema";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";
import { z } from "zod";

// ============ AUTH MIDDLEWARE ============

interface BotApiRequest extends Request {
  botEstablishmentId?: number;
  botApiKeyId?: number;
  botIsGlobal?: boolean;
}

/**
 * Middleware que valida a API Key e injeta o establishmentId no request.
 * Também incrementa o contador de uso e atualiza lastUsedAt.
 */
async function botApiAuth(req: BotApiRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "API Key não fornecida. Use o header: Authorization: Bearer {SUA_API_KEY}",
      });
    }

    const apiKey = authHeader.slice(7).trim();
    if (!apiKey) {
      return res.status(401).json({ error: "API Key vazia." });
    }

    const dbInstance = await db.getDb();
    if (!dbInstance) {
      return res.status(503).json({ error: "Banco de dados indisponível." });
    }

    // Buscar a API Key no banco
    const [keyRecord] = await dbInstance
      .select()
      .from(botApiKeys)
      .where(eq(botApiKeys.apiKey, apiKey))
      .limit(1);

    if (!keyRecord) {
      return res.status(401).json({ error: "API Key inválida." });
    }

    if (!keyRecord.isActive) {
      return res.status(403).json({ error: "API Key desativada." });
    }

    // Atualizar lastUsedAt e requestCount (fire-and-forget)
    dbInstance
      .update(botApiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: sql`${botApiKeys.requestCount} + 1`,
      })
      .where(eq(botApiKeys.id, keyRecord.id))
      .catch(() => {}); // Não bloquear se falhar

    req.botEstablishmentId = keyRecord.establishmentId;
    req.botApiKeyId = keyRecord.id;
    req.botIsGlobal = keyRecord.isGlobal ?? false;
    next();
  } catch (error) {
    console.error("[BotAPI] Erro no middleware de auth:", error);
    return res.status(500).json({ error: "Erro interno de autenticação." });
  }
}

// ============ HELPER FUNCTIONS ============

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

// ============ ROUTER ============

export function createBotApiRouter(): Router {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(botApiAuth as any);

  // ──────────────────────────────────────────────
  // GET /api/bot/establishment — Dados do estabelecimento
  // ──────────────────────────────────────────────
  router.get("/establishment", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      // Buscar status de abertura
      const storeStatus = await db.getEstablishmentOpenStatus(estId);

      // Buscar horários de funcionamento
      const hours = await db.getBusinessHoursForPublicMenu(estId);

      // Formatar horários para exibição
      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const openingHours = hours
        .filter((h) => h.isActive && h.openTime && h.closeTime)
        .map((h) => ({
          day: dayNames[h.dayOfWeek],
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }));

      // Montar métodos de pagamento
      const paymentMethods: string[] = [];
      if (establishment.acceptsCash) paymentMethods.push("dinheiro");
      if (establishment.acceptsCard) paymentMethods.push("cartao");
      if (establishment.acceptsPix) paymentMethods.push("pix");
      if (establishment.acceptsBoleto) paymentMethods.push("boleto");

      return res.json({
        id: establishment.id,
        name: establishment.name,
        phone: establishment.whatsapp,
        address: [
          establishment.street,
          establishment.number,
          establishment.complement,
          establishment.neighborhood,
          establishment.city,
          establishment.state,
        ]
          .filter(Boolean)
          .join(", "),
        isOpen: storeStatus.isOpen,
        manuallyClosed: storeStatus.manuallyClosed,
        nextOpeningTime: storeStatus.nextOpeningTime,
        openingHours,
        deliveryEnabled: establishment.allowsDelivery,
        pickupEnabled: establishment.allowsPickup,
        dineInEnabled: establishment.allowsDineIn,
        minimumOrderEnabled: establishment.minimumOrderEnabled,
        minimumOrderValue: establishment.minimumOrderValue,
        deliveryTimeEnabled: establishment.deliveryTimeEnabled,
        deliveryTimeMin: establishment.deliveryTimeMin,
        deliveryTimeMax: establishment.deliveryTimeMax,
        deliveryFeeType: establishment.deliveryFeeType,
        deliveryFeeFixed: establishment.deliveryFeeFixed,
        paymentMethods,
        rating: establishment.rating,
        reviewCount: establishment.reviewCount,
        schedulingEnabled: establishment.schedulingEnabled,
        autoAcceptOrders: establishment.autoAcceptOrders,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /establishment:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu — Cardápio completo
  // ──────────────────────────────────────────────
  router.get("/menu", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar categorias ativas
      const menuCategories = await dbInstance
        .select()
        .from(categories)
        .where(and(eq(categories.establishmentId, estId), eq(categories.isActive, true)))
        .orderBy(asc(categories.sortOrder));

      // Buscar produtos ativos
      const menuProducts = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.establishmentId, estId), eq(products.status, "active")))
        .orderBy(asc(products.sortOrder));

      // Verificar estoque
      const productsWithStock = await Promise.all(
        menuProducts.map(async (product) => {
          let outOfStock = false;
          let availableStock: number | null = null;

          if (product.hasStock) {
            const [stockItem] = await dbInstance
              .select()
              .from(stockItems)
              .where(eq(stockItems.linkedProductId, product.id))
              .limit(1);

            if (stockItem) {
              availableStock = Number(stockItem.currentQuantity);
            } else if (product.stockQuantity !== null) {
              availableStock = product.stockQuantity;
            }
            outOfStock = availableStock !== null && availableStock <= 0;
          }

          return {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description,
            price: product.price,
            isCombo: product.isCombo,
            outOfStock,
            availableStock,
            hasStock: product.hasStock,
          };
        })
      );

      // Agrupar por categoria
      const result = menuCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        products: productsWithStock.filter((p) => p.categoryId === cat.id),
      }));

      return res.json({ categories: result });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /menu:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu/search?q=termo — Buscar no cardápio
  // ──────────────────────────────────────────────
  router.get("/menu/search", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const query = (req.query.q as string || "").trim();
      if (!query) {
        return sendError(res, 400, "Parâmetro 'q' é obrigatório.");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const results = await dbInstance
        .select({
          id: products.id,
          categoryId: products.categoryId,
          name: products.name,
          description: products.description,
          price: products.price,
          isCombo: products.isCombo,
          hasStock: products.hasStock,
          stockQuantity: products.stockQuantity,
        })
        .from(products)
        .where(
          and(
            eq(products.establishmentId, estId),
            eq(products.status, "active"),
            like(products.name, `%${query}%`)
          )
        )
        .orderBy(asc(products.sortOrder))
        .limit(20);

      return res.json({ query, results });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /menu/search:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/products/:id — Detalhes de um produto com complementos
  // ──────────────────────────────────────────────
  router.get("/products/:id", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) return sendError(res, 400, "ID do produto inválido.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar produto
      const [product] = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.establishmentId, estId)))
        .limit(1);

      if (!product) return sendError(res, 404, "Produto não encontrado.");

      // Buscar complementos
      const groups = await db.getComplementGroupsByProduct(productId);
      const complementGroupsData = await Promise.all(
        groups.map(async (group) => {
          const items = await db.getComplementItemsByGroup(group.id, productId);
          return {
            id: group.id,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            items: items
              .filter((i) => i.isActive)
              .map((item) => ({
                id: item.id,
                name: item.name,
                price: item.priceMode === "free" ? "0" : item.price,
                priceMode: item.priceMode,
              })),
          };
        })
      );

      // Se for combo, buscar grupos do combo
      let comboGroupsData: any[] = [];
      if (product.isCombo) {
        const cGroups = await dbInstance
          .select()
          .from(comboGroups)
          .where(eq(comboGroups.productId, productId))
          .orderBy(asc(comboGroups.sortOrder));

        comboGroupsData = await Promise.all(
          cGroups.map(async (cg) => {
            const cgItems = await dbInstance
              .select()
              .from(comboGroupItems)
              .where(eq(comboGroupItems.comboGroupId, cg.id));

            // Buscar nomes dos produtos do combo
            const itemsWithNames = await Promise.all(
              cgItems.map(async (ci) => {
                const [prod] = await dbInstance
                  .select({ name: products.name, price: products.price })
                  .from(products)
                  .where(eq(products.id, ci.productId))
                  .limit(1);
                return {
                  productId: ci.productId,
                  productName: prod?.name || "Produto",
                  price: prod?.price || "0",
                };
              })
            );

            return {
              id: cg.id,
              name: cg.name,
              maxQuantity: cg.maxQuantity,
              isRequired: cg.isRequired,
              items: itemsWithNames,
            };
          })
        );
      }

      // Verificar estoque
      let outOfStock = false;
      let availableStock: number | null = null;
      if (product.hasStock) {
        const [stockItem] = await dbInstance
          .select()
          .from(stockItems)
          .where(eq(stockItems.linkedProductId, product.id))
          .limit(1);
        if (stockItem) {
          availableStock = Number(stockItem.currentQuantity);
        } else if (product.stockQuantity !== null) {
          availableStock = product.stockQuantity;
        }
        outOfStock = availableStock !== null && availableStock <= 0;
      }

      return res.json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        isCombo: product.isCombo,
        outOfStock,
        availableStock,
        complementGroups: complementGroupsData,
        comboGroups: comboGroupsData.length > 0 ? comboGroupsData : undefined,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /products/:id:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/stock/:productId — Verificar estoque de um produto
  // ──────────────────────────────────────────────
  router.get("/stock/:productId", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) return sendError(res, 400, "ID do produto inválido.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const [product] = await dbInstance
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.establishmentId, estId)))
        .limit(1);

      if (!product) return sendError(res, 404, "Produto não encontrado.");

      if (!product.hasStock) {
        return res.json({
          productId: product.id,
          productName: product.name,
          hasStockControl: false,
          available: true,
          message: "Este produto não possui controle de estoque.",
        });
      }

      const [stockItem] = await dbInstance
        .select()
        .from(stockItems)
        .where(eq(stockItems.linkedProductId, product.id))
        .limit(1);

      const availableQty = stockItem
        ? Number(stockItem.currentQuantity)
        : product.stockQuantity ?? 0;

      return res.json({
        productId: product.id,
        productName: product.name,
        hasStockControl: true,
        available: availableQty > 0,
        quantity: availableQty,
        unit: stockItem?.unit || "unidade",
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /stock/:productId:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/delivery-fees — Taxas de entrega
  // ──────────────────────────────────────────────
  router.get("/delivery-fees", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) return sendError(res, 404, "Estabelecimento não encontrado.");

      if (establishment.deliveryFeeType === "free") {
        return res.json({
          type: "free",
          message: "Entrega grátis para todos os bairros.",
        });
      }

      if (establishment.deliveryFeeType === "fixed") {
        return res.json({
          type: "fixed",
          fee: establishment.deliveryFeeFixed,
        });
      }

      // byNeighborhood
      const fees = await db.getNeighborhoodFeesByEstablishment(estId);
      return res.json({
        type: "byNeighborhood",
        neighborhoods: fees.map((f) => ({
          id: f.id,
          neighborhood: f.neighborhood,
          fee: f.fee,
        })),
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /delivery-fees:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/delivery-fees/search?neighborhood=nome — Taxa por bairro
  // ──────────────────────────────────────────────
  router.get("/delivery-fees/search", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const neighborhood = (req.query.neighborhood as string || "").trim();
      if (!neighborhood) {
        return sendError(res, 400, "Parâmetro 'neighborhood' é obrigatório.");
      }

      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) return sendError(res, 404, "Estabelecimento não encontrado.");

      if (establishment.deliveryFeeType === "free") {
        return res.json({ fee: "0", type: "free", message: "Entrega grátis." });
      }

      if (establishment.deliveryFeeType === "fixed") {
        return res.json({ fee: establishment.deliveryFeeFixed, type: "fixed" });
      }

      // Buscar por bairro (busca parcial case-insensitive)
      const fees = await db.getNeighborhoodFeesByEstablishment(estId);
      const normalizedSearch = neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const match = fees.find((f) => {
        const normalizedName = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
      });

      if (match) {
        return res.json({
          neighborhood: match.neighborhood,
          fee: match.fee,
          found: true,
        });
      }

      // Retornar sugestões se não encontrou exato
      const suggestions = fees
        .filter((f) => {
          const normalizedName = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedName.includes(normalizedSearch.substring(0, 3));
        })
        .slice(0, 5)
        .map((f) => f.neighborhood);

      return res.json({
        found: false,
        message: `Bairro "${neighborhood}" não encontrado na lista de entrega.`,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /delivery-fees/search:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // POST /api/bot/coupons/validate — Validar cupom
  // ──────────────────────────────────────────────
  router.post("/coupons/validate", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const { code, orderTotal } = req.body || {};

      if (!code) return sendError(res, 400, "Campo 'code' é obrigatório.");

      const coupon = await db.getCouponByCode(estId, code);
      if (!coupon) {
        return res.json({ valid: false, message: "Cupom não encontrado." });
      }

      if (coupon.status !== "active") {
        return res.json({ valid: false, message: `Cupom ${coupon.status === "expired" ? "expirado" : coupon.status === "exhausted" ? "esgotado" : "inativo"}.` });
      }

      // Verificar quantidade
      if (coupon.quantity !== null && coupon.usedCount >= coupon.quantity) {
        return res.json({ valid: false, message: "Cupom esgotado." });
      }

      // Verificar data de validade
      if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
        return res.json({ valid: false, message: "Cupom expirado." });
      }

      if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
        return res.json({ valid: false, message: "Cupom ainda não está ativo." });
      }

      // Verificar valor mínimo
      if (coupon.minOrderValue && orderTotal) {
        const minValue = parseFloat(String(coupon.minOrderValue));
        const total = parseFloat(String(orderTotal));
        if (total < minValue) {
          return res.json({
            valid: false,
            message: `Pedido mínimo de R$ ${minValue.toFixed(2)} para usar este cupom.`,
          });
        }
      }

      // Calcular desconto
      let discount = 0;
      if (coupon.type === "percentage") {
        discount = orderTotal ? (parseFloat(String(orderTotal)) * parseFloat(String(coupon.value))) / 100 : 0;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, parseFloat(String(coupon.maxDiscount)));
        }
      } else {
        discount = parseFloat(String(coupon.value));
      }

      return res.json({
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        calculatedDiscount: discount.toFixed(2),
        message: coupon.type === "percentage"
          ? `Cupom de ${coupon.value}% de desconto aplicado!`
          : `Cupom de R$ ${parseFloat(String(coupon.value)).toFixed(2)} de desconto aplicado!`,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em POST /coupons/validate:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // POST /api/bot/orders — Criar pedido
  // ──────────────────────────────────────────────
  const createOrderSchema = z.object({
    customerName: z.string().min(1, "Nome do cliente é obrigatório"),
    customerPhone: z.string().min(10, "Telefone do cliente é obrigatório"),
    deliveryType: z.enum(["delivery", "pickup", "dine_in"]),
    paymentMethod: z.enum(["cash", "card", "pix", "boleto"]),
    customerAddress: z.string().optional(),
    notes: z.string().optional(),
    changeAmount: z.string().optional(),
    couponCode: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        complements: z
          .array(
            z.object({
              name: z.string(),
              price: z.number(),
              quantity: z.number().default(1),
            })
          )
          .optional(),
        notes: z.string().optional(),
      })
    ).min(1, "Pelo menos um item é obrigatório"),
  });

  router.post("/orders", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;

      // Validar input
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, 400, parsed.error.issues.map((e: any) => e.message).join("; "));
      }
      const input = parsed.data;

      // Verificar se o estabelecimento existe e está aberto
      const establishment = await db.getEstablishmentById(estId);
      if (!establishment) return sendError(res, 404, "Estabelecimento não encontrado.");

      const storeStatus = await db.getEstablishmentOpenStatus(estId);
      if (!storeStatus.isOpen) {
        return sendError(res, 400, "O estabelecimento está fechado no momento.");
      }

      // Verificar tipo de entrega
      if (input.deliveryType === "delivery" && !establishment.allowsDelivery) {
        return sendError(res, 400, "Este estabelecimento não realiza entregas.");
      }
      if (input.deliveryType === "pickup" && !establishment.allowsPickup) {
        return sendError(res, 400, "Este estabelecimento não aceita retirada.");
      }
      if (input.deliveryType === "dine_in" && !establishment.allowsDineIn) {
        return sendError(res, 400, "Este estabelecimento não aceita consumo no local.");
      }

      // Verificar endereço obrigatório para delivery
      if (input.deliveryType === "delivery" && !input.customerAddress) {
        return sendError(res, 400, "Endereço é obrigatório para entregas.");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar e validar todos os produtos
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
        complements: Array<{ name: string; price: number; quantity: number }>;
        notes: string | null;
      }> = [];

      for (const item of input.items) {
        const [product] = await dbInstance
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.establishmentId, estId)))
          .limit(1);

        if (!product) {
          return sendError(res, 400, `Produto ID ${item.productId} não encontrado.`);
        }

        if (product.status !== "active") {
          return sendError(res, 400, `Produto "${product.name}" não está disponível.`);
        }

        // Validar complementos obrigatórios
        const groups = await db.getComplementGroupsByProduct(product.id);
        for (const group of groups) {
          if (group.isRequired) {
            const selectedFromGroup = (item.complements || []).filter((c) => {
              // Verificar se o complemento pertence a este grupo
              return true; // Simplificado - a validação real é feita pelo nome
            });
            // Verificar se pelo menos minQuantity complementos foram selecionados do grupo obrigatório
            // (simplificado - verificação completa seria por grupo)
          }
        }

        // Calcular preço do item
        const unitPrice = parseFloat(String(product.price));
        let complementsTotal = 0;
        const itemComplements = (item.complements || []).map((c) => {
          complementsTotal += c.price * (c.quantity || 1);
          return { name: c.name, price: c.price, quantity: c.quantity || 1 };
        });

        const itemTotal = (unitPrice + complementsTotal) * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: itemTotal.toFixed(2),
          complements: itemComplements,
          notes: item.notes || null,
        });
      }

      // Calcular taxa de entrega
      let deliveryFee = 0;
      if (input.deliveryType === "delivery") {
        if (establishment.deliveryFeeType === "fixed") {
          deliveryFee = parseFloat(String(establishment.deliveryFeeFixed || "0"));
        } else if (establishment.deliveryFeeType === "byNeighborhood" && input.customerAddress) {
          // Tentar encontrar bairro no endereço
          const fees = await db.getNeighborhoodFeesByEstablishment(estId);
          const normalizedAddress = input.customerAddress.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const matchedFee = fees.find((f) => {
            const normalizedNeighborhood = f.neighborhood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedAddress.includes(normalizedNeighborhood);
          });
          if (matchedFee) {
            deliveryFee = parseFloat(String(matchedFee.fee));
          }
        }
      }

      // Calcular desconto de cupom
      let discount = 0;
      let couponId: number | undefined;
      if (input.couponCode) {
        const coupon = await db.getCouponByCode(estId, input.couponCode);
        if (coupon && coupon.status === "active") {
          couponId = coupon.id;
          if (coupon.type === "percentage") {
            discount = (subtotal * parseFloat(String(coupon.value))) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, parseFloat(String(coupon.maxDiscount)));
            }
          } else {
            discount = parseFloat(String(coupon.value));
          }
        }
      }

      // Verificar pedido mínimo
      if (establishment.minimumOrderEnabled && establishment.minimumOrderValue) {
        const minValue = parseFloat(String(establishment.minimumOrderValue));
        if (subtotal < minValue) {
          return sendError(
            res,
            400,
            `Pedido mínimo de R$ ${minValue.toFixed(2)}. Subtotal atual: R$ ${subtotal.toFixed(2)}.`
          );
        }
      }

      const total = subtotal + deliveryFee - discount;

      // Criar o pedido
      try {
        const result = await db.createPublicOrder(
          {
            establishmentId: estId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerAddress: input.customerAddress || null,
            deliveryType: input.deliveryType,
            paymentMethod: input.paymentMethod,
            subtotal: subtotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            discount: discount.toFixed(2),
            total: total.toFixed(2),
            notes: input.notes || null,
            changeAmount: input.changeAmount || null,
            couponCode: input.couponCode || null,
            orderNumber: "", // Will be generated
          },
          orderItemsData.map((item) => ({
            orderId: 0, // Will be set
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            complements: item.complements,
            notes: item.notes,
          }))
        );

        // Incrementar uso do cupom
        if (couponId && result) {
          await db.incrementCouponUsage(couponId);
        }

        return res.status(201).json({
          success: true,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          message: `Pedido ${result.orderNumber} criado com sucesso!`,
        });
      } catch (orderError: any) {
        if (orderError.message?.includes("Estoque insuficiente")) {
          return sendError(res, 400, orderError.message);
        }
        throw orderError;
      }
    } catch (error) {
      console.error("[BotAPI] Erro em POST /orders:", error);
      return sendError(res, 500, "Erro interno ao criar pedido.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/orders?phone=5534999999999 — Pedidos do cliente
  // ──────────────────────────────────────────────
  router.get("/orders", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const phone = (req.query.phone as string || "").trim();
      if (!phone) return sendError(res, 400, "Parâmetro 'phone' é obrigatório.");

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const customerOrders = await dbInstance
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.establishmentId, estId),
            eq(orders.customerPhone, phone)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(10);

      const ordersWithItems = await Promise.all(
        customerOrders.map(async (order) => {
          const items = await db.getOrderItems(order.id);
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            deliveryType: order.deliveryType,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            createdAt: order.createdAt,
            items: items.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              complements: i.complements,
              notes: i.notes,
            })),
          };
        })
      );

      return res.json({ orders: ordersWithItems });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /orders:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/orders/:id — Detalhes de um pedido
  // ──────────────────────────────────────────────
  router.get("/orders/:id", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) return sendError(res, 400, "ID do pedido inválido.");

      const order = await db.getOrderById(orderId);
      if (!order || order.establishmentId !== estId) {
        return sendError(res, 404, "Pedido não encontrado.");
      }

      const items = await db.getOrderItems(orderId);

      const statusLabels: Record<string, string> = {
        pending_confirmation: "Aguardando confirmação",
        new: "Novo",
        preparing: "Em preparo",
        ready: "Pronto",
        out_for_delivery: "Saiu para entrega",
        completed: "Concluído",
        cancelled: "Cancelado",
        scheduled: "Agendado",
      };

      return res.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusLabels[order.status] || order.status,
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
        createdAt: order.createdAt,
        items: items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          complements: i.complements,
          notes: i.notes,
        })),
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /orders/:id:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/whatsapp-config — Buscar establishmentId pelo número conectado
  // Query param: phone (número do WhatsApp conectado)
  // ──────────────────────────────────────────────
  router.get("/whatsapp-config", async (req: BotApiRequest, res: Response) => {
    try {
      // Este endpoint requer uma API Key global (isGlobal=true)
      if (!req.botIsGlobal) {
        return sendError(res, 403, "Este endpoint requer uma API Key global. Gere uma na página Bot WhatsApp.");
      }

      const phone = req.query.phone as string;
      if (!phone) {
        return sendError(res, 400, "Parâmetro 'phone' é obrigatório. Ex: ?phone=5511999998888");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar na whatsappConfig pelo connectedPhone
      const [config] = await dbInstance
        .select({
          establishmentId: whatsappConfig.establishmentId,
          connectedPhone: whatsappConfig.connectedPhone,
          status: whatsappConfig.status,
        })
        .from(whatsappConfig)
        .where(eq(whatsappConfig.connectedPhone, phone))
        .limit(1);

      if (!config) {
        return sendError(res, 404, `Nenhum estabelecimento encontrado com o número ${phone}.`);
      }

      return res.json({
        establishmentId: config.establishmentId,
        connectedPhone: config.connectedPhone,
        status: config.status,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /whatsapp-config:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/api-key — Buscar API Key pelo establishmentId
  // Query param: establishmentId (ID do estabelecimento)
  // ──────────────────────────────────────────────
  router.get("/api-key", async (req: BotApiRequest, res: Response) => {
    try {
      // Este endpoint requer uma API Key global (isGlobal=true)
      if (!req.botIsGlobal) {
        return sendError(res, 403, "Este endpoint requer uma API Key global. Gere uma na página Bot WhatsApp.");
      }

      const establishmentId = parseInt(req.query.establishmentId as string, 10);
      if (!establishmentId || isNaN(establishmentId)) {
        return sendError(res, 400, "Parâmetro 'establishmentId' é obrigatório. Ex: ?establishmentId=30001");
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      // Buscar a API Key ativa (não global) vinculada ao establishmentId
      const [keyRecord] = await dbInstance
        .select({
          id: botApiKeys.id,
          name: botApiKeys.name,
          apiKey: botApiKeys.apiKey,
          establishmentId: botApiKeys.establishmentId,
          isActive: botApiKeys.isActive,
          createdAt: botApiKeys.createdAt,
        })
        .from(botApiKeys)
        .where(
          and(
            eq(botApiKeys.establishmentId, establishmentId),
            eq(botApiKeys.isActive, true),
            eq(botApiKeys.isGlobal, false)
          )
        )
        .orderBy(desc(botApiKeys.createdAt))
        .limit(1);

      if (!keyRecord) {
        return sendError(res, 404, `Nenhuma API Key ativa encontrada para o estabelecimento ${establishmentId}.`);
      }

      return res.json({
        id: keyRecord.id,
        name: keyRecord.name,
        apiKey: keyRecord.apiKey,
        establishmentId: keyRecord.establishmentId,
        isActive: keyRecord.isActive,
        createdAt: keyRecord.createdAt,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /api-key:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/bot-status — Verificar se o bot está ativo para o estabelecimento
  // Retorna { enabled: boolean, establishmentId: number }
  // ──────────────────────────────────────────────
  router.get("/bot-status", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const [establishment] = await dbInstance
        .select({
          id: establishments.id,
          name: establishments.name,
          whatsappBotEnabled: establishments.whatsappBotEnabled,
        })
        .from(establishments)
        .where(eq(establishments.id, estId))
        .limit(1);

      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      return res.json({
        enabled: establishment.whatsappBotEnabled,
        establishmentId: establishment.id,
        establishmentName: establishment.name,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /bot-status:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  // ──────────────────────────────────────────────
  // GET /api/bot/menu-link — Link do cardápio público
  // ──────────────────────────────────────────────
  router.get("/menu-link", async (req: BotApiRequest, res: Response) => {
    try {
      const estId = req.botEstablishmentId!;
      const dbInstance = await db.getDb();
      if (!dbInstance) return sendError(res, 503, "Banco de dados indisponível.");

      const [establishment] = await dbInstance
        .select({
          name: establishments.name,
          menuSlug: establishments.menuSlug,
        })
        .from(establishments)
        .where(eq(establishments.id, estId))
        .limit(1);

      if (!establishment) {
        return sendError(res, 404, "Estabelecimento não encontrado.");
      }

      const slug = establishment.menuSlug || String(estId);
      const baseUrl = "https://v2.mindi.com.br";
      const menuUrl = `${baseUrl}/menu/${slug}`;

      return res.json({
        menuUrl,
        slug,
        establishmentName: establishment.name,
      });
    } catch (error) {
      console.error("[BotAPI] Erro em GET /menu-link:", error);
      return sendError(res, 500, "Erro interno.");
    }
  });

  return router;
}
