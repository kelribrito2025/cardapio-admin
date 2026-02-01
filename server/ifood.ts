/**
 * iFood Integration Module
 * 
 * Este módulo gerencia a integração com a API do iFood:
 * - Autenticação OAuth2 (obter e renovar tokens)
 * - Recebimento de eventos via Webhook
 * - Processamento de pedidos
 * - Sincronização de status
 */

import { ENV } from "./_core/env";

// Constantes da API do iFood
const IFOOD_API_BASE_URL = "https://merchant-api.ifood.com.br";
const IFOOD_AUTH_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";

// Cache do token em memória
let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

/**
 * Obtém um token de acesso do iFood
 * Usa cache em memória para evitar requisições desnecessárias
 */
export async function getIfoodAccessToken(): Promise<string> {
  // Verifica se há token em cache e se ainda é válido (com margem de 5 minutos)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  // Solicita novo token
  const response = await fetch(IFOOD_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grantType: "client_credentials",
      clientId: ENV.ifoodClientId,
      clientSecret: ENV.ifoodClientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter token do iFood: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Armazena em cache
  cachedToken = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + (data.expiresIn * 1000),
  };

  return cachedToken.accessToken;
}

/**
 * Valida as credenciais do iFood tentando obter um token
 */
export async function validateIfoodCredentials(): Promise<{ valid: boolean; error?: string }> {
  try {
    await getIfoodAccessToken();
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Busca detalhes de um pedido do iFood
 */
export async function getIfoodOrderDetails(orderId: string): Promise<any> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao buscar pedido do iFood: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Envia acknowledgment para um evento do iFood
 */
export async function acknowledgeIfoodEvent(eventId: string): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/events/acknowledgment`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ id: eventId }]),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar acknowledgment: ${response.status} - ${errorText}`);
  }
}

/**
 * Confirma um pedido do iFood
 */
export async function confirmIfoodOrder(orderId: string): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/confirm`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao confirmar pedido no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Inicia o preparo de um pedido do iFood
 */
export async function startIfoodOrderPreparation(orderId: string): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/startPreparation`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao iniciar preparo no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Marca pedido como pronto para retirada no iFood
 */
export async function readyToPickupIfoodOrder(orderId: string): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/readyToPickup`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao marcar pronto no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Despacha um pedido do iFood
 */
export async function dispatchIfoodOrder(orderId: string): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/dispatch`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao despachar pedido no iFood: ${response.status} - ${errorText}`);
  }
}

/**
 * Busca motivos de cancelamento disponíveis para um pedido
 */
export async function getIfoodCancellationReasons(orderId: string): Promise<any[]> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/cancellationReasons`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao buscar motivos de cancelamento: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Solicita cancelamento de um pedido do iFood
 */
export async function requestIfoodOrderCancellation(
  orderId: string, 
  cancellationCode: string
): Promise<void> {
  const token = await getIfoodAccessToken();
  
  const response = await fetch(`${IFOOD_API_BASE_URL}/order/v1.0/orders/${orderId}/requestCancellation`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cancellationCode,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao cancelar pedido no iFood: ${response.status} - ${errorText}`);
  }
}

// Tipos para eventos do iFood
export interface IfoodEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId: string;
  createdAt: string;
  salesChannel?: string;
  metadata?: Record<string, any>;
}

// Tipos para pedido do iFood
export interface IfoodOrder {
  id: string;
  displayId: string;
  orderType: "DELIVERY" | "TAKEOUT" | "DINE_IN" | "INDOOR";
  orderTiming: "IMMEDIATE" | "SCHEDULED";
  salesChannel: string;
  createdAt: string;
  preparationStartDateTime?: string;
  merchant: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    documentNumber?: string;
    phone?: {
      number: string;
      localizer?: string;
    };
  };
  items: IfoodOrderItem[];
  total: {
    subTotal: number;
    deliveryFee: number;
    benefits: number;
    orderAmount: number;
    additionalFees: number;
  };
  payments: {
    methods: Array<{
      value: number;
      currency: string;
      method: string;
      type: string;
      prepaid: boolean;
      changeFor?: number;
      card?: {
        brand: string;
      };
    }>;
  };
  delivery?: {
    mode: string;
    deliveredBy: string;
    deliveryAddress?: {
      streetName: string;
      streetNumber: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
      reference?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    observations?: string;
  };
  takeout?: {
    mode: string;
    takeoutDateTime?: string;
  };
  schedule?: {
    deliveryDateTimeStart: string;
    deliveryDateTimeEnd: string;
  };
  extraInfo?: string;
}

export interface IfoodOrderItem {
  id: string;
  uniqueId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
  optionsPrice: number;
  totalPrice: number;
  observations?: string;
  externalCode?: string;
  options?: Array<{
    id: string;
    name: string;
    groupName: string;
    quantity: number;
    unitPrice: number;
    price: number;
  }>;
}


// Import das funções do banco de dados
import * as db from "./db";

// Mapeamento de tipo de pedido iFood para interno
function mapIfoodOrderType(orderType: string): "delivery" | "pickup" | "dine_in" {
  switch (orderType) {
    case "DELIVERY":
      return "delivery";
    case "TAKEOUT":
      return "pickup";
    case "DINE_IN":
    case "INDOOR":
      return "dine_in";
    default:
      return "delivery";
  }
}

// Mapeamento de método de pagamento iFood para interno
function mapIfoodPaymentMethod(methods: any[]): "cash" | "card" | "pix" | "boleto" {
  if (!methods || methods.length === 0) return "card";
  
  const method = methods[0].method?.toUpperCase() || "";
  
  if (method.includes("CASH") || method.includes("DINHEIRO")) return "cash";
  if (method.includes("PIX")) return "pix";
  if (method.includes("BOLETO")) return "boleto";
  return "card";
}

// Converter pedido iFood para formato interno
async function convertIfoodOrderToInternal(ifoodOrder: IfoodOrder, establishmentId: number) {
  // Montar endereço
  let customerAddress = "";
  if (ifoodOrder.delivery?.deliveryAddress) {
    const addr = ifoodOrder.delivery.deliveryAddress;
    customerAddress = `${addr.streetName}, ${addr.streetNumber}`;
    if (addr.complement) customerAddress += ` - ${addr.complement}`;
    customerAddress += ` - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
    if (addr.postalCode) customerAddress += ` - CEP: ${addr.postalCode}`;
    if (addr.reference) customerAddress += ` (Ref: ${addr.reference})`;
  }

  // Gerar número do pedido
  const orderNumber = `IF${ifoodOrder.displayId || ifoodOrder.id.substring(0, 8).toUpperCase()}`;

  // Converter itens
  const items = ifoodOrder.items.map(item => ({
    productId: 0, // Produto externo, não mapeado
    productName: item.name,
    quantity: item.quantity,
    unitPrice: (item.unitPrice / 100).toFixed(2), // iFood envia em centavos
    totalPrice: (item.totalPrice / 100).toFixed(2),
    complements: item.options?.map(opt => ({
      name: `${opt.groupName}: ${opt.name}`,
      price: opt.price / 100,
      quantity: opt.quantity
    })) || [],
    notes: item.observations || null
  }));

  return {
    establishmentId,
    orderNumber,
    customerName: ifoodOrder.customer?.name || "Cliente iFood",
    customerPhone: ifoodOrder.customer?.phone?.number || null,
    customerAddress,
    status: "new" as const,
    deliveryType: mapIfoodOrderType(ifoodOrder.orderType),
    paymentMethod: mapIfoodPaymentMethod(ifoodOrder.payments?.methods || []),
    subtotal: (ifoodOrder.total.subTotal / 100).toFixed(2),
    deliveryFee: (ifoodOrder.total.deliveryFee / 100).toFixed(2),
    discount: (ifoodOrder.total.benefits / 100).toFixed(2),
    total: (ifoodOrder.total.orderAmount / 100).toFixed(2),
    notes: ifoodOrder.extraInfo || ifoodOrder.delivery?.observations || null,
    changeAmount: ifoodOrder.payments?.methods?.[0]?.changeFor 
      ? (ifoodOrder.payments.methods[0].changeFor / 100).toFixed(2) 
      : null,
    source: "ifood" as const,
    externalId: ifoodOrder.id,
    externalDisplayId: ifoodOrder.displayId,
    externalStatus: "PLACED",
    externalData: ifoodOrder as unknown as Record<string, unknown>,
    items
  };
}

