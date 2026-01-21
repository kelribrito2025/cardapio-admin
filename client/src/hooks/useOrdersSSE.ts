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
// SINGLETON GLOBAL - Uma única conexão SSE
// ============================================
interface GlobalSSEState {
  eventSource: EventSource | null;
  establishmentId: number | null;
  status: SSEStatus;
  listeners: Set<{
    onNewOrder?: (order: SSEOrder) => void;
    onOrderUpdate?: (update: SSEOrderUpdate) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Event) => void;
    setStatus: (status: SSEStatus) => void;
    setLastEvent: (date: Date) => void;
  }>;
  reconnectTimeout: NodeJS.Timeout | null;
  reconnectAttempts: number;
}

// Estado global do SSE - compartilhado entre todos os componentes
const globalSSE: GlobalSSEState = {
  eventSource: null,
  establishmentId: null,
  status: "disconnected",
  listeners: new Set(),
  reconnectTimeout: null,
  reconnectAttempts: 0,
};

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 3000; // 3 segundos

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

function connectGlobalSSE(establishmentId: number) {
  // Se já existe uma conexão ativa para este estabelecimento, não criar outra
  if (
    globalSSE.eventSource &&
    globalSSE.eventSource.readyState !== EventSource.CLOSED &&
    globalSSE.establishmentId === establishmentId
  ) {
    console.log("[SSE-Global] Conexão já existe e está ativa, reutilizando...");
    return;
  }

  // Se existe conexão para outro estabelecimento, fechar primeiro
  if (globalSSE.eventSource && globalSSE.establishmentId !== establishmentId) {
    console.log("[SSE-Global] Fechando conexão anterior para estabelecimento diferente");
    globalSSE.eventSource.close();
    globalSSE.eventSource = null;
  }

  // Se a conexão está fechada, limpar a referência
  if (globalSSE.eventSource && globalSSE.eventSource.readyState === EventSource.CLOSED) {
    console.log("[SSE-Global] Conexão anterior estava fechada, limpando...");
    globalSSE.eventSource = null;
  }

  // Se ainda existe uma conexão (pode estar CONNECTING), não criar outra
  if (globalSSE.eventSource) {
    console.log("[SSE-Global] Conexão em andamento, aguardando...", globalSSE.eventSource.readyState);
    return;
  }

  globalSSE.status = "connecting";
  globalSSE.establishmentId = establishmentId;
  notifyListeners("status", "connecting");
  
  console.log("[SSE-Global] Criando nova conexão para estabelecimento:", establishmentId);

  const eventSource = new EventSource("/api/orders/stream", {
    withCredentials: true,
  });

  eventSource.onopen = () => {
    console.log("[SSE-Global] Conexão estabelecida com sucesso");
    globalSSE.status = "connected";
    globalSSE.reconnectAttempts = 0;
    notifyListeners("status", "connected");
    notifyListeners("connected");
  };

  eventSource.onerror = (event) => {
    console.error("[SSE-Global] Erro na conexão - readyState:", eventSource.readyState);
    
    // Se a conexão foi fechada, tentar reconectar
    if (eventSource.readyState === EventSource.CLOSED) {
      globalSSE.status = "error";
      globalSSE.eventSource = null;
      notifyListeners("status", "error");
      notifyListeners("error", event);

      // Tentar reconectar com backoff exponencial
      if (globalSSE.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(2, globalSSE.reconnectAttempts);
        console.log(`[SSE-Global] Reconectando em ${delay}ms (tentativa ${globalSSE.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        // Limpar timeout anterior se existir
        if (globalSSE.reconnectTimeout) {
          clearTimeout(globalSSE.reconnectTimeout);
        }
        
        globalSSE.reconnectTimeout = setTimeout(() => {
          globalSSE.reconnectAttempts++;
          // Só reconectar se ainda não existe conexão
          if (!globalSSE.eventSource || globalSSE.eventSource.readyState === EventSource.CLOSED) {
            connectGlobalSSE(establishmentId);
          }
        }, delay);
      } else {
        console.log("[SSE-Global] Máximo de tentativas atingido");
        globalSSE.status = "disconnected";
        notifyListeners("status", "disconnected");
        notifyListeners("disconnected");
      }
    }
  };

  // Evento de conexão estabelecida
  eventSource.addEventListener("connected", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[SSE-Global] Conectado ao estabelecimento:", data.establishmentId);
      notifyListeners("lastEvent", new Date());
    } catch (e) {
      console.error("[SSE-Global] Erro ao parsear evento connected:", e);
    }
  });

  // Evento de novo pedido
  eventSource.addEventListener("new_order", (event) => {
    try {
      const order = JSON.parse(event.data) as SSEOrder;
      console.log("[SSE-Global] Novo pedido recebido:", order.orderNumber);
      notifyListeners("lastEvent", new Date());
      notifyListeners("newOrder", order);
    } catch (e) {
      console.error("[SSE-Global] Erro ao parsear novo pedido:", e);
    }
  });

  // Evento de atualização de pedido
  eventSource.addEventListener("order_update", (event) => {
    try {
      const update = JSON.parse(event.data) as SSEOrderUpdate;
      console.log("[SSE-Global] Pedido atualizado:", update.id, "->", update.status);
      notifyListeners("lastEvent", new Date());
      notifyListeners("orderUpdate", update);
    } catch (e) {
      console.error("[SSE-Global] Erro ao parsear atualização:", e);
    }
  });

  // Heartbeat para manter conexão ativa
  eventSource.addEventListener("heartbeat", () => {
    notifyListeners("lastEvent", new Date());
  });

  globalSSE.eventSource = eventSource;
}

function disconnectGlobalSSE() {
  console.log("[SSE-Global] Desconectando...");
  
  if (globalSSE.reconnectTimeout) {
    clearTimeout(globalSSE.reconnectTimeout);
    globalSSE.reconnectTimeout = null;
  }

  if (globalSSE.eventSource) {
    globalSSE.eventSource.close();
    globalSSE.eventSource = null;
  }

  globalSSE.status = "disconnected";
  globalSSE.establishmentId = null;
  globalSSE.reconnectAttempts = 0;
  notifyListeners("status", "disconnected");
  notifyListeners("disconnected");
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
  
  // Ref para manter as callbacks atualizadas sem causar re-renders
  const callbacksRef = useRef({
    onNewOrder,
    onOrderUpdate,
    onConnected,
    onDisconnected,
    onError,
  });
  
  // Atualizar ref quando callbacks mudarem
  useEffect(() => {
    callbacksRef.current = {
      onNewOrder,
      onOrderUpdate,
      onConnected,
      onDisconnected,
      onError,
    };
  }, [onNewOrder, onOrderUpdate, onConnected, onDisconnected, onError]);

  // Registrar listener uma única vez
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

    // Adicionar listener ao conjunto global
    globalSSE.listeners.add(listener);
    console.log("[SSE-Hook] Listener registrado. Total:", globalSSE.listeners.size);

    // Conectar se ainda não está conectado
    connectGlobalSSE(establishmentId);

    // Sincronizar status inicial
    setStatus(globalSSE.status);

    // Cleanup: remover listener ao desmontar
    return () => {
      globalSSE.listeners.delete(listener);
      console.log("[SSE-Hook] Listener removido. Restantes:", globalSSE.listeners.size);
      
      // Se não há mais listeners, desconectar
      if (globalSSE.listeners.size === 0) {
        console.log("[SSE-Hook] Nenhum listener restante, desconectando SSE...");
        disconnectGlobalSSE();
      }
    };
  }, [enabled, establishmentId]); // Dependências mínimas - não inclui callbacks

  const reconnect = useCallback(() => {
    if (establishmentId) {
      globalSSE.reconnectAttempts = 0;
      disconnectGlobalSSE();
      setTimeout(() => connectGlobalSSE(establishmentId), 100);
    }
  }, [establishmentId]);

  const disconnect = useCallback(() => {
    disconnectGlobalSSE();
  }, []);

  return {
    status,
    lastEvent,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    hasError: status === "error",
    reconnect,
    disconnect,
  };
}
