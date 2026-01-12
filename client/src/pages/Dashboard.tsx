import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Package
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.dashboard.weeklyStats.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: recentOrders, isLoading: ordersLoading } = trpc.dashboard.recentOrders.useQuery(
    { establishmentId: establishmentId!, limit: 5 },
    { enabled: !!establishmentId }
  );

  const { data: lowStock } = trpc.dashboard.lowStock.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format chart data
  const chartData = weeklyStats?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("pt-BR", { weekday: "short" }),
    pedidos: Number(item.orders),
    faturamento: Number(item.revenue),
  })) || [];

  // Order status mapping
  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default" }> = {
    new: { label: "Novo", variant: "info" },
    preparing: { label: "Preparando", variant: "warning" },
    ready: { label: "Pronto", variant: "success" },
    completed: { label: "Finalizado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "error" },
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do seu estabelecimento"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pedidos Hoje"
          value={stats?.ordersToday ?? 0}
          icon={ShoppingBag}
          loading={statsLoading}
        />
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(stats?.revenueToday ?? 0)}
          icon={DollarSign}
          loading={statsLoading}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.avgTicket ?? 0)}
          icon={TrendingUp}
          loading={statsLoading}
        />
        <StatCard
          title="Itens em Falta"
          value={stats?.lowStockCount ?? 0}
          icon={AlertTriangle}
          loading={statsLoading}
          className={stats?.lowStockCount && stats.lowStockCount > 0 ? "border-amber-200 bg-amber-50" : ""}
        />
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <SectionCard 
          title="Últimos 7 dias" 
          className="lg:col-span-2"
        >
          {weeklyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="skeleton h-full w-full rounded" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.18 145)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.55 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    stroke="oklch(0.55 0.18 145)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </SectionCard>

        {/* Recent Orders */}
        <SectionCard title="Pedidos Recentes" noPadding>
          {ordersLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4">
                  <div className="skeleton h-4 w-24 rounded mb-2" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">#{order.orderNumber}</span>
                    <StatusBadge variant={statusMap[order.status]?.variant}>
                      {statusMap[order.status]?.label}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(order.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    <span className="font-medium text-primary">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Nenhum pedido"
              description="Os pedidos aparecerão aqui"
            />
          )}
        </SectionCard>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <SectionCard 
          title="Produtos em Falta" 
          className="mt-6"
          description="Produtos que precisam de reposição"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.slice(0, 6).map((product) => (
              <div 
                key={product.id} 
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="p-2 bg-amber-100 rounded">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-amber-600">
                    {product.stockQuantity ?? 0} em estoque
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </AdminLayout>
  );
}
