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
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
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

  // Se não há estabelecimento, redirecionar para configurações
  if (!establishmentLoading && !establishment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 bg-muted/30 rounded-3xl mb-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Cardápio Admin!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Para começar, configure as informações do seu estabelecimento.
          </p>
          <a href="/configuracoes" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
            Configurar Estabelecimento
          </a>
        </div>
      </AdminLayout>
    );
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
          className={stats?.lowStockCount && stats.lowStockCount > 0 ? "border-amber-200/50 bg-amber-50/50" : ""}
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
            <div className="h-72 flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-xl" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pedidos"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPedidos)"
                    name="Pedidos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </SectionCard>

        {/* Recent Orders */}
        <SectionCard title="Pedidos Recentes">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                  <div className="skeleton h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-24 rounded-lg" />
                    <div className="skeleton h-3 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2.5 bg-card rounded-lg border border-border/50 shadow-sm">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">#{order.id}</span>
                      <StatusBadge variant={statusMap[order.status]?.variant || "default"}>
                        {statusMap[order.status]?.label || order.status}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum pedido"
              description="Os pedidos aparecerão aqui"
            />
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
