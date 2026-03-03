import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/shared";
import { WeeklyRevenueCard } from "@/components/WeeklyRevenueCard";
import { HeatmapCard } from "@/components/HeatmapCard";
import { trpc } from "@/lib/trpc";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Users,
  Clock,
  Package,
  Target,
  Trophy,
  Truck,
  Timer
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
import { useEffect, useState, useCallback, useMemo } from "react";
import { Calendar, LayoutDashboard } from "lucide-react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";

const periodOptions = [
  { value: 'today' as const, label: 'Hoje' },
  { value: 'week' as const, label: 'Esta semana' },
  { value: 'month' as const, label: 'Este mês' },
];

export default function Dashboard() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Memoize the period input to avoid infinite re-renders
  const statsInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
  }), [establishmentId, period]);

  // All hooks MUST be called before any early return
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(
    statsInput,
    { enabled: !!establishmentId }
  );

  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.dashboard.weeklyStats.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchRecentOrders } = trpc.dashboard.recentOrders.useQuery(
    { establishmentId: establishmentId!, limit: 5 },
    { enabled: !!establishmentId }
  );


  const conversionInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period,
  }), [establishmentId, period]);

  const { data: conversionRate, isLoading: conversionLoading } = trpc.dashboard.conversionRate.useQuery(
    conversionInput,
    { enabled: !!establishmentId }
  );

  // Novas queries: Top Produtos, Modalidade, Tempo Médio
  const { data: topProducts, isLoading: topProductsLoading } = trpc.dashboard.topProducts.useQuery(
    { establishmentId: establishmentId!, period },
    { enabled: !!establishmentId }
  );

  const { data: ordersByModality, isLoading: modalityLoading } = trpc.dashboard.ordersByDeliveryType.useQuery(
    { establishmentId: establishmentId!, period },
    { enabled: !!establishmentId }
  );

  const { data: avgPrepTime, isLoading: prepTimeLoading } = trpc.dashboard.avgPrepTime.useQuery(
    { establishmentId: establishmentId!, period },
    { enabled: !!establishmentId }
  );

  // Card Acumulado: quando filtro é "Hoje", mostra semana; quando "Este mês", mostra mês
  const revenuePeriod = period === 'today' ? 'week' : period;
  const revenueInput = useMemo(() => ({
    establishmentId: establishmentId!,
    period: revenuePeriod,
  }), [establishmentId, revenuePeriod]);

  const { data: weeklyRevenue, isLoading: weeklyRevenueLoading } = trpc.dashboard.weeklyRevenue.useQuery(
    revenueInput,
    { enabled: !!establishmentId }
  );

  // Handlers para SSE - atualizar dados quando novo pedido chegar
  const handleNewOrder = useCallback(() => {
    refetchRecentOrders();
  }, [refetchRecentOrders]);

  const handleOrderUpdate = useCallback(() => {
    refetchRecentOrders();
  }, [refetchRecentOrders]);

  // Hook SSE para receber pedidos em tempo real
  useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Nota: Removido bloqueio para usuários sem estabelecimento - agora o Dashboard mostra normalmente

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Dashboard" 
          description="Visão geral do seu estabelecimento"
          icon={<LayoutDashboard className="h-6 w-6 text-blue-600" />}
        />
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                period === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard
          title={period === 'today' ? 'Pedidos Hoje' : period === 'week' ? 'Pedidos da Semana' : 'Pedidos do Mês'}
          value={stats?.ordersCount ?? 0}
          icon={ShoppingBag}
          loading={statsLoading}
          variant="blue"
          trend={stats && stats.ordersChange !== undefined ? {
            value: stats.ordersChange,
            isPositive: stats.ordersChange >= 0,
            label: period === 'today' ? 'vs ontem' : period === 'week' ? 'vs semana anterior' : 'vs mês anterior'
          } : undefined}
        />
        <StatCard
          title={period === 'today' ? 'Faturamento Hoje' : period === 'week' ? 'Faturamento da Semana' : 'Faturamento do Mês'}
          value={formatCurrency(stats?.revenue ?? 0)}
          icon={DollarSign}
          loading={statsLoading}
          variant="emerald"
          trend={stats && stats.revenueChange !== undefined ? {
            value: stats.revenueChange,
            isPositive: stats.revenueChange >= 0,
            label: period === 'today' ? 'vs ontem' : period === 'week' ? 'vs semana anterior' : 'vs mês anterior'
          } : undefined}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.avgTicket ?? 0)}
          icon={TrendingUp}
          loading={statsLoading}
          variant="blue"
          trend={stats && stats.avgTicketChange !== undefined ? {
            value: stats.avgTicketChange,
            isPositive: stats.avgTicketChange >= 0,
            label: period === 'today' ? 'vs ontem' : period === 'week' ? 'vs semana anterior' : 'vs mês anterior'
          } : undefined}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${conversionRate?.rate?.toFixed(1) ?? '0.0'}%`}
          tooltip={`${conversionRate?.orders ?? 0} pedidos / ${conversionRate?.views ?? 0} visualizações`}
          icon={Target}
          loading={conversionLoading}
          variant="emerald"
          trend={conversionRate && conversionRate.change !== undefined ? {
            value: conversionRate.change,
            isPositive: conversionRate.change >= 0,
            label: period === 'today' ? 'vs ontem' : period === 'week' ? 'vs semana anterior' : 'vs mês anterior'
          } : undefined}
        />
        <StatCard
          title="C. Fidelizados"
          value={stats?.recurringCustomers ?? 0}
          tooltip={`${stats?.recurringPercentage ?? 0}% da base ativa (2+ pedidos nos últimos 30 dias)`}
          icon={Users}
          loading={statsLoading}
          variant="primary"
          trend={stats && stats.recurringChange !== undefined ? {
            value: stats.recurringChange,
            isPositive: stats.recurringChange >= 0,
            label: 'vs mês anterior'
          } : undefined}
        />
      </div>

      {/* Weekly Revenue Card + Mapa de Calor */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <WeeklyRevenueCard
            thisWeek={weeklyRevenue?.thisWeek ?? []}
            lastWeek={weeklyRevenue?.lastWeek ?? []}
            thisWeekTotal={weeklyRevenue?.thisWeekTotal ?? 0}
            lastWeekTotal={weeklyRevenue?.lastWeekTotal ?? 0}
            loading={weeklyRevenueLoading}
            periodLabel={weeklyRevenue?.periodLabel}
            comparisonLabel={weeklyRevenue?.comparisonLabel}
            mode={weeklyRevenue?.mode as 'daily' | 'monthly' | undefined}
            currentIndex={weeklyRevenue?.currentIndex}
            monthLabels={weeklyRevenue?.monthLabels}
          />
        </div>
        <div className="lg:col-span-2">
          <HeatmapCard period={period} />
        </div>
      </div>

      {/* Top Produtos + Modalidade + Tempo Médio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Produtos */}
        <SectionCard title="Top Produtos">
          {topProductsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="flex-1 skeleton h-3 rounded" />
                  <div className="skeleton h-3 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 10).map((product, index) => {
                const maxQty = topProducts[0]?.totalQuantity || 1;
                const pct = (product.totalQuantity / maxQty) * 100;
                return (
                  <div key={product.productName} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate mr-2">{product.productName}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{product.totalQuantity}x</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Sem dados"
              description="Nenhum produto vendido no período"
            />
          )}
        </SectionCard>

        {/* Pedidos por Modalidade */}
        <SectionCard title="Pedidos por Modalidade">
          {modalityLoading ? (
            <div className="flex flex-col gap-6 py-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-8 w-16 rounded" />
                  <div className="skeleton h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : ordersByModality && ordersByModality.length > 0 ? (() => {
            const total = ordersByModality.reduce((sum, m) => sum + m.count, 0);
            const barColors = ['#c2410c', '#ea580c', '#f59e0b'];
            const labelMap: Record<string, string> = { 'Entrega': 'Delivery', 'Consumo no local': 'Consumo' };
            const getLabel = (label: string) => labelMap[label] || label;
            return (
              <div className="flex flex-col gap-6 py-2">
                {/* Labels + percentuais em grid */}
                <div className="grid grid-cols-3 gap-3">
                  {ordersByModality.map((item, i) => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.deliveryType} className="flex flex-col gap-1" style={{ borderLeft: '2px dotted #d1d5db', paddingLeft: '10px' }}>
                        <span className="text-xs text-muted-foreground font-medium">{getLabel(item.label)}</span>
                        <span className="text-3xl font-bold tracking-tight text-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                {/* Barras individuais lado a lado */}
                <div className="flex gap-1.5 w-full">
                  {ordersByModality.map((item, i) => {
                    const pct = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div
                        key={item.deliveryType}
                        className="h-3.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColors[i % barColors.length],
                          minWidth: pct > 0 ? '12px' : '0',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <EmptyState
              icon={Truck}
              title="Sem dados"
              description="Nenhum pedido no período"
            />
          )}
        </SectionCard>

        {/* Tempo Médio */}
        <SectionCard title="Tempo Médio">
          {prepTimeLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="skeleton h-32 w-32 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--muted)" strokeWidth="2" />
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke={avgPrepTime && avgPrepTime.avgMinutes > 0 ? (avgPrepTime.avgMinutes <= 30 ? '#22c55e' : avgPrepTime.avgMinutes <= 60 ? '#f59e0b' : '#ef4444') : 'var(--muted)'}
                    strokeWidth="2.5"
                    strokeDasharray={`${Math.min((avgPrepTime?.avgMinutes ?? 0) / 90 * 100, 100)} ${100 - Math.min((avgPrepTime?.avgMinutes ?? 0) / 90 * 100, 100)}`}
                    strokeLinecap="round"
                    className="-rotate-90 origin-center transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Timer className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-3xl font-bold">{avgPrepTime?.avgMinutes ?? 0}</span>
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Do pedido até finalizado</p>
              <p className="text-xs text-muted-foreground">{avgPrepTime?.totalOrders ?? 0} pedidos no período</p>
            </div>
          )}
        </SectionCard>
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
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64">
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
            <div className="h-64 flex items-center justify-center text-muted-foreground text-base">
              Nenhum dado disponível
            </div>
          )}
        </SectionCard>

        {/* Recent Orders */}
        <SectionCard title="Pedidos Recentes">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-2.5 w-28 rounded" />
                      <div className="skeleton h-3 w-14 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-2.5 w-14 rounded" />
                </div>
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                // Extrair nomes dos itens do pedido
                const itemNames = order.items?.map((item: any) => item.name || item.productName).join(", ") || "Itens do pedido";
                
                return (
                  <div
                    key={order.id}
                    className="border-b border-border/50 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-sm text-foreground">
                            #{order.id}
                          </span>
                          <StatusBadge variant={statusMap[order.status]?.variant || "default"}>
                            {statusMap[order.status]?.label || order.status}
                          </StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                          {itemNames}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(Number(order.total))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                );
              })}
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