/**
 * Processa um evento de webhook do iFood
 * Esta função é chamada pelo endpoint de webhook
 */
export async function processIfoodWebhookEvent(event: IfoodEvent): Promise<void> {
  console.log(`[iFood Webhook] Processando evento: ${event.code} - Pedido: ${event.orderId}`);
  
  try {
    // Processar diferentes tipos de eventos
    switch (event.code) {
      case "PLC": // Pedido colocado (novo pedido)
        // Buscar detalhes do pedido
        const orderDetails = await getIfoodOrderDetails(event.orderId);
        
        // TODO: Identificar o establishmentId correto baseado no merchantId
        // Por enquanto, buscar o primeiro estabelecimento que tem integração iFood
        // Em produção, deve haver uma tabela de mapeamento merchantId -> establishmentId
        const establishmentId = 30001; // Placeholder - deve ser configurável
        
        // Converter e salvar pedido
        const orderData = await convertIfoodOrderToInternal(orderDetails, establishmentId);
        const newOrder = await db.createOrderFromIfood(orderData);
        
        if (newOrder) {
          console.log(`[iFood Webhook] Novo pedido criado: ${newOrder.id} - ${newOrder.orderNumber}`);
        }
        break;
        
      case "CFM": // Pedido confirmado
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CONFIRMED");
        console.log(`[iFood Webhook] Pedido ${event.orderId} confirmado`);
        break;
        
      case "CAN": // Pedido cancelado
        await db.updateOrderStatusByExternalId(event.orderId, "cancelled");
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CANCELLED");
        console.log(`[iFood Webhook] Pedido ${event.orderId} cancelado`);
        break;
        
      case "DSP": // Pedido despachado
        await db.updateOrderExternalStatusByExternalId(event.orderId, "DISPATCHED");
        console.log(`[iFood Webhook] Pedido ${event.orderId} despachado`);
        break;
        
      case "CON": // Pedido concluído
        await db.updateOrderStatusByExternalId(event.orderId, "completed");
        await db.updateOrderExternalStatusByExternalId(event.orderId, "CONCLUDED");
        console.log(`[iFood Webhook] Pedido ${event.orderId} concluído`);
        break;
        
      case "RTP": // Pronto para retirada
        await db.updateOrderStatusByExternalId(event.orderId, "ready");
        await db.updateOrderExternalStatusByExternalId(event.orderId, "READY_TO_PICKUP");
        console.log(`[iFood Webhook] Pedido ${event.orderId} pronto para retirada`);
        break;
        
      default:
        console.log(`[iFood Webhook] Evento não tratado: ${event.code}`);
    }
    
    // Enviar acknowledgment para o iFood
    try {
      await acknowledgeIfoodEvent(event.id);
      console.log(`[iFood Webhook] Acknowledgment enviado para evento ${event.id}`);
    } catch (ackError) {
      console.error(`[iFood Webhook] Erro ao enviar acknowledgment:`, ackError);
    }
    
  } catch (error) {
    console.error(`[iFood Webhook] Erro ao processar evento ${event.code}:`, error);
    throw error;
  }
}
