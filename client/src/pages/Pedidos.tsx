import { AdminLayout } from "@/components/AdminLayout";
import { useSearch } from "@/contexts/SearchContext";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  RefreshCw,
  Printer,
  Smartphone,
  MessageCircle,
  Mail,
  Calendar,
  User,
  Trash2,
  Edit,
  ArrowLeft,
  Bike,
  Plus,
  MoreVertical,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Inbox,
  Wifi,
  WifiOff,
  Link2Off,
  QrCode,
  Star,
  LayoutGrid,
  List,
  Eye,
  Info,
  Send,
  Video,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus = "new" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

// Configuração das colunas Kanban
const kanbanColumns = [
  {
    id: "new" as OrderStatus,
    title: "Novos",
    color: "blue",
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
    placeholderBorder: "border-blue-300 dark:border-blue-800",
    placeholderBg: "bg-blue-50 dark:bg-blue-950/30",
    placeholderText: "text-blue-500",
    tabBg: "bg-blue-100 dark:bg-blue-950/50",
    tabText: "text-blue-700 dark:text-blue-300",
    tabBorder: "border-blue-200 dark:border-blue-800",
    badgeBg: "bg-blue-500",
    icon: Clock,
  },
  {
    id: "preparing" as OrderStatus,
    title: "Preparo",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-600",
    dotColor: "bg-red-500",
    placeholderBorder: "border-red-300 dark:border-red-800",
    placeholderBg: "bg-red-50/50 dark:bg-red-950/30",
    placeholderText: "text-red-500",
    tabBg: "bg-red-100 dark:bg-red-950/50",
    tabText: "text-red-700 dark:text-red-300",
    tabBorder: "border-red-200 dark:border-red-800",
    badgeBg: "bg-red-500",
    icon: ChefHat,
  },
  {
    id: "ready" as OrderStatus,
    title: "Prontos",
    color: "emerald",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    placeholderBorder: "border-emerald-300 dark:border-emerald-800",
    placeholderBg: "bg-emerald-50/50 dark:bg-emerald-950/30",
    placeholderText: "text-emerald-500",
    tabBg: "bg-emerald-100 dark:bg-emerald-950/50",
    tabText: "text-emerald-700 dark:text-emerald-300",
    tabBorder: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-500",
    icon: Package,
  },
  {
    id: "completed" as OrderStatus,
    title: "Completos",
    color: "gray",
    borderColor: "border-t-muted-foreground/50",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
    placeholderBorder: "border-border",
    placeholderBg: "bg-muted/50",
    placeholderText: "text-muted-foreground",
    tabBg: "bg-gray-200 dark:bg-gray-800",
    tabText: "text-gray-700 dark:text-gray-300",
    tabBorder: "border-gray-300 dark:border-gray-700",
    badgeBg: "bg-gray-400",
    icon: CheckCircle2,
  },
  {
    id: "cancelled" as OrderStatus,
    title: "Cancelados",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-950/50",
    iconColor: "text-red-600",
    dotColor: "bg-red-500",
    placeholderBorder: "border-red-300 dark:border-red-800",
    placeholderBg: "bg-red-50 dark:bg-red-950/30",
    placeholderText: "text-red-500",
    tabBg: "bg-red-100 dark:bg-red-950/50",
    tabText: "text-red-700 dark:text-red-300",
    tabBorder: "border-red-200 dark:border-red-800",
    badgeBg: "bg-red-500",
    icon: XCircle,
  },
];

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", badgeBg: "#3b82f6", badgeText: "#ffffff" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#dc2626", badgeText: "#ffffff" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", badgeBg: "#059669", badgeText: "#ffffff" },
  out_for_delivery: { label: "Em entrega", variant: "info", icon: Bike, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", badgeBg: "#ea580c", badgeText: "#ffffff" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-muted-foreground", bgColor: "bg-muted", badgeBg: "#6b7280", badgeText: "#ffffff" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", badgeBg: "#dc2626", badgeText: "#ffffff" },
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: CreditCard },
  boleto: { label: "Boleto", icon: CreditCard },
  card_online: { label: "Cartão Online", icon: CreditCard },
};

