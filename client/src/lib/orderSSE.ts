/**
 * Singleton SSE para gerenciar conexão única de acompanhamento de pedidos no menu público
 * 
 * Regras:
 * 1. Apenas UMA conexão SSE por cliente (singleton)
 * 2. Conexão só é aberta APÓS o pedido ser criado
 * 3. Reutiliza conexão existente se já estiver aberta
 * 4. Tratamento silencioso de erro 429 com reconexão após delay
 * 5. NÃO reconecta quando adiciona novo pedido se já conectado
 */

type OrderStatus = "sent" | "accepted" | "delivering" | "delivered" | "cancelled";

interface OrderStatusUpdate {
  orderNumber: string;
  status: string;
  cancellationReason?: string;
}

type StatusUpdateCallback = (update: OrderStatusUpdate) => void;

// Delays de backoff exponencial em ms
const BACKOFF_DELAYS = [3000, 6000, 12000, 24000, 60000];

class OrderSSEManager {
  private static instance: OrderSSEManager | null = null;
  private eventSource: EventSource | null = null;
  private connectedOrders: Set<string> = new Set();
  private pendingOrders: Set<string> = new Set(); // Pedidos aguardando para serem adicionados
  private callbacks: Map<string, StatusUpdateCallback[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isConnecting: boolean = false;
  private lastConnectedOrdersHash: string = "";

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
   * Gera hash dos pedidos para comparação
   */
  private getOrdersHash(): string {
    return Array.from(this.connectedOrders).sort().join(',');
  }

  /**
   * Adiciona um pedido para ser monitorado
   * Se já existe conexão ABERTA, apenas registra o callback (não reconecta)
   * Se não existe conexão, cria nova
   */
  trackOrder(orderNumber: string, callback: StatusUpdateCallback): void {
    // Registrar callback para este pedido
    if (!this.callbacks.has(orderNumber)) {
      this.callbacks.set(orderNumber, []);
    }
    this.callbacks.get(orderNumber)!.push(callback);
    
    // Se o pedido já está sendo monitorado, não precisa fazer nada
    if (this.connectedOrders.has(orderNumber)) {
      console.log(`[SSE-Public] Pedido ${orderNumber} já está sendo monitorado`);
      return;
    }
    
    // Adicionar à lista de pedidos
    this.connectedOrders.add(orderNumber);
    console.log(`[SSE-Public] Adicionando pedido: ${orderNumber}. Total: ${this.connectedOrders.size}`);
    
    // Se já está conectado e funcionando, NÃO reconectar
    // O servidor pode não suportar atualização dinâmica de pedidos
    // Mas registramos o callback para quando reconectar
    if (this.isConnected()) {
      console.log(`[SSE-Public] Conexão já ativa. Pedido ${orderNumber} será monitorado na próxima reconexão.`);
      this.pendingOrders.add(orderNumber);
      return;
    }
    
    // Se está conectando, aguardar
    if (this.isConnecting) {
      console.log(`[SSE-Public] Já está conectando. Pedido ${orderNumber} será incluído.`);
      return;
    }
    
    // Conectar
    this.connect();
  }

  /**
   * Atualiza o callback de um pedido (substitui todos os callbacks existentes)
   * Usado para garantir que o callback sempre use os valores mais recentes das refs
   */
  updateCallback(orderNumber: string, callback: StatusUpdateCallback): void {
    if (this.connectedOrders.has(orderNumber)) {
      // Substituir todos os callbacks por um novo
      this.callbacks.set(orderNumber, [callback]);
      console.log(`[SSE-Public] Callback atualizado para pedido: ${orderNumber}`);
    }
  }

  /**
   * Remove um pedido do monitoramento
   */
  untrackOrder(orderNumber: string): void {
    this.connectedOrders.delete(orderNumber);
    this.pendingOrders.delete(orderNumber);
    this.callbacks.delete(orderNumber);
    console.log(`[SSE-Public] Removendo pedido: ${orderNumber}. Restantes: ${this.connectedOrders.size}`);
    
    // Se não há mais pedidos, fechar conexão
    if (this.connectedOrders.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Força reconexão com todos os pedidos (incluindo pendentes)
   */
  reconnectWithAllOrders(): void {
    if (this.pendingOrders.size > 0) {
      console.log(`[SSE-Public] Reconectando com ${this.pendingOrders.size} pedidos pendentes`);
      this.pendingOrders.clear();
      this.forceReconnect();
    }
  }

  /**
   * Força reconexão
   */
  private forceReconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.connect();
  }

  /**
   * Conecta ao SSE com os pedidos atuais
   */
  private connect(): void {
    // Se já está conectando, aguardar
    if (this.isConnecting) {
      console.log('[SSE-Public] Já está conectando, aguardando...');
      return;
    }

    // Se não há pedidos para monitorar, não conectar
    if (this.connectedOrders.size === 0) {
      console.log('[SSE-Public] Nenhum pedido para monitorar');
      return;
    }

    // Verificar se a lista de pedidos mudou
    const currentHash = this.getOrdersHash();
    if (this.isConnected() && currentHash === this.lastConnectedOrdersHash) {
      console.log('[SSE-Public] Conexão já ativa com mesmos pedidos');
      return;
    }

    // Fechar conexão anterior se existir
    if (this.eventSource) {
      console.log('[SSE-Public] Fechando conexão anterior');
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
    
    console.log(`[SSE-Public] Conectando com ${this.connectedOrders.size} pedidos`);
    
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.addEventListener('connected', (event) => {
        console.log('[SSE-Public] Conexão estabelecida');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedOrdersHash = this.getOrdersHash();
      });

      this.eventSource.addEventListener('order_status_update', (event) => {
        try {
          const data: OrderStatusUpdate = JSON.parse(event.data);
          console.log('[SSE-Public] Atualização recebida:', data.orderNumber, '->', data.status);
          
          // Notificar todos os callbacks registrados para este pedido
          const callbacks = this.callbacks.get(data.orderNumber);
          if (callbacks) {
            callbacks.forEach(cb => cb(data));
          }
        } catch (e) {
          console.error('[SSE-Public] Erro ao processar evento:', e);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeat silencioso
      });

      this.eventSource.onerror = (error) => {
        console.warn('[SSE-Public] Erro na conexão');
        this.isConnecting = false;
        this.lastConnectedOrdersHash = "";
        this.handleConnectionError();
      };

      this.eventSource.onopen = () => {
        console.log('[SSE-Public] Conexão aberta');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedOrdersHash = this.getOrdersHash();
      };

    } catch (error) {
      console.error('[SSE-Public] Erro ao criar EventSource:', error);
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
      console.log('[SSE-Public] Máximo de tentativas atingido. Parando reconexão.');
      return;
    }

    // Calcular delay com backoff exponencial
    const delayIndex = Math.min(this.reconnectAttempts - 1, BACKOFF_DELAYS.length - 1);
    const delay = BACKOFF_DELAYS[delayIndex];
    
    console.log(`[SSE-Public] Reconectando em ${delay/1000}s (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Desconecta do SSE
   */
  disconnect(): void {
    console.log('[SSE-Public] Desconectando...');
    
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
    this.lastConnectedOrdersHash = "";
  }

  /**
   * Limpa todos os dados e desconecta
   */
  reset(): void {
    this.disconnect();
    this.connectedOrders.clear();
    this.pendingOrders.clear();
    this.callbacks.clear();
  }

  /**
   * Retorna os pedidos sendo monitorados
   */
  getTrackedOrders(): string[] {
    return Array.from(this.connectedOrders);
  }

  /**
   * Retorna status da conexão
   */
  getStatus(): { connected: boolean; connecting: boolean; orders: number; attempts: number } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      orders: this.connectedOrders.size,
      attempts: this.reconnectAttempts,
    };
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
