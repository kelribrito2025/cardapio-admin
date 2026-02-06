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

import { getPrinterSettings, getOrdersByEstablishment, updateOrderStatus, getEstablishmentById, getActivePrinters, getOrderById, getOrderItems } from "./db";
import { notifyOrderUpdate, getConnectionCount } from "./_core/sse";

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
 * Imprime um pedido diretamente via rede (ESC/POS socket TCP)
 * Sem depender do navegador ou app Multi Printer
 */
async function printOrderServerSide(orderId: number, establishmentId: number): Promise<void> {
  try {
    // Buscar impressoras ativas
    const activePrinters = await getActivePrinters(establishmentId);
    
    if (activePrinters.length === 0) {
      // Verificar se tem impressão direta configurada (configuração antiga)
      const settings = await getPrinterSettings(establishmentId);
      if (!(settings as any)?.directPrintEnabled || !(settings as any)?.directPrintIp) {
        console.log(`[AutoAccept:Print] Nenhuma impressora configurada para estabelecimento ${establishmentId}`);
        return;
      }
      
      // Usar impressão direta única
      const { printOrderDirect } = await import('./escposPrinter');
      const orderData = await buildOrderData(orderId, establishmentId);
      if (!orderData) return;
      
      const result = await printOrderDirect(
        { ip: (settings as any).directPrintIp, port: (settings as any).directPrintPort || 9100 },
        orderData
      );
      
      console.log(`[AutoAccept:Print] Impressão direta: ${result.success ? 'OK' : result.message}`);
      return;
    }
    
    // Imprimir em todas as impressoras ativas
    const { printOrderToMultiplePrinters } = await import('./escposPrinter');
    const orderData = await buildOrderData(orderId, establishmentId);
    if (!orderData) return;
    
    const printerConfigs = activePrinters.map(p => ({
      ip: p.ipAddress,
      port: p.port || 9100,
    }));
    
    const result = await printOrderToMultiplePrinters(printerConfigs, orderData);
    
    console.log(`[AutoAccept:Print] Impressão em ${activePrinters.length} impressora(s):`,
      result.results.map(r => `${r.ip}: ${r.success ? 'OK' : r.message}`).join(', '));
  } catch (error) {
    console.error(`[AutoAccept:Print] Erro ao imprimir pedido ${orderId}:`, error);
  }
}

/**
 * Monta os dados do pedido no formato esperado pelo ESC/POS printer
 */
async function buildOrderData(orderId: number, establishmentId: number) {
  const order = await getOrderById(orderId);
  if (!order) {
    console.error(`[AutoAccept:Print] Pedido ${orderId} não encontrado`);
    return null;
  }
  
  const items = await getOrderItems(orderId);
  const establishment = await getEstablishmentById(establishmentId);
  
  // Extrair bairro do endereço se disponível
  const addressParts = order.customerAddress?.split(',') || [];
  const neighborhoodFromAddress = addressParts.length > 1 ? addressParts[addressParts.length - 1]?.trim() : undefined;
  
  return {
    orderId: order.id,
    orderNumber: parseInt(order.orderNumber) || 0,
    customerName: order.customerName || 'Não informado',
    customerPhone: order.customerPhone || undefined,
    deliveryType: (order.deliveryType || 'delivery') as 'delivery' | 'pickup' | 'table',
    address: order.customerAddress || undefined,
    neighborhood: neighborhoodFromAddress,
    paymentMethod: order.paymentMethod || 'Dinheiro',
    items: items.map(item => ({
      name: item.productName,
      quantity: item.quantity ?? 1,
      price: parseFloat(item.totalPrice) / (item.quantity ?? 1),
      observation: item.notes || undefined,
      complements: typeof item.complements === 'string' ? item.complements : undefined,
    })),
    subtotal: parseFloat(order.subtotal || '0'),
    deliveryFee: parseFloat(order.deliveryFee || '0'),
    discount: parseFloat(order.discount || '0'),
    total: parseFloat(order.total),
    observation: order.notes || undefined,
    createdAt: new Date(order.createdAt),
    establishmentName: establishment?.name || 'Estabelecimento',
  };
}

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
      
      // Verificar se há conexões SSE ativas (frontend aberto)
      const hasActiveConnections = getConnectionCount(establishmentId) > 0;
      
      for (const order of newOrders) {
        // Pular se já foi auto-aceito
        if (autoAcceptedOrders.has(order.id)) continue;
        
        // Calcular tempo desde a criação do pedido
        const createdAt = new Date(order.createdAt).getTime();
        const now = Date.now();
        const elapsedSeconds = (now - createdAt) / 1000;
        
        // Se há frontend conectado, o frontend cuida do countdown visual e do aceite.
        // O servidor só aceita como fallback se:
        // 1) Não há frontend conectado (SSE offline), OU
        // 2) O pedido já passou do DOBRO do timer (fallback de segurança caso frontend falhe)
        const effectiveTimer = hasActiveConnections 
          ? config.timerSeconds * 2 + 10  // Dar tempo extra quando frontend está ativo (timer*2 + 10s de margem)
          : config.timerSeconds;            // Sem frontend, usar timer normal
        
        // Se o tempo configurado já passou, auto-aceitar
        if (elapsedSeconds >= effectiveTimer) {
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
            
            // ====== IMPRESSÃO DIRETA VIA REDE (ESC/POS) ======
            // Imprimir automaticamente sem depender do frontend/app Multi Printer
            try {
              await printOrderServerSide(order.id, establishmentId);
            } catch (printError) {
              console.error(`[AutoAccept] Erro na impressão do pedido #${order.orderNumber}:`, printError);
              // Não falhar o auto-aceite por causa de erro de impressão
            }
            
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
