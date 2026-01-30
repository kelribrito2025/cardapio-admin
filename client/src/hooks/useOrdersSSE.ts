import { useEffect, useRef, useCallback, useState } from "react";

// ============================================
// SSE MANAGER - SINGLETON COM LÍDER/SEGUIDOR
// Garante apenas 1 conexão SSE por navegador
// ============================================

type SSEStatus = "connecting" | "connected" | "disconnected" | "error";

interface SSEOrder {
  id: number;
  orderNumber: string;
  establishmentId: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee?: string;
  total: string;
  notes?: string | null;
  changeAmount?: string | null;
  status: string;
  createdAt: Date | string;
  items?: Array<{
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    complements?: unknown[];
    notes?: string | null;
  }>;
}

interface SSEOrderUpdate {
  id: number;
  status: string;
  updatedAt: Date | string;
}

// Gerar ID único para esta aba
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Estado global do SSE Manager
let eventSource: EventSource | null = null;
let isLeader = false;
let bc: BroadcastChannel | null = null;
let currentEstablishmentId: number | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let leaderCheckTimeout: NodeJS.Timeout | null = null;
let status: SSEStatus = "disconnected";

const MAX_RECONNECT_ATTEMPTS = 5;
// Backoff exponencial: 1s, 2s, 5s, 10s, 20s
const BACKOFF_DELAYS = [1000, 2000, 5000, 10000, 20000];

// Callbacks registrados pelos componentes
const callbacks: Set<{
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  setStatus: (status: SSEStatus) => void;
}> = new Set();

