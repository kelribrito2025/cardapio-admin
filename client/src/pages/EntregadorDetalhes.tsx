import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntregadorDetalhes() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const driverId = parseInt(params.id || "0");

  const { data: driver, isLoading: driverLoading } = trpc.driver.getById.useQuery(
    { id: driverId },
    { enabled: driverId > 0 }
  );
  const { data: metrics, isLoading: metricsLoading } = trpc.driver.getDetailMetrics.useQuery(
    { driverId },
    { enabled: driverId > 0 }
  );
  const { data: deliveriesList, isLoading: deliveriesLoading, refetch: refetchDeliveries } = trpc.driver.getDeliveries.useQuery(
    { driverId },
    { enabled: driverId > 0 }
  );

  const markPaidMutation = trpc.driver.markAsPaid.useMutation();

  const handleMarkPaid = async (deliveryId: number) => {
    try {
      await markPaidMutation.mutateAsync({ deliveryId });
      toast.success("Repasse marcado como pago");
      refetchDeliveries();
    } catch (error: any) {
      toast.error("Erro ao marcar como pago", { description: error.message });
    }
  };

  if (driverLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div>
      </AdminLayout>
    );
  }

  if (!driver) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Entregador não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/entregadores")}>
            Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/entregadores")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
              {driver.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{driver.name}</h1>
              <p className="text-sm text-muted-foreground">{driver.whatsapp} · {driver.isActive ? "Ativo" : "Inativo"}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total de entregas"
            value={metricsLoading ? "..." : metrics?.totalDeliveries ?? 0}
            icon={Package}
            variant="blue"
            loading={metricsLoading}
          />
          <StatCard
            title="Total bruto"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalBruto ?? 0)}
            icon={DollarSign}
            variant="emerald"
            loading={metricsLoading}
          />
          <StatCard
            title="Pendente"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalPending ?? 0)}
            icon={Clock}
            variant="amber"
            loading={metricsLoading}
          />
          <StatCard
            title="Já pago"
            value={metricsLoading ? "..." : formatCurrency(metrics?.totalPaid ?? 0)}
            icon={CheckCircle2}
            variant="emerald"
            loading={metricsLoading}
          />

        </div>

        {/* Deliveries Table */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            Entregas realizadas
          </h2>

          {deliveriesLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : !deliveriesList || deliveriesList.length === 0 ? (
            <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma entrega registrada</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pedido</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bairro</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Taxa</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Repasse</th>
                      <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveriesList.map((delivery) => {
                      const order = delivery.order;
                      // Extract neighborhood from address
                      const addressParts = (order?.customerAddress || "").split(",");
                      const neighborhood = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : addressParts[0]?.trim() || "—";

                      return (
                        <tr key={delivery.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{order?.orderNumber || "—"}</td>
                          <td className="p-4">{order?.customerName || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{neighborhood}</td>
                          <td className="p-4 text-right">{formatCurrency(parseFloat(delivery.deliveryFee || "0"))}</td>
                          <td className="p-4 text-right font-medium">{formatCurrency(parseFloat(delivery.repasseValue || "0"))}</td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={delivery.paymentStatus === "paid" ? "default" : "secondary"}
                              className={delivery.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}
                            >
                              {delivery.paymentStatus === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right text-sm text-muted-foreground">{formatDate(delivery.createdAt)}</td>
                          <td className="p-4 text-right">
                            {delivery.paymentStatus === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => handleMarkPaid(delivery.id)}
                                disabled={markPaidMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Pagar
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border/30">
                {deliveriesList.map((delivery) => {
                  const order = delivery.order;
                  return (
                    <div key={delivery.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{order?.orderNumber || "—"}</span>
                        <Badge
                          variant={delivery.paymentStatus === "paid" ? "default" : "secondary"}
                          className={delivery.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}
                        >
                          {delivery.paymentStatus === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                      <p className="text-sm">{order?.customerName || "—"}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa: {formatCurrency(parseFloat(delivery.deliveryFee || "0"))}</span>
                        <span className="font-medium">Repasse: {formatCurrency(parseFloat(delivery.repasseValue || "0"))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(delivery.createdAt)}</span>
                        {delivery.paymentStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => handleMarkPaid(delivery.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
