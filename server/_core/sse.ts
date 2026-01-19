import { Response } from "express";

// Armazena conexões SSE por estabelecimento
// Map<establishmentId, Set<Response>>
const connections = new Map<number, Set<Response>>();

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
