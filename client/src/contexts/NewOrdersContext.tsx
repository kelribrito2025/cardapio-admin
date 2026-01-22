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
  
  // Ref para rastrear se já inicializamos
  const initializedRef = useRef(false);
  // Ref para a contagem atual (para evitar closure stale)
  const countRef = useRef(0);

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

  // Callback para novo pedido - usando ref para evitar stale closure
  const handleNewOrder = useCallback((order: unknown) => {
    // Incrementar usando ref para garantir valor atualizado
    countRef.current = countRef.current + 1;
    setNewOrdersCount(countRef.current);
    console.log("[NewOrders] Novo pedido recebido via SSE:", order);
    console.log("[NewOrders] Nova contagem:", countRef.current);
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
