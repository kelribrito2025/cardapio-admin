import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageCircle,
  Mail,
  Calendar,
  User,
  Trash2,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
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
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-amber-600", bgColor: "bg-amber-50" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-gray-600", bgColor: "bg-gray-50" },
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
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("new");
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
  
  // Query para buscar todos os pedidos (para contagem)
  const { data: allOrdersData, refetch: refetchAll } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId!,
    },
    { 
      enabled: !!establishmentId,
      // Polling como fallback apenas se SSE não estiver conectado
      refetchInterval: false,
    }
  );

  // Query para buscar pedidos filtrados por status
  const { data: ordersData, refetch, isLoading } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId!,
      status: activeTab !== "all" ? activeTab : undefined,
    },
    { 
      enabled: !!establishmentId,
      // Polling como fallback apenas se SSE não estiver conectado
      refetchInterval: false,
    }
  );

  // Handlers para eventos SSE
  const handleNewOrder = useCallback(() => {
    // Atualizar cache do tRPC quando novo pedido chegar
    refetch();
    refetchAll();
    // Tocar som de notificação
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    toast.success("Novo pedido recebido!", {
      description: "Um novo pedido acabou de chegar.",
      duration: 5000,
    });
  }, [refetch, refetchAll]);

  const handleOrderUpdate = useCallback(() => {
    // Atualizar cache do tRPC quando pedido for atualizado
    refetch();
    refetchAll();
  }, [refetch, refetchAll]);

  const handleSSEConnected = useCallback(() => {
    console.log("[Pedidos] SSE conectado - tempo real ativado");
  }, []);

  const handleSSEDisconnected = useCallback(() => {
    console.log("[Pedidos] SSE desconectado - ativando fallback de polling");
    // Quando SSE desconectar, fazer refetch manual
    refetch();
    refetchAll();
  }, [refetch, refetchAll]);

  // Hook SSE para receber pedidos em tempo real
  const { status: sseStatus, isConnected: sseConnected } = useOrdersSSE({
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onConnected: handleSSEConnected,
    onDisconnected: handleSSEDisconnected,
    enabled: !!establishmentId,
  });

  // Fallback: polling a cada 30 segundos se SSE não estiver conectado
  useEffect(() => {
    if (!establishmentId || sseConnected) return;
    
    const interval = setInterval(() => {
      console.log("[Pedidos] Polling fallback - SSE não conectado");
      refetch();
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [establishmentId, sseConnected, refetch, refetchAll]);

  const allOrders = allOrdersData?.orders || [];
  const orders = ordersData?.orders || [];

  const { data: orderDetails } = trpc.orders.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      refetchAll();
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

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

  // Count orders by status
  // Calcular contagem usando todos os pedidos
  const orderCounts = {
    new: allOrders?.filter(o => o.status === "new").length ?? 0,
    preparing: allOrders?.filter(o => o.status === "preparing").length ?? 0,
    ready: allOrders?.filter(o => o.status === "ready").length ?? 0,
    completed: allOrders?.filter(o => o.status === "completed").length ?? 0,
    cancelled: allOrders?.filter(o => o.status === "cancelled").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
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

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Novos */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "new" && "ring-2 ring-blue-500"
          )}
          onClick={() => setActiveTab("new")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Novos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-blue-600">{orderCounts.new}</p>
            </div>
            <div className="p-2.5 bg-blue-100 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Em Preparo */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "preparing" && "ring-2 ring-amber-500"
          )}
          onClick={() => setActiveTab("preparing")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Em Preparo</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-amber-600">{orderCounts.preparing}</p>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-lg shrink-0">
              <ChefHat className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        {/* Prontos */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "ready" && "ring-2 ring-emerald-500"
          )}
          onClick={() => setActiveTab("ready")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Prontos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-600">{orderCounts.ready}</p>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-lg shrink-0">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        {/* Finalizados */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "completed" && "ring-2 ring-gray-500"
          )}
          onClick={() => setActiveTab("completed")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Finalizados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-gray-600">{orderCounts.completed}</p>
            </div>
            <div className="p-2.5 bg-gray-100 rounded-lg shrink-0">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        {/* Cancelados */}
        <div 
          className={cn(
            "bg-card rounded-xl p-4 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer border-red-200/50 bg-red-50/30",
            activeTab === "cancelled" && "ring-2 ring-red-500"
          )}
          onClick={() => setActiveTab("cancelled")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Cancelados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-red-600">{orderCounts.cancelled}</p>
            </div>
            <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | "all")}>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
                  <div className="skeleton h-5 w-24 rounded-md mb-3" />
                  <div className="skeleton h-4 w-full rounded-md mb-2" />
                  <div className="skeleton h-3 w-2/3 rounded-md mb-4" />
                  <div className="skeleton h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((order) => {
                const config = statusConfig[order.status as OrderStatus];
                const nextAction = getNextAction(order.status as OrderStatus);
                const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                return (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-200"
                  >
                    {/* Header */}
                    <div className={cn("px-4 py-3 flex items-center justify-between", config.bgColor)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-white/80", config.color)}>
                          <config.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className={cn("font-bold text-sm", config.color)}>#{order.orderNumber}</span>
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Customer info */}
                      {order.customerName && (
                        <p className="font-semibold text-sm mb-1.5">{order.customerName}</p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <PaymentIcon className="h-3.5 w-3.5" />
                          {paymentMethodLabels[order.paymentMethod]?.label}
                        </span>
                        <span className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-medium capitalize">
                          {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between py-2.5 border-t border-border/50">
                        <span className="text-xs text-muted-foreground font-medium">Total</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
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
                            disabled={updateStatusMutation.isPending}
                          >
                            {nextAction.label}
                          </Button>
                        )}
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
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
              })}
            </div>
          ) : (
            <SectionCard>
              <EmptyState
                icon={ClipboardList}
                title="Nenhum pedido"
                description={
                  activeTab === "new"
                    ? "Novos pedidos aparecerão aqui"
                    : `Nenhum pedido ${statusConfig[activeTab as OrderStatus]?.label.toLowerCase() || ""}`
                }
              />
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-hidden">
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
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Order ID and Actions */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedido #{orderDetails.orderNumber}</h2>
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

              {/* Info Cards Grid */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Info */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Informações do Cliente</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {orderDetails.customerName?.charAt(0) || "C"}
                        </span>
                        {orderDetails.customerName || "Cliente"}
                      </span>
                    </div>
                    {orderDetails.customerPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{orderDetails.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  {orderDetails.customerPhone && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`https://wa.me/${orderDetails.customerPhone?.replace(/\D/g, '')}`, '_blank')}>
                        Mensagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Detalhes do Pagamento</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">{format(new Date(orderDetails.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">{paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Informações de Entrega</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{orderDetails.deliveryType === "delivery" ? "Entrega" : "Retirada"}</span>
                    </div>
                    {orderDetails.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium text-right max-w-[150px]">{orderDetails.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items and Status */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Items */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{item.notes || ""}</span>
                          <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                        </div>
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
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir Pedido
            </Button>
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                const phone = orderDetails?.customerPhone?.replace(/\D/g, '');
                if (phone) {
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
    </AdminLayout>
  );
}