function notifyAll(event: "newOrder" | "orderUpdate" | "connected" | "disconnected" | "error" | "status", data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[SSE-NotifyAll] [${timestamp}] Notificando ${callbacks.size} listeners sobre evento: ${event}`);
  console.log(`[SSE-NotifyAll] [${timestamp}] Dados do evento:`, data ? JSON.stringify(data).substring(0, 200) : 'undefined');
  
  // Verificar se estamos em Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  console.log(`[SSE-NotifyAll] [${timestamp}] Plataforma: ${isAndroid ? 'Android' : 'Outro'}`);
  
  callbacks.forEach((cb, index) => {
    switch (event) {
      case "newOrder":
        console.log(`[SSE-NotifyAll] [${timestamp}] Chamando onNewOrder do listener`, cb.onNewOrder ? 'existe' : 'não existe');
        try {
          cb.onNewOrder?.(data as SSEOrder);
          console.log(`[SSE-NotifyAll] [${timestamp}] onNewOrder executado com sucesso`);
        } catch (e) {
          console.error(`[SSE-NotifyAll] [${timestamp}] Erro ao executar onNewOrder:`, e);
        }
        break;
      case "orderUpdate":
        cb.onOrderUpdate?.(data as SSEOrderUpdate);
        break;
      case "connected":
        cb.onConnected?.();
        cb.setStatus("connected");
        break;
      case "disconnected":
        cb.onDisconnected?.();
        cb.setStatus("disconnected");
        break;
      case "error":
        cb.onError?.(data as Event);
        cb.setStatus("error");
        break;
      case "status":
        cb.setStatus(data as SSEStatus);
        break;
    }
  });
}

function initBroadcastChannel(establishmentId: number) {
  if (bc) return; // Já inicializado

  const isAndroid = /Android/i.test(navigator.userAgent);
  console.log(`[SSE-Tab] Aba aberta: ${TAB_ID}`);
  console.log(`[SSE-Tab] Plataforma: ${isAndroid ? 'Android' : 'Outro'}`);
  
  // Verificar se BroadcastChannel é suportado
  if (typeof BroadcastChannel === 'undefined') {
    console.log('[SSE-Tab] BroadcastChannel não suportado - assumindo liderança diretamente');
    becomeLeader(establishmentId);
    return;
  }
  
  try {
    bc = new BroadcastChannel("mindi-orders-channel");
  } catch (e) {
    console.error('[SSE-Tab] Erro ao criar BroadcastChannel:', e);
    // Fallback: assumir liderança diretamente
    becomeLeader(establishmentId);
    return;
  }
  
  currentEstablishmentId = establishmentId;

  bc.onmessage = (msg) => {
    const data = msg.data;
    console.log("[SSE-BC] Recebido broadcast:", data.type);

    switch (data.type) {
      case "who-is-leader":
        // Outra aba perguntando quem é líder
        if (isLeader) {
          bc?.postMessage({ type: "leader-exists", tabId: TAB_ID });
        }
        break;

      case "leader-exists":
        // Já existe um líder, não precisamos ser
        if (data.tabId !== TAB_ID) {
          console.log(`[SSE-Tab] Líder atual: ${data.tabId} (não sou eu)`);
          isLeader = false;
          // Cancelar qualquer tentativa de se tornar líder
          if (leaderCheckTimeout) {
            clearTimeout(leaderCheckTimeout);
            leaderCheckTimeout = null;
          }
          // Fechar nossa conexão SSE se tivermos uma
          if (eventSource) {
            console.log("[SSE-Tab] Fechando conexão SSE pois outro é líder");
            eventSource.close();
            eventSource = null;
          }
        }
        break;

      case "order-update":
        // Evento de atualização de pedido do líder
        if (!isLeader && data.payload) {
          console.log("[SSE-Orders] Evento recebido via broadcast:", data.payload.id || data.payload.orderNumber, "status:", data.payload.status);
          if (data.payload.orderNumber) {
            notifyAll("newOrder", data.payload);
          } else {
            notifyAll("orderUpdate", data.payload);
          }
        }
        break;

      case "status-update":
        // Atualização de status do líder
        if (!isLeader) {
          status = data.status;
          notifyAll("status", data.status);
          if (data.status === "connected") {
            notifyAll("connected");
          } else if (data.status === "disconnected") {
            notifyAll("disconnected");
          }
        }
        break;

      case "leader-closed":
        // Líder fechou, precisamos eleger novo
        if (!isLeader) {
          console.log("[SSE-Tab] Líder fechou, tentando assumir...");
          tryBecomeLeader(establishmentId);
        }
        break;
    }
  };

  // Perguntar se existe líder
  bc.postMessage({ type: "who-is-leader" });

  // Aguardar 1s para ver se alguém responde
  leaderCheckTimeout = setTimeout(() => {
    if (!isLeader && !eventSource) {
      console.log("[SSE-Tab] Nenhum líder respondeu, assumindo liderança...");
      becomeLeader(establishmentId);
    }
  }, 1000);
}

function tryBecomeLeader(establishmentId: number) {
  // Aguardar um tempo aleatório para evitar race condition
  const delay = Math.random() * 500 + 500; // 500-1000ms
  
  leaderCheckTimeout = setTimeout(() => {
    if (!isLeader && !eventSource) {
      becomeLeader(establishmentId);
    }
  }, delay);
}

function becomeLeader(establishmentId: number) {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const timestamp = new Date().toISOString();
  
  console.log(`[SSE-Leader] [${timestamp}] ========== INICIANDO LIDERANÇA ==========`);
  console.log(`[SSE-Leader] [${timestamp}] Plataforma: ${isAndroid ? 'Android' : 'Outro'}`);
  console.log(`[SSE-Leader] [${timestamp}] EstablishmentId: ${establishmentId}`);
  
  // Verificar se já existe conexão SSE (previne múltiplas conexões)
  if (eventSource) {
    console.log(`[SSE-Leader] [${timestamp}] Conexão já existe, não criando outra`);
    return;
  }

  isLeader = true;
  console.log(`[SSE-Tab] [${timestamp}] Líder atual: ${TAB_ID} (sou eu)`);
  
  // Anunciar que somos o líder
  bc?.postMessage({ type: "leader-exists", tabId: TAB_ID });

  console.log(`[SSE-Leader] [${timestamp}] Criando conexão SSE...`);
  
  status = "connecting";
  notifyAll("status", "connecting");
  bc?.postMessage({ type: "status-update", status: "connecting" });

  try {
    eventSource = new EventSource("/api/orders/stream", {
      withCredentials: true,
    });
    console.log(`[SSE-Leader] [${timestamp}] EventSource criado com sucesso`);
  } catch (e) {
    console.error(`[SSE-Leader] [${timestamp}] Erro ao criar EventSource:`, e);
    return;
  }

  eventSource.onopen = () => {
    const openTimestamp = new Date().toISOString();
    console.log(`[SSE-Leader] [${openTimestamp}] Conexão estabelecida.`);
    console.log(`[SSE-Leader] [${openTimestamp}] Plataforma: ${isAndroid ? 'Android' : 'Outro'}`);
    status = "connected";
    reconnectAttempts = 0;
    notifyAll("connected");
    bc?.postMessage({ type: "status-update", status: "connected" });
  };

  eventSource.onerror = (event) => {
    const readyState = eventSource?.readyState;
    console.warn("[SSE-Leader] Erro na conexão – readyState:", readyState);

    if (readyState === EventSource.CLOSED) {
      status = "error";
      notifyAll("error", event);
      bc?.postMessage({ type: "status-update", status: "error" });

      eventSource?.close();
      eventSource = null;

      // Verificar se é erro de rate limit (429)
      // O servidor retorna "Rate exceeded." como texto
      console.warn("[SSE-Leader] Rate limit detectado (429). Aguardando backoff...");

      // Backoff exponencial
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && isLeader) {
        const delay = BACKOFF_DELAYS[Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1)];
        console.log(`[SSE-Leader] Reconectando em ${delay}ms (tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          if (isLeader && !eventSource) {
            becomeLeader(establishmentId);
          }
        }, delay);
      } else {
        console.log("[SSE-Leader] Máximo de tentativas atingido ou não sou mais líder");
        status = "disconnected";
        notifyAll("disconnected");
        bc?.postMessage({ type: "status-update", status: "disconnected" });
      }
    }
  };

  // Evento de conexão estabelecida
  eventSource.addEventListener("connected", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[SSE-Leader] Conectado ao estabelecimento:", data.establishmentId);
    } catch (e) {
      console.error("[SSE-Error] Erro ao parsear evento connected:", e);
    }
  });

  // Evento de novo pedido
  eventSource.addEventListener("new_order", (event) => {
    const eventTimestamp = new Date().toISOString();
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    
    console.log(`[SSE-Orders] [${eventTimestamp}] ========== EVENTO NEW_ORDER RECEBIDO ==========`);
    console.log(`[SSE-Orders] [${eventTimestamp}] Plataforma: ${isAndroidDevice ? 'Android' : 'Outro'}`);
    console.log(`[SSE-Orders] [${eventTimestamp}] Raw event data:`, event.data?.substring(0, 200));
    
    try {
      const order = JSON.parse(event.data) as SSEOrder;
      console.log(`[SSE-Orders] [${eventTimestamp}] Pedido parseado:`, order.orderNumber, "status:", order.status);
      console.log(`[SSE-Orders] [${eventTimestamp}] Chamando notifyAll...`);
      notifyAll("newOrder", order);
      console.log(`[SSE-Orders] [${eventTimestamp}] notifyAll executado`);
      // Broadcast para outras abas
      bc?.postMessage({ type: "order-update", payload: order });
      console.log(`[SSE-Orders] [${eventTimestamp}] Broadcast enviado`);
    } catch (e) {
      console.error(`[SSE-Error] [${eventTimestamp}] Erro ao parsear novo pedido:`, e);
    }
    
    console.log(`[SSE-Orders] [${eventTimestamp}] ========== FIM EVENTO NEW_ORDER ==========`);
  });

  // Evento de atualização de pedido
  eventSource.addEventListener("order_update", (event) => {
    try {
      const update = JSON.parse(event.data) as SSEOrderUpdate;
      console.log("[SSE-Orders] Evento recebido:", update.id, "status:", update.status);
      notifyAll("orderUpdate", update);
      // Broadcast para outras abas
      bc?.postMessage({ type: "order-update", payload: update });
    } catch (e) {
      console.error("[SSE-Error] Erro ao parsear atualização:", e);
    }
  });

  // Heartbeat
  eventSource.addEventListener("heartbeat", () => {
    // Silencioso, apenas mantém conexão viva
  });
}

