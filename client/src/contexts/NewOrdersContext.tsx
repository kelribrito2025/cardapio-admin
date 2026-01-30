import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";

// Singleton para gerenciar o áudio de notificação
class NotificationAudioManager {
  private static instance: NotificationAudioManager;
  private audio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private pendingPlay = false;
  private soundStateLoaded = false; // Flag para garantir que o estado foi carregado

  private constructor() {
    this.initAudio();
  }

  // Verificar se o som está habilitado nas configurações
  // IMPORTANTE: O padrão é FALSE (desativado) até o usuário clicar para ativar
  private isSoundEnabled(): boolean {
    const soundEnabled = localStorage.getItem("notificationSoundEnabled");
    // Só retorna true se explicitamente definido como "true"
    return soundEnabled === "true";
  }

  // Verificar se estamos no menu público (onde o som nunca deve tocar)
  private isInPublicMenu(): boolean {
    if (typeof window !== "undefined") {
      return window.location.pathname.startsWith('/menu/');
    }
    return false;
  }

  static getInstance(): NotificationAudioManager {
    if (!NotificationAudioManager.instance) {
      NotificationAudioManager.instance = new NotificationAudioManager();
    }
    return NotificationAudioManager.instance;
  }

  private initAudio() {
    if (typeof window === "undefined") return;
    
    this.audio = new Audio("/notification.mp3");
    // IMPORTANTE: Inicializar SEMPRE mutado para evitar vazamento de áudio
    this.audio.muted = true;
    this.audio.volume = 0;
    this.audio.preload = "auto";
    
    // Marcar que o estado foi carregado após um pequeno delay
    // para garantir que o localStorage foi lido
    setTimeout(() => {
      this.soundStateLoaded = true;
      // Só desmuta se o som estiver explicitamente habilitado
      if (this.audio && this.isSoundEnabled()) {
        this.audio.muted = false;
        this.audio.volume = 0.7;
      }
      console.log("[NotificationAudio] Estado de som carregado, habilitado:", this.isSoundEnabled());
    }, 100);
    
    // Tentar desbloquear o áudio em qualquer interação do usuário
    const unlockAudio = () => {
      if (this.isUnlocked) return;
      
      // NÃO desbloquear se o som não estiver habilitado
      if (!this.isSoundEnabled()) {
        console.log("[NotificationAudio] Som desabilitado, não desbloqueando");
        return;
      }
      
      if (this.audio) {
        // Garantir que está mutado antes de tentar desbloquear
        const wasMuted = this.audio.muted;
        this.audio.muted = true;
        this.audio.volume = 0;
        
        // Tocar e pausar imediatamente para desbloquear
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.audio?.pause();
              this.audio!.currentTime = 0;
              this.isUnlocked = true;
              
              // Restaurar volume APENAS se o som estiver habilitado
              if (this.isSoundEnabled()) {
                this.audio!.muted = false;
                this.audio!.volume = 0.7;
              }
              
              console.log("[NotificationAudio] Áudio desbloqueado com sucesso!");
              
              // Se tinha um play pendente, executar agora APENAS se o som estiver habilitado
              // E se NÃO estiver no menu público
              if (this.pendingPlay && this.isSoundEnabled() && !this.isInPublicMenu()) {
                this.pendingPlay = false;
                this.play();
              } else {
                this.pendingPlay = false; // Limpar pendingPlay mesmo se som desabilitado ou no menu público
              }
            })
            .catch(() => {
              // Ainda não conseguiu desbloquear, tentar novamente na próxima interação
              // Restaurar estado de mute
              if (this.audio) {
                this.audio.muted = wasMuted;
              }
            });
        }
      }
    };

    // Adicionar listeners para desbloquear o áudio
    const events = ["click", "touchstart", "touchend", "keydown"];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: false, passive: true });
    });
  }

  play() {
    // Verificar se estamos no menu público - NUNCA tocar som lá
    if (this.isInPublicMenu()) {
      console.log("[NotificationAudio] No menu público, som bloqueado");
      return;
    }

    // Verificar se o estado de som já foi carregado
    if (!this.soundStateLoaded) {
      console.log("[NotificationAudio] Estado de som ainda não carregado, ignorando");
      return;
    }

    // Verificar se o som está habilitado nas configurações
    if (!this.isSoundEnabled()) {
      console.log("[NotificationAudio] Som desabilitado, não tocando");
      return;
    }

    if (!this.audio) {
      this.initAudio();
    }

    if (this.audio) {
      // Garantir que o áudio não está mutado antes de tocar
      this.audio.muted = false;
      this.audio.volume = 0.7;
      
      // Resetar o áudio para o início
      this.audio.currentTime = 0;
      
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[NotificationAudio] Som tocado com sucesso!");
            this.isUnlocked = true;
          })
          .catch((err) => {
            console.log("[NotificationAudio] Não foi possível tocar o som:", err.message);
            // Marcar como pendente para tocar quando desbloquear
            if (!this.isUnlocked) {
              this.pendingPlay = true;
            }
          });
      }
    }
  }

  // Método para verificar se o áudio está desbloqueado
  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  // Método para forçar desbloqueio (chamado em interação do usuário)
  unlock(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isUnlocked) {
        resolve(true);
        return;
      }

      if (this.audio) {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.audio?.pause();
              this.audio!.currentTime = 0;
              this.isUnlocked = true;
              console.log("[NotificationAudio] Áudio desbloqueado manualmente!");
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }
}

