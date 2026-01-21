import { useEffect, useRef, useState, useCallback } from "react";

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

interface UseOrdersSSEOptions {
  establishmentId?: number;
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

// ============================================
// SISTEMA DE LÍDER/SEGUIDOR COM BROADCASTCHANNEL
// Garante apenas 1 conexão SSE por navegador (todas as abas)
// ============================================

const CHANNEL_NAME = "orders-sse-channel";
const LEADER_HEARTBEAT_INTERVAL = 2000; // 2 segundos
const LEADER_TIMEOUT = 5000; // 5 segundos sem heartbeat = líder morto

interface BroadcastMessage {
  type: "leader_heartbeat" | "leader_elected" | "sse_event" | "request_leader" | "status_update";
  tabId: string;
  establishmentId?: number;
  data?: unknown;
  status?: SSEStatus;
}

// Gerar ID único para esta aba
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface GlobalSSEState {
  channel: BroadcastChannel | null;
  eventSource: EventSource | null;
  establishmentId: number | null;
  status: SSEStatus;
  isLeader: boolean;
  leaderId: string | null;
  lastLeaderHeartbeat: number;
  leaderHeartbeatInterval: NodeJS.Timeout | null;
  leaderCheckInterval: NodeJS.Timeout | null;
  reconnectTimeout: NodeJS.Timeout | null;
  reconnectAttempts: number;
  listeners: Set<{
    onNewOrder?: (order: SSEOrder) => void;
    onOrderUpdate?: (update: SSEOrderUpdate) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Event) => void;
    setStatus: (status: SSEStatus) => void;
    setLastEvent: (date: Date) => void;
  }>;
}

const globalSSE: GlobalSSEState = {
  channel: null,
  eventSource: null,
  establishmentId: null,
  status: "disconnected",
  isLeader: false,
  leaderId: null,
  lastLeaderHeartbeat: 0,
  leaderHeartbeatInterval: null,
  leaderCheckInterval: null,
  reconnectTimeout: null,
  reconnectAttempts: 0,
  listeners: new Set(),
};

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 3000;

function notifyListeners(event: "status" | "newOrder" | "orderUpdate" | "connected" | "disconnected" | "error" | "lastEvent", data?: unknown) {
  globalSSE.listeners.forEach((listener) => {
    switch (event) {
      case "status":
        listener.setStatus(data as SSEStatus);
        break;
      case "newOrder":
        listener.onNewOrder?.(data as SSEOrder);
        break;
      case "orderUpdate":
        listener.onOrderUpdate?.(data as SSEOrderUpdate);
        break;
      case "connected":
        listener.onConnected?.();
        break;
      case "disconnected":
        listener.onDisconnected?.();
        break;
      case "error":
        listener.onError?.(data as Event);
        break;
      case "lastEvent":
        listener.setLastEvent(data as Date);
        break;
    }
  });
}

function broadcast(message: BroadcastMessage) {
  if (globalSSE.channel) {
    globalSSE.channel.postMessage(message);
  }
}

