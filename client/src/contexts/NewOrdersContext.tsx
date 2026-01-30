import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";

// Singleton para gerenciar o áudio de notificação
// Otimizado para funcionar em dispositivos móveis (iOS/Android)
class NotificationAudioManager {
  private static instance: NotificationAudioManager;
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isUnlocked = false;
  private pendingPlay = false;
  private soundStateLoaded = false;
  private isMobile = false;
  private userHasInteracted = false;

  private constructor() {
    this.detectMobile();
    this.initAudio();
  }

  // Detectar se é dispositivo móvel
  private detectMobile() {
    if (typeof window !== "undefined") {
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log("[NotificationAudio] Dispositivo móvel:", this.isMobile);
    }
  }

  // Verificar se o som está habilitado nas configurações
  private isSoundEnabled(): boolean {
    const soundEnabled = localStorage.getItem("notificationSoundEnabled");
    return soundEnabled === "true";
  }

  // Verificar se estamos no menu público
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

  private async initAudio() {
    if (typeof window === "undefined") return;
    
    // Criar elemento de áudio HTML (funciona melhor no desktop)
    this.audio = new Audio("/notification.mp3");
    this.audio.muted = true;
    this.audio.volume = 0;
    this.audio.preload = "auto";
    
    // Para mobile, também preparar Web Audio API (mais confiável em iOS/Android)
    if (this.isMobile) {
      try {
        // @ts-ignore - webkitAudioContext para Safari
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
          // Pré-carregar o áudio como buffer
          this.loadAudioBuffer();
        }
      } catch (e) {
        console.log("[NotificationAudio] Web Audio API não disponível:", e);
      }
    }
    
    // Marcar estado como carregado
    setTimeout(() => {
      this.soundStateLoaded = true;
      if (this.audio && this.isSoundEnabled()) {
        this.audio.muted = false;
        this.audio.volume = 0.7;
      }
      console.log("[NotificationAudio] Estado carregado, habilitado:", this.isSoundEnabled());
    }, 100);
    
    // Configurar listeners para interação do usuário
    this.setupInteractionListeners();
  }

  // Carregar áudio como buffer para Web Audio API
  private async loadAudioBuffer() {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch("/notification.mp3");
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log("[NotificationAudio] Buffer de áudio carregado para mobile");
    } catch (e) {
      console.log("[NotificationAudio] Erro ao carregar buffer:", e);
    }
  }

  // Configurar listeners de interação
  private setupInteractionListeners() {
    const handleInteraction = () => {
      this.userHasInteracted = true;
      
      // Resumir AudioContext se estiver suspenso (necessário para iOS)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log("[NotificationAudio] AudioContext resumido");
        });
      }
      
      // Tentar desbloquear áudio HTML
      if (!this.isUnlocked && this.isSoundEnabled()) {
        this.unlockHtmlAudio();
      }
    };

    // Eventos de interação - importante para mobile
    const events = ["click", "touchstart", "touchend", "keydown"];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });
  }

  // Desbloquear áudio HTML
  private unlockHtmlAudio() {
    if (!this.audio || this.isUnlocked) return;
    
    // Salvar estado atual
    const wasMuted = this.audio.muted;
    this.audio.muted = true;
    this.audio.volume = 0;
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.audio?.pause();
          this.audio!.currentTime = 0;
          this.isUnlocked = true;
          
          if (this.isSoundEnabled()) {
            this.audio!.muted = false;
            this.audio!.volume = 0.7;
          }
          
          console.log("[NotificationAudio] Áudio HTML desbloqueado!");
          
          // Executar play pendente
          if (this.pendingPlay && this.isSoundEnabled() && !this.isInPublicMenu()) {
            this.pendingPlay = false;
            setTimeout(() => this.play(), 50);
          } else {
            this.pendingPlay = false;
          }
        })
        .catch(() => {
          if (this.audio) {
            this.audio.muted = wasMuted;
          }
        });
    }
  }

  // Tocar usando Web Audio API (melhor para mobile)
  private playWithWebAudio(): boolean {
    if (!this.audioContext || !this.audioBuffer) return false;
    
    try {
      // Resumir contexto se necessário
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.7;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      console.log("[NotificationAudio] Som tocado via Web Audio API!");
      return true;
    } catch (e) {
      console.log("[NotificationAudio] Erro ao tocar via Web Audio:", e);
      return false;
    }
  }

  // Tocar usando HTML Audio
  private playWithHtmlAudio(): boolean {
    if (!this.audio) return false;
    
    this.audio.muted = false;
    this.audio.volume = 0.7;
    this.audio.currentTime = 0;
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("[NotificationAudio] Som tocado via HTML Audio!");
          this.isUnlocked = true;
        })
        .catch((err) => {
          console.log("[NotificationAudio] Erro HTML Audio:", err.message);
          if (!this.isUnlocked) {
            this.pendingPlay = true;
          }
        });
      return true;
    }
    return false;
  }

  play() {
    // Verificar se estamos no menu público
    if (this.isInPublicMenu()) {
      console.log("[NotificationAudio] No menu público, som bloqueado");
      return;
    }

    // Verificar se o estado foi carregado
    if (!this.soundStateLoaded) {
      console.log("[NotificationAudio] Estado ainda não carregado");
      return;
    }

    // Verificar se o som está habilitado
    if (!this.isSoundEnabled()) {
      console.log("[NotificationAudio] Som desabilitado");
      return;
    }

    console.log("[NotificationAudio] Tentando tocar som...", {
      isMobile: this.isMobile,
      userHasInteracted: this.userHasInteracted,
      isUnlocked: this.isUnlocked,
      hasAudioContext: !!this.audioContext,
      hasAudioBuffer: !!this.audioBuffer
    });

    // Em mobile, tentar Web Audio API primeiro (mais confiável)
    if (this.isMobile && this.userHasInteracted) {
      if (this.playWithWebAudio()) {
        return;
      }
    }

    // Fallback para HTML Audio
    this.playWithHtmlAudio();
  }

  // Método para verificar se o áudio está desbloqueado
  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  // Método para forçar desbloqueio (chamado em interação do usuário)
  unlock(): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.userHasInteracted = true;
      
      // Resumir AudioContext para mobile
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log("[NotificationAudio] AudioContext resumido no unlock");
        } catch (e) {
          console.log("[NotificationAudio] Erro ao resumir AudioContext:", e);
        }
      }
      
      if (this.isUnlocked) {
        resolve(true);
        return;
      }

      if (this.audio) {
        // Garantir que está mutado durante o desbloqueio
        this.audio.muted = true;
        this.audio.volume = 0;
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.audio?.pause();
              this.audio!.currentTime = 0;
              this.isUnlocked = true;
              
              // Restaurar volume se som habilitado
              if (this.isSoundEnabled()) {
                this.audio!.muted = false;
                this.audio!.volume = 0.7;
              }
              
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