function cleanup() {
  console.log(`[SSE-Tab] Cleanup da aba ${TAB_ID}`);

  // Se somos o líder, avisar outras abas
  if (isLeader) {
    bc?.postMessage({ type: "leader-closed" });
  }

  // Limpar timeouts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (leaderCheckTimeout) {
    clearTimeout(leaderCheckTimeout);
    leaderCheckTimeout = null;
  }

  // Fechar conexão SSE se formos o líder
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  // Fechar canal de broadcast
  if (bc) {
    bc.close();
    bc = null;
  }

  isLeader = false;
  status = "disconnected";
  currentEstablishmentId = null;
  reconnectAttempts = 0;
}

// ============================================
// HOOK - Interface para componentes React
// ============================================

interface UseOrdersSSEOptions {
  establishmentId?: number;
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useOrdersSSE(options: UseOrdersSSEOptions = {}) {
  const {
    establishmentId,
    onNewOrder,
    onOrderUpdate,
    onConnected,
    onDisconnected,
    onError,
    enabled = true,
  } = options;

  const [currentStatus, setStatus] = useState<SSEStatus>(status);

  // Ref para manter as callbacks atualizadas
  const callbacksRef = useRef({
    onNewOrder,
    onOrderUpdate,
    onConnected,
    onDisconnected,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewOrder,
      onOrderUpdate,
      onConnected,
      onDisconnected,
      onError,
    };
  }, [onNewOrder, onOrderUpdate, onConnected, onDisconnected, onError]);

