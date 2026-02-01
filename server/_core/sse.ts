import { Response } from "express";

// Armazena conexões SSE por estabelecimento (para dashboard do restaurante)
// Map<establishmentId, Set<Response>>
const connections = new Map<number, Set<Response>>();

// Armazena conexões SSE por orderNumber (para clientes acompanharem pedidos)
// Map<orderNumber, Set<Response>>
const orderConnections = new Map<string, Set<Response>>();

/**
 * Adiciona uma conexão SSE para um estabelecimento
 */
export function addConnection(establishmentId: number, res: Response): void {
  if (!connections.has(establishmentId)) {
    connections.set(establishmentId, new Set());
  }
  connections.get(establishmentId)!.add(res);
  
  console.log(`[SSE] Nova conexão para estabelecimento ${establishmentId}. Total: ${connections.get(establishmentId)!.size}`);
}

/**
 * Remove uma conexão SSE
 */
export function removeConnection(establishmentId: number, res: Response): void {
  const establishmentConnections = connections.get(establishmentId);
  if (establishmentConnections) {
    establishmentConnections.delete(res);
    console.log(`[SSE] Conexão removida do estabelecimento ${establishmentId}. Restantes: ${establishmentConnections.size}`);
    
    if (establishmentConnections.size === 0) {
      connections.delete(establishmentId);
    }
  }
}

/**
 * Envia um evento SSE para todas as conexões de um estabelecimento
 */
export function sendEvent(establishmentId: number, eventType: string, data: unknown): void {
  const establishmentConnections = connections.get(establishmentId);
  if (!establishmentConnections || establishmentConnections.size === 0) {
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  console.log(`[SSE] Enviando evento '${eventType}' para ${establishmentConnections.size} conexão(ões) do estabelecimento ${establishmentId}`);
  
  establishmentConnections.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      console.error(`[SSE] Erro ao enviar evento:`, error);
      removeConnection(establishmentId, res);
    }
  });
}

/**
 * Envia evento de novo pedido
 */
export function notifyNewOrder(establishmentId: number, order: unknown): void {
  console.log(`[SSE] notifyNewOrder chamado para establishmentId: ${establishmentId}`);
  console.log(`[SSE] Conexões ativas para este estabelecimento: ${connections.get(establishmentId)?.size || 0}`);
  // Log para debug do source do pedido
  const orderData = order as { source?: string };
  console.log(`[SSE] Source do pedido: ${orderData?.source || 'não definido'}`);
  sendEvent(establishmentId, "new_order", order);
}

/**
 * Envia evento para imprimir pedido (usado pelo Print Server Local)
 */
export function notifyPrintOrder(establishmentId: number, orderData: {
  orderId: number;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  notes: string | null;
  changeAmount: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements: Array<{ name: string; price: number }> | null;
    notes: string | null;
  }>;
  createdAt: Date;
}): void {
  console.log(`[SSE] notifyPrintOrder chamado para establishmentId: ${establishmentId}, pedido: ${orderData.orderNumber}`);
  sendEvent(establishmentId, "print_order", orderData);
}

/**
 * Envia evento de atualização de status do pedido
 */
export function notifyOrderUpdate(establishmentId: number, order: unknown): void {
  sendEvent(establishmentId, "order_update", order);
}

/**
 * Envia heartbeat para manter a conexão ativa
 */
export function sendHeartbeat(establishmentId: number): void {
  sendEvent(establishmentId, "heartbeat", { timestamp: Date.now() });
}

/**
 * Retorna o número de conexões ativas para um estabelecimento
 */
export function getConnectionCount(establishmentId: number): number {
  return connections.get(establishmentId)?.size || 0;
}

/**
 * Retorna o número total de conexões ativas
 */
export function getTotalConnections(): number {
  let total = 0;
  connections.forEach((set) => {
    total += set.size;
  });
  return total;
}

// ==================== FUNÇÕES PARA PEDIDOS (por orderNumber) ====================

/**
 * Adiciona uma conexão SSE para um pedido (identificado pelo orderNumber)
 */
export function addOrderConnection(orderNumber: string, res: Response): void {
  if (!orderConnections.has(orderNumber)) {
    orderConnections.set(orderNumber, new Set());
  }
  orderConnections.get(orderNumber)!.add(res);
  
  console.log(`[SSE-Order] Nova conexão para pedido ${orderNumber}. Total: ${orderConnections.get(orderNumber)!.size}`);
}

/**
 * Adiciona uma conexão SSE para múltiplos pedidos
 */
export function addOrderConnectionForMultiple(orderNumbers: string[], res: Response): void {
  orderNumbers.forEach(orderNumber => {
    if (!orderConnections.has(orderNumber)) {
      orderConnections.set(orderNumber, new Set());
    }
    orderConnections.get(orderNumber)!.add(res);
  });
  
  console.log(`[SSE-Order] Nova conexão para ${orderNumbers.length} pedidos: ${orderNumbers.join(', ')}`);
}

/**
 * Remove uma conexão SSE de um pedido
 */
