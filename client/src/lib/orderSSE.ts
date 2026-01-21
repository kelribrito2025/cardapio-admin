/**
 * Singleton SSE para gerenciar conexão única de acompanhamento de pedidos
 * 
 * Regras:
 * 1. Apenas UMA conexão SSE por cliente (singleton)
 * 2. Conexão só é aberta APÓS o pedido ser criado
 * 3. Reutiliza conexão existente se já estiver aberta
 * 4. Tratamento silencioso de erro 429 com reconexão após delay
 */

type OrderStatus = "sent" | "accepted" | "delivering" | "delivered" | "cancelled";

interface OrderStatusUpdate {
  orderNumber: string;
  status: string;
  cancellationReason?: string;
}

type StatusUpdateCallback = (update: OrderStatusUpdate) => void;

class OrderSSEManager {
  private static instance: OrderSSEManager | null = null;
  private eventSource: EventSource | null = null;
  private connectedOrders: Set<string> = new Set();
  private callbacks: Map<string, StatusUpdateCallback[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private isConnecting: boolean = false;

  private constructor() {}

  static getInstance(): OrderSSEManager {
    if (!OrderSSEManager.instance) {
      OrderSSEManager.instance = new OrderSSEManager();
    }
    return OrderSSEManager.instance;
  }

  /**
   * Verifica se a conexão está ativa
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Verifica se está tentando conectar
   */
  isConnectionPending(): boolean {
    return this.isConnecting;
  }

  /**
   * Adiciona um pedido para ser monitorado
   * Se já existe conexão, adiciona o pedido à lista
   * Se não existe, cria nova conexão
   */
  trackOrder(orderNumber: string, callback: StatusUpdateCallback): void {
    console.log(`[SSE-Manager] Adicionando pedido para tracking: ${orderNumber}`);
    
    // Registrar callback para este pedido
    if (!this.callbacks.has(orderNumber)) {
      this.callbacks.set(orderNumber, []);
    }
    this.callbacks.get(orderNumber)!.push(callback);
    
    // Se o pedido já está sendo monitorado, não precisa reconectar
    if (this.connectedOrders.has(orderNumber)) {
      console.log(`[SSE-Manager] Pedido ${orderNumber} já está sendo monitorado`);
      return;
    }
    
    // Adicionar à lista de pedidos
    this.connectedOrders.add(orderNumber);
    
    // Reconectar para incluir o novo pedido
    this.connect();
  }

  /**
   * Remove um pedido do monitoramento
   */
  untrackOrder(orderNumber: string): void {
    console.log(`[SSE-Manager] Removendo pedido do tracking: ${orderNumber}`);
    
    this.connectedOrders.delete(orderNumber);
    this.callbacks.delete(orderNumber);
    
    // Se não há mais pedidos, fechar conexão
    if (this.connectedOrders.size === 0) {
      this.disconnect();
    } else {
      // Reconectar sem o pedido removido
      this.connect();
    }
  }

  /**
   * Conecta ao SSE com os pedidos atuais
   */
  private connect(): void {
    // Se já está conectando, aguardar
    if (this.isConnecting) {
      console.log('[SSE-Manager] Já está conectando, aguardando...');
      return;
    }

    // Se não há pedidos para monitorar, não conectar
    if (this.connectedOrders.size === 0) {
      console.log('[SSE-Manager] Nenhum pedido para monitorar');
      return;
    }

    // Fechar conexão anterior se existir
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Limpar timeout de reconexão
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnecting = true;

    // Criar lista de orderNumbers
    const orderNumbers = Array.from(this.connectedOrders).join(',');
    const url = `/api/orders/track/stream?orders=${encodeURIComponent(orderNumbers)}`;
    
    console.log(`[SSE-Manager] Conectando ao SSE com pedidos: ${orderNumbers}`);
    
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.addEventListener('connected', (event) => {
        console.log('[SSE-Manager] Conexão estabelecida:', event.data);
        this.isConnecting = false;
        this.reconnectAttempts = 0; // Reset tentativas em caso de sucesso
      });

      this.eventSource.addEventListener('order_status_update', (event) => {
        try {
          const data: OrderStatusUpdate = JSON.parse(event.data);
          console.log('[SSE-Manager] Atualização de status recebida:', data);
          
          // Notificar todos os callbacks registrados para este pedido
          const callbacks = this.callbacks.get(data.orderNumber);
          if (callbacks) {
            callbacks.forEach(cb => cb(data));
          }
        } catch (e) {
          console.error('[SSE-Manager] Erro ao processar evento:', e);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeat silencioso - apenas para manter conexão viva
      });

      this.eventSource.onerror = (error) => {
        console.error('[SSE-Manager] Erro na conexão:', error);
        this.isConnecting = false;
        this.handleConnectionError();
      };

      this.eventSource.onopen = () => {
        console.log('[SSE-Manager] Conexão aberta');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

    } catch (error) {
      console.error('[SSE-Manager] Erro ao criar EventSource:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  /**
   * Trata erros de conexão com reconexão silenciosa
   * Implementa backoff exponencial para evitar rate limiting
   */
  private handleConnectionError(): void {
    // Se não há mais pedidos, não tentar reconectar
    if (this.connectedOrders.size === 0) {
      return;
    }

    // Incrementar tentativas
    this.reconnectAttempts++;

    // Se excedeu o limite, parar de tentar
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('[SSE-Manager] Máximo de tentativas atingido. Parando reconexão.');
      return;
    }

    // Calcular delay com backoff exponencial (3s, 6s, 12s, 24s, max 60s)
    const baseDelay = 3000;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), 60000);
    
    console.log(`[SSE-Manager] Reconectando em ${delay/1000}s (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Desconecta do SSE
   */
  disconnect(): void {
    console.log('[SSE-Manager] Desconectando...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Limpa todos os dados e desconecta
   */
  reset(): void {
    this.disconnect();
    this.connectedOrders.clear();
    this.callbacks.clear();
  }

  /**
   * Retorna os pedidos sendo monitorados
   */
  getTrackedOrders(): string[] {
    return Array.from(this.connectedOrders);
  }
}

// Exportar instância singleton
export const orderSSE = OrderSSEManager.getInstance();

// Mapeamento de status do backend para frontend
export const statusMap: Record<string, OrderStatus> = {
  'new': 'sent',
  'preparing': 'accepted',
  'ready': 'delivering',
  'completed': 'delivered',
  'cancelled': 'cancelled',
};
