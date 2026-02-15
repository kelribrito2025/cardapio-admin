import { getScheduledOrdersToMove, moveScheduledOrderToQueue } from "./db";

let jobInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Processa pedidos agendados que precisam ser movidos para a fila principal.
 * Verifica todos os estabelecimentos com agendamento habilitado e move pedidos
 * cujo horário agendado está dentro do intervalo configurado (schedulingMoveMinutes).
 * 
 * Roda a cada 60 segundos.
 */
async function processScheduledOrders() {
  try {
    const ordersToMove = await getScheduledOrdersToMove();
    
    if (ordersToMove.length === 0) return;
    
    console.log(`[ScheduledOrders] Movendo ${ordersToMove.length} pedido(s) agendado(s) para a fila...`);
    
    for (const { order, establishmentId } of ordersToMove) {
      try {
        await moveScheduledOrderToQueue(order.id);
        
        const scheduledTime = order.scheduledAt 
          ? new Date(order.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "??:??";
        
        console.log(
          `[ScheduledOrders] Pedido #${order.orderNumber} (est. ${establishmentId}) ` +
          `movido para fila. Agendado para: ${scheduledTime}`
        );
      } catch (error) {
        console.error(
          `[ScheduledOrders] Erro ao mover pedido #${order.orderNumber} (ID: ${order.id}):`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[ScheduledOrders] Erro no job de processamento:", error);
  }
}

/**
 * Inicia o job de processamento de pedidos agendados.
 * Verifica a cada 60 segundos se há pedidos que precisam ser movidos para a fila.
 */
export function startScheduledOrdersJob() {
  if (jobInterval) {
    console.log("[ScheduledOrders] Job já está rodando");
    return;
  }
  
  console.log("[ScheduledOrders] Iniciando job de processamento (intervalo: 60s)");
  
  // Processar imediatamente ao iniciar
  processScheduledOrders();
  
  // Depois a cada 60 segundos
  jobInterval = setInterval(processScheduledOrders, 60 * 1000);
}

export function stopScheduledOrdersJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log("[ScheduledOrders] Job parado");
  }
}