export function removeOrderConnection(orderNumber: string, res: Response): void {
  const pedidoConnections = orderConnections.get(orderNumber);
  if (pedidoConnections) {
    pedidoConnections.delete(res);
    console.log(`[SSE-Order] Conexão removida do pedido ${orderNumber}. Restantes: ${pedidoConnections.size}`);
    
    if (pedidoConnections.size === 0) {
      orderConnections.delete(orderNumber);
    }
  }
}

/**
 * Remove uma conexão SSE de múltiplos pedidos
 */
export function removeOrderConnectionFromMultiple(orderNumbers: string[], res: Response): void {
  orderNumbers.forEach(orderNumber => {
    removeOrderConnection(orderNumber, res);
  });
  console.log(`[SSE-Order] Conexão removida de ${orderNumbers.length} pedidos`);
}

/**
 * Envia um evento SSE para todas as conexões de um pedido
 */
export function sendOrderEvent(orderNumber: string, eventType: string, data: unknown): void {
  const pedidoConnections = orderConnections.get(orderNumber);
  if (!pedidoConnections || pedidoConnections.size === 0) {
    console.log(`[SSE-Order] Nenhuma conexão ativa para pedido ${orderNumber}`);
    return;
  }
  
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  
  console.log(`[SSE-Order] Enviando evento '${eventType}' para ${pedidoConnections.size} conexão(ões) do pedido ${orderNumber}`);
  
  pedidoConnections.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      console.error(`[SSE-Order] Erro ao enviar evento:`, error);
      removeOrderConnection(orderNumber, res);
    }
  });
}

/**
 * Notifica sobre atualização de status do pedido
 */
export function notifyOrderStatusUpdate(orderNumber: string, data: {
  id: number;
  orderNumber: string;
  status: string;
  updatedAt: Date;
  cancellationReason?: string | null;
}): void {
  console.log(`[SSE-Order] notifyOrderStatusUpdate chamado para orderNumber: ${orderNumber}, novo status: ${data.status}`);
  console.log(`[SSE-Order] Conexões ativas para este pedido: ${orderConnections.get(orderNumber)?.size || 0}`);
  sendOrderEvent(orderNumber, "order_status_update", data);
}

/**
 * Envia heartbeat para manter a conexão do pedido ativa
 */
export function sendOrderHeartbeat(orderNumber: string): void {
  sendOrderEvent(orderNumber, "heartbeat", { timestamp: Date.now() });
}

/**
 * Envia heartbeat para todas as conexões de pedidos
 */
export function sendAllOrdersHeartbeat(): void {
  orderConnections.forEach((_, orderNumber) => {
    sendOrderHeartbeat(orderNumber);
  });
}

/**
 * Retorna o número de conexões ativas para um pedido
 */
export function getOrderConnectionCount(orderNumber: string): number {
  return orderConnections.get(orderNumber)?.size || 0;
}

/**
 * Retorna o número total de conexões de pedidos ativas
 */
export function getTotalOrderConnections(): number {
  let total = 0;
  orderConnections.forEach((set) => {
    total += set.size;
  });
  return total;
}

// ==================== FUNÇÕES LEGADAS (mantidas para compatibilidade) ====================
// Estas funções são mantidas para não quebrar código existente, mas devem ser migradas

// Armazena conexões SSE por cliente (por telefone) - LEGADO
const customerConnections = new Map<string, Set<Response>>();

export function addCustomerConnection(customerPhone: string, res: Response): void {
  if (!customerConnections.has(customerPhone)) {
    customerConnections.set(customerPhone, new Set());
  }
  customerConnections.get(customerPhone)!.add(res);
  console.log(`[SSE-Customer] Nova conexão para cliente ${customerPhone}. Total: ${customerConnections.get(customerPhone)!.size}`);
}

export function removeCustomerConnection(customerPhone: string, res: Response): void {
  const clientConnections = customerConnections.get(customerPhone);
  if (clientConnections) {
    clientConnections.delete(res);
    console.log(`[SSE-Customer] Conexão removida do cliente ${customerPhone}. Restantes: ${clientConnections.size}`);
    if (clientConnections.size === 0) {
      customerConnections.delete(customerPhone);
    }
  }
}

export function sendCustomerEvent(customerPhone: string, eventType: string, data: unknown): void {
  const clientConnections = customerConnections.get(customerPhone);
  if (!clientConnections || clientConnections.size === 0) {
    return;
  }
  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
  console.log(`[SSE-Customer] Enviando evento '${eventType}' para ${clientConnections.size} conexão(ões) do cliente ${customerPhone}`);
  clientConnections.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      console.error(`[SSE-Customer] Erro ao enviar evento:`, error);
      removeCustomerConnection(customerPhone, res);
    }
  });
}

export function notifyCustomerOrderUpdate(customerPhone: string, order: unknown): void {
  sendCustomerEvent(customerPhone, "order_status_update", order);
}

export function sendCustomerHeartbeat(customerPhone: string): void {
  sendCustomerEvent(customerPhone, "heartbeat", { timestamp: Date.now() });
}

export function getCustomerConnectionCount(customerPhone: string): number {
  return customerConnections.get(customerPhone)?.size || 0;
}
