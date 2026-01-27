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
  MoreVertical,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  new: { label: "Novos", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  preparing: { label: "Em Preparo", variant: "warning", icon: ChefHat, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  ready: { label: "Prontos", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  completed: { label: "Finalizados", variant: "default", icon: CheckCircle, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
  cancelled: { label: "Cancelados", variant: "error", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
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

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const utils = trpc.useUtils();
  
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
      
      const order = previousAllOrders?.orders?.find(o => o.id === variables.id);
      if (order?.status === "new" && variables.status !== "new") {
        decrementCount();
      }
      
      return { previousAllOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousAllOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0 },
          context.previousAllOrders
        );
      }
      toast.error("Erro ao atualizar status", {
        description: "Tente novamente.",
      });
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
    onSuccess: (_, variables) => {
      const statusMessages: Record<OrderStatus, string> = {
        new: "Pedido marcado como novo",
        preparing: "Pedido em preparo",
        ready: "Pedido pronto para entrega",
        completed: "Pedido finalizado",
        cancelled: "Pedido cancelado",
      };
      toast.success(statusMessages[variables.status as OrderStatus]);
    },
  });

  // Função para impressão térmica
  const handlePrintThermal = async (orderId: number) => {
    try {
      const response = await fetch(`/api/print/thermal/${orderId}`);
      if (!response.ok) throw new Error("Erro ao gerar impressão");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      toast.error("Erro ao imprimir", {
        description: "Não foi possível gerar a impressão.",
      });
    }
  };

  // Função para impressão em múltiplas impressoras
  const handlePrintMultiPrinter = async (orderId: number) => {
    try {
      const response = await fetch(`/api/print/multi/${orderId}`);
      if (!response.ok) throw new Error("Erro ao gerar impressão");
      
      const data = await response.json();
      
      if (data.printUrl) {
        window.open(data.printUrl, '_blank');
      }
    } catch (error) {
      toast.error("Erro ao imprimir", {
        description: "Não foi possível gerar a impressão.",
      });
    }
  };

  // Função para impressão direta
  const handlePrintOrderDirect = (orderId: number) => {
    if (!orderDetails && orderId !== selectedOrder) {
      setSelectedOrder(orderId);
      setTimeout(() => handlePrintOrderDirect(orderId), 500);
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Erro ao abrir janela de impressão");
      return;
    }
    
    const orderToPrint = orderId === selectedOrder ? orderDetails : allOrders.find(o => o.id === orderId);
    if (!orderToPrint) {
      toast.error("Pedido não encontrado");
      return;
    }
    
    const itemsHtml = (orderToPrint as any).items?.map((item: any) => {
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
    
    const discount = (orderToPrint as any).discount ? Number((orderToPrint as any).discount) : 0;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${(orderToPrint as any).orderNumber?.startsWith('#') ? (orderToPrint as any).orderNumber : `#${(orderToPrint as any).orderNumber}`}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; padding: 20px; max-width: 320px; margin: 0 auto; }
          .logo { text-align: center; padding-bottom: 15px; margin-bottom: 15px; }
          .logo h1 { font-size: 22px; font-weight: bold; }
          .order-info { margin-bottom: 15px; }
          .order-info h2 { font-size: 16px; font-weight: bold; }
          .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
          .item { margin-bottom: 10px; }
          .item-header { display: flex; justify-content: space-between; font-weight: 500; }
          .item-obs { font-size: 11px; color: #666; margin-top: 2px; }
          .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
          .totals { margin: 15px 0; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .total-row.final { font-weight: bold; font-size: 15px; margin-top: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="logo"><h1>${establishment?.name || 'Cardápio'}</h1></div>
        <div class="order-info">
          <h2>Pedido ${(orderToPrint as any).orderNumber?.startsWith('#') ? (orderToPrint as any).orderNumber : `#${(orderToPrint as any).orderNumber}`}</h2>
          <p>${format(new Date((orderToPrint as any).createdAt), "dd/MM/yyyy HH:mm")}</p>
        </div>
        <hr class="divider">
        <div class="items">${itemsHtml}</div>
        <hr class="divider">
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>R$ ${Number((orderToPrint as any).subtotal).toFixed(2).replace('.', ',')}</span></div>
          ${discount > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
          <div class="total-row"><span>Taxa de entrega</span><span>${Number((orderToPrint as any).deliveryFee) > 0 ? `R$ ${Number((orderToPrint as any).deliveryFee).toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>
          <div class="total-row final"><span>Total</span><span>R$ ${Number((orderToPrint as any).total).toFixed(2).replace('.', ',')}</span></div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
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
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
    
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

  // Agrupar pedidos por status
  const ordersByStatus = {
    new: allOrders?.filter(o => o.status === "new") ?? [],
    preparing: allOrders?.filter(o => o.status === "preparing") ?? [],
    ready: allOrders?.filter(o => o.status === "ready") ?? [],
    completed: allOrders?.filter(o => o.status === "completed") ?? [],
    cancelled: allOrders?.filter(o => o.status === "cancelled") ?? [],
  };

  // Colunas do Kanban (sem finalizados e cancelados para manter mais limpo)
  const kanbanColumns: OrderStatus[] = ["new", "preparing", "ready"];

  // Componente de Card de Pedido compacto para o Kanban
  const OrderCard = ({ order }: { order: typeof allOrders[0] }) => {
    const config = statusConfig[order.status as OrderStatus];
    const nextAction = getNextAction(order.status as OrderStatus);
    const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

    return (
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header compacto */}
        <div className={cn("px-3 py-2 flex items-center justify-between", config.bgColor)}>
          <div className="flex items-center gap-2">
            <span className={cn("font-bold text-sm", config.color)}>
              {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
            </span>
          </div>
          <div className={cn("flex items-center gap-1 text-xs", config.color)}>
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: false, locale: ptBR })}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Cliente e valor */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm truncate max-w-[120px]">
              {order.customerName || "Cliente"}
            </span>
            <span className="font-bold text-primary">
              {formatCurrency(order.total)}
            </span>
          </div>

          {/* Info linha */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <PaymentIcon className="h-3 w-3" />
              {paymentMethodLabels[order.paymentMethod]?.label}
            </span>
            <span>•</span>
            <span className="capitalize">
              {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setSelectedOrder(order.id)}
            >
              Detalhes
            </Button>
            {nextAction && (
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                disabled={updateStatusMutation.isPending}
              >
                {nextAction.label}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePrintOrderDirect(order.id)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrintThermal(order.id)}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Impressora Térmica
                </DropdownMenuItem>
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => {
                        setOrderToCancel(order.id);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
        />
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            sseConnected 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-amber-100 text-amber-700"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              sseConnected 
                ? "bg-emerald-500 animate-pulse" 
                : "bg-amber-500"
            )} />
            {sseConnected ? "Tempo real" : "Polling"}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {kanbanColumns.map((status) => {
          const config = statusConfig[status];
          const orders = ordersByStatus[status];
          const StatusIcon = config.icon;

          return (
            <div 
              key={status} 
              className={cn(
                "flex-shrink-0 w-[320px] rounded-xl border-2 flex flex-col",
                config.borderColor,
                config.bgColor
              )}
            >
              {/* Column Header */}
              <div className={cn("px-4 py-3 border-b", config.borderColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-white", config.color)}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <span className={cn("font-semibold", config.color)}>{config.label}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-sm font-bold bg-white",
                    config.color
                  )}>
                    {orders.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-xl border p-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <StatusIcon className={cn("h-10 w-10 mb-2 opacity-30", config.color)} />
                    <p className={cn("text-sm font-medium opacity-50", config.color)}>
                      Nenhum pedido
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Coluna de Finalizados/Cancelados (colapsada) */}
        <div className="flex-shrink-0 w-[280px] rounded-xl border-2 border-gray-200 bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white text-gray-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="font-semibold text-gray-600">Histórico</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-white text-gray-600">
                {ordersByStatus.completed.length + ordersByStatus.cancelled.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Finalizados */}
            {ordersByStatus.completed.slice(0, 5).map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg border border-gray-200 p-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setSelectedOrder(order.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-gray-600">
                    {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">Finalizado</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {order.customerName}
                  </span>
                  <span className="text-xs font-medium">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}
            
            {/* Cancelados */}
            {ordersByStatus.cancelled.slice(0, 3).map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg border border-red-200 p-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setSelectedOrder(order.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-gray-600">
                    {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                  </span>
                  <span className="text-xs text-red-600 font-medium">Cancelado</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {order.customerName}
                  </span>
                  <span className="text-xs font-medium">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}

            {(ordersByStatus.completed.length > 5 || ordersByStatus.cancelled.length > 3) && (
              <p className="text-xs text-center text-muted-foreground py-2">
                + {Math.max(0, ordersByStatus.completed.length - 5) + Math.max(0, ordersByStatus.cancelled.length - 3)} mais pedidos
              </p>
            )}
          </div>
        </div>
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

              {/* Info Cards */}
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
                    {Number(orderDetails.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="font-medium text-red-500">-{formatCurrency(orderDetails.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="font-bold text-primary">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(orderDetails.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Info */}
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
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-border/50 space-y-3">
                {getNextAction(orderDetails.status as OrderStatus) && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate(orderDetails.id, getNextAction(orderDetails.status as OrderStatus)!.newStatus)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {getNextAction(orderDetails.status as OrderStatus)?.label}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handlePrintOrderDirect(orderDetails.id)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  {orderDetails.status !== "completed" && orderDetails.status !== "cancelled" && (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => {
                        setOrderToCancel(orderDetails.id);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Motivo do cancelamento (opcional)</label>
            <textarea
              className="w-full mt-2 p-3 border rounded-lg resize-none"
              rows={3}
              placeholder="Informe o motivo do cancelamento..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={updateStatusMutation.isPending}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
