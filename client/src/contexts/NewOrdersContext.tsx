import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

  // Usar o hook SSE compartilhado
  useOrdersSSE({
    establishmentId: establishment?.id,
    enabled: !!establishment?.id && establishment.id > 0,
    onNewOrder: useCallback(() => {
      // Quando um novo pedido chega via SSE, incrementar a contagem
      // independentemente de estar na página de pedidos ou não
      // O badge só aparece se não estiver na página de pedidos (verificado no render)
      setNewOrdersCount(prev => prev + 1);
      console.log("[NewOrders] Novo pedido recebido via SSE, incrementando contagem");
    }, []),
    onOrderUpdate: useCallback(() => {
      // Não fazer nada no update - a contagem é baseada em pedidos novos
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