function initBroadcastChannel(establishmentId: number) {
  if (globalSSE.channel) {
    return; // Já inicializado
  }

  globalSSE.channel = new BroadcastChannel(CHANNEL_NAME);
  globalSSE.establishmentId = establishmentId;

  globalSSE.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
    const message = event.data;

    // Ignorar mensagens de estabelecimentos diferentes
    if (message.establishmentId && message.establishmentId !== globalSSE.establishmentId) {
      return;
    }

    switch (message.type) {
      case "leader_heartbeat":
        // Atualizar timestamp do último heartbeat do líder
        if (message.tabId !== TAB_ID) {
          globalSSE.lastLeaderHeartbeat = Date.now();
          globalSSE.leaderId = message.tabId;
          globalSSE.isLeader = false;
        }
        break;

      case "leader_elected":
        // Outro tab se elegeu líder
        if (message.tabId !== TAB_ID) {
          console.log(`[SSE-Tab] Líder eleito: ${message.tabId}`);
          globalSSE.leaderId = message.tabId;
          globalSSE.isLeader = false;
          globalSSE.lastLeaderHeartbeat = Date.now();
          // Fechar nossa conexão SSE se tivermos uma
          if (globalSSE.eventSource) {
            globalSSE.eventSource.close();
            globalSSE.eventSource = null;
          }
        }
        break;

      case "sse_event":
        // Evento SSE recebido do líder
        if (!globalSSE.isLeader && message.data) {
          const { eventType, eventData } = message.data as { eventType: string; eventData: unknown };
          handleSSEEvent(eventType, eventData);
        }
        break;

      case "status_update":
        // Atualização de status do líder
        if (!globalSSE.isLeader && message.status) {
          globalSSE.status = message.status;
          notifyListeners("status", message.status);
          if (message.status === "connected") {
            notifyListeners("connected");
          } else if (message.status === "disconnected") {
            notifyListeners("disconnected");
          }
        }
        break;

      case "request_leader":
        // Outra aba está pedindo quem é o líder
        if (globalSSE.isLeader) {
          broadcast({
            type: "leader_heartbeat",
            tabId: TAB_ID,
            establishmentId: globalSSE.establishmentId!,
          });
        }
        break;
    }
  };

  // Iniciar verificação de líder
  startLeaderCheck(establishmentId);
}

function handleSSEEvent(eventType: string, eventData: unknown) {
  notifyListeners("lastEvent", new Date());
  
  switch (eventType) {
    case "new_order":
      notifyListeners("newOrder", eventData as SSEOrder);
      break;
    case "order_update":
      notifyListeners("orderUpdate", eventData as SSEOrderUpdate);
      break;
    case "connected":
      notifyListeners("connected");
      break;
  }
}

function startLeaderCheck(establishmentId: number) {
  // Limpar intervalos anteriores
  if (globalSSE.leaderCheckInterval) {
    clearInterval(globalSSE.leaderCheckInterval);
  }

  // Pedir para o líder atual se identificar
  broadcast({
    type: "request_leader",
    tabId: TAB_ID,
    establishmentId,
  });

  // Aguardar um pouco para ver se há líder
  setTimeout(() => {
    const timeSinceLastHeartbeat = Date.now() - globalSSE.lastLeaderHeartbeat;
    
    if (timeSinceLastHeartbeat > LEADER_TIMEOUT || globalSSE.lastLeaderHeartbeat === 0) {
      // Não há líder ou líder morreu - assumir liderança
      becomeLeader(establishmentId);
    }
  }, 1000);

  // Verificar periodicamente se o líder ainda está vivo
  globalSSE.leaderCheckInterval = setInterval(() => {
    const timeSinceLastHeartbeat = Date.now() - globalSSE.lastLeaderHeartbeat;
    
    if (!globalSSE.isLeader && timeSinceLastHeartbeat > LEADER_TIMEOUT) {
      console.log("[SSE-Tab] Líder não responde, assumindo liderança...");
      becomeLeader(establishmentId);
    }
  }, LEADER_TIMEOUT / 2);
}

function becomeLeader(establishmentId: number) {
  if (globalSSE.isLeader) {
    return; // Já somos o líder
  }

  console.log(`[SSE-Tab] Esta aba (${TAB_ID}) é agora o líder`);
  globalSSE.isLeader = true;
  globalSSE.leaderId = TAB_ID;

  // Anunciar que somos o líder
  broadcast({
    type: "leader_elected",
    tabId: TAB_ID,
    establishmentId,
  });

  // Iniciar heartbeat
  if (globalSSE.leaderHeartbeatInterval) {
    clearInterval(globalSSE.leaderHeartbeatInterval);
  }
  
  globalSSE.leaderHeartbeatInterval = setInterval(() => {
    broadcast({
      type: "leader_heartbeat",
      tabId: TAB_ID,
      establishmentId,
    });
  }, LEADER_HEARTBEAT_INTERVAL);

  // Conectar ao SSE
  connectSSE(establishmentId);
}

