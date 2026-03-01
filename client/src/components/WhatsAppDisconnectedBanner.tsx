import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { WifiOff, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "whatsapp-banner-dismissed";

export function WhatsAppDisconnectedBanner() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  });
  const [showBanner, setShowBanner] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  // Usar o getConfig que já existe — sem chamada extra
  const { data: config, refetch } = trpc.whatsapp.getConfig.useQuery(undefined, {
    // Refetch ao focar a janela (quando o usuário volta à aba)
    refetchOnWindowFocus: true,
  });

  // Determinar se o WhatsApp está desconectado
  // Só mostrar o banner se:
  // 1. O usuário já conectou pelo menos uma vez (tem instanceToken)
  // 2. E agora está desconectado (status !== 'connected')
  const hasEverConnected = config && config.instanceToken;
  const isDisconnected = hasEverConnected && config.status !== "connected";

  // Quando chega um novo pedido, re-verificar e forçar exibição se desconectado
  const handleNewOrder = useCallback(() => {
    refetch().then((result) => {
      const cfg = result.data;
      if (cfg && cfg.instanceToken && cfg.status !== "connected") {
        // Forçar exibição mesmo se o banner foi dismissido
        setForceShow(true);
        setDismissed(false);
        sessionStorage.removeItem(DISMISS_KEY);
      }
    });
  }, [refetch]);

  // Ouvir evento global de novo pedido
  useEffect(() => {
    window.addEventListener("new-order-notification", handleNewOrder);
    return () => {
      window.removeEventListener("new-order-notification", handleNewOrder);
    };
  }, [handleNewOrder]);

  // Controlar visibilidade do banner
  useEffect(() => {
    if (isDisconnected && !dismissed) {
      setShowBanner(true);
    } else if (!isDisconnected) {
      setShowBanner(false);
      setForceShow(false);
      // Limpar dismiss quando reconectar
      sessionStorage.removeItem(DISMISS_KEY);
    }
  }, [isDisconnected, dismissed]);

  // Forçar exibição quando novo pedido chega e está desconectado
  useEffect(() => {
    if (forceShow && isDisconnected) {
      setShowBanner(true);
    }
  }, [forceShow, isDisconnected]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setForceShow(false);
    sessionStorage.setItem(DISMISS_KEY, "true");
  };

  const handleReconnect = () => {
    // Disparar evento para a página de Pedidos abrir o modal de conexão
    window.dispatchEvent(new CustomEvent('open-whatsapp-modal'));
    // Navegar para Pedidos
    navigate("/pedidos");
  };

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "relative mx-3 lg:mx-6 mb-3 lg:mb-4 mt-0 rounded-xl overflow-hidden",
        "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg",
        "animate-in slide-in-from-bottom-2 fade-in duration-300"
      )}
    >
      {/* Efeito de pulso sutil no fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      
      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Ícone pulsante */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
          <div className="relative p-2 bg-white/20 rounded-full backdrop-blur-sm">
            <WifiOff className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            WhatsApp desconectado
          </p>
          <p className="text-xs text-white/80 leading-tight mt-0.5">
            Seus clientes não estão recebendo notificações dos pedidos
          </p>
        </div>

        {/* Botão reconectar */}
        <Button
          onClick={handleReconnect}
          size="sm"
          className="flex-shrink-0 bg-white text-red-600 hover:bg-white/90 font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-sm"
        >
          Reconectar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4 text-white/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