export default function Pedidos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearColumnTarget, setClearColumnTarget] = useState<OrderStatus | null>(null);
  // Estado para controlar expansão das colunas no mobile (acordeão)
  const [expandedColumns, setExpandedColumns] = useState<Set<OrderStatus>>(() => new Set<OrderStatus>(["new"]));
  // Estado para limpeza manual visual das colunas (sem apagar do banco)
  // Persistido no localStorage para sobreviver ao refresh, com reset automático à meia-noite
  const [manuallyClearedColumns, setManuallyClearedColumns] = useState<Set<OrderStatus>>(() => {
    try {
      const stored = localStorage.getItem('clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar se o timestamp de limpeza é do mesmo dia (timezone do restaurante)
        const clearedDate = new Date(parsed.timestamp);
        const now = new Date();
        // Se o dia mudou, limpar o localStorage (reset à meia-noite)
        if (clearedDate.toDateString() !== now.toDateString()) {
          localStorage.removeItem('clearedColumns');
          return new Set();
        }
        return new Set(parsed.columns as OrderStatus[]);
      }
    } catch {}
    return new Set();
  });
  // Estado para controlar loading do WhatsApp
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  // Estado para o modal de QR Code do WhatsApp
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [isPollingQrCode, setIsPollingQrCode] = useState(false);
  // Estado para rastrear qual pedido está com loading de ação
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  // Estado para alternar entre visualização kanban e lista compacta
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    try {
      return (localStorage.getItem('pedidos_viewMode') as 'kanban' | 'list') || 'kanban';
    } catch { return 'kanban'; }
  });
  // Estado para filtro de status na lista compacta
  const [listStatusFilter, setListStatusFilter] = useState<OrderStatus | 'all'>('all');
  // Estado para o modal informativo de WhatsApp
  const [whatsappInfoModalOpen, setWhatsappInfoModalOpen] = useState(false);
  const [whatsappMsgIndex, setWhatsappMsgIndex] = useState(0);
  const [whatsappMsgFading, setWhatsappMsgFading] = useState(false);
  const [, navigate] = useLocation();

  // Estado para modal de onboarding contextual ao mudar status do pedido
  const [statusOnboardingModal, setStatusOnboardingModal] = useState<{
    open: boolean;
    statusType: 'preparing' | 'ready' | 'completed' | null;
    orderId: number | null;
    dontShowAgain: boolean;
  }>({ open: false, statusType: null, orderId: null, dontShowAgain: false });

  // Carrossel de mensagens do modal WhatsApp (estabilizado com useMemo)
  const whatsappMessages = useMemo(() => [
    {
      text: <>Olá <strong>João Silva!</strong> Boa tarde, Tudo bem?</>,
      text2: <>Seu pedido <strong>#1234</strong> foi recebido com sucesso!</>,
      items: ['• 1x Pizza Margherita', '• 1x Refrigerante'],
      time: '12:20',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> está sendo preparado! 👨‍🍳</>,
      items: ['Tempo estimado: 25 min'],
      time: '12:25',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> saiu para entrega! 🚨</>,
      items: ['Entregador: Carlos', 'Previsão: 15 min'],
      time: '12:45',
    },
    {
      text: <>Olá <strong>João Silva!</strong></>,
      text2: <>Seu pedido <strong>#1234</strong> foi entregue! ✅</>,
      items: ['Obrigado pela preferência!'],
      time: '13:00',
    },
  ], []);

  useEffect(() => {
    if (!whatsappInfoModalOpen) return;
    const interval = setInterval(() => {
      setWhatsappMsgFading(true);
      setTimeout(() => {
        setWhatsappMsgIndex((prev) => (prev + 1) % whatsappMessages.length);
        setWhatsappMsgFading(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [whatsappInfoModalOpen, whatsappMessages.length]);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const utils = trpc.useUtils();
  
  // Query para status do WhatsApp (com polling quando modal está aberto)
  const { data: whatsappStatus, refetch: refetchWhatsappStatus, isLoading: isWhatsappLoading, isFetched: isWhatsappFetched } = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: isPollingQrCode ? 3000 : 30000,
  });
  
  // Query para configurações do WhatsApp (notificações ativas)
  const { data: whatsappConfig } = trpc.whatsapp.getConfig.useQuery();

  // Mutation para conectar WhatsApp (gera QR Code)
  const connectWhatsapp = trpc.whatsapp.connect.useMutation({
    onSuccess: (data) => {
      if (data.qrcode) {
        toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        setIsPollingQrCode(true);
      } else if (data.status === 'connected') {
        toast.success("WhatsApp já está conectado!");
        setQrCodeModalOpen(false);
      }
      refetchWhatsappStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar WhatsApp");
    },
  });
  
  // Mutation para desconectar WhatsApp
  const disconnectWhatsapp = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso");
      setIsPollingQrCode(false);
      refetchWhatsappStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar WhatsApp");
    },
  });
  
  // Parar polling quando conectado
  useEffect(() => {
    if (whatsappStatus?.status === 'connected' && isPollingQrCode) {
      setIsPollingQrCode(false);
      setQrCodeModalOpen(false);
      toast.success("WhatsApp conectado com sucesso!");
    }
  }, [whatsappStatus?.status, isPollingQrCode]);

  // Modal informativo: exibir APENAS uma vez para novos usuários que nunca conectaram WhatsApp
  useEffect(() => {
    if (!isWhatsappFetched || isWhatsappLoading) return;
    
    // Se WhatsApp está conectado, nunca mostrar o modal e marcar como visto permanentemente
    if (whatsappStatus?.status === 'connected') {
      localStorage.setItem('whatsapp-info-modal-seen', 'true');
      setWhatsappInfoModalOpen(false);
      return;
    }
    
    // Verificar se já foi dispensado permanentemente (localStorage persiste entre sessões)
    const alreadySeen = localStorage.getItem('whatsapp-info-modal-seen');
    if (alreadySeen) return;
    
    // Mostrar modal apenas para novos usuários que nunca viram
    setWhatsappInfoModalOpen(true);
  }, [isWhatsappFetched, isWhatsappLoading, whatsappStatus?.status]);
  
  // Query para buscar todos os pedidos
  const { data: allOrdersData, refetch: refetchAll, isLoading } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId ?? 0,
    },
    { 
      enabled: !!establishmentId && establishmentId > 0,
      refetchInterval: false,
    }
  );

  // Handlers para eventos SSE
  const handleNewOrder = useCallback(() => {
    refetchAll();
    // Toast agora é disparado globalmente pelo AdminLayout via evento 'new-order-notification'
    // Não duplicar aqui
  }, [refetchAll]);

  const handleOrderUpdate = useCallback(() => {
    refetchAll();
  }, [refetchAll]);

  const handleSSEConnected = useCallback(() => {
    console.log("[Pedidos] SSE conectado - tempo real ativado");
  }, []);

  const handleSSEDisconnected = useCallback(() => {
    console.log("[Pedidos] SSE desconectado - ativando fallback de polling");
    refetchAll();
  }, [refetchAll]);

  // Hook SSE para receber pedidos em tempo real
  const { status: sseStatus, isConnected: sseConnected } = useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onConnected: handleSSEConnected,
    onDisconnected: handleSSEDisconnected,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Fallback: polling a cada 30 segundos se SSE não estiver conectado
  useEffect(() => {
    if (!establishmentId || sseConnected) return;
    
    const interval = setInterval(() => {
      console.log("[Pedidos] Polling fallback - SSE não conectado");
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [establishmentId, sseConnected, refetchAll]);

  const allOrders = allOrdersData?.orders || [];

  const { data: orderDetails } = trpc.orders.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  // Query para buscar configurações de impressão (para saber o método favorito)
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );

  // Query para verificar se existem entregadores ativos (fluxo inteligente de entrega)
  const { data: activeDriversList } = trpc.driver.listActive.useQuery(
    undefined,
    { enabled: !!establishmentId && establishmentId > 0 }
  );
  const hasActiveDrivers = (activeDriversList?.length ?? 0) > 0;

  // Mutation para atualizar método de impressão favorito
  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });

  // Função para alternar o método de impressão favorito
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    console.log('[Favorito] Clicou para mudar para:', method);
    console.log('[Favorito] establishmentId:', establishmentId);
    console.log('[Favorito] printerSettings atual:', printerSettings);
    if (!establishmentId) {
      console.log('[Favorito] Sem establishmentId, retornando');
      return;
    }
    console.log('[Favorito] Chamando mutation...');
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

  // Verificar se o usuário tem API Key gerada (Mindi Printer conectado)
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;

  // Hook para gerenciar contagem de pedidos novos na sidebar
  const { decrementCount } = useNewOrders();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onMutate: async (variables) => {
      console.log("[Pedidos] Optimistic update iniciado", { orderId: variables.id, newStatus: variables.status });
      
      await utils.orders.list.cancel();
      
      const previousAllOrders = utils.orders.list.getData({ establishmentId: establishmentId ?? 0 });
      
      utils.orders.list.setData(
        { establishmentId: establishmentId ?? 0 },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map(order => 
              order.id === variables.id 
                ? { ...order, status: variables.status, cancellationReason: variables.cancellationReason || order.cancellationReason }
                : order
            ),
          };
        }
      );
      
      // Decrementar badge se estava como "new"
      const order = previousAllOrders?.orders?.find(o => o.id === variables.id);
      if (order?.status === "new" && variables.status !== "new") {
        decrementCount();
      }
      
      return { previousAllOrders };
    },
    onError: (err, variables, context) => {
      console.error("[Pedidos] Erro ao atualizar status:", err);
      if (context?.previousAllOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0 },
          context.previousAllOrders
        );
      }
      toast.error("Erro ao atualizar status do pedido");
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
    onSuccess: (result: any, variables) => {
      // Interceptar resposta de múltiplos entregadores no aceite (on_accepted)
      if (result?.action === 'choose_driver_on_accept' && result?.drivers?.length > 0) {
        setDriverModalOrderId(result.orderId);
        setDriverModalDrivers(result.drivers);
        setDriverModalContext('accept');
        setDriverModalOpen(true);
        toast.info("Selecione o entregador para este pedido");
        return;
      }
      const statusLabels: Record<string, string> = {
        preparing: "Pedido aceito e em preparo!",
        ready: "Pedido pronto para entrega!",
        completed: "Pedido finalizado!",
        cancelled: "Pedido cancelado.",
      };
      toast.success(statusLabels[variables.status] || "Status atualizado!");
    },
  });

  // Função para imprimir pedido - usa iframe oculto para não abrir nova janela
  // Usa a mesma API de recibo que a aba de recibo para garantir consistência
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    
    const receiptUrl = `${window.location.origin}/api/print/receipt/${orderDetails.id}`;
    
    // Criar iframe oculto para impressão
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = receiptUrl;
    
    document.body.appendChild(iframe);
    
    // Aguardar o iframe carregar e chamar print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remover iframe após impressão (com delay para garantir que o diálogo de impressão abriu)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  // Função para imprimir via API térmica
  const handlePrintThermal = async (orderId: number) => {
    try {
      const response = await fetch(`/api/print/order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success("Pedido enviado para impressão térmica!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao enviar para impressão");
      }
    } catch (error) {
      toast.error("Erro ao conectar com a impressora");
    }
  };

  // Função para imprimir via Multi Printer
  const handlePrintMultiPrinter = async (orderId: number) => {
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) {
      toast.info("Para impressão em múltiplas impressoras, use um dispositivo Android com o app Multi Printer Network Print Service.");
      return;
    }
    
    try {
      // Buscar deep link do servidor
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-sectors/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        // Abrir o deep link para o app Multi Printer
        window.location.href = data.deepLink;
        toast.success(`Enviando para ${data.printers.length} impressora(s)...`);
      } else {
        toast.error(data.error || "Erro ao gerar link de impressão");
      }
    } catch (error) {
      console.error("Erro ao imprimir em múltiplas impressoras:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Função para imprimir direto (sem abrir detalhes)
  // Usa iframe oculto para não abrir nova aba - abre direto o diálogo de impressão
  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      
      // Criar iframe oculto para impressão
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      
      document.body.appendChild(iframe);
      
      // Aguardar o iframe carregar e chamar print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remover iframe após impressão (com delay para garantir que o diálogo de impressão abriu)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      toast.error("Erro ao imprimir pedido");
    }
  };

  // Função antiga mantida para referência (não utilizada)
  const handlePrintOrderDirectOld = async (orderId: number) => {
    try {
      const orderData = allOrders.find(o => o.id === orderId);
      if (!orderData) {
        toast.error("Pedido não encontrado");
        return;
      }
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        toast.error("Não foi possível abrir a janela de impressão.");
        return;
      }
      
      const itemsHtml = orderData.items?.map((item: any) => {
        const complementsHtml = item.complements && item.complements.length > 0
          ? item.complements.map((c: any) => {
              const qty = c.quantity || 1;
              const price = Number(c.price || 0);
              const totalPrice = price * qty;
              const priceStr = totalPrice > 0 ? ` R$ ${totalPrice.toFixed(2).replace('.', ',')}` : '';
              const qtyStr = qty > 1 ? `${qty}x ` : '';
              return `<div class="item-complement">+ ${qtyStr}${c.name}${priceStr}</div>`;
            }).join('')
          : '';
        return `
          <div class="item">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x ${item.productName.toUpperCase()}</span>
              <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
            </div>
            ${complementsHtml}
            ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
          </div>
        `;
      }).join('') || '';
      
      const discount = orderData.discount ? Number(orderData.discount) : 0;
      const deliveryBadge = orderData.deliveryType === 'delivery' ? 'ENTREGA' : orderData.deliveryType === 'dine_in' ? 'CONSUMO LOCAL' : 'RETIRADA';
      const deliveryText = orderData.deliveryType === 'delivery' 
        ? `Entrega: ${orderData.customerAddress || 'Endereço não informado'}` 
        : orderData.deliveryType === 'dine_in'
        ? 'Consumo no local: Cliente irá consumir no estabelecimento'
        : 'Retirada: Cliente irá retirar no estabelecimento';
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; padding: 15px; max-width: 320px; margin: 0 auto; background: #fff; color: #333; }
            .receipt { background: #fff; padding: 5px; }
            .logo { text-align: center; padding-bottom: 15px; margin-bottom: 10px; }
            .logo h1 { font-size: 20px; font-weight: bold; margin: 0; }
            .logo p { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
            .order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
            .order-header h2 { font-size: 16px; font-weight: bold; margin: 0; }
            .badge { background: #333; color: #fff; padding: 4px 10px; font-size: 10px; font-weight: bold; border-radius: 3px; }
            .order-date { font-size: 11px; color: #666; margin-bottom: 12px; display: flex; align-items: center; gap: 5px; }
            .divider-dashed { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
            .item { margin-bottom: 8px; }
            .item-header { display: flex; justify-content: space-between; font-weight: 500; font-size: 13px; }
            .item-obs { font-size: 11px; color: #666; margin-top: 2px; padding-left: 5px; }
            .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
            .totals { margin: 12px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .total-highlight { background: #333; color: #fff; padding: 8px 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; }
            .info-card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
            .info-card-row { display: flex; justify-content: space-between; align-items: center; }
            .info-card-label { font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px; }
            .info-card-value { font-size: 13px; font-weight: 500; }
            .info-card-text { font-size: 12px; color: #444; margin-top: 2px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; }
            .footer p { font-size: 11px; color: #666; line-height: 1.5; }
            @media print { body { padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">
              <h1>${establishment?.name || 'Cardápio'}</h1>
              <p>Sistema de Pedidos</p>
            </div>
            
            <div class="order-header">
              <h2>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</h2>
              <span class="badge">${deliveryBadge}</span>
            </div>
            <div class="order-date">
              📅 ${format(new Date(orderData.createdAt), "dd/MM/yyyy")}, ${format(new Date(orderData.createdAt), "HH:mm")}
            </div>
            
            <hr class="divider-dashed">
            
            <div class="items">${itemsHtml}</div>
            
            <hr class="divider-dashed">
            
            <div class="totals">
              <div class="total-row"><span>Subtotal:</span><span>R$ ${Number(orderData.subtotal).toFixed(2).replace('.', ',')}</span></div>
              ${orderData.couponCode ? `<div class="total-row"><span>Cupom:</span><span>${orderData.couponCode}</span></div>` : ''}
              ${discount > 0 ? `<div class="total-row"><span>Desconto:</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
              ${Number(orderData.deliveryFee) > 0 ? `<div class="total-row"><span>Taxa entrega:</span><span>R$ ${Number(orderData.deliveryFee).toFixed(2).replace('.', ',')}</span></div>` : ''}
            </div>
            
            <div class="total-highlight">
              <span>TOTAL:</span>
              <span>R$ ${Number(orderData.total).toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div style="margin-top: 15px;">
              <div class="info-card">
                <div class="info-card-text">${deliveryText}</div>
              </div>
              
              <div class="info-card">
                <div class="info-card-row">
                  ${orderData.paymentMethod === 'card_online' 
                    ? `<span class="info-card-label">💰 Pagamento confirmado \u2013 Cart\u00e3o online</span>`
                    : `<span class="info-card-label">💰 Pagamento</span>
                       <span class="info-card-value">${(paymentMethodLabels[orderData.paymentMethod]?.label || orderData.paymentMethod).toUpperCase()}</span>`
                  }
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-card-row">
                  <span class="info-card-label">☆ Cliente</span>
                  <span class="info-card-value">${orderData.customerName || 'Não informado'} - ${orderData.customerPhone || ''}</span>
                </div>
              </div>
            </div>
            
            ${orderData.notes ? `<div class="info-card" style="margin-top: 10px;"><div class="info-card-label">📝 Observações</div><div class="info-card-text">${orderData.notes}</div></div>` : ''}
            
            <div class="footer">
              <p>Pedido realizado via Cardápio Admin<br>manus.space</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      toast.error("Erro ao imprimir pedido");
    }
  };

  // Nota: Removido bloqueio para usuários sem estabelecimento - agora a página de Pedidos mostra normalmente

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  // Helper: verificar se o modal de onboarding de status já foi dispensado
  const isStatusOnboardingDismissed = (statusType: 'preparing' | 'ready' | 'completed'): boolean => {
    if (!establishmentId) return true;
    try {
      return localStorage.getItem(`onboarding_modal_dismissed_${establishmentId}_${statusType}`) === 'true';
    } catch {
      return false;
    }
  };

  // Helper: verificar se a notificação correspondente está ativa
  const isNotificationActive = (statusType: 'preparing' | 'ready' | 'completed'): boolean => {
    if (!whatsappConfig) return false;
    if (whatsappStatus?.status !== 'connected') return false;
    switch (statusType) {
      case 'preparing': return whatsappConfig.notifyOnPreparing ?? true;
      case 'ready': return whatsappConfig.notifyOnReady ?? true;
      case 'completed': return whatsappConfig.notifyOnCompleted ?? false;
      default: return false;
    }
  };

  // Helper: salvar preferência de "não mostrar novamente"
  const dismissStatusOnboarding = (statusType: 'preparing' | 'ready' | 'completed') => {
    if (!establishmentId) return;
    try {
      localStorage.setItem(`onboarding_modal_dismissed_${establishmentId}_${statusType}`, 'true');
    } catch {}
  };

  // Executar a mudança de status real (chamado após o modal ou diretamente)
  const executeStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    // Smart driver assignment: intercept when marking as "ready" for DELIVERY orders only
    if (newStatus === "ready") {
      const order = allOrders.find((o: any) => o.id === orderId);
      const isDeliveryOrder = order?.deliveryType === 'delivery';

      if (isDeliveryOrder) {
        setLoadingOrderId(orderId);
        markReadyAndAssignMutation.mutate(
          { orderId },
          {
            onSettled: () => {
              setLoadingOrderId(null);
            },
          }
        );
        return;
      }
    }

    setLoadingOrderId(orderId);
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSettled: () => {
          setLoadingOrderId(null);
        },
      }
    );
    
    if (newStatus === "preparing") {
      const printMethod = printerSettings?.defaultPrintMethod || 'normal';
      
      if (printMethod === 'automatic') {
        toast.success("📦 Pedido aceito!", {
          description: "Impressão automática enviada para o Mindi Printer.",
          duration: 4000,
        });
      } else {
        toast.success("📦 Pedido aceito!", {
          description: "Abrindo tela de impressão...",
          duration: 4000,
        });
        
        setTimeout(() => {
          handlePrintOrderDirect(orderId);
        }, 300);
      }
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    // Verificar se devemos mostrar o modal de onboarding contextual
    const statusType = newStatus as 'preparing' | 'ready' | 'completed';
    
    // Se existem entregadores e o pedido é delivery, pular o modal de "Pronto"
    // O entregador controla o fluxo via WhatsApp
    if (statusType === 'ready' && hasActiveDrivers) {
      const order = allOrders.find((o: OrderItem) => o.id === orderId);
      if (order?.deliveryType === 'delivery') {
        // Executar diretamente sem modal
        executeStatusUpdate(orderId, newStatus);
        return;
      }
    }
    
    if (
      (statusType === 'preparing' || statusType === 'ready' || statusType === 'completed') &&
      isNotificationActive(statusType) &&
      !isStatusOnboardingDismissed(statusType)
    ) {
      // Mostrar modal informativo antes de executar a ação
      setStatusOnboardingModal({
        open: true,
        statusType,
        orderId,
        dontShowAgain: false,
      });
      return;
    }

    // Sem modal: executar diretamente
    executeStatusUpdate(orderId, newStatus);
  };

  // Handler para confirmar ação no modal de onboarding
  const handleStatusOnboardingConfirm = () => {
    const { statusType, orderId, dontShowAgain } = statusOnboardingModal;
    if (!statusType || !orderId) return;

    // Salvar preferência se marcou "não mostrar novamente"
    if (dontShowAgain) {
      dismissStatusOnboarding(statusType);
    }

    // Fechar modal
    setStatusOnboardingModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });

    // Executar a ação
    executeStatusUpdate(orderId, statusType);
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      updateStatusMutation.mutate(
        { id: orderToCancel, status: "cancelled", cancellationReason: cancellationReason || undefined },
        {
          onSuccess: () => {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
            setCancellationReason("");
          },
        }
      );
    }
  };

  // Driver assignment states
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverModalOrderId, setDriverModalOrderId] = useState<number | null>(null);
  const [driverModalDrivers, setDriverModalDrivers] = useState<Array<{ id: number; name: string; whatsapp: string }>>([]);
  const [assigningDriverId, setAssigningDriverId] = useState<number | null>(null);
  // Context: 'accept' = modal opened on order accept (on_accepted), 'ready' = modal opened on mark ready
  const [driverModalContext, setDriverModalContext] = useState<'accept' | 'ready'>('ready');

  // Mutation for assigning driver on accept (doesn't change order status)
  const assignDriverOnAcceptMutation = trpc.driver.assignToOrder.useMutation({
    onSuccess: (result) => {
      toast.success("Entregador atribuído!" + (result.whatsappSent ? " Notificação enviada via WhatsApp." : ""));
      setDriverModalOpen(false);
      setDriverModalOrderId(null);
      setAssigningDriverId(null);
      setDriverModalContext('ready');
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atribuir entregador");
      setAssigningDriverId(null);
    },
  });

  // Smart driver assignment mutation
  const markReadyAndAssignMutation = trpc.orders.markReadyAndAssign.useMutation({
    onSuccess: (result, variables) => {
      if (result.action === 'marked_ready') {
        // No active drivers, just marked as ready
        toast.success("Pedido pronto para entrega!");
      } else if (result.action === 'choose_driver') {
        // Multiple drivers, show modal
        setDriverModalOrderId(variables.orderId);
        setDriverModalDrivers(result.drivers || []);
        setDriverModalOpen(true);
        toast.info("Selecione o entregador para este pedido");
      } else if (result.action === 'assigned') {
        // Auto-assigned or manually selected
        toast.success("Pedido em entrega!" + (result.whatsappSent ? " Notificação enviada ao entregador." : ""));
        setDriverModalOpen(false);
        setDriverModalOrderId(null);
        setAssigningDriverId(null);
      }
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atribuir entregador");
      setAssigningDriverId(null);
    },
  });

  const getNextAction = (status: OrderStatus, order?: OrderItem): { label: string; newStatus: OrderStatus; disabled?: boolean; driverControlled?: boolean } | null => {
    switch (status) {
      case "new":
        return { label: "Aceitar", newStatus: "preparing" };
      case "preparing":
        return { label: "Pronto", newStatus: "ready" };
      case "ready":
      case "out_for_delivery":
        // Se existem entregadores e o pedido é delivery, o entregador controla a finalização
        if (hasActiveDrivers && order?.deliveryType === 'delivery') {
          return { label: "Entregador", newStatus: "completed", disabled: true, driverControlled: true };
        }
        return { label: "Finalizar", newStatus: "completed" };
      default:
        return null;
    }
  };

  // Função para toggle de expansão das colunas no mobile
  const toggleColumnExpansion = (columnId: OrderStatus) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  // Filtrar pedidos completos e cancelados para mostrar apenas os do dia atual (timezone do restaurante)
  const getTodayStartInTimezone = (tz: string): Date => {
    // Obter a data/hora atual no timezone do restaurante
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now); // formato YYYY-MM-DD
    // Criar data de início do dia no timezone do restaurante
    const [year, month, day] = todayStr.split('-').map(Number);
    // Converter 00:00 do timezone do restaurante para UTC usando Intl
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    });
    const parts = utcFormatter.formatToParts(now);
    const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || '';
    // Parse offset como GMT-3, GMT+5:30, etc.
    const offsetMatch = tzOffset.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
    let offsetMinutes = 0;
    if (offsetMatch) {
      const sign = offsetMatch[1] === '-' ? -1 : 1;
      const hours = parseInt(offsetMatch[2] || '0');
      const mins = parseInt(offsetMatch[3] || '0');
      offsetMinutes = sign * (hours * 60 + mins);
    }
    // 00:00 no timezone do restaurante = 00:00 - offset em UTC
    const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);
    return todayStart;
  };

  const restaurantTimezone = establishment?.timezone || 'America/Sao_Paulo';
  const todayStart = getTodayStartInTimezone(restaurantTimezone);

  // Busca global
  const { searchQuery: globalSearch } = useSearch();

  // Filtrar pedidos pela busca global (número do pedido, nome do cliente)
  const filteredOrders = useMemo(() => {
    if (!allOrders || !globalSearch.trim()) return allOrders;
    const term = globalSearch.toLowerCase().trim();
    return allOrders.filter((o: typeof allOrders[number]) =>
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.customerName && o.customerName.toLowerCase().includes(term)) ||
      (o.customerPhone && o.customerPhone.includes(term))
    );
  }, [allOrders, globalSearch]);

  // Estado para guardar o timestamp de quando cada coluna foi limpa manualmente
  const [clearTimestamps, setClearTimestamps] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('clearedColumns');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar se é do mesmo dia
        const clearedDate = new Date(parsed.timestamp || parsed.clearedAt?.completed || parsed.clearedAt?.cancelled || Date.now());
        const now = new Date();
        if (clearedDate.toDateString() !== now.toDateString()) {
          localStorage.removeItem('clearedColumns');
          return {};
        }
        return parsed.clearedAt || {};
      }
    } catch {}
    return {};
  });

  // Agrupar pedidos por status para o Kanban
  type OrderItem = typeof allOrders[number];
  const ordersByStatus: Record<string, OrderItem[]> = {
    new: filteredOrders?.filter((o: OrderItem) => o.status === "new") ?? [],
    preparing: filteredOrders?.filter((o: OrderItem) => o.status === "preparing") ?? [],
    ready: filteredOrders?.filter((o: OrderItem) => o.status === "ready" || o.status === "out_for_delivery") ?? [],
    completed: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "completed") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      if (orderTime < todayStart) return false; // Limpeza automática diária
      // Limpeza manual: esconder apenas pedidos anteriores ao timestamp de limpeza
      if (clearTimestamps.completed) {
        const clearedAt = new Date(clearTimestamps.completed);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
    cancelled: filteredOrders?.filter((o: OrderItem) => {
      if (o.status !== "cancelled") return false;
      const orderTime = new Date(o.updatedAt || o.createdAt);
      if (orderTime < todayStart) return false; // Limpeza automática diária
      // Limpeza manual: esconder apenas pedidos anteriores ao timestamp de limpeza
      if (clearTimestamps.cancelled) {
        const clearedAt = new Date(clearTimestamps.cancelled);
        if (orderTime <= clearedAt) return false;
      }
      return true;
    }) ?? [],
  };

  // Verificar se o dia mudou (reset automático à meia-noite do timezone do restaurante)
  useEffect(() => {
    if (manuallyClearedColumns.size === 0) return;
    const checkReset = () => {
      try {
        const stored = localStorage.getItem('clearedColumns');
        if (stored) {
          const parsed = JSON.parse(stored);
          const clearedAt = new Date(parsed.timestamp);
          // Comparar usando todayStart: se o timestamp da limpeza é anterior ao início do dia atual, resetar
          if (clearedAt < todayStart) {
            localStorage.removeItem('clearedColumns');
            setManuallyClearedColumns(new Set());
          }
        }
      } catch {}
    };
    checkReset();
    // Verificar a cada minuto
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [todayStart, manuallyClearedColumns.size]);

  // Handler para limpeza manual de coluna (persiste no localStorage)
  const handleManualClear = (columnId: OrderStatus) => {
    const now = new Date().toISOString();
    setClearTimestamps(prev => {
      const next = { ...prev, [columnId]: now };
      // Persistir no localStorage
      try {
        localStorage.setItem('clearedColumns', JSON.stringify({
          clearedAt: next,
          timestamp: now,
        }));
      } catch {}
      return next;
    });
    // Manter compatibilidade com manuallyClearedColumns para o estado visual
    setManuallyClearedColumns(prev => {
      const next = new Set(prev);
      next.add(columnId);
      return next;
    });
    toast.success(columnId === "completed" ? "Pedidos completos limpos" : "Pedidos cancelados limpos");
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
        />
        {/* Toggle Kanban/Lista + WhatsApp Status */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Toggle de visualização */}
          <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
            <button
              onClick={() => { setViewMode('kanban'); localStorage.setItem('pedidos_viewMode', 'kanban'); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'kanban' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('pedidos_viewMode', 'list'); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'list' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap",
            !isWhatsappFetched || isWhatsappLoading
              ? "bg-muted/50 border-border text-muted-foreground"
              : whatsappStatus?.status === 'connected'
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          )} style={{height: '35px'}}>
            {/* Status com Tooltip do número conectado */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default">
                  {!isWhatsappFetched || isWhatsappLoading ? (
                    /* Estado de carregamento */
                    <>
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : whatsappStatus?.status === 'connected' ? (
                    /* Conectado */
                    <>
                      <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" style={{width: '10px', height: '10px'}} />
                      <span style={{fontSize: '13px'}}>Conectado</span>
                    </>
                  ) : (
                    /* Desconectado */
                    <>
                      <span className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" style={{width: '10px', height: '10px'}} />
                      <span>Offline</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {whatsappStatus?.status === 'connected' && whatsappStatus?.phone ? (
                  <p>Número conectado:<br/><strong>{whatsappStatus.phone.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 $1 $2-$3').replace(/^55(\d{2})(\d{4})(\d{4})$/, '+55 $1 $2-$3')}</strong></p>
                ) : (
                  <p>Nenhum número conectado</p>
                )}
              </TooltipContent>
            </Tooltip>
            
            {/* Botões de ação - só mostra após carregar */}
            {isWhatsappFetched && !isWhatsappLoading && (
              <>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-1">
                  {whatsappStatus?.status === 'connected' ? (
                /* Quando conectado: Desconectar */
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-500"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
                            disconnectWhatsapp.mutate();
                          }
                        }}
                        disabled={disconnectWhatsapp.isPending}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Desconectar WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>
              ) : (
                /* Quando desconectado: Conectar via QR Code */
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 hover:bg-muted/50 gap-1.5"
                        onClick={() => {
                          setQrCodeModalOpen(true);
                          connectWhatsapp.mutate();
                        }}
                        disabled={connectWhatsapp.isPending}
                      >
                        {connectWhatsapp.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4" />
                        )}
                        <span className="text-xs">Conectar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Conectar WhatsApp via QR Code</p>
                    </TooltipContent>
                  </Tooltip>
              )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:h-[calc(100vh-200px)]">
        {kanbanColumns.map((column) => {
          const columnOrders = ordersByStatus[column.id];
          const Icon = column.icon;
          const isExpanded = expandedColumns.has(column.id);
          
          return (
            <div 
              key={column.id}
              className={cn(
                "bg-card rounded-2xl flex flex-col overflow-hidden border border-border/50 border-t-4",
                column.borderColor,
                // Card de Cancelados: visível apenas no mobile
                column.id === "cancelled" && "md:hidden"
              )}
            >
              {/* Column Header - clicável no mobile para expandir/minimizar */}
              <div 
                className="px-5 py-5 flex items-start justify-between gap-2 cursor-pointer md:cursor-default select-none"
                onClick={() => toggleColumnExpansion(column.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{column.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("w-2 h-2 rounded-full", column.dotColor)} />
                    <span className="text-2xl font-bold tracking-tight">{columnOrders.length}</span>
                    <span className="text-xs text-muted-foreground">ativos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(column.id === "completed" || column.id === "cancelled") && columnOrders.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClearColumnTarget(column.id);
                              setClearConfirmOpen(true);
                            }}
                            className={cn(
                              "p-2.5 rounded-lg shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                              column.iconBg,
                              "hover:opacity-80"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", column.iconColor)} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center">
                          <p className="text-xs">Clique para limpar {column.id === "completed" ? "pedidos completos" : "pedidos cancelados"} da tela</p>
                        </TooltipContent>
                      </Tooltip>
                  ) : (
                    <div className={cn("p-2.5 rounded-lg shrink-0", column.iconBg)}>
                      <Icon className={cn("h-5 w-5", column.iconColor)} />
                    </div>
                  )}
                  {/* Seta de expansão - visível apenas no mobile */}
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200 md:hidden",
                    isExpanded && "rotate-180"
                  )} />
                </div>
              </div>

              {/* Column Content - colapsável no mobile */}
              <div className={cn(
                "flex-1 overflow-y-auto px-3 pb-3 space-y-3 transition-all duration-200",
                // No mobile: esconde se não expandido
                !isExpanded && "max-h-0 pb-0 overflow-hidden md:max-h-none md:pb-3 md:overflow-y-auto"
              )}>
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-card rounded-xl p-4 shadow-sm">
                        <div className="skeleton h-4 w-20 rounded mb-2" />
                        <div className="skeleton h-3 w-full rounded mb-1" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                      </div>
                    ))}
                  </div>
                ) : columnOrders.length > 0 ? (
                  // Order cards with animations
                  <AnimatePresence mode="popLayout" initial={false}>
                  {columnOrders.map((order: OrderItem) => {
                    // Na coluna "Prontos", usar sempre a cor verde da coluna (ready) em vez da cor individual do status
                    const displayStatus = column.id === 'ready' ? 'ready' : order.status;
                    const config = statusConfig[displayStatus as OrderStatus];
                    const nextAction = getNextAction(order.status as OrderStatus, order);
                    const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{
                          layout: { type: "spring", stiffness: 500, damping: 35 },
                          opacity: { duration: 0.2, ease: "easeInOut" },
                          y: { duration: 0.2, ease: "easeOut" },
                          scale: { duration: 0.15, ease: "easeOut" },
                        }}
                        className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-shadow duration-200" style={{height: '136px'}}
                      >
                        {/* Header colorido com ícone - estilo original */}
                        <div className={cn("px-3 py-2 flex items-center justify-between rounded-t-xl", config.bgColor)} style={{height: '48px'}}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-full bg-card/90 shadow-sm", config.color)}>
                              <config.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold text-sm", config.color)}>
                                  {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                                </span>
                                {/* Badge iFood */}
                                {(order as any).source === 'ifood' && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                    iFood
                                  </span>
                                )}
                              </div>
                              <span className={cn("py-0.5 font-bold uppercase tracking-wide", order.deliveryType === "delivery" && "animate-pulse")} style={{borderRadius: '5px', fontSize: '8px', height: '16px', paddingRight: '5px', paddingLeft: '5px', color: config.badgeText, backgroundColor: config.badgeBg}}>
                                {order.deliveryType === "delivery" ? "Entrega" : order.deliveryType === "dine_in" ? "Consumo" : "Retirada"}
                              </span>
                            </div>
                          </div>
                          <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                            <Clock className="h-3.5 w-3.5" />
                            {(() => {
                              const diffMs = Date.now() - new Date(order.createdAt).getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMins / 60);
                              if (diffMins < 1) return 'agora';
                              if (diffMins < 60) return `${diffMins} min`;
                              return `${diffHours}h`;
                            })()}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="px-3" style={{height: '83px', paddingTop: '9px', paddingBottom: '9px'}}>
                          {/* Linha compacta com todas as informações */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Nome do cliente */}
                              {order.customerName && (
                                <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px]">
                                  {order.customerName}
                                </span>
                              )}
                              
                              {/* Separador */}
                              {order.customerName && (
                                <span className="text-muted-foreground/50">•</span>
                              )}
                              
                              {/* Ícone e método de pagamento */}
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <PaymentIcon className="h-3.5 w-3.5" />
                                {paymentMethodLabels[order.paymentMethod]?.label}
                              </span>
                              

                            </div>
                            
                            {/* Valor total */}
                            <span className="text-base font-bold text-primary whitespace-nowrap">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          {/* Actions - Botões completos */}
                          <div className="flex gap-1.5 mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-72">
                                <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handlePrintOrderDirect(order.id)}>
                                  <div className="flex items-center">
                                    <Printer className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Impressão Normal</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavoritePrintMethod('normal');
                                    }}
                                    className="p-1 hover:bg-accent-foreground/10 rounded"
                                    title="Definir como impressão padrão. Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido."
                                  >
                                    <Star 
                                      className={cn(
                                        "h-4 w-4 transition-colors",
                                        printerSettings?.defaultPrintMethod === 'normal' 
                                          ? "fill-amber-500 text-amber-500" 
                                          : "text-amber-500"
                                      )} 
                                    />
                                  </button>
                                </div>
                                {hasMindiPrinterApiKey && (
                                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                                    toast.info("Impressão automática", {
                                      description: "A impressão automática é enviada via Mindi Printer ao receber o pedido. Marque como favorita para não abrir a tela de impressão ao aceitar.",
                                      duration: 5000,
                                    });
                                  }}>
                                    <div className="flex items-center">
                                      <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                                      <span className="text-sm">Impressão Automática</span>
                                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">Mindi</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavoritePrintMethod('automatic');
                                      }}
                                      className="p-1 hover:bg-accent-foreground/10 rounded"
                                      title="Definir como impressão padrão. Ao marcar como favorito, o pedido será impresso automaticamente via Mindi Printer e a tela de impressão não abrirá ao aceitar."
                                    >
                                      <Star 
                                        className={cn(
                                          "h-4 w-4 transition-colors",
                                          printerSettings?.defaultPrintMethod === 'automatic' 
                                            ? "fill-amber-500 text-amber-500" 
                                            : "text-amber-500"
                                        )} 
                                      />
                                    </button>
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 rounded-lg border-border/50 hover:bg-accent text-xs"
                              onClick={() => setSelectedOrder(order.id)}
                            >
                              Ver detalhes
                            </Button>
                            {nextAction && (
                              nextAction.driverControlled ? (
                                <div className="flex-1 h-8 rounded-lg text-xs flex items-center justify-center border border-border/50 bg-background text-muted-foreground cursor-default" title="A finalização do pedido é realizada pelo entregador após marcar como entregue.">
                                  Entregador
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 rounded-lg shadow-sm text-xs hover:opacity-90"
                                  style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                                  onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                                  disabled={loadingOrderId !== null}
                                >
                                  {loadingOrderId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    nextAction.label
                                  )}
                                </Button>
                              )
                            )}
                            {order.status !== "completed" && order.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                                onClick={() => {
                                  setOrderToCancel(order.id);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                ) : (
                  // Empty state placeholder - informativo, não clicável
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-default select-none min-h-[140px]",
                      column.placeholderBorder,
                      column.placeholderBg
                    )} style={{height: '135px'}}
                  >
                    {column.id === "new" ? (
                      // Coluna Novos: ícone de loading animado
                      <>
                        <Loader2 className="h-8 w-8 text-blue-400 mb-2 animate-spin" />
                        <span className="text-sm text-blue-500">Aguardando pedidos…</span>
                      </>
                    ) : column.id === "preparing" ? (
                      // Coluna Preparo: ícone de chef
                      <>
                        <ChefHat className="h-8 w-8 text-red-300 mb-2" />
                        <span className="text-sm text-red-400">Nenhum pedido em preparo</span>
                      </>
                    ) : column.id === "ready" ? (
                      // Coluna Prontos: ícone de pacote
                      <>
                        <Package className="h-8 w-8 text-emerald-300 mb-2" />
                        <span className="text-sm text-emerald-400">Nenhum pedido pronto</span>
                      </>
                    ) : (
                      // Coluna Completos: ícone de check
                      <>
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <span className="text-sm text-muted-foreground">Nenhum pedido finalizado</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
      /* Lista Compacta */
      <div className="space-y-4">
        {/* Filtros de status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setListStatusFilter('all')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              listStatusFilter === 'all' ? "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700" : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Todos
            <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold bg-gray-500 text-white">
              {filteredOrders?.length || 0}
            </span>
          </button>
          {kanbanColumns.map((col) => {
            const count = ordersByStatus[col.id]?.length || 0;
            return (
              <button
                key={col.id}
                onClick={() => setListStatusFilter(col.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  listStatusFilter === col.id ? `${col.tabBg} ${col.tabText} ${col.tabBorder}` : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", col.dotColor)} />
                {col.title}
                <span className={cn("min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold text-white", col.badgeBg)}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabela compacta */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          {/* Header da tabela */}
          <div className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 bg-muted/50 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Status</span>
            <span>Pedido</span>
            <span>Tempo</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Pagamento</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Ações</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-border/30">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 items-center">
                  <div className="skeleton h-5 w-20 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-12 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-4 w-16 rounded ml-auto" />
                  <div className="skeleton h-7 w-20 rounded ml-auto" />
                </div>
              ))
            ) : (() => {
              const listOrders = listStatusFilter === 'all'
                ? [...(ordersByStatus.new || []), ...(ordersByStatus.preparing || []), ...(ordersByStatus.ready || []), ...(ordersByStatus.completed || []), ...(ordersByStatus.cancelled || [])]
                : ordersByStatus[listStatusFilter] || [];

              if (listOrders.length === 0) {
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                );
              }

              return listOrders.map((order: OrderItem) => {
                const config = statusConfig[order.status as OrderStatus];
                const nextAction = getNextAction(order.status as OrderStatus, order);
                const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;
                const diffMs = Date.now() - new Date(order.createdAt).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const timeStr = diffMins < 1 ? 'agora' : diffMins < 60 ? `${diffMins} min` : `${diffHours}h`;

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-[100px_1fr_70px_140px_110px_120px_120px_150px] gap-3 px-5 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    {/* Status badge */}
                    <span
                      className="inline-flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                    >
                      {config.label}
                    </span>

                    {/* Pedido info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("font-bold text-base", config.color)}>
                        {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                      </span>
                      {(order as any).source === 'ifood' && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">iFood</span>
                      )}
                    </div>

                    {/* Tempo */}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {timeStr}
                    </span>

                    {/* Cliente */}
                    <span className="text-sm font-medium truncate">{order.customerName || '—'}</span>

                    {/* Tipo de entrega */}
                    <span
                      className="inline-flex items-center justify-center py-0.5 font-bold uppercase tracking-wide w-fit"
                      style={{ borderRadius: '5px', fontSize: '9px', height: '18px', paddingRight: '6px', paddingLeft: '6px', color: config.badgeText, backgroundColor: config.badgeBg }}
                    >
                      {order.deliveryType === 'delivery' ? 'Entrega' : order.deliveryType === 'dine_in' ? 'Consumo' : 'Retirada'}
                    </span>

                    {/* Pagamento */}
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PaymentIcon className="h-4 w-4" />
                      {paymentMethodLabels[order.paymentMethod]?.label || order.paymentMethod}
                    </span>

                    {/* Valor */}
                    <span className="text-base font-bold text-primary text-right">{formatCurrency(order.total)}</span>

                    {/* Ações */}
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      {nextAction && (
                        nextAction.driverControlled ? (
                          <div className="h-8 px-4 rounded-lg text-xs flex items-center justify-center border border-border/50 bg-background text-muted-foreground cursor-default" title="A finalização do pedido é realizada pelo entregador após marcar como entregue.">
                            Entregador
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 px-4 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90"
                            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
                            onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                            disabled={loadingOrderId !== null}
                          >
                            {loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              nextAction.label
                            )}
                          </Button>
                        )
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                          onClick={() => {
                            setOrderToCancel(order.id);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      )}

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={handlePrintOrder}>
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="text-sm">Impressão Normal</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavoritePrintMethod('normal');
                    }}
                    className="p-1 hover:bg-accent-foreground/10 rounded"
                    title="Definir como impressão padrão. Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido."
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4 transition-colors",
                        printerSettings?.defaultPrintMethod === 'normal' 
                          ? "fill-amber-500 text-amber-500" 
                          : "text-amber-500"
                      )} 
                    />
                  </button>
                </div>
                {hasMindiPrinterApiKey && (
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => {
                    toast.info("Impressão automática", {
                      description: "A impressão automática é enviada via Mindi Printer ao receber o pedido. Marque como favorita para não abrir a tela de impressão ao aceitar.",
                      duration: 5000,
                    });
                  }}>
                    <div className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                      <span className="text-sm">Impressão Automática</span>
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">Mindi</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoritePrintMethod('automatic');
                      }}
                      className="p-1 hover:bg-accent-foreground/10 rounded"
                      title="Definir como impressão padrão. Ao marcar como favorito, o pedido será impresso automaticamente via Mindi Printer e a tela de impressão não abrirá ao aceitar."
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4 transition-colors",
                          printerSettings?.defaultPrintMethod === 'automatic' 
                            ? "fill-amber-500 text-amber-500" 
                            : "text-amber-500"
                        )} 
                      />
                    </button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {orderDetails && (
            <div className="overflow-y-auto flex-1">
              {/* Order ID and Actions */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedido {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(orderDetails.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                  </p>
                  {/* Código de coleta iFood */}
                  {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalDisplayId && (
                    <p className="text-sm font-bold text-red-600 mt-1">
                      Código de Coleta: {(orderDetails as any).externalDisplayId}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Badge iFood */}
                  {(orderDetails as any).source === 'ifood' && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                      iFood
                    </span>
                  )}
                  <StatusBadge variant={statusConfig[orderDetails.status as OrderStatus]?.variant}>
                    {statusConfig[orderDetails.status as OrderStatus]?.label}
                  </StatusBadge>
                </div>
              </div>

              {/* Info Cards - Layout Vertical */}
              <div className="px-6 py-4 space-y-4">
                {/* Customer Info */}
                <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">Informações do Cliente</h4>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {orderDetails.customerName?.charAt(0) || "C"}
                      </span>
                      <span className="font-medium truncate">{orderDetails.customerName || "Cliente"}</span>
                    </div>
                    {orderDetails.customerPhone && (
                      <span className="text-muted-foreground shrink-0">{orderDetails.customerPhone}</span>
                    )}
                  </div>
                  {orderDetails.customerPhone && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                        <Phone className="h-3.5 w-3.5" />
                        Ligar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" 
                        onClick={() => {
                          let phone = orderDetails.customerPhone?.replace(/\D/g, '');
                          if (phone && !phone.startsWith('55')) {
                            phone = '55' + phone;
                          }
                          
                          // Montar mensagem completa com itens do pedido
                          const orderNumber = orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`;
                          
                          // Formatar itens com complementos
                          const itemsText = orderDetails.items?.map(item => {
                            let itemLine = `${item.quantity}x ${item.productName}`;
                            // Adicionar complementos se houver
                            if (item.complements && item.complements.length > 0) {
                              const complementsText = item.complements.map((c: any) => {
                                const qty = c.quantity || 1;
                                return qty > 1 ? `  + ${qty}x ${c.name}` : `  + ${c.name}`;
                              }).join('\n');
                              itemLine += '\n' + complementsText;
                            }
                            return itemLine;
                          }).join('\n') || '';
                          
                          // Formatar valor total
                          const totalFormatted = `R$ ${Number(orderDetails.total).toFixed(2).replace('.', ',')}`;
                          
                          // Montar mensagem completa
                          const message = `Olá ${orderDetails.customerName || ''}! Sobre seu pedido ${orderNumber}:\n\n*Itens:*\n${itemsText}\n\n*Total:* ${totalFormatted}`;
                          
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        <img src="/icons8-whatsapp.svg" alt="WhatsApp" className="h-4 w-4" />
                        Mensagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        {/* Complementos do item */}
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1.5 pl-2 border-l-2 border-primary/30">
                            {item.complements.map((complement: { name: string; price: number; quantity?: number }, compIndex: number) => {
                              const qty = complement.quantity || 1;
                              const totalPrice = complement.price * qty;
                              return (
                                <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                  <span className="text-foreground/70">+ {qty > 1 ? `${qty}x ` : ''}{complement.name}</span>
                                  {totalPrice > 0 && (
                                    <span className="text-foreground/70">+ {formatCurrency(totalPrice)}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(Number(item.unitPrice) > 0 || item.notes) && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{item.notes || ""}</span>
                            {Number(item.unitPrice) > 0 && (
                              <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Price Details */}
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    <h5 className="font-medium text-sm mb-2">Detalhes do Preço</h5>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                    </div>
                    {Number(orderDetails.deliveryFee) > 0 && orderDetails.deliveryType !== 'dine_in' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Entrega:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.deliveryFee)}</span>
                      </div>
                    )}
                    {orderDetails.couponCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cupom Aplicado:</span>
                        <span className="font-medium text-emerald-600">{orderDetails.couponCode}</span>
                      </div>
                    )}
                    {Number(orderDetails.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="font-medium text-red-500">-{formatCurrency(orderDetails.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa da Plataforma:</span>
                      <span className="font-medium">Grátis</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="font-bold text-primary">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(orderDetails.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Info - Unified Card */}
                <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">{orderDetails.deliveryType === 'dine_in' ? 'Consumo e Pagamento' : 'Entrega e Pagamento'}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{orderDetails.deliveryType === "delivery" ? "Entrega" : orderDetails.deliveryType === "dine_in" ? "Consumo no local" : "Retirada"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">{paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</span>
                    </div>
                    {/* Bandeira do cartão - apenas para pedidos iFood */}
                    {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalData?.payments?.methods?.[0]?.card?.brand && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bandeira:</span>
                        <span className="font-medium">{(orderDetails as any).externalData.payments.methods[0].card.brand}</span>
                      </div>
                    )}
                    {/* Valor do troco - para pagamento em dinheiro */}
                    {orderDetails.paymentMethod === 'cash' && (orderDetails as any).changeAmount && Number((orderDetails as any).changeAmount) > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Troco para:</span>
                          <span className="font-medium">{formatCurrency((orderDetails as any).changeAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Troco a devolver:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(Number((orderDetails as any).changeAmount) - Number(orderDetails.total))}</span>
                        </div>
                      </>
                    )}
                    {orderDetails.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium text-right max-w-[180px]">{orderDetails.customerAddress}</span>
                      </div>
                    )}
                    {/* CPF/CNPJ do cliente - apenas para pedidos iFood */}
                    {(orderDetails as any).source === 'ifood' && (orderDetails as any).externalData?.customer?.documentNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CPF/CNPJ:</span>
                        <span className="font-medium">{(orderDetails as any).externalData.customer.documentNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Adicionais do iFood */}
                {(orderDetails as any).source === 'ifood' && (
                  <div className="border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 rounded-xl p-4">
                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">iFood</span>
                      Informações do Pedido
                    </h4>
                    <div className="space-y-2">
                      {/* Tipo de pedido (Imediato ou Agendado) */}
                      {(orderDetails as any).externalData?.orderTiming && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">
                            {(orderDetails as any).externalData.orderTiming === 'SCHEDULED' ? 'Agendado' : 'Imediato'}
                          </span>
                        </div>
                      )}
                      {/* Data/hora de entrega agendada */}
                      {(orderDetails as any).externalData?.orderTiming === 'SCHEDULED' && (orderDetails as any).externalData?.schedule?.deliveryDateTimeStart && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Entrega Agendada:</span>
                          <span className="font-medium text-amber-600">
                            {format(new Date((orderDetails as any).externalData.schedule.deliveryDateTimeStart), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      {/* Responsável pelo desconto */}
                      {(orderDetails as any).externalData?.total?.benefits?.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Desconto:</span>
                          <span className="font-medium">
                            {(orderDetails as any).externalData.total.benefits.map((b: any) => 
                              `${b.sponsorshipValues?.IFOOD ? 'iFood' : 'Loja'}: ${formatCurrency((b.value || 0) / 100)}`
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                      {/* Observações de entrega */}
                      {(orderDetails as any).externalData?.delivery?.observations && (
                        <div className="text-sm">
                          <span className="text-muted-foreground block mb-1">Observações de Entrega:</span>
                          <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 px-2 py-1 rounded block">
                            {(orderDetails as any).externalData.delivery.observations}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Status do Pedido</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status !== "cancelled" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pedido Recebido</p>
                        <p className="text-xs text-muted-foreground">Pedido criado no sistema</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["preparing", "ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <ChefHat className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Em Preparo</p>
                        <p className="text-xs text-muted-foreground">Pedido sendo preparado</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pronto</p>
                        <p className="text-xs text-muted-foreground">Pedido pronto para entrega/retirada</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Finalizado</p>
                        <p className="text-xs text-muted-foreground">Pedido entregue ao cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div className="px-6 py-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-2">Observações</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{orderDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}


        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) setCancellationReason("");
      }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Motivo do cancelamento (obrigatório)
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ex: Produto indisponível, cliente solicitou cancelamento..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updateStatusMutation.isPending || !cancellationReason.trim()}
              className="rounded-xl"
            >
              {updateStatusMutation.isPending ? "Cancelando..." : "Cancelar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para limpar pedidos */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Limpar pedidos</DialogTitle>
            <DialogDescription>
              {clearColumnTarget === "completed"
                ? "Tem certeza que deseja limpar todos os pedidos completos da tela?"
                : "Tem certeza que deseja limpar todos os pedidos cancelados da tela?"}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Os pedidos não serão apagados do sistema, apenas removidos da visualização atual.
          </p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (clearColumnTarget) handleManualClear(clearColumnTarget);
                setClearConfirmOpen(false);
                setClearColumnTarget(null);
              }}
              className="rounded-xl"
            >
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de QR Code do WhatsApp */}
      <Dialog open={qrCodeModalOpen} onOpenChange={(open) => {
        setQrCodeModalOpen(open);
        if (!open) {
          setIsPollingQrCode(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-start gap-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
              <div>
                <DialogTitle className="text-amber-600 text-lg">Aguardando conexão...</DialogTitle>
                <DialogDescription className="text-sm">
                  Escaneie o QR Code com seu WhatsApp
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            {/* QR Code */}
            <div className="bg-muted/50 p-4 rounded-xl">
              {(connectWhatsapp.data?.qrcode || whatsappStatus?.qrcode) ? (
                <img 
                  src={connectWhatsapp.data?.qrcode || whatsappStatus?.qrcode} 
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Instruções */}
            <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
              Abra o WhatsApp no seu celular, vá em <strong>Dispositivos conectados</strong> e escaneie o QR Code
            </p>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                connectWhatsapp.mutate();
              }}
              disabled={connectWhatsapp.isPending}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", connectWhatsapp.isPending && "animate-spin")} />
              Atualizar QR Code
            </Button>
            <Button
              variant="ghost"
              onClick={() => setQrCodeModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Informativo - Conectar WhatsApp para notificações */}
      <Dialog open={whatsappInfoModalOpen} onOpenChange={(open) => {
        if (!open) {
          localStorage.setItem('whatsapp-info-modal-seen', 'true');
        }
        setWhatsappInfoModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md" style={{borderRadius: '16px'}}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-lg">Notificações de pedidos via WhatsApp</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Conecte o WhatsApp para notificar seus clientes sobre o status de cada pedido.
            </DialogDescription>
          </DialogHeader>
          
          {/* Card visual de conversa WhatsApp com carrossel */}
          <div className="py-2">
            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              {/* Header do WhatsApp */}
              <div className="bg-emerald-700 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted-foreground/50 flex items-center justify-center text-white font-bold text-sm">
                  {establishment?.name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{establishment?.name || 'Seu Estabelecimento'}</p>
                  <p className="text-emerald-200 text-xs">online</p>
                </div>
              </div>
              {/* Corpo da conversa - carrossel animado */}
              <div className="bg-[#e5ddd5] px-4 py-5 min-h-[160px] flex items-start">
                <div
                  className="bg-card rounded-lg px-3 py-2.5 max-w-[85%] shadow-sm relative"
                  style={{
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                    opacity: whatsappMsgFading ? 0 : 1,
                    transform: whatsappMsgFading ? 'translateY(8px)' : 'translateY(0)',
                  }}
                >
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-card" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                  <p className="text-[13px] text-foreground leading-relaxed">
                    {whatsappMessages[whatsappMsgIndex].text}
                  </p>
                  <p className="text-[13px] text-foreground leading-relaxed mt-2">
                    {whatsappMessages[whatsappMsgIndex].text2}
                  </p>
                  <div className="mt-2 text-[13px] text-foreground">
                    {whatsappMessages[whatsappMsgIndex].items.map((item, i) => (
                      <p key={i}>{item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{whatsappMessages[whatsappMsgIndex].time}</p>
                </div>
              </div>
              {/* Indicadores de posição */}
              <div className="bg-[#e5ddd5] px-4 pb-3 flex justify-center gap-1.5">
                {whatsappMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === whatsappMsgIndex ? 'bg-emerald-600 w-4' : 'bg-muted-foreground/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl sm:order-1"
              onClick={() => {
                localStorage.setItem('whatsapp-info-modal-seen', 'true');
                setWhatsappInfoModalOpen(false);
              }}
            >
              Agora não
            </Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 sm:order-2"
              onClick={() => {
                localStorage.setItem('whatsapp-info-modal-seen', 'true');
                setWhatsappInfoModalOpen(false);
                // Abrir modal de QR Code do WhatsApp
                connectWhatsapp.mutate();
                setQrCodeModalOpen(true);
                setIsPollingQrCode(true);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Conectar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de seleção de entregador */}
      <Dialog open={driverModalOpen} onOpenChange={(open) => {
        if (!open) {
          setDriverModalOpen(false);
          setDriverModalOrderId(null);
          setAssigningDriverId(null);
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-orange-500" />
              Selecionar Entregador
            </DialogTitle>
            <DialogDescription>
              Escolha o entregador para este pedido. A notificação será enviada automaticamente via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
            {driverModalDrivers.map((driver) => (
              <button
                key={driver.id}
                disabled={assigningDriverId !== null}
                onClick={() => {
                  if (!driverModalOrderId) return;
                  setAssigningDriverId(driver.id);
                  if (driverModalContext === 'accept') {
                    // Fluxo de aceite: apenas atribuir entregador sem mudar status
                    assignDriverOnAcceptMutation.mutate({
                      orderId: driverModalOrderId,
                      driverId: driver.id,
                    });
                  } else {
                    // Fluxo de pronto: marcar como pronto e atribuir
                    markReadyAndAssignMutation.mutate({
                      orderId: driverModalOrderId,
                      driverId: driver.id,
                    });
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  assigningDriverId === driver.id
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20",
                  assigningDriverId !== null && assigningDriverId !== driver.id && "opacity-50"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{driver.name}</p>
                  <p className="text-xs text-muted-foreground">{driver.whatsapp}</p>
                </div>
                {assigningDriverId === driver.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDriverModalOpen(false);
                setDriverModalOrderId(null);
              }}
              disabled={assigningDriverId !== null}
              className="rounded-xl"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de onboarding contextual ao mudar status do pedido */}
      <Dialog
        open={statusOnboardingModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setStatusOnboardingModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });
          }
        }}
      >
        <DialogContent
          className={cn(
            "sm:max-w-[440px] p-0 overflow-hidden border-t-4",
            statusOnboardingModal.statusType === 'preparing' && 'border-t-red-500',
            statusOnboardingModal.statusType === 'ready' && 'border-t-emerald-500',
            statusOnboardingModal.statusType === 'completed' && 'border-t-muted-foreground/50',
          )}
          style={{ borderRadius: '16px' }}
        >
          {statusOnboardingModal.statusType && (() => {
            // Buscar o pedido para saber o tipo (delivery/pickup/dine_in)
            const currentOrder = allOrders.find((o: any) => o.id === statusOnboardingModal.orderId);
            const isPickupOrDineIn = currentOrder?.deliveryType === 'pickup' || currentOrder?.deliveryType === 'dine_in';

            // Templates padrão (fallback)
            const defaultTemplates = {
              preparing: '👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!',
              ready: '✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{deliveryMessage}}',
              readyPickup: '✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{pickupMessage}}',
              completed: 'Seu pedido {{orderNumber}} foi finalizado!\n\n📌 Atualização de fidelidade\n\n*+1 carimbo* adicionado ao seu cartão.\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*',
            };

            // Obter template real salvo ou usar padrão
            const getTemplateForStatus = (statusType: string): string => {
              if (statusType === 'preparing') {
                return (whatsappConfig as any)?.templatePreparing || defaultTemplates.preparing;
              }
              if (statusType === 'ready') {
                if (isPickupOrDineIn) {
                  return (whatsappConfig as any)?.templateReadyPickup || defaultTemplates.readyPickup;
                }
                return (whatsappConfig as any)?.templateReady || defaultTemplates.ready;
              }
              if (statusType === 'completed') {
                return (whatsappConfig as any)?.templateCompleted || defaultTemplates.completed;
              }
              return '';
            };

            // Substituir variáveis do template por valores de exemplo
            const resolveTemplate = (template: string): string => {
              let resolved = template
                .replace(/\{\{customerName\}\}/g, 'João Silva')
                .replace(/\{\{orderNumber\}\}/g, '#1234')
                .replace(/\{\{establishmentName\}\}/g, establishment?.name || 'Restaurante')
                .replace(/\{\{greeting\}\}/g, 'Boa tarde')
                .replace(/\{\{deliveryMessage\}\}/g, '🛵 Nosso entregador já está a caminho.')
                .replace(/\{\{pickupMessage\}\}/g, 'Você já pode vir retirar. 😄')
                .replace(/\{\{cancellationReason\}\}/g, 'Item indisponível')
                .replace(/\{\{itensPedido\}\}/g, '• 1x Pizza Margherita\n• 1x Refrigerante')
                .replace(/\{\{totalPagamento\}\}/g, '🧾 Total: R$ 129,00\n💰 Pagamento via: PIX');
              // Cashback: só substituir por valores de exemplo se cashback estiver ativo
              const isCashbackActive = (establishment as any)?.cashbackEnabled === true || (establishment as any)?.rewardProgramType === 'cashback';
              if (isCashbackActive) {
                resolved = resolved
                  .replace(/\{\{cashbackEarned\}\}/g, 'Cashback ganho: R$0,15')
                  .replace(/\{\{cashbackTotal\}\}/g, 'Cashback acumulado: R$0,35');
              }
              // Remover linhas que contêm variáveis não resolvidas (ex: {{algo}}) - inclui cashback quando não ativo
              resolved = resolved.split('\n').filter(line => !/\{\{[^}]+\}\}/.test(line)).join('\n');
              // Limpar linhas vazias consecutivas (máx 2)
              resolved = resolved.replace(/\n{3,}/g, '\n\n');
              return resolved.trim();
            };

            const rawTemplate = getTemplateForStatus(statusOnboardingModal.statusType!);
            const resolvedMessage = resolveTemplate(rawTemplate);

            const modalConfig = {
              preparing: {
                borderClass: 'border-t-4 border-t-red-500',
                iconBg: 'bg-red-100 dark:bg-red-950/50',
                iconColor: 'text-red-600',
                icon: ChefHat,
                title: 'Pedido em preparo',
                description: 'Ao aceitar, o cliente será avisado via WhatsApp que o pedido está em preparo.',
                messagePreview: resolvedMessage,
                buttonLabel: 'Entendi, aceitar pedido',
              },
              ready: {
                borderClass: 'border-t-4 border-t-emerald-500',
                iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
                iconColor: 'text-emerald-600',
                icon: Package,
                title: 'Pedido pronto',
                description: isPickupOrDineIn
                  ? 'Ao marcar como pronto, o cliente será avisado via WhatsApp que o pedido está pronto para retirada.'
                  : 'Ao marcar como pronto, o cliente será avisado via WhatsApp que o pedido está pronto.',
                messagePreview: resolvedMessage,
                buttonLabel: 'Entendi, marcar como pronto',
              },
              completed: {
                borderClass: 'border-t-4 border-t-muted-foreground/50',
                iconBg: 'bg-gray-100 dark:bg-gray-800',
                iconColor: 'text-gray-600',
                icon: CheckCircle,
                title: 'Pedido finalizado',
                description: 'Ao finalizar, o cliente será avisado via WhatsApp que o pedido foi concluído.',
                messagePreview: resolvedMessage,
                buttonLabel: 'Entendi, finalizar pedido',
              },
            };
            const cfg = modalConfig[statusOnboardingModal.statusType!];
            const IconComponent = cfg.icon;
            const restaurantName = establishment?.name || 'Seu Estabelecimento';
            const restaurantLogo = establishment?.logo;

            // Formatar texto estilo WhatsApp (negrito com *texto*)
            const formatWAText = (text: string): React.ReactNode => {
              const parts: React.ReactNode[] = [];
              let currentIdx = 0;
              const boldRegex = /\*([^*]+)\*/g;
              let m;
              while ((m = boldRegex.exec(text)) !== null) {
                if (m.index > currentIdx) {
                  parts.push(text.slice(currentIdx, m.index));
                }
                parts.push(<strong key={m.index}>{m[1]}</strong>);
                currentIdx = m.index + m[0].length;
              }
              if (currentIdx < text.length) {
                parts.push(text.slice(currentIdx));
              }
              return parts.length > 0 ? parts : text;
            };

            return (
              <>
                <DialogTitle className="sr-only">{cfg.title}</DialogTitle>
                <div className="px-6 pt-5 pb-6">
                  {/* Header com ícone */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.iconBg)}>
                      <IconComponent className={cn("h-6 w-6", cfg.iconColor)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{cfg.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview WhatsApp - Estilo idêntico ao /configuracoes templates */}
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm mb-5">
                    {/* Header do WhatsApp - com foto, nome e "online" */}
                    <div className="bg-[#008069] px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {restaurantLogo ? (
                            <img 
                              src={restaurantLogo} 
                              alt={restaurantName} 
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center overflow-hidden">
                              <span className="text-white font-bold text-sm">
                                {restaurantName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold text-sm">{restaurantName}</p>
                            <p className="text-emerald-200 text-xs">online</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Video className="h-4 w-4 text-white/80" />
                          <Phone className="h-4 w-4 text-white/80" />
                          <MoreVertical className="h-4 w-4 text-white/80" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Área de Chat - Background WhatsApp */}
                    <div 
                      className="px-3 py-3 relative"
                      style={{
                        backgroundColor: '#ECE5DD',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23d4cfc4' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                      }}
                    >
                      {/* Badge HOJE */}
                      <div className="flex justify-center mb-3">
                        <span className="bg-white/90 text-gray-500 text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-sm">
                          HOJE
                        </span>
                      </div>
                      
                      {/* Bolha de mensagem recebida */}
                      <div className="flex justify-start">
                        <div className="max-w-[88%] relative">
                          <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 shadow-sm relative">
                            {/* Triângulo da bolha */}
                            <div 
                              className="absolute -left-2 top-0 w-0 h-0"
                              style={{
                                borderRight: '8px solid white',
                                borderBottom: '8px solid transparent',
                              }}
                            />
                            {/* Conteúdo da mensagem */}
                            <div className="text-[13px] text-gray-800 whitespace-pre-wrap break-words leading-relaxed pr-10">
                              {formatWAText(cfg.messagePreview)}
                            </div>
                            {/* Horário */}
                            <div className="absolute bottom-1.5 right-2 flex items-center">
                              <span className="text-[10px] text-gray-400">
                                {format(new Date(), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-5">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      Você pode personalizar as mensagens em <strong>Configurações → Whatsapp → Templates</strong>.
                    </p>
                  </div>

                  {/* Botão "Não mostrar novamente" - estilo vazado/outline */}
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-10 font-medium mb-2.5 border-border text-muted-foreground hover:bg-muted/50"
                    onClick={() => {
                      setStatusOnboardingModal(prev => ({ ...prev, dontShowAgain: true }));
                      // Executar imediatamente com dismiss
                      const { statusType, orderId } = statusOnboardingModal;
                      if (statusType && orderId) {
                        dismissStatusOnboarding(statusType);
                        setStatusOnboardingModal({ open: false, statusType: null, orderId: null, dontShowAgain: false });
                        executeStatusUpdate(orderId, statusType);
                      }
                    }}
                  >
                    Não mostrar este aviso novamente
                  </Button>

                  {/* Botão de confirmação principal */}
                  <Button
                    className={cn(
                      "w-full rounded-xl h-10 font-semibold",
                      statusOnboardingModal.statusType === 'preparing' && 'bg-red-500 hover:bg-red-600 text-white',
                      statusOnboardingModal.statusType === 'ready' && 'bg-emerald-500 hover:bg-emerald-600 text-white',
                      statusOnboardingModal.statusType === 'completed' && 'bg-gray-500 hover:bg-gray-600 text-white',
                    )}
                    onClick={handleStatusOnboardingConfirm}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {cfg.buttonLabel}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
