import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
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

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const { data: orders, refetch, isLoading } = trpc.order.list.useQuery(
    { 
      establishmentId: establishmentId!,
      status: activeTab !== "all" ? activeTab : undefined,
    },
    { 
      enabled: !!establishmentId,
      refetchInterval: 30000,
    }
  );

  const { data: orderDetails } = trpc.order.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
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
        { id: orderToCancel, status: "cancelled" },
        {
          onSuccess: () => {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
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
  const orderCounts = {
    new: orders?.filter(o => o.status === "new").length ?? 0,
    preparing: orders?.filter(o => o.status === "preparing").length ?? 0,
    ready: orders?.filter(o => o.status === "ready").length ?? 0,
    completed: orders?.filter(o => o.status === "completed").length ?? 0,
    cancelled: orders?.filter(o => o.status === "cancelled").length ?? 0,
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Pedidos"
        description="Gerencie os pedidos do seu estabelecimento"
        actions={
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl border-border/50 hover:bg-accent">
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Novos */}
        <div 
          className={cn(
            "bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "new" && "ring-2 ring-blue-500"
          )}
          onClick={() => setActiveTab("new")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Novos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-blue-600">{orderCounts.new}</p>
            </div>
            <div className="p-2.5 bg-blue-100 rounded-xl shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Em Preparo */}
        <div 
          className={cn(
            "bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "preparing" && "ring-2 ring-amber-500"
          )}
          onClick={() => setActiveTab("preparing")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Em Preparo</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-amber-600">{orderCounts.preparing}</p>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-xl shrink-0">
              <ChefHat className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        {/* Prontos */}
        <div 
          className={cn(
            "bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "ready" && "ring-2 ring-emerald-500"
          )}
          onClick={() => setActiveTab("ready")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Prontos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-600">{orderCounts.ready}</p>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-xl shrink-0">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        {/* Finalizados */}
        <div 
          className={cn(
            "bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "completed" && "ring-2 ring-gray-500"
          )}
          onClick={() => setActiveTab("completed")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Finalizados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-gray-600">{orderCounts.completed}</p>
            </div>
            <div className="p-2.5 bg-gray-100 rounded-xl shrink-0">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        {/* Cancelados */}
        <div 
          className={cn(
            "bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer border-red-200/50 bg-red-50/30",
            activeTab === "cancelled" && "ring-2 ring-red-500"
          )}
          onClick={() => setActiveTab("cancelled")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Cancelados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-red-600">{orderCounts.cancelled}</p>
            </div>
            <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
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
                <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
                  <div className="skeleton h-6 w-28 rounded-lg mb-4" />
                  <div className="skeleton h-5 w-full rounded-lg mb-3" />
                  <div className="skeleton h-4 w-2/3 rounded-lg mb-5" />
                  <div className="skeleton h-11 w-full rounded-xl" />
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
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-200"
                  >
                    {/* Header */}
                    <div className={cn("px-5 py-4 flex items-center justify-between", config.bgColor)}>
                      <div className="flex items-center gap-2.5">
                        <div className={cn("p-2 rounded-xl bg-white/80", config.color)}>
                          <config.icon className="h-4 w-4" />
                        </div>
                        <span className={cn("font-bold text-lg", config.color)}>#{order.orderNumber}</span>
                      </div>
                      <div className={cn("flex items-center gap-1.5 text-sm font-medium", config.color)}>
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Customer info */}
                      {order.customerName && (
                        <p className="font-semibold text-base mb-2">{order.customerName}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <PaymentIcon className="h-4 w-4" />
                          {paymentMethodLabels[order.paymentMethod]?.label}
                        </span>
                        <span className="px-2 py-0.5 bg-muted/50 rounded-md text-xs font-medium capitalize">
                          {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between py-3 border-t border-border/50">
                        <span className="text-sm text-muted-foreground font-medium">Total</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10 rounded-xl border-border/50 hover:bg-accent"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          Ver detalhes
                        </Button>
                        {nextAction && (
                          <Button
                            size="sm"
                            className="flex-1 h-10 rounded-xl shadow-sm"
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
                            className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setOrderToCancel(order.id);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-5 w-5" />
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

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Pedido #{orderDetails?.orderNumber}</DialogTitle>
            <DialogDescription>
              {orderDetails && (
                <StatusBadge variant={statusConfig[orderDetails.status as OrderStatus]?.variant}>
                  {statusConfig[orderDetails.status as OrderStatus]?.label}
                </StatusBadge>
              )}
            </DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-5">
              {/* Customer */}
              {(orderDetails.customerName || orderDetails.customerPhone) && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Cliente</h4>
                  {orderDetails.customerName && (
                    <p className="font-semibold text-base">{orderDetails.customerName}</p>
                  )}
                  {orderDetails.customerPhone && (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {orderDetails.customerPhone}
                    </p>
                  )}
                  {orderDetails.customerAddress && (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {orderDetails.customerAddress}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Itens</h4>
                <div className="space-y-3">
                  {orderDetails.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm p-3 bg-muted/30 rounded-xl">
                      <span className="font-medium">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-border/50 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                {Number(orderDetails.deliveryFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="font-medium">{formatCurrency(orderDetails.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Observações</h4>
                  <p className="text-sm bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200/50">{orderDetails.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updateStatusMutation.isPending}
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
