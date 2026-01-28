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
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
    toast.success("Novo pedido recebido!", {
      description: "Um novo pedido acabou de chegar.",
      duration: 5000,
    });
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

  // Função para imprimir pedido
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.");
      return;
    }
    
    const itemsHtml = orderDetails.items?.map(item => {
      const unitPrice = Number(item.totalPrice) / item.quantity;
      const complementsHtml = item.complements && item.complements.length > 0
        ? item.complements.map((c: any) => {
            const price = Number(c.price || 0);
            const priceStr = price > 0 ? ` (R$ ${price.toFixed(2).replace('.', ',')})` : '';
            return `<div class="item-complement">+ ${c.name}${priceStr}</div>`;
          }).join('')
        : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-qty">${item.quantity}x ${item.productName}</span>
            <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
          </div>
          ${complementsHtml}
          ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
        </div>
      `;
    }).join('') || '';
    
    const discount = orderDetails.discount ? Number(orderDetails.discount) : 0;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 13px; 
            padding: 20px; 
            max-width: 320px; 
            margin: 0 auto; 
            background: #f5f5f0;
            color: #333;
          }
          .receipt { background: #f5f5f0; padding: 10px; }
          .logo { text-align: center; padding-bottom: 15px; margin-bottom: 15px; }
          .logo h1 { font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 1px; }
          .logo p { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
          .order-info { margin-bottom: 15px; }
          .order-info h2 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .order-info p { font-size: 12px; color: #666; }
          .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
          .divider-dashed { border: none; border-top: 1px dashed #bbb; margin: 10px 0; }
          .item { margin-bottom: 10px; }
          .item-header { display: flex; justify-content: space-between; font-weight: 500; }
          .item-obs { font-size: 11px; color: #666; margin-top: 2px; padding-left: 5px; }
          .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
          .totals { margin: 15px 0; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
          .total-row.final { font-weight: bold; font-size: 15px; margin-top: 8px; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
          .section-content { font-size: 13px; color: #444; line-height: 1.4; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; }
          .footer p { font-size: 11px; color: #666; }
          @media print { body { padding: 0; background: white; } .receipt { background: white; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="logo">
            <h1>${establishment?.name || 'Cardápio'}</h1>
            <p>Sistema de Pedidos</p>
          </div>
          <div class="order-info">
            <h2>Pedido ${orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
            <p>Realizado em: ${format(new Date(orderDetails.createdAt), "dd/MM/yyyy")} - ${format(new Date(orderDetails.createdAt), "HH:mm")}</p>
          </div>
          <hr class="divider">
          <div class="items">${itemsHtml}</div>
          <hr class="divider-dashed">
          <div class="totals">
            <div class="total-row"><span>Valor dos produtos</span><span>R$ ${Number(orderDetails.subtotal).toFixed(2).replace('.', ',')}</span></div>
            ${orderDetails.couponCode ? `<div class="total-row"><span>Cupom aplicado</span><span>${orderDetails.couponCode}</span></div>` : ''}
            ${discount > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
            <div class="total-row"><span>Taxa de entrega</span><span>${Number(orderDetails.deliveryFee) > 0 ? `R$ ${Number(orderDetails.deliveryFee).toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>
            <div class="total-row final"><span>Total</span><span>R$ ${Number(orderDetails.total).toFixed(2).replace('.', ',')}</span></div>
          </div>
          ${orderDetails.notes ? `<hr class="divider"><div class="section"><div class="section-title">Observações:</div><div class="section-content">${orderDetails.notes}</div></div>` : ''}
          <hr class="divider">
          <div class="section"><div class="section-title">Entrega</div><div class="section-content">${orderDetails.deliveryType === 'delivery' ? (orderDetails.customerAddress || 'Endereço não informado') : 'Retirada no local'}</div></div>
          <hr class="divider">
          <div class="section"><div class="section-title">Forma de pagamento</div><div class="section-content">${paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</div></div>
          <hr class="divider">
          <div class="section"><div class="section-title">Cliente</div><div class="section-content">${orderDetails.customerName || 'Não informado'}<br>${orderDetails.customerPhone || ''}</div></div>
          <div class="footer"><p>Pedido realizado via Cardápio Admin</p><p>manus.space</p></div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
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
  const handlePrintOrderDirect = async (orderId: number) => {
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
              const price = Number(c.price || 0);
              const priceStr = price > 0 ? ` (R$ ${price.toFixed(2).replace('.', ',')})` : '';
              return `<div class="item-complement">+ ${c.name}${priceStr}</div>`;
            }).join('')
          : '';
        return `
          <div class="item">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x ${item.productName}</span>
              <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
            </div>
            ${complementsHtml}
            ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
          </div>
        `;
      }).join('') || '';
      
      const discount = orderData.discount ? Number(orderData.discount) : 0;
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; padding: 20px; max-width: 320px; margin: 0 auto; background: #f5f5f0; color: #333; }
            .receipt { background: #f5f5f0; padding: 10px; }
            .logo { text-align: center; padding-bottom: 15px; margin-bottom: 15px; }
            .logo h1 { font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 1px; }
            .logo p { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
            .order-info { margin-bottom: 15px; }
            .order-info h2 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .order-info p { font-size: 12px; color: #666; }
            .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
            .divider-dashed { border: none; border-top: 1px dashed #bbb; margin: 10px 0; }
            .item { margin-bottom: 10px; }
            .item-header { display: flex; justify-content: space-between; font-weight: 500; }
            .item-obs { font-size: 11px; color: #666; margin-top: 2px; padding-left: 5px; }
            .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
            .totals { margin: 15px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
            .total-row.final { font-weight: bold; font-size: 15px; margin-top: 8px; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
            .section-content { font-size: 13px; color: #444; line-height: 1.4; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; }
            .footer p { font-size: 11px; color: #666; }
            @media print { body { padding: 0; background: white; } .receipt { background: white; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo"><h1>${establishment?.name || 'Cardápio'}</h1><p>Sistema de Pedidos</p></div>
            <div class="order-info"><h2>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</h2><p>Realizado em: ${format(new Date(orderData.createdAt), "dd/MM/yyyy")} - ${format(new Date(orderData.createdAt), "HH:mm")}</p></div>
            <hr class="divider">
            <div class="items">${itemsHtml}</div>
            <hr class="divider-dashed">
            <div class="totals">
              <div class="total-row"><span>Valor dos produtos</span><span>R$ ${Number(orderData.subtotal).toFixed(2).replace('.', ',')}</span></div>
              ${orderData.couponCode ? `<div class="total-row"><span>Cupom aplicado</span><span>${orderData.couponCode}</span></div>` : ''}
              ${discount > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
              <div class="total-row"><span>Taxa de entrega</span><span>${Number(orderData.deliveryFee) > 0 ? `R$ ${Number(orderData.deliveryFee).toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>
              <div class="total-row final"><span>Total</span><span>R$ ${Number(orderData.total).toFixed(2).replace('.', ',')}</span></div>
            </div>
            ${orderData.notes ? `<hr class="divider"><div class="section"><div class="section-title">Observações:</div><div class="section-content">${orderData.notes}</div></div>` : ''}
            <hr class="divider">
            <div class="section"><div class="section-title">Entrega</div><div class="section-content">${orderData.deliveryType === 'delivery' ? (orderData.customerAddress || 'Endereço não informado') : 'Retirada no local'}</div></div>
            <hr class="divider">
            <div class="section"><div class="section-title">Forma de pagamento</div><div class="section-content">${paymentMethodLabels[orderData.paymentMethod]?.label || orderData.paymentMethod}</div></div>
            <hr class="divider">
            <div class="section"><div class="section-title">Cliente</div><div class="section-content">${orderData.customerName || 'Não informado'}<br>${orderData.customerPhone || ''}</div></div>
            <div class="footer"><p>Pedido realizado via Cardápio Admin</p><p>manus.space</p></div>
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

  // Se não há estabelecimento, mostrar tela de criação
  if (!establishmentLoading && !establishment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 bg-muted/30 rounded-3xl mb-6">
            <ClipboardList className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configure seu estabelecimento</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Antes de gerenciar pedidos, você precisa configurar as informações do seu estabelecimento.
          </p>
          <Button onClick={() => window.location.href = "/configuracoes"} className="rounded-xl">
            Ir para Configurações
          </Button>
        </div>
      </AdminLayout>
    );
  }

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
      toast.success("📦 Pedido aceito e enviado para impressão!", {
        description: "O pedido foi aceito e está sendo enviado para as impressoras.",
        duration: 4000,
      });
      
      setTimeout(() => {
        handlePrintMultiPrinter(orderId);
      }, 300);
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

  // Agrupar pedidos por status para o Kanban
  const ordersByStatus = {
    new: allOrders?.filter(o => o.status === "new") ?? [],
    preparing: allOrders?.filter(o => o.status === "preparing") ?? [],
    ready: allOrders?.filter(o => o.status === "ready") ?? [],
    completed: allOrders?.filter(o => o.status === "completed") ?? [],
    cancelled: allOrders?.filter(o => o.status === "cancelled") ?? [],
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
        />
        {/* Card de Status de Conexão WhatsApp */}
        <div className="hidden sm:flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-medium shadow-sm",
            !isWhatsappFetched || isWhatsappLoading
              ? "bg-gray-50 border-gray-200 text-gray-600"
              : whatsappStatus?.status === 'connected'
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
          )} style={{width: '224px', height: '41px'}}>
            {/* Ícone de status */}
            <div className="flex items-center gap-2">
              {!isWhatsappFetched || isWhatsappLoading ? (
                /* Estado de carregamento */
                <>
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                  <span>Verificando...</span>
                </>
              ) : whatsappStatus?.status === 'connected' ? (
                /* Conectado */
                <>
                  <Wifi className="h-4 w-4 text-emerald-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Conectado</span>
                </>
              ) : (
                /* Desconectado */
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="w-2 h-2 rounded-full bg-red-500" />
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
                /* Quando conectado: Atualizar e Desconectar */
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-white/50"
                          onClick={async () => {
                            setWhatsappLoading(true);
                            await refetchWhatsappStatus();
                            setWhatsappLoading(false);
                            toast.success("Status atualizado");
                          }}
                          disabled={whatsappLoading}
                        >
                          <RefreshCw className={cn("h-4 w-4", whatsappLoading && "animate-spin")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atualizar status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
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
                </>
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
                column.borderColor
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
                                {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
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
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePrintOrderDirect(order.id)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Impressão Normal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrintMultiPrinter(order.id)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Múltiplas Impressoras (Android)
                                </DropdownMenuItem>
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
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
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
                </div>
                <div className="flex items-center gap-2">
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
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`https://wa.me/${orderDetails.customerPhone?.replace(/\D/g, '')}`, '_blank')}>
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
                            {item.complements.map((complement: { name: string; price: number }, compIndex: number) => (
                              <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                <span className="text-foreground/70">+ {complement.name}</span>
                                {complement.price > 0 && (
                                  <span className="text-foreground/70">+ {formatCurrency(complement.price)}</span>
                                )}
                              </div>
                            ))}
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
                    {Number(orderDetails.deliveryFee) > 0 && (
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
                  <h4 className="font-semibold text-base mb-3">Entrega e Pagamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{orderDetails.deliveryType === "delivery" ? "Entrega" : "Retirada"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">{paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</span>
                    </div>
                    {orderDetails.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium text-right max-w-[180px]">{orderDetails.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir Pedido
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handlePrintOrder}>
                  <Printer className="h-4 w-4 mr-2" />
                  Impressão Normal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => orderDetails && handlePrintMultiPrinter(orderDetails.id)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Múltiplas Impressoras (Android)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                let phone = orderDetails?.customerPhone?.replace(/\D/g, '');
                if (phone) {
                  // Adicionar código do país (55) se não estiver presente
                  if (!phone.startsWith('55')) {
                    phone = '55' + phone;
                  }
                  window.open(`https://wa.me/${phone}?text=Olá! Sobre seu pedido %23${orderDetails?.orderNumber}...`, '_blank');
                } else {
                  toast.error("Cliente não possui telefone cadastrado");
                }
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Mensagem no WhatsApp
            </Button>
          </div>
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
    </AdminLayout>
  );
}
