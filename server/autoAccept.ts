/**
 * Auto-Accept Orders Module
 * 
 * Gerencia o aceite automático de pedidos com timer server-side.
 * Quando habilitado, pedidos com status "new" são automaticamente aceitos
 * (status -> "preparing") após o tempo configurado (10s ou 15s).
 * 
 * O timer é calculado com base no createdAt do pedido, garantindo
 * persistência mesmo se o usuário navegar para outra página ou fechar o browser.
 */

import { getPrinterSettings, getOrdersByEstablishment, updateOrderStatus, getEstablishmentById } from "./db";
import { notifyOrderUpdate } from "./_core/sse";

// Intervalo do loop de verificação (a cada 2 segundos)
const CHECK_INTERVAL_MS = 2000;

// Map para rastrear quais pedidos já foram auto-aceitos (evitar duplicatas)
const autoAcceptedOrders = new Set<number>();

// Map para rastrear quais estabelecimentos têm auto-accept habilitado (cache)
const autoAcceptCache = new Map<number, { enabled: boolean; timerSeconds: number; lastCheck: number }>();

// Cache TTL: 30 segundos
const CACHE_TTL_MS = 30000;

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Busca as configurações de auto-aceite de um estabelecimento (com cache)
 */
async function getAutoAcceptConfig(establishmentId: number): Promise<{ enabled: boolean; timerSeconds: number }> {
  const cached = autoAcceptCache.get(establishmentId);
  const now = Date.now();
  
  if (cached && (now - cached.lastCheck) < CACHE_TTL_MS) {
    return { enabled: cached.enabled, timerSeconds: cached.timerSeconds };
  }
  
  try {
    const settings = await getPrinterSettings(establishmentId);
    const config = {
      enabled: settings?.autoAcceptEnabled ?? false,
      timerSeconds: settings?.autoAcceptTimerSeconds ?? 10,
    };
    
    autoAcceptCache.set(establishmentId, {
      ...config,
      lastCheck: now,
    });
    
    return config;
  } catch (error) {
    console.error(`[AutoAccept] Erro ao buscar config do estabelecimento ${establishmentId}:`, error);
    return { enabled: false, timerSeconds: 10 };
  }
}

/**
 * Invalida o cache de um estabelecimento (chamado quando as configurações mudam)
 */
export function invalidateAutoAcceptCache(establishmentId: number): void {
  autoAcceptCache.delete(establishmentId);
}

/**
 * Verifica e auto-aceita pedidos pendentes para todos os estabelecimentos ativos
 */
async function checkAndAutoAcceptOrders(): Promise<void> {
  try {
    // Buscar todos os estabelecimentos que têm pedidos "new"
    // Para otimizar, vamos iterar sobre os estabelecimentos no cache
    // e também verificar novos que possam ter sido adicionados
    
    // Importar a função para buscar todos os estabelecimentos com pedidos novos
    const { getEstablishmentsWithNewOrders } = await import("./db");
    
    let establishmentIds: number[];
    try {
      establishmentIds = await getEstablishmentsWithNewOrders();
    } catch {
      // Se a função não existir ainda, retornar silenciosamente
      return;
    }
    
    for (const establishmentId of establishmentIds) {
      const config = await getAutoAcceptConfig(establishmentId);
      
      if (!config.enabled) continue;
      
      // Buscar pedidos "new" deste estabelecimento
      const newOrders = await getOrdersByEstablishment(establishmentId, "new");
      
      for (const order of newOrders) {
        // Pular se já foi auto-aceito
        if (autoAcceptedOrders.has(order.id)) continue;
        
        // Calcular tempo desde a criação do pedido
        const createdAt = new Date(order.createdAt).getTime();
        const now = Date.now();
        const elapsedSeconds = (now - createdAt) / 1000;
        
        // Se o tempo configurado já passou, auto-aceitar
        if (elapsedSeconds >= config.timerSeconds) {
          try {
            console.log(`[AutoAccept] Auto-aceitando pedido #${order.orderNumber} (${order.id}) do estabelecimento ${establishmentId} após ${Math.round(elapsedSeconds)}s`);
            
            // Marcar como auto-aceito antes de processar (evitar duplicatas)
            autoAcceptedOrders.add(order.id);
            
            // Atualizar status para "preparing"
            await updateOrderStatus(order.id, "preparing");
            
            // Notificar via SSE que o pedido foi auto-aceito
            notifyOrderUpdate(establishmentId, {
              id: order.id,
              status: "preparing",
              updatedAt: new Date(),
              autoAccepted: true,
            });
            
            console.log(`[AutoAccept] Pedido #${order.orderNumber} auto-aceito com sucesso`);
          } catch (error) {
            console.error(`[AutoAccept] Erro ao auto-aceitar pedido ${order.id}:`, error);
            // Remover do set para tentar novamente
            autoAcceptedOrders.delete(order.id);
          }
        }
      }
    }
    
    // Limpar pedidos antigos do set (mais de 1 hora)
    // Para evitar memory leak
    if (autoAcceptedOrders.size > 1000) {
      autoAcceptedOrders.clear();
    }
    
  } catch (error) {
    console.error("[AutoAccept] Erro no loop de verificação:", error);
  }
}

/**
 * Inicia o loop de verificação de auto-aceite
 */
export function startAutoAcceptLoop(): void {
  if (intervalId) {
    console.log("[AutoAccept] Loop já está rodando");
    return;
  }
  
  console.log(`[AutoAccept] Iniciando loop de verificação (intervalo: ${CHECK_INTERVAL_MS}ms)`);
  intervalId = setInterval(checkAndAutoAcceptOrders, CHECK_INTERVAL_MS);
}

/**
 * Para o loop de verificação
 */
export function stopAutoAcceptLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[AutoAccept] Loop de verificação parado");
  }
}