  // Registrar listener e inicializar sistema
  useEffect(() => {
    if (!enabled || !establishmentId) {
      return;
    }

    // Criar listener único para esta instância do hook
    const listener = {
      onNewOrder: (order: SSEOrder) => callbacksRef.current.onNewOrder?.(order),
      onOrderUpdate: (update: SSEOrderUpdate) => callbacksRef.current.onOrderUpdate?.(update),
      onConnected: () => callbacksRef.current.onConnected?.(),
      onDisconnected: () => callbacksRef.current.onDisconnected?.(),
      onError: (error: Event) => callbacksRef.current.onError?.(error),
      setStatus,
    };

    callbacks.add(listener);
    console.log(`[SSE-Hook] Listener registrado. Total: ${callbacks.size}`);

    // Inicializar BroadcastChannel e sistema de líder (apenas se ainda não foi inicializado)
    if (!bc) {
      initBroadcastChannel(establishmentId);
    }

    // Sincronizar status inicial
    setStatus(status);

    // Cleanup ao desmontar
    return () => {
      callbacks.delete(listener);
      console.log(`[SSE-Hook] Listener removido. Restantes: ${callbacks.size}`);

      // Se não há mais listeners, fazer cleanup completo
      if (callbacks.size === 0) {
        cleanup();
      }
    };
  }, [enabled, establishmentId]);

  const reconnect = useCallback(() => {
    if (establishmentId && isLeader) {
      reconnectAttempts = 0;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setTimeout(() => becomeLeader(establishmentId), 100);
    }
  }, [establishmentId]);

  const disconnect = useCallback(() => {
    cleanup();
  }, []);

  return {
    status: currentStatus,
    isConnected: currentStatus === "connected",
    isConnecting: currentStatus === "connecting",
    hasError: currentStatus === "error",
    isLeader,
    reconnect,
    disconnect,
  };
}