// Função para tocar som de notificação
const playNotificationSound = () => {
  try {
    NotificationAudioManager.getInstance().play();
  } catch (err) {
    console.log("[NewOrders] Erro ao tocar áudio:", err);
  }
};

interface NewOrdersContextType {
  newOrdersCount: number;
  markOrdersAsSeen: () => void;
  incrementCount: () => void;
  decrementCount: () => void;
  unlockAudio: () => Promise<boolean>;
  isAudioUnlocked: boolean;
}

const NewOrdersContext = createContext<NewOrdersContextType | undefined>(undefined);

export function NewOrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem("lastSeenOrdersTimestamp");
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // Ref para rastrear se já inicializamos
  const initializedRef = useRef(false);
  // Ref para a contagem atual (para evitar closure stale)
  const countRef = useRef(0);

  // Verificar estado do áudio periodicamente
  useEffect(() => {
    const checkAudioState = () => {
      const unlocked = NotificationAudioManager.getInstance().getIsUnlocked();
      if (unlocked !== isAudioUnlocked) {
        setIsAudioUnlocked(unlocked);
      }
    };

    // Verificar a cada segundo
    const interval = setInterval(checkAudioState, 1000);
    return () => clearInterval(interval);
  }, [isAudioUnlocked]);

  // Query para buscar o estabelecimento do usuário
  const { data: establishment } = trpc.establishment.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Query para buscar pedidos novos (status = 'new')
  const { data: ordersData } = trpc.orders.list.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { 
      enabled: !!establishment?.id && establishment.id > 0,
      refetchInterval: false, // Não usar polling, vamos usar SSE
      staleTime: 30000, // Considerar dados válidos por 30s
    }
  );

  // Ref para a localização atual (para evitar closure stale)
  const locationRef = useRef(location);
  
  // Atualizar ref quando location mudar
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Callback para novo pedido - usando ref para evitar stale closure
  const handleNewOrder = useCallback((order: unknown) => {
    // Incrementar usando ref para garantir valor atualizado
    countRef.current = countRef.current + 1;
    setNewOrdersCount(countRef.current);
    console.log("[NewOrders] Novo pedido recebido via SSE:", order);
    console.log("[NewOrders] Nova contagem:", countRef.current);
    
    // Tocar som de notificação APENAS se não estiver no menu público
    // O menu público usa a rota /menu/:slug
    if (!locationRef.current.startsWith('/menu/')) {
      playNotificationSound();
    } else {
      console.log("[NewOrders] Som não tocado - usuário está no menu público");
    }
  }, []);

  // Callback para update de pedido
  const handleOrderUpdate = useCallback(() => {
    // Não fazer nada no update - a contagem é baseada em pedidos novos
  }, []);

  // Usar o hook SSE compartilhado
  useOrdersSSE({
    establishmentId: establishment?.id,
    enabled: !!establishment?.id && establishment.id > 0,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
  });

  // Calcular contagem inicial de pedidos novos quando os dados carregam
  useEffect(() => {
    if (ordersData?.orders && !initializedRef.current) {
      const newOrders = ordersData.orders.filter(order => order.status === 'new');
      // Contar apenas pedidos criados após o último timestamp visto
      const unseenNewOrders = newOrders.filter(order => {
        const orderTimestamp = new Date(order.createdAt).getTime();
        return orderTimestamp > lastSeenTimestamp;
      });
      
      // Só atualizar se não estiver na página de pedidos
      if (location !== "/pedidos") {
        countRef.current = unseenNewOrders.length;
        setNewOrdersCount(unseenNewOrders.length);
        console.log("[NewOrders] Contagem inicial calculada:", unseenNewOrders.length);
        initializedRef.current = true;
      }
    }
  }, [ordersData, lastSeenTimestamp, location]);

  // Zerar contagem quando entrar na página de pedidos
  useEffect(() => {
    if (location === "/pedidos") {
      const now = Date.now();
      setLastSeenTimestamp(now);
      localStorage.setItem("lastSeenOrdersTimestamp", String(now));
      countRef.current = 0;
      setNewOrdersCount(0);
      initializedRef.current = true; // Marcar como inicializado
      console.log("[NewOrders] Entrando na página de pedidos, zerando contagem");
    }
  }, [location]);

  const markOrdersAsSeen = useCallback(() => {
    const now = Date.now();
    setLastSeenTimestamp(now);
    localStorage.setItem("lastSeenOrdersTimestamp", String(now));
    countRef.current = 0;
    setNewOrdersCount(0);
  }, []);

  const incrementCount = useCallback(() => {
    countRef.current = countRef.current + 1;
    setNewOrdersCount(countRef.current);
  }, []);

  const decrementCount = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    setNewOrdersCount(countRef.current);
  }, []);

  const unlockAudio = useCallback(async () => {
    const result = await NotificationAudioManager.getInstance().unlock();
    setIsAudioUnlocked(result);
    return result;
  }, []);

  return (
    <NewOrdersContext.Provider value={{ 
      newOrdersCount, 
      markOrdersAsSeen, 
      incrementCount, 
      decrementCount,
      unlockAudio,
      isAudioUnlocked
    }}>
      {children}
    </NewOrdersContext.Provider>
  );
}

export function useNewOrders() {
  const context = useContext(NewOrdersContext);
  if (context === undefined) {
    throw new Error("useNewOrders must be used within a NewOrdersProvider");
  }
  return context;
}