function connectSSE(establishmentId: number) {
  // Só o líder pode conectar
  if (!globalSSE.isLeader) {
    return;
  }

  // Se já existe conexão ativa, não criar outra
  if (globalSSE.eventSource && globalSSE.eventSource.readyState !== EventSource.CLOSED) {
    console.log("[SSE-Leader] Conexão já existe e está ativa");
    return;
  }

  // Limpar conexão anterior se existir
  if (globalSSE.eventSource) {
    globalSSE.eventSource.close();
    globalSSE.eventSource = null;
  }

  globalSSE.status = "connecting";
  notifyListeners("status", "connecting");
  broadcast({ type: "status_update", tabId: TAB_ID, establishmentId, status: "connecting" });

  console.log("[SSE-Leader] Criando conexão SSE...");

  const eventSource = new EventSource("/api/orders/stream", {
    withCredentials: true,
  });

  eventSource.onopen = () => {
    console.log("[SSE-Leader] Conexão estabelecida");
    globalSSE.status = "connected";
    globalSSE.reconnectAttempts = 0;
    notifyListeners("status", "connected");
    notifyListeners("connected");
    broadcast({ type: "status_update", tabId: TAB_ID, establishmentId, status: "connected" });
  };

  eventSource.onerror = (event) => {
    console.error("[SSE-Leader] Erro na conexão - readyState:", eventSource.readyState);

    if (eventSource.readyState === EventSource.CLOSED) {
      globalSSE.status = "error";
      globalSSE.eventSource = null;
      notifyListeners("status", "error");
      notifyListeners("error", event);
      broadcast({ type: "status_update", tabId: TAB_ID, establishmentId, status: "error" });

      // Tentar reconectar com backoff exponencial
      if (globalSSE.reconnectAttempts < MAX_RECONNECT_ATTEMPTS && globalSSE.isLeader) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(2, globalSSE.reconnectAttempts);
        console.log(`[SSE-Leader] Reconectando em ${delay}ms (tentativa ${globalSSE.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        if (globalSSE.reconnectTimeout) {
          clearTimeout(globalSSE.reconnectTimeout);
        }

        globalSSE.reconnectTimeout = setTimeout(() => {
          globalSSE.reconnectAttempts++;
          if (globalSSE.isLeader) {
            connectSSE(establishmentId);
          }
        }, delay);
      } else {
        console.log("[SSE-Leader] Máximo de tentativas atingido");
        globalSSE.status = "disconnected";
        notifyListeners("status", "disconnected");
        notifyListeners("disconnected");
        broadcast({ type: "status_update", tabId: TAB_ID, establishmentId, status: "disconnected" });
      }
    }
  };

  // Evento de conexão estabelecida
  eventSource.addEventListener("connected", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[SSE-Leader] Conectado ao estabelecimento:", data.establishmentId);
      notifyListeners("lastEvent", new Date());
      // Broadcast para outras abas
      broadcast({
        type: "sse_event",
        tabId: TAB_ID,
        establishmentId,
        data: { eventType: "connected", eventData: data },
      });
    } catch (e) {
      console.error("[SSE-Leader] Erro ao parsear evento connected:", e);
    }
  });

  // Evento de novo pedido
  eventSource.addEventListener("new_order", (event) => {
    try {
      const order = JSON.parse(event.data) as SSEOrder;
      console.log("[SSE-Leader] Novo pedido recebido:", order.orderNumber);
      notifyListeners("lastEvent", new Date());
      notifyListeners("newOrder", order);
      // Broadcast para outras abas
      broadcast({
        type: "sse_event",
        tabId: TAB_ID,
        establishmentId,
        data: { eventType: "new_order", eventData: order },
      });
    } catch (e) {
      console.error("[SSE-Leader] Erro ao parsear novo pedido:", e);
    }
  });

  // Evento de atualização de pedido
  eventSource.addEventListener("order_update", (event) => {
    try {
      const update = JSON.parse(event.data) as SSEOrderUpdate;
      console.log("[SSE-Leader] Pedido atualizado:", update.id, "->", update.status);
      notifyListeners("lastEvent", new Date());
      notifyListeners("orderUpdate", update);
      // Broadcast para outras abas
      broadcast({
        type: "sse_event",
        tabId: TAB_ID,
        establishmentId,
        data: { eventType: "order_update", eventData: update },
      });
    } catch (e) {
      console.error("[SSE-Leader] Erro ao parsear atualização:", e);
    }
  });

  // Heartbeat
  eventSource.addEventListener("heartbeat", () => {
    notifyListeners("lastEvent", new Date());
  });

  globalSSE.eventSource = eventSource;
}

function cleanup() {
  console.log(`[SSE-Tab] Cleanup da aba ${TAB_ID}`);

  // Limpar intervalos
  if (globalSSE.leaderHeartbeatInterval) {
    clearInterval(globalSSE.leaderHeartbeatInterval);
    globalSSE.leaderHeartbeatInterval = null;
  }

  if (globalSSE.leaderCheckInterval) {
    clearInterval(globalSSE.leaderCheckInterval);
    globalSSE.leaderCheckInterval = null;
  }

  if (globalSSE.reconnectTimeout) {
    clearTimeout(globalSSE.reconnectTimeout);
    globalSSE.reconnectTimeout = null;
  }

  // Fechar conexão SSE se formos o líder
  if (globalSSE.isLeader && globalSSE.eventSource) {
    globalSSE.eventSource.close();
    globalSSE.eventSource = null;
  }

  // Fechar canal de broadcast
  if (globalSSE.channel) {
    globalSSE.channel.close();
    globalSSE.channel = null;
  }

  globalSSE.isLeader = false;
  globalSSE.leaderId = null;
  globalSSE.status = "disconnected";
  globalSSE.establishmentId = null;
  globalSSE.reconnectAttempts = 0;
  globalSSE.lastLeaderHeartbeat = 0;
}

// ============================================
// HOOK - Interface para componentes React
// ============================================
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

  const [status, setStatus] = useState<SSEStatus>(globalSSE.status);
  const [lastEvent, setLastEvent] = useState<Date | null>(null);

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

    const listener = {
      onNewOrder: (order: SSEOrder) => callbacksRef.current.onNewOrder?.(order),
      onOrderUpdate: (update: SSEOrderUpdate) => callbacksRef.current.onOrderUpdate?.(update),
      onConnected: () => callbacksRef.current.onConnected?.(),
      onDisconnected: () => callbacksRef.current.onDisconnected?.(),
      onError: (error: Event) => callbacksRef.current.onError?.(error),
      setStatus,
      setLastEvent,
    };

    globalSSE.listeners.add(listener);
    console.log(`[SSE-Hook] Listener registrado (aba ${TAB_ID}). Total: ${globalSSE.listeners.size}`);

    // Inicializar BroadcastChannel e sistema de líder
    initBroadcastChannel(establishmentId);

    // Sincronizar status inicial
    setStatus(globalSSE.status);

    // Cleanup ao desmontar
    return () => {
      globalSSE.listeners.delete(listener);
      console.log(`[SSE-Hook] Listener removido. Restantes: ${globalSSE.listeners.size}`);

      // Se não há mais listeners nesta aba, fazer cleanup
      if (globalSSE.listeners.size === 0) {
        cleanup();
      }
    };
  }, [enabled, establishmentId]);

  const reconnect = useCallback(() => {
    if (establishmentId && globalSSE.isLeader) {
      globalSSE.reconnectAttempts = 0;
      if (globalSSE.eventSource) {
        globalSSE.eventSource.close();
        globalSSE.eventSource = null;
      }
      setTimeout(() => connectSSE(establishmentId), 100);
    }
  }, [establishmentId]);

  const disconnect = useCallback(() => {
    cleanup();
  }, []);

  return {
    status,
    lastEvent,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    hasError: status === "error",
    isLeader: globalSSE.isLeader,
    reconnect,
    disconnect,
  };
}
