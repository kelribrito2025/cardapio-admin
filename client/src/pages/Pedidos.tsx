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
  Plus,
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
  headerBg: string;
  headerText: string;
  emptyText: string;
}> = {
  new: { 
    label: "Novos", 
    variant: "info", 
    icon: Clock, 
    headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",
    headerText: "text-white",
    emptyText: "Nenhum pedido novo"
  },
  preparing: { 
    label: "Em Preparo", 
    variant: "warning", 
    icon: ChefHat, 
    headerBg: "bg-gradient-to-r from-orange-400 to-orange-500",
    headerText: "text-white",
    emptyText: "Nenhum em preparo"
  },
  ready: { 
    label: "Prontos", 
    variant: "success", 
    icon: Package, 
    headerBg: "bg-gradient-to-r from-green-500 to-green-600",
    headerText: "text-white",
    emptyText: "Nenhum pronto"
  },
  completed: { 
    label: "Finalizados", 
    variant: "default", 
    icon: CheckCircle, 
    headerBg: "bg-gradient-to-r from-gray-700 to-gray-800",
    headerText: "text-white",
    emptyText: "Nenhum finalizado"
  },
  cancelled: { 
    label: "Cancelados", 
    variant: "error", 
    icon: XCircle, 
    headerBg: "bg-gradient-to-r from-red-500 to-red-600",
    headerText: "text-white",
    emptyText: "Nenhum cancelado"
  },
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
        <title>Pedido ${orderToPrint.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .order-number { font-size: 24px; font-weight: bold; }
          .customer { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .item { padding: 8px 0; border-bottom: 1px dashed #ccc; }
          .item-header { display: flex; justify-content: space-between; }
          .item-qty { font-weight: bold; }
          .item-complement { font-size: 12px; color: #666; margin-left: 15px; }
          .item-obs { font-size: 12px; color: #666; font-style: italic; margin-top: 4px; }
          .total { margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-size: 18px; font-weight: bold; text-align: right; }
          .delivery { margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px; }
          .payment { margin-top: 10px; padding: 10px; background: #fff3e0; border-radius: 5px; }
          .discount { color: #e53935; }
          @media print { body { margin: 0; padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="order-number">${orderToPrint.orderNumber}</div>
          <div>${format(new Date(orderToPrint.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
        </div>
        <div class="customer">
          <strong>${orderToPrint.customerName}</strong><br>
          ${orderToPrint.customerPhone}
        </div>
        <div class="items">
          ${itemsHtml}
        </div>
        ${discount > 0 ? `<div class="discount">Desconto: -R$ ${discount.toFixed(2).replace('.', ',')}</div>` : ''}
        <div class="total">Total: R$ ${Number(orderToPrint.total).toFixed(2).replace('.', ',')}</div>
        <div class="delivery">
          <strong>${orderToPrint.deliveryType === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</strong><br>
          ${orderToPrint.deliveryType === 'delivery' && (orderToPrint as any).deliveryAddress 
            ? `${(orderToPrint as any).deliveryAddress}${(orderToPrint as any).deliveryNumber ? `, ${(orderToPrint as any).deliveryNumber}` : ''}${(orderToPrint as any).deliveryNeighborhood ? ` - ${(orderToPrint as any).deliveryNeighborhood}` : ''}${(orderToPrint as any).deliveryComplement ? ` (${(orderToPrint as any).deliveryComplement})` : ''}`
            : 'Retirar no local'}
        </div>
        <div class="payment">
          <strong>💳 ${paymentMethodLabels[orderToPrint.paymentMethod]?.label || orderToPrint.paymentMethod}</strong>
          ${orderToPrint.changeAmount ? `<br>Troco para: R$ ${Number(orderToPrint.changeAmount).toFixed(2).replace('.', ',')}` : ''}
        </div>
        ${orderToPrint.notes ? `<div style="margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 5px;"><strong>📝 Obs:</strong> ${orderToPrint.notes}</div>` : ''}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Early return after all hooks
  if (establishmentLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!establishment) {
    return (
      <AdminLayout>
        <EmptyState
          icon={ClipboardList}
          title="Configure seu estabelecimento"
          description="Antes de gerenciar pedidos, você precisa configurar as informações do seu estabelecimento."
        />
      </AdminLayout>
    );
  }

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // Agrupar pedidos por status
  const ordersByStatus: Record<OrderStatus, typeof allOrders> = {
    new: allOrders.filter(o => o.status === "new"),
    preparing: allOrders.filter(o => o.status === "preparing"),
    ready: allOrders.filter(o => o.status === "ready"),
    completed: allOrders.filter(o => o.status === "completed"),
    cancelled: allOrders.filter(o => o.status === "cancelled"),
  };

  // Colunas do Kanban (sem cancelled que vai junto com completed)
  const kanbanColumns: OrderStatus[] = ["new", "preparing", "ready", "completed"];

  // Componente de card do pedido
  const OrderCard = ({ order }: { order: typeof allOrders[0] }) => {
    const items = (order as any).items || [];
    const itemsText = items.length > 0 
      ? items.slice(0, 2).map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')
      : 'Sem itens';
    const moreItems = items.length > 2 ? ` +${items.length - 2}` : '';

    return (
      <div 
        className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => setSelectedOrder(order.id)}
      >
        {/* Card Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800">
              {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">{order.customerName}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3">
          <p className="text-xs text-gray-500 truncate">
            {itemsText}{moreItems}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-gray-800">{formatCurrency(order.total)}</span>
            <div className="flex items-center gap-1">
              {order.deliveryType === 'delivery' ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Entrega</span>
              ) : (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Retirada</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="px-3 pb-3 flex items-center gap-2">
          {order.status === "new" && (
            <Button 
              size="sm" 
              className="flex-1 h-8 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({ id: order.id, status: "preparing" });
              }}
            >
              <ChefHat className="h-3 w-3 mr-1" />
              Preparar
            </Button>
          )}
          {order.status === "preparing" && (
            <Button 
              size="sm" 
              className="flex-1 h-8 bg-green-500 hover:bg-green-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({ id: order.id, status: "ready" });
              }}
            >
              <Package className="h-3 w-3 mr-1" />
              Pronto
            </Button>
          )}
          {order.status === "ready" && (
            <Button 
              size="sm" 
              className="flex-1 h-8 bg-gray-700 hover:bg-gray-800 text-white"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({ id: order.id, status: "completed" });
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Finalizar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
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
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {kanbanColumns.map((status) => {
          const config = statusConfig[status];
          const orders = ordersByStatus[status];
          const StatusIcon = config.icon;

          return (
            <div 
              key={status} 
              className="flex-shrink-0 w-[320px] rounded-2xl bg-gray-50 flex flex-col overflow-hidden shadow-sm"
            >
              {/* Column Header - Colorido */}
              <div className={cn("px-4 py-3", config.headerBg)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <StatusIcon className={cn("h-5 w-5", config.headerText)} />
                    </div>
                    <div>
                      <span className={cn("font-bold text-lg", config.headerText)}>{config.label}</span>
                      <p className={cn("text-sm opacity-80", config.headerText)}>{orders.length} pedidos</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8 hover:bg-white/20", config.headerText)}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => refetchAll()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <Plus className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">
                      {config.emptyText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Resumo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-gray-800">Total de Pedidos Hoje</span>
              <span className="text-sm text-gray-500">{allOrders.length} pedidos processados</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-500">{ordersByStatus.new.length}</span>
                <p className="text-xs text-gray-500">Novos</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-500">{ordersByStatus.preparing.length}</span>
                <p className="text-xs text-gray-500">Preparo</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-green-500">{ordersByStatus.ready.length}</span>
                <p className="text-xs text-gray-500">Prontos</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-600">{ordersByStatus.completed.length}</span>
                <p className="text-xs text-gray-500">Finalizados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {orderDetails && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-xl font-bold">
                    {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}
                  </span>
                  <StatusBadge 
                    variant={statusConfig[orderDetails.status as OrderStatus]?.variant || "default"}
                  >
                    {statusConfig[orderDetails.status as OrderStatus]?.label || orderDetails.status}
                  </StatusBadge>
                </SheetTitle>
                <SheetDescription>
                  {format(new Date(orderDetails.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Cliente */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="font-medium">{orderDetails.customerName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {orderDetails.customerPhone}
                    </div>
                    {(orderDetails as any).customerEmail && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {(orderDetails as any).customerEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Entrega */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {orderDetails.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    {orderDetails.deliveryType === 'delivery' ? (
                      <p className="text-sm">
                        {(orderDetails as any).deliveryAddress}
                        {(orderDetails as any).deliveryNumber && `, ${(orderDetails as any).deliveryNumber}`}
                        {(orderDetails as any).deliveryNeighborhood && ` - ${(orderDetails as any).deliveryNeighborhood}`}
                        {(orderDetails as any).deliveryComplement && (
                          <span className="block text-muted-foreground mt-1">
                            Complemento: {(orderDetails as any).deliveryComplement}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm">Retirar no estabelecimento</p>
                    )}
                  </div>
                </div>

                {/* Itens */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {(orderDetails as any).items?.map((item: any, index: number) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{item.quantity}x {item.productName}</p>
                            {item.complements && item.complements.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.complements.map((c: any, i: number) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    + {c.name} {Number(c.price) > 0 && `(${formatCurrency(c.price)})`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Obs: {item.notes}
                              </p>
                            )}
                          </div>
                          <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagamento */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {paymentMethodLabels[orderDetails.paymentMethod]?.icon && (
                        <span className="text-muted-foreground">
                          {(() => {
                            const Icon = paymentMethodLabels[orderDetails.paymentMethod]?.icon;
                            return Icon ? <Icon className="h-4 w-4" /> : null;
                          })()}
                        </span>
                      )}
                      <span className="font-medium">
                        {paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}
                      </span>
                    </div>
                    {orderDetails.changeAmount && (
                      <p className="text-sm text-muted-foreground">
                        Troco para: {formatCurrency(orderDetails.changeAmount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  {(orderDetails as any).discount && Number((orderDetails as any).discount) > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Desconto</span>
                      <span className="text-red-500">-{formatCurrency((orderDetails as any).discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(orderDetails.total)}</span>
                  </div>
                </div>

                {/* Observações */}
                {orderDetails.notes && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Observações
                    </h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm">{orderDetails.notes}</p>
                    </div>
                  </div>
                )}

                {/* Motivo do cancelamento */}
                {orderDetails.status === "cancelled" && orderDetails.cancellationReason && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Motivo do Cancelamento
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{orderDetails.cancellationReason}</p>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-6 flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePrintOrderDirect(orderDetails.id)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handlePrintThermal(orderDetails.id)}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
                
                {orderDetails.status === "new" && (
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: orderDetails.id, status: "preparing" });
                      setSelectedOrder(null);
                    }}
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Iniciar Preparo
                  </Button>
                )}
                {orderDetails.status === "preparing" && (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: orderDetails.id, status: "ready" });
                      setSelectedOrder(null);
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Marcar como Pronto
                  </Button>
                )}
                {orderDetails.status === "ready" && (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: orderDetails.id, status: "completed" });
                      setSelectedOrder(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Pedido
                  </Button>
                )}
                
                {orderDetails.status !== "completed" && orderDetails.status !== "cancelled" && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      setOrderToCancel(orderDetails.id);
                      setCancelDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Pedido
                  </Button>
                )}
              </SheetFooter>
            </>
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
              className="w-full mt-2 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Ex: Cliente desistiu, item indisponível..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCancelDialogOpen(false);
              setCancellationReason("");
            }}>
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (orderToCancel) {
                  updateStatusMutation.mutate({ 
                    id: orderToCancel, 
                    status: "cancelled",
                    cancellationReason: cancellationReason || undefined
                  });
                  setCancelDialogOpen(false);
                  setSelectedOrder(null);
                  setOrderToCancel(null);
                  setCancellationReason("");
                }
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
