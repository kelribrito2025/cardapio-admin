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
  onNewOrder?: (order: SSEOrder) => void;
  onOrderUpdate?: (update: SSEOrderUpdate) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useOrdersSSE(options: UseOrdersSSEOptions = {}) {
  const {
    onNewOrder,
    onOrderUpdate,
    onConnected,
    onDisconnected,
    onError,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const connect = useCallback(() => {
    if (!enabled) return;

    // Limpar conexão anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    console.log("[SSE] Conectando ao stream de pedidos...");

    const eventSource = new EventSource("/api/orders/stream", {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log("[SSE] Conexão estabelecida");
      setStatus("connected");
      reconnectAttempts.current = 0;
      onConnected?.();
    };

    eventSource.onerror = (event) => {
      // EventSource errors don't have useful info, just log the state
      console.error("[SSE] Erro na conexão - readyState:", eventSource.readyState);
      setStatus("error");
      onError?.(event);

      // Tentar reconectar com backoff exponencial
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
        console.log(`[SSE] Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        console.log("[SSE] Máximo de tentativas de reconexão atingido. Usando fallback de polling.");
        setStatus("disconnected");
        onDisconnected?.();
      }
    };

    // Evento de conexão estabelecida
    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      console.log("[SSE] Conectado ao estabelecimento:", data.establishmentId);
      setLastEvent(new Date());
    });

    // Evento de novo pedido
    eventSource.addEventListener("new_order", (event) => {
      const order = JSON.parse(event.data) as SSEOrder;
      console.log("[SSE] Novo pedido recebido:", order.orderNumber);
      setLastEvent(new Date());
      onNewOrder?.(order);
    });

    // Evento de atualização de pedido
    eventSource.addEventListener("order_update", (event) => {
      const update = JSON.parse(event.data) as SSEOrderUpdate;
      console.log("[SSE] Pedido atualizado:", update.id, "->", update.status);
      setLastEvent(new Date());
      onOrderUpdate?.(update);
    });

    // Heartbeat para manter conexão ativa
    eventSource.addEventListener("heartbeat", () => {
      setLastEvent(new Date());
    });

    eventSourceRef.current = eventSource;
  }, [enabled, onNewOrder, onOrderUpdate, onConnected, onDisconnected, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus("disconnected");
    onDisconnected?.();
  }, [onDisconnected]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    lastEvent,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    hasError: status === "error",
    reconnect: connect,
    disconnect,
  };
}
