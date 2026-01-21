import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";

interface NewOrdersContextType {
  newOrdersCount: number;
  markOrdersAsSeen: () => void;
  incrementCount: () => void;
  decrementCount: () => void;
}

const NewOrdersContext = createContext<NewOrdersContextType | undefined>(undefined);

export function NewOrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem("lastSeenOrdersTimestamp");
    return saved ? parseInt(saved, 10) : 0;
  });

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

  // Ref para controle anti-spam do som (IDs de pedidos já notificados)
  const notifiedOrdersRef = useRef<Set<number>>(new Set());
  
  // Ref para o áudio de notificação
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Inicializar o áudio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Função para tocar o som de notificação
  const playNotificationSound = useCallback(() => {
    // Verificar se o som está habilitado no localStorage
    const soundEnabled = localStorage.getItem("cardapio_sound_enabled") === "true";
    if (!soundEnabled || !audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      audioRef.current.play().catch((error) => {
        console.warn("[NewOrders] Não foi possível tocar o som:", error);
      });
    } catch (error) {
      console.warn("[NewOrders] Erro ao tocar som:", error);
    }
  }, []);

  // Usar o hook SSE compartilhado
  useOrdersSSE({
    establishmentId: establishment?.id,
    enabled: !!establishment?.id && establishment.id > 0,
    onNewOrder: useCallback((order: { id: number; status: string }) => {
      // Quando um novo pedido chega via SSE, incrementar a contagem
      // independentemente de estar na página de pedidos ou não
      // O badge só aparece se não estiver na página de pedidos (verificado no render)
      setNewOrdersCount(prev => prev + 1);
      console.log("[NewOrders] Novo pedido recebido via SSE, incrementando contagem");
      
      // Tocar som apenas para pedidos novos (status === 'new') e que ainda não foram notificados
      if (order.status === 'new' && !notifiedOrdersRef.current.has(order.id)) {
        notifiedOrdersRef.current.add(order.id);
        playNotificationSound();
        console.log("[NewOrders] Som de notificação tocado para pedido:", order.id);
        
        // Limpar pedidos antigos do Set para evitar memory leak (manter últimos 100)
        if (notifiedOrdersRef.current.size > 100) {
          const arr = Array.from(notifiedOrdersRef.current);
          notifiedOrdersRef.current = new Set(arr.slice(-50));
        }
      }
    }, [playNotificationSound]),
    onOrderUpdate: useCallback(() => {
      // Não fazer nada no update - a contagem é baseada em pedidos novos
      // Não tocar som em mudanças de status (anti-spam)
    }, []),
  });

  // Calcular contagem inicial de pedidos novos quando os dados carregam
  useEffect(() => {
    if (ordersData?.orders) {
      const newOrders = ordersData.orders.filter(order => order.status === 'new');
      // Contar apenas pedidos criados após o último timestamp visto
      const unseenNewOrders = newOrders.filter(order => {
        const orderTimestamp = new Date(order.createdAt).getTime();
        return orderTimestamp > lastSeenTimestamp;
      });
      
      // Só atualizar se a contagem for diferente (evita loops)
      if (unseenNewOrders.length !== newOrdersCount && location !== "/pedidos") {
        setNewOrdersCount(unseenNewOrders.length);
        console.log("[NewOrders] Contagem inicial calculada:", unseenNewOrders.length);
      }
    }
  }, [ordersData, lastSeenTimestamp, location]);

  // Zerar contagem quando entrar na página de pedidos
  useEffect(() => {
    if (location === "/pedidos") {
      const now = Date.now();
      setLastSeenTimestamp(now);
      localStorage.setItem("lastSeenOrdersTimestamp", String(now));
      setNewOrdersCount(0);
      console.log("[NewOrders] Entrando na página de pedidos, zerando contagem");
    }
  }, [location]);

  const markOrdersAsSeen = useCallback(() => {
    const now = Date.now();
    setLastSeenTimestamp(now);
    localStorage.setItem("lastSeenOrdersTimestamp", String(now));
    setNewOrdersCount(0);
  }, []);

  const incrementCount = useCallback(() => {
    setNewOrdersCount(prev => prev + 1);
  }, []);

  const decrementCount = useCallback(() => {
    setNewOrdersCount(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <NewOrdersContext.Provider value={{ newOrdersCount, markOrdersAsSeen, incrementCount, decrementCount }}>
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
