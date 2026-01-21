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

  // Ref para evitar chamadas duplicadas
  const initialFetchDone = useRef(false);

  // Query para buscar o estabelecimento do usuário
  const { data: establishment } = trpc.establishment.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Query para buscar pedidos novos (status = 'new') - SEM refetchInterval
  const { data: ordersData, refetch: refetchOrders } = trpc.orders.list.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { 
      enabled: !!establishment?.id && establishment.id > 0,
      refetchInterval: false, // Não usar polling, vamos usar SSE
      staleTime: 30000, // Considerar dados válidos por 30s
    }
  );

  // Usar o hook SSE compartilhado (não cria conexão própria)
  useOrdersSSE({
    establishmentId: establishment?.id,
    enabled: !!establishment?.id && establishment.id > 0,
    onNewOrder: useCallback(() => {
      // Quando um novo pedido chega, incrementar a contagem se não estiver na página de pedidos
      if (location !== "/pedidos") {
        setNewOrdersCount(prev => prev + 1);
      }
      // NÃO chamar refetchOrders aqui - o componente Pedidos.tsx já faz isso
      // Isso evita chamadas duplicadas de orders.list
    }, [location]),
    onOrderUpdate: useCallback(() => {
      // NÃO chamar refetchOrders aqui - o componente Pedidos.tsx já faz isso
      // Isso evita chamadas duplicadas de orders.list
    }, []),
  });

  // Calcular contagem de pedidos novos - APENAS UMA VEZ no mount
  useEffect(() => {
    if (ordersData?.orders && !initialFetchDone.current) {
      initialFetchDone.current = true;
      const newOrders = ordersData.orders.filter(order => order.status === 'new');
      // Contar apenas pedidos criados após o último timestamp visto
      const unseenNewOrders = newOrders.filter(order => {
        const orderTimestamp = new Date(order.createdAt).getTime();
        return orderTimestamp > lastSeenTimestamp;
      });
      setNewOrdersCount(unseenNewOrders.length);
    }
  }, [ordersData, lastSeenTimestamp]);

  // Zerar contagem quando entrar na página de pedidos
  useEffect(() => {
    if (location === "/pedidos") {
      const now = Date.now();
      setLastSeenTimestamp(now);
      localStorage.setItem("lastSeenOrdersTimestamp", String(now));
      setNewOrdersCount(0);
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
