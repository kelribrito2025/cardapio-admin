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
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600 bg-blue-100" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-amber-600 bg-amber-100" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-green-600 bg-green-100" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-gray-600 bg-gray-100" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-600 bg-red-100" },
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: CreditCard },
  boleto: { label: "Boleto", icon: CreditCard },
};

export default function Pedidos() {
  const { data: establishment } = trpc.establishment.get.useQuery();
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

  // Fetch orders
  const { data: orders, refetch, isLoading } = trpc.order.list.useQuery(
    { 
      establishmentId: establishmentId!,
      status: activeTab !== "all" ? activeTab : undefined,
    },
    { 
      enabled: !!establishmentId,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch order details
  const { data: orderDetails } = trpc.order.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  // Update status mutation
  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

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
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | "all")}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="new" className="relative">
            Novos
            {orderCounts.new > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {orderCounts.new}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Em preparo
            {orderCounts.preparing > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-600 text-white rounded-full">
                {orderCounts.preparing}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready">
            Prontos
            {orderCounts.ready > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-600 text-white rounded-full">
                {orderCounts.ready}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Finalizados</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border p-4">
                  <div className="skeleton h-6 w-24 rounded mb-3" />
                  <div className="skeleton h-4 w-full rounded mb-2" />
                  <div className="skeleton h-4 w-2/3 rounded mb-4" />
                  <div className="skeleton h-10 w-full rounded" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                const config = statusConfig[order.status as OrderStatus];
                const nextAction = getNextAction(order.status as OrderStatus);
                const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                return (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className={cn("px-4 py-3 flex items-center justify-between", config.color)}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span className="font-semibold">#{order.orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
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
                        <p className="font-medium mb-1">{order.customerName}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <PaymentIcon className="h-3 w-3" />
                          {paymentMethodLabels[order.paymentMethod]?.label}
                        </span>
                        <span className="capitalize">
                          {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          Ver detalhes
                        </Button>
                        {nextAction && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {nextAction.label}
                          </Button>
                        )}
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
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

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{orderDetails?.orderNumber}</DialogTitle>
            <DialogDescription>
              {orderDetails && (
                <StatusBadge variant={statusConfig[orderDetails.status as OrderStatus]?.variant}>
                  {statusConfig[orderDetails.status as OrderStatus]?.label}
                </StatusBadge>
              )}
            </DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className="space-y-4">
              {/* Customer */}
              {(orderDetails.customerName || orderDetails.customerPhone) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Cliente</h4>
                  {orderDetails.customerName && (
                    <p className="font-medium">{orderDetails.customerName}</p>
                  )}
                  {orderDetails.customerPhone && (
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {orderDetails.customerPhone}
                    </p>
                  )}
                  {orderDetails.customerAddress && (
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {orderDetails.customerAddress}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Itens</h4>
                <div className="space-y-2">
                  {orderDetails.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                {Number(orderDetails.deliveryFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>{formatCurrency(orderDetails.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Observações</h4>
                  <p className="text-sm bg-muted p-2 rounded">{orderDetails.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Cancelando..." : "Cancelar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
