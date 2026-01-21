import { Response } from "express";

// Armazena conexões SSE por estabelecimento (para dashboard do restaurante)
// Map<establishmentId, Set<Response>>
const connections = new Map<number, Set<Response>>();

// Armazena conexões SSE por cliente (por telefone) para atualizações de pedidos
// Map<customerPhone, Set<Response>>
const customerConnections = new Map<string, Set<Response>>();

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
  sendEvent(establishmentId, "new_order", order);
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

// ==================== FUNÇÕES PARA CLIENTES (por telefone) ====================

/**
 * Adiciona uma conexão SSE para um cliente (identificado pelo telefone)
 */
export function addCustomerConnection(customerPhone: string, res: Response): void {
  if (!customerConnections.has(customerPhone)) {
    customerConnections.set(customerPhone, new Set());
  }
  customerConnections.get(customerPhone)!.add(res);
  
  console.log(`[SSE-Customer] Nova conexão para cliente ${customerPhone}. Total: ${customerConnections.get(customerPhone)!.size}`);
}

/**
 * Remove uma conexão SSE de um cliente
 */
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

/**
 * Envia um evento SSE para todas as conexões de um cliente
 */
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

/**
 * Notifica o cliente sobre atualização de status do pedido
 */
export function notifyCustomerOrderUpdate(customerPhone: string, order: unknown): void {
  sendCustomerEvent(customerPhone, "order_status_update", order);
}

/**
 * Envia heartbeat para manter a conexão do cliente ativa
 */
export function sendCustomerHeartbeat(customerPhone: string): void {
  sendCustomerEvent(customerPhone, "heartbeat", { timestamp: Date.now() });
}

/**
 * Retorna o número de conexões ativas para um cliente
 */
export function getCustomerConnectionCount(customerPhone: string): number {
  return customerConnections.get(customerPhone)?.size || 0;
}
