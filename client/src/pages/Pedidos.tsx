import { AdminLayout } from "@/components/AdminLayout";
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
  TooltipProvider,
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
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

// Configuração das colunas Kanban
const kanbanColumns = [
  {
    id: "new" as OrderStatus,
    title: "Novos",
    color: "blue",
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
    placeholderBorder: "border-blue-300",
    placeholderBg: "bg-blue-50",
    placeholderText: "text-blue-500",
    icon: Clock,
  },
  {
    id: "preparing" as OrderStatus,
    title: "Preparo",
    color: "amber",
    borderColor: "border-t-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    dotColor: "bg-amber-500",
    placeholderBorder: "border-amber-300",
    placeholderBg: "bg-amber-50/50",
    placeholderText: "text-amber-500",
    icon: ChefHat,
  },
  {
    id: "ready" as OrderStatus,
    title: "Prontos",
    color: "emerald",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    placeholderBorder: "border-emerald-300",
    placeholderBg: "bg-emerald-50/50",
    placeholderText: "text-emerald-500",
    icon: Package,
  },
  {
    id: "completed" as OrderStatus,
    title: "Completos",
    color: "gray",
    borderColor: "border-t-gray-400",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    dotColor: "bg-gray-400",
    placeholderBorder: "border-gray-300",
    placeholderBg: "bg-gray-50",
    placeholderText: "text-gray-400",
    icon: CheckCircle2,
  },
  {
    id: "cancelled" as OrderStatus,
    title: "Cancelados",
    color: "red",
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    dotColor: "bg-red-500",
    placeholderBorder: "border-red-300",
    placeholderBg: "bg-red-50",
    placeholderText: "text-red-500",
    icon: XCircle,
  },
];

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-amber-600", bgColor: "bg-amber-50" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-gray-600", bgColor: "bg-[#e3e3e3]" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
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
  // Estado para controlar expansão das colunas no mobile (acordeão)
  const [expandedColumns, setExpandedColumns] = useState<Set<OrderStatus>>(() => new Set<OrderStatus>(["new"]));
  // Estado para controlar loading do WhatsApp
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  // Estado para o modal de QR Code do WhatsApp
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [isPollingQrCode, setIsPollingQrCode] = useState(false);
  // Estado para rastrear qual pedido está com loading de ação
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  // Estado para o modal informativo de WhatsApp
  const [whatsappInfoModalOpen, setWhatsappInfoModalOpen] = useState(false);
  const [whatsappMsgIndex, setWhatsappMsgIndex] = useState(0);
  const [whatsappMsgFading, setWhatsappMsgFading] = useState(false);
  const [, navigate] = useLocation();

  // Carrossel de mensagens do modal WhatsApp
  const whatsappMessages = [
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
  ];

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

  // Modal informativo: exibir no primeiro acesso se WhatsApp não estiver conectado
  useEffect(() => {
    if (!isWhatsappFetched || isWhatsappLoading) return;
    if (whatsappStatus?.status === 'connected') return;
    
    // Verificar se já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem('whatsapp-info-modal-dismissed');
    if (dismissed) return;
    
    // Mostrar modal
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
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'android') => {
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
    onSuccess: (_, variables) => {
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

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
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
      // Verificar método de impressão favorito
      const printMethod = printerSettings?.defaultPrintMethod || 'normal';
      
      if (printMethod === 'android') {
        toast.success("📦 Pedido aceito e enviado para impressão!", {
          description: "O pedido foi aceito e está sendo enviado para as impressoras Android.",
          duration: 4000,
        });
        
        setTimeout(() => {
          handlePrintMultiPrinter(orderId);
        }, 300);
      } else {
        // Impressão normal - abrir tela de impressão do navegador
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

  const getNextAction = (status: OrderStatus): { label: string; newStatus: OrderStatus } | null => {
    switch (status) {
      case "new":
        return { label: "Aceitar", newStatus: "preparing" };
      case "preparing":
        return { label: "Pronto", newStatus: "ready" };
      case "ready":
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

  // Filtrar pedidos completos para mostrar apenas os do dia atual (timezone do restaurante)
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

  // Agrupar pedidos por status para o Kanban
  const ordersByStatus = {
    new: allOrders?.filter(o => o.status === "new") ?? [],
    preparing: allOrders?.filter(o => o.status === "preparing") ?? [],
    ready: allOrders?.filter(o => o.status === "ready") ?? [],
    completed: allOrders?.filter(o => o.status === "completed" && new Date(o.updatedAt || o.createdAt) >= todayStart) ?? [],
    cancelled: allOrders?.filter(o => o.status === "cancelled") ?? [],
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
        />
        {/* Card de Status de Conexão WhatsApp */}
        <div className="hidden sm:flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-medium shadow-sm whitespace-nowrap",
            !isWhatsappFetched || isWhatsappLoading
              ? "bg-gray-50 border-gray-200 text-gray-600"
              : whatsappStatus?.status === 'connected'
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
          )}>
            {/* Status */}
            <div className="flex items-center gap-2">
              {!isWhatsappFetched || isWhatsappLoading ? (
                /* Estado de carregamento */
                <>
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : whatsappStatus?.status === 'connected' ? (
                /* Conectado */
                <>
                  <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" style={{width: '10px', height: '10px'}} />
                  <span>Conectado</span>
                </>
              ) : (
                /* Desconectado */
                <>
                  <span className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" style={{width: '10px', height: '10px'}} />
                  <span>Desconectado</span>
                </>
              )}
            </div>
            
            {/* Botões de ação - só mostra após carregar */}
            {isWhatsappFetched && !isWhatsappLoading && (
              <>
                <div className="w-px h-5 bg-gray-300" />
                <div className="flex items-center gap-1">
                  {whatsappStatus?.status === 'connected' ? (
                /* Quando conectado: Desconectar */
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-red-100 text-red-500"
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
                </TooltipProvider>
              ) : (
                /* Quando desconectado: Conectar via QR Code */
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 hover:bg-white/50 gap-1.5"
                        onClick={() => {
                          setQrCodeModalOpen(true);
                          connectWhatsapp.mutate();
                        }}
                        disabled={connectWhatsapp.isPending} style={{width: '82px', height: '30px'}}
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
                </TooltipProvider>
              )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:h-[calc(100vh-200px)]">
        {kanbanColumns.map((column) => {
          const columnOrders = ordersByStatus[column.id];
          const Icon = column.icon;
          const isExpanded = expandedColumns.has(column.id);
          
          return (
            <div 
              key={column.id}
              className={cn(
                "bg-card rounded-2xl flex flex-col overflow-hidden border-t-4 shadow-soft",
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
                  <div className={cn("p-2.5 rounded-lg shrink-0", column.iconBg)}>
                    <Icon className={cn("h-5 w-5", column.iconColor)} />
                  </div>
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
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="skeleton h-4 w-20 rounded mb-2" />
                        <div className="skeleton h-3 w-full rounded mb-1" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                      </div>
                    ))}
                  </div>
                ) : columnOrders.length > 0 ? (
                  // Order cards
                  columnOrders.map((order) => {
                    const config = statusConfig[order.status as OrderStatus];
                    const nextAction = getNextAction(order.status as OrderStatus);
                    const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                    return (
                      <div
                        key={order.id}
                        className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-200"
                      >
                        {/* Header colorido com ícone - estilo original */}
                        <div className={cn("px-4 py-3 flex items-center justify-between rounded-t-xl", config.bgColor)}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full bg-white/90 shadow-sm", config.color)}>
                              <config.icon className="h-4 w-4" />
                            </div>
                            <span className={cn("font-bold text-base", config.color)}>
                              {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                            </span>
                            {/* Badge iFood */}
                            {(order as any).source === 'ifood' && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                iFood
                              </span>
                            )}
                          </div>
                          <div className={cn("flex items-center gap-1.5 text-sm font-medium", config.color)}>
                            <Clock className="h-4 w-4" />
                            {(() => {
                              const diffMs = Date.now() - new Date(order.createdAt).getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMins / 60);
                              if (diffMins < 1) return 'agora';
                              if (diffMins < 60) return `${diffMins} min`;
                              if (diffHours === 1) return '1 hora';
                              return `${diffHours} horas`;
                            })()}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
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
                              
                              {/* Tag de entrega/retirada */}
                              <span className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-medium capitalize whitespace-nowrap">
                                {order.deliveryType === "delivery" ? "Entrega" : order.deliveryType === "dine_in" ? "Local" : "Retirada"}
                              </span>
                            </div>
                            
                            {/* Valor total */}
                            <span className="text-base font-bold text-primary whitespace-nowrap">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          {/* Actions - Botões completos */}
                          <div className="flex gap-2 mt-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavoritePrintMethod('normal');
                                        }}
                                        className="p-1 hover:bg-accent-foreground/10 rounded"
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
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[220px]">
                                      <p className="font-medium">Definir como impressão padrão</p>
                                      <p className="text-xs text-muted-foreground">Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => handlePrintMultiPrinter(order.id)}>
                                  <div className="flex items-center">
                                    <Printer className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Múltiplas Impressoras (Android)</span>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavoritePrintMethod('android');
                                        }}
                                        className="p-1 hover:bg-accent-foreground/10 rounded"
                                      >
                                        <Star 
                                          className={cn(
                                            "h-4 w-4 transition-colors",
                                            printerSettings?.defaultPrintMethod === 'android' 
                                              ? "fill-amber-500 text-amber-500" 
                                              : "text-amber-500"
                                          )} 
                                        />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[220px]">
                                      <p className="font-medium">Definir como impressão padrão</p>
                                      <p className="text-xs text-muted-foreground">Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 rounded-lg border-border/50 hover:bg-accent text-sm"
                              onClick={() => setSelectedOrder(order.id)}
                            >
                              Ver detalhes
                            </Button>
                            {nextAction && (
                              <Button
                                size="sm"
                                className="flex-1 h-9 rounded-lg shadow-sm text-sm"
                                onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                                disabled={loadingOrderId !== null}
                              >
                                {loadingOrderId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  nextAction.label
                                )}
                              </Button>
                            )}
                            {order.status !== "completed" && order.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
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
                      </div>
                    );
                  })
                ) : (
                  // Empty state placeholder - informativo, não clicável
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-default select-none min-h-[140px]",
                      column.placeholderBorder,
                      column.placeholderBg
                    )}
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
                        <ChefHat className="h-8 w-8 text-amber-300 mb-2" />
                        <span className="text-sm text-amber-400">Nenhum pedido em preparo</span>
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
                        <CheckCircle2 className="h-8 w-8 text-gray-300 mb-2" />
                        <span className="text-sm text-gray-400">Nenhum pedido finalizado</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavoritePrintMethod('normal');
                        }}
                        className="p-1 hover:bg-accent-foreground/10 rounded"
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
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px]">
                      <p className="font-medium">Definir como impressão padrão</p>
                      <p className="text-xs text-muted-foreground">Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" onClick={() => orderDetails && handlePrintMultiPrinter(orderDetails.id)}>
                  <div className="flex items-center">
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="text-sm">Múltiplas Impressoras (Android)</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavoritePrintMethod('android');
                        }}
                        className="p-1 hover:bg-accent-foreground/10 rounded"
                      >
                        <Star 
                          className={cn(
                            "h-4 w-4 transition-colors",
                            printerSettings?.defaultPrintMethod === 'android' 
                              ? "fill-amber-500 text-amber-500" 
                              : "text-amber-500"
                          )} 
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px]">
                      <p className="font-medium">Definir como impressão padrão</p>
                      <p className="text-xs text-muted-foreground">Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4">
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
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
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
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
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
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Troco para:</span>
                        <span className="font-medium">{formatCurrency((orderDetails as any).changeAmount)}</span>
                      </div>
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
                  <div className="border border-red-200 bg-red-50/50 rounded-xl p-4">
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
                          <span className="font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded block">
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
                          orderDetails.status !== "cancelled" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
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
                          ["preparing", "ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
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
                          ["ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
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
                          orderDetails.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
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
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-amber-800 mb-2">Observações</h4>
                    <p className="text-sm text-amber-700">{orderDetails.notes}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo do cancelamento (obrigatório)
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ex: Produto indisponível, cliente solicitou cancelamento..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
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
            <div className="bg-gray-50 p-4 rounded-xl">
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
          sessionStorage.setItem('whatsapp-info-modal-dismissed', 'true');
        }
        setWhatsappInfoModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md" style={{borderRadius: '16px'}}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
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
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {/* Header do WhatsApp */}
              <div className="bg-emerald-700 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
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
                  className="bg-white rounded-lg px-3 py-2.5 max-w-[85%] shadow-sm relative"
                  style={{
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                    opacity: whatsappMsgFading ? 0 : 1,
                    transform: whatsappMsgFading ? 'translateY(8px)' : 'translateY(0)',
                  }}
                >
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                  <p className="text-[13px] text-gray-800 leading-relaxed">
                    {whatsappMessages[whatsappMsgIndex].text}
                  </p>
                  <p className="text-[13px] text-gray-800 leading-relaxed mt-2">
                    {whatsappMessages[whatsappMsgIndex].text2}
                  </p>
                  <div className="mt-2 text-[13px] text-gray-800">
                    {whatsappMessages[whatsappMsgIndex].items.map((item, i) => (
                      <p key={i}>{item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-1">{whatsappMessages[whatsappMsgIndex].time}</p>
                </div>
              </div>
              {/* Indicadores de posição */}
              <div className="bg-[#e5ddd5] px-4 pb-3 flex justify-center gap-1.5">
                {whatsappMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === whatsappMsgIndex ? 'bg-emerald-600 w-4' : 'bg-gray-400/50'}`}
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
                sessionStorage.setItem('whatsapp-info-modal-dismissed', 'true');
                setWhatsappInfoModalOpen(false);
              }}
            >
              Agora não
            </Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 sm:order-2"
              onClick={() => {
                sessionStorage.setItem('whatsapp-info-modal-dismissed', 'true');
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
    </AdminLayout>
  );
}
