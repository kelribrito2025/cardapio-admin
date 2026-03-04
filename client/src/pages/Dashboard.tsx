import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/shared";
import { WeeklyRevenueCard } from "@/components/WeeklyRevenueCard";
import { HeatmapCard } from "@/components/HeatmapCard";
import { trpc } from "@/lib/trpc";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  TrendingDown, 
  Users,
  Clock,
  Package,
  Target,
  Trophy,
  Truck,
  Timer,
  UsersRound,
  Info,
  BarChart3,
  ArrowRight,
  CalendarDays
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Calendar, LayoutDashboard } from "lucide-react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

const periodOptions = [
  { value: 'today' as const, label: 'Hoje' },
  { value: 'week' as const, label: 'Esta semana' },
  { value: 'month' as const, label: 'Este mês' },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [period, setPeriodState] = useState<'today' | 'week' | 'month'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardPeriod');
      if (saved === 'today' || saved === 'week' || saved === 'month') return saved;
    }
    return 'today';
  });
  const setPeriod = (p: 'today' | 'week' | 'month') => {
    setPeriodState(p);
    localStorage.setItem('dashboardPeriod', p);
  };
  const [weeklyPeriod, setWeeklyPeriod] = useState<7 | 14 | 30>(7);
  const [, setTick] = useState(0);

  // Contador em tempo real - atualiza a cada 60s para refresh do tempo de espera
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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

  const weeklyInput = useMemo(() => ({
    establishmentId: establishmentId!,
    days: weeklyPeriod,
  }), [establishmentId, weeklyPeriod]);

  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.dashboard.weeklyStats.useQuery(
    weeklyInput,
    { enabled: !!establishmentId }
  );

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchRecentOrders } = trpc.dashboard.recentOrders.useQuery(
    { establishmentId: establishmentId!, limit: 7 },
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

  const { data: prepTimeTrend } = trpc.dashboard.avgPrepTimeTrend.useQuery(
    { establishmentId: establishmentId!, period },
    { enabled: !!establishmentId }
  );

  const { data: customerInsights, isLoading: customerInsightsLoading } = trpc.dashboard.customerInsights.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: revenueByHour, isLoading: revenueByHourLoading } = trpc.dashboard.revenueByHour.useQuery(
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

  // Format chart data - período atual com dados do período anterior alinhados por índice
  const currentData = weeklyStats?.current ?? [];
  const previousData = weeklyStats?.previous ?? [];
  const chartData = currentData.map((item, idx) => ({
    date: new Date(item.date).toLocaleDateString("pt-BR", { weekday: weeklyPeriod <= 7 ? "long" : "short", day: weeklyPeriod > 7 ? "numeric" : undefined, month: weeklyPeriod > 7 ? "short" : undefined }),
    pedidos: Number(item.orders),
    faturamento: Number(item.revenue),
    prevPedidos: idx < previousData.length ? Number(previousData[idx].orders) : undefined,
  }));

  // Dados do período anterior para comparação de KPIs
  const prevTotalPedidos = previousData.reduce((sum, d) => sum + Number(d.orders), 0);

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
        <div className="bg-card rounded-xl border border-border/50 pt-5 px-5 pb-0 flex flex-col">
          {/* Header com ícone - mesmo estilo Formas de Pagamento */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Top 10 | Mais vendidos</h3>
              <p className="text-xs text-muted-foreground">Produtos mais vendidos no período</p>
            </div>
          </div>

          {topProductsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                  <div className="skeleton h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : topProducts && topProducts.products && topProducts.products.length > 0 ? (
            <>
            <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '365px', scrollbarGutter: 'stable', paddingBottom: '4px' }}>
              {(() => {
                const products = topProducts.products;
                const maxQty = products[0]?.totalQuantity || 1;
                const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
                // Degradê de ranking: verde (mais vendido) → amarelo → laranja → vermelho (menos vendido)
                const getRankColor = (idx: number, total: number) => {
                  if (total <= 1) return '#22c55e'; // verde
                  const t = idx / (total - 1); // 0 = primeiro, 1 = último
                  // Interpolação: verde → amarelo-verde → amarelo → laranja → vermelho
                  const colors = [
                    { r: 34, g: 197, b: 94 },   // verde (#22c55e)
                    { r: 234, g: 179, b: 8 },    // amarelo (#eab308)
                    { r: 249, g: 115, b: 22 },   // laranja (#f97316)
                    { r: 239, g: 68, b: 68 },    // vermelho (#ef4444)
                  ];
                  const segment = t * (colors.length - 1);
                  const i = Math.min(Math.floor(segment), colors.length - 2);
                  const f = segment - i;
                  const c1 = colors[i], c2 = colors[i + 1];
                  const r = Math.round(c1.r + (c2.r - c1.r) * f);
                  const g = Math.round(c1.g + (c2.g - c1.g) * f);
                  const b = Math.round(c1.b + (c2.b - c1.b) * f);
                  return `rgb(${r},${g},${b})`;
                };
                return products.slice(0, 10).map((product, index) => {
                  const pct = (product.totalQuantity / maxQty) * 100;
                  const revPct = totalRevenue > 0 ? Math.round((product.totalRevenue / totalRevenue) * 100) : 0;
                  const barColorStyle = getRankColor(index, Math.min(products.length, 10));
                  return (
                    <div key={product.productName} className="group relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{product.productName}</span>
                          <span className="text-xs text-muted-foreground">({product.totalQuantity}x)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(product.totalRevenue)}</span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{revPct}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: barColorStyle }}
                        />
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                        <div className="bg-foreground text-background rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                          <div className="font-semibold mb-1">{product.productName}</div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>Receita:</span>
                            <span className="font-semibold">{formatCurrency(product.totalRevenue)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>Quantidade:</span>
                            <span className="font-semibold">{product.totalQuantity}x</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Percentual:</span>
                            <span className="font-semibold">{revPct}%</span>
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            {/* Insight: % do faturamento dos top 10 */}
            <div className="mt-auto">
            {topProducts.totalPeriodRevenue > 0 ? (
              <p className="text-[11px] px-0 py-3 flex items-center gap-1"><Info className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" /><span className="text-shimmer">Seus {topProducts.products.length} produtos líderes representam {topProducts.topProductsPct}% do faturamento do período</span></p>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 px-0 py-3">Não há métricas suficientes para o cálculo</p>
            )}
            </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
              <p className="text-xs text-muted-foreground/70">Nenhum produto vendido no período</p>
            </div>
          )}
        </div>

        {/* Coluna do meio: Pedidos por Modalidade + Clientes */}
        <div className="flex flex-col gap-6">
          {/* Pedidos por Modalidade */}
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[196px] overflow-hidden">
            {/* Header igual ao WeeklyRevenueCard */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Pedidos por Modalidade</h3>
                <p className="text-xs text-muted-foreground">Distribuição por tipo de entrega</p>
              </div>
            </div>

            {modalityLoading ? (
              <div className="flex flex-col gap-6 py-2 flex-1">
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
              const barColors = ['#8b5cf6', '#3b82f6', '#10b981'];
              const labelMap: Record<string, string> = { 'Entrega': 'Delivery', 'Consumo no local': 'Consumo' };
              const getLabel = (label: string) => labelMap[label] || label;
              return (
                <div className="flex flex-col">
                  {/* Labels + percentuais em grid - linhas pontilhadas alinhadas com barras */}
                  <div className="flex w-full gap-1.5 mt-2">
                    {ordersByModality.map((item, i) => {
                      const pct = total > 0 ? (item.count / total) * 100 : 0;
                      const roundedPct = Math.round(pct);
                      return (
                        <div
                          key={item.deliveryType}
                          className="flex flex-col gap-1"
                          style={{ width: `${pct}%`, minWidth: pct > 0 ? '60px' : '0', borderLeft: '2px dotted #d1d5db', paddingLeft: '10px' }}
                        >
                          <span className="text-xs text-muted-foreground font-medium">{getLabel(item.label)}</span>
                          <span className="text-3xl font-bold tracking-tight text-foreground">{roundedPct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Barras individuais lado a lado */}
                  <div className="flex gap-1.5 w-full mt-4">
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
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                <Truck className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
                <p className="text-xs text-muted-foreground/70">Nenhum pedido no período</p>
              </div>
            )}
          </div>

          {/* Clientes Recorrentes vs Novos */}
          <HoverCard openDelay={300} closeDelay={200}>
          <HoverCardTrigger asChild>
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[306px] overflow-hidden cursor-default transition-shadow hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/50">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <UsersRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Perfil de Clientes</h3>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </div>
            </div>

            {customerInsightsLoading ? (
              <div className="flex gap-8 py-2">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-10 w-20 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-10 w-20 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
              </div>
            ) : (() => {
              const recurringPct = customerInsights?.recurringPct ?? 0;
              const newPct = customerInsights?.newPct ?? 0;
              const totalBars = 40;
              const recurringBars = Math.round((recurringPct / 100) * totalBars);
              const newBars = totalBars - recurringBars;
              return (
                <div className="flex flex-col flex-1">
                  {/* Percentuais lado a lado */}
                  <div className="flex items-start gap-6 mt-1">
                    <div className="flex-1">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{recurringPct}%</span>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Clientes Recorrentes</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">2+ pedidos nos últimos 30 dias</p>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{newPct}%</span>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Clientes Novos</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">Primeiro pedido no período</p>
                    </div>
                  </div>
                  {/* Gráfico de barras verticais finas */}
                  <div className="flex items-end gap-[2px] mt-4 h-10">
                    {Array.from({ length: recurringBars }).map((_, i) => (
                      <div
                        key={`r-${i}`}
                        className="flex-1 rounded-sm transition-all duration-500"
                        style={{ backgroundColor: '#22c55e', height: '100%' }}
                      />
                    ))}
                    {/* Linha separadora laranja */}
                    {recurringBars > 0 && newBars > 0 && (
                      <div className="w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: '#f97316', height: '110%' }} />
                    )}
                    {Array.from({ length: newBars }).map((_, i) => (
                      <div
                        key={`n-${i}`}
                        className="flex-1 rounded-sm transition-all duration-500"
                        style={{ backgroundColor: '#e5e7eb', height: '100%' }}
                      />
                    ))}
                  </div>
                  {/* Total de clientes */}
                  <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2">{customerInsights?.totalCustomers ?? 0} clientes únicos no período</p>
                </div>
              );
            })()}
          </div>
          </HoverCardTrigger>
          <HoverCardContent side="top" align="center" className="w-80 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                  <UsersRound className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-sm">Resumo do Perfil de Clientes</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>Nos últimos 30 dias:</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span><strong className="text-foreground">{customerInsights?.recurringPct ?? 0}%</strong> são clientes recorrentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span><strong className="text-foreground">{customerInsights?.newPct ?? 0}%</strong> são novos clientes</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/30">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {(customerInsights?.newPct ?? 0) > 50
                    ? '\uD83D\uDCA1 Isso indica crescimento da base de clientes.'
                    : (customerInsights?.recurringPct ?? 0) > 50
                    ? '\uD83D\uDCA1 Boa fidelização! A maioria dos clientes retorna.'
                    : '\uD83D\uDCA1 Base equilibrada entre novos e recorrentes.'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Total analisado: <strong className="text-foreground">{customerInsights?.totalCustomers ?? 0}</strong> clientes únicos</p>
            </div>
          </HoverCardContent>
          </HoverCard>
        </div>

        {/* Coluna direita: Tempo Médio + Faturamento por Hora */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Tempo Médio */}
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[196px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Tempo Médio</h3>
                <p className="text-xs text-muted-foreground">Tempo médio de preparo (aceito → pronto)</p>
              </div>
            </div>

            {prepTimeLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            ) : (
              <div className="flex items-end gap-4 flex-1 min-h-0">
                {/* Lado esquerdo: KPI numérico + contexto */}
                <div className="flex flex-col justify-end flex-shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-foreground">{avgPrepTime?.avgMinutes ?? 0}</span>
                    <span className="text-sm font-medium text-muted-foreground">min</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{avgPrepTime?.totalOrders ?? 0} pedidos no período</p>
                  {/* Insight de comparação */}
                  {(() => {
                    const current = avgPrepTime?.avgMinutes ?? 0;
                    const previous = prepTimeTrend?.previousAvg ?? 0;
                    if (current === 0 || previous === 0) return null;
                    const diff = previous - current;
                    const isFaster = diff > 0;
                    const periodLabel = period === 'today' ? 'que ontem' : period === 'week' ? 'que sem. passada' : 'que mês passado';
                    return (
                      <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium ${
                        isFaster 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isFaster ? (
                          <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span>{Math.abs(diff)} min {isFaster ? 'mais rápido' : 'mais lento'} {periodLabel}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Lado direito: Sparkline de tendência */}
                {prepTimeTrend?.trend && prepTimeTrend.trend.length >= 2 && (
                  <div className="flex-1 min-w-0 flex flex-col justify-end pb-1">
                    <ResponsiveContainer width="100%" height={64}>
                      <AreaChart data={prepTimeTrend.trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="prepTimeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="avgMinutes"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#prepTimeGrad)"
                          dot={false}
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-[9px] text-muted-foreground/50 text-right mt-0.5">últimos 7 dias</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Faturamento por Hora */}
          <div className="bg-card rounded-xl border border-border/50 p-5 flex flex-col h-[306px] overflow-hidden">
            {/* Header padronizado */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground">Faturamento por Hora</h3>
                <p className="text-xs text-muted-foreground">Distribuição de vendas ao longo do dia</p>
              </div>
            </div>

            {revenueByHourLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="skeleton h-full w-full rounded-lg" />
              </div>
            ) : revenueByHour && revenueByHour.length > 0 ? (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByHour.map(d => ({ ...d, label: `${String(d.hour).padStart(2, '0')}:00` }))}>
                    <defs>
                      <linearGradient id="revenueLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                      width={40}
                    />
                    {(() => {
                      const peakHour = revenueByHour.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueByHour[0]);
                      const peakLabel = `${String(peakHour.hour).padStart(2, '0')}:00`;
                      return <ReferenceLine x={peakLabel} stroke="rgba(239,68,68,0.15)" strokeWidth={40} />;
                    })()}
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="url(#revenueLineGrad)" 
                      strokeWidth={2.5} 
                      dot={false}
                      activeDot={{ r: 4, fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Sem dados</p>
                <p className="text-xs text-muted-foreground/70">Nenhum faturamento no período</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Pedidos por período (analítico) */}
        <div className="bg-card rounded-xl border border-border/50 flex flex-col lg:col-span-2">
          {/* Header padronizado */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Pedidos | Últimos {weeklyPeriod} dias</h3>
                <p className="text-xs text-muted-foreground">Análise de pedidos finalizados</p>
              </div>
            </div>
            {/* Filtro de período */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setWeeklyPeriod(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    weeklyPeriod === d
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            {weeklyLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="skeleton h-full w-full rounded-lg" />
              </div>
            ) : (() => {
              const totalPedidos = chartData.reduce((sum, d) => sum + d.pedidos, 0);
              const mediaDiaria = chartData.length > 0 ? Math.round(totalPedidos / chartData.length) : 0;
              const melhorDia = chartData.length > 0 ? chartData.reduce((best, d) => d.pedidos > best.pedidos ? d : best, chartData[0]) : null;
              // Variação real vs período anterior
              const tendencia = prevTotalPedidos > 0 ? Math.round(((totalPedidos - prevTotalPedidos) / prevTotalPedidos) * 100) : (totalPedidos > 0 ? 100 : 0);

              return (
                <>
                  {/* KPIs Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Total de Pedidos */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total do Período</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{totalPedidos}</span>
                        {tendencia !== 0 && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${tendencia > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tendencia > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {tendencia > 0 ? '+' : ''}{tendencia}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">pedidos finalizados</p>
                      {prevTotalPedidos > 0 && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">anterior: {prevTotalPedidos}</p>
                      )}
                    </div>

                    {/* Média Diária */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Média Diária</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{mediaDiaria}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">pedidos/dia</p>
                    </div>

                    {/* Melhor Dia */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Melhor Dia</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{melhorDia ? melhorDia.pedidos : 0}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{melhorDia ? melhorDia.date : '-'}</p>
                    </div>
                  </div>

                  {/* Gráfico */}
                  {chartData.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            className="text-xs text-muted-foreground"
                            tick={{ fill: 'currentColor', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                          />
                          {/* Linha de média semanal */}
                          <ReferenceLine 
                            y={mediaDiaria} 
                            stroke="rgba(239,68,68,0.5)" 
                            strokeDasharray="6 4" 
                            strokeWidth={1.5}
                            label={{ 
                              value: `Média: ${mediaDiaria}`, 
                              position: 'right', 
                              fill: 'rgba(239,68,68,0.7)', 
                              fontSize: 10,
                              fontWeight: 600
                            }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              padding: '10px 14px'
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === 'Período anterior') return [`${value} pedidos`, 'Período anterior'];
                              const diff = value - mediaDiaria;
                              const diffText = diff > 0 ? `+${diff} acima da média` : diff < 0 ? `${diff} abaixo da média` : 'na média';
                              return [`${value} pedidos (${diffText})`, 'Período atual'];
                            }}
                            labelFormatter={(label: string) => `${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="pedidos"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorPedidos)"
                            name="Período atual"
                            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                            activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                          />
                          {chartData.some(d => (d as any).prevPedidos !== undefined) && (
                            <Area
                              type="monotone"
                              dataKey="prevPedidos"
                              stroke="rgba(156,163,175,0.6)"
                              strokeWidth={1.5}
                              strokeDasharray="5 3"
                              fillOpacity={0}
                              fill="none"
                              name="Período anterior"
                              dot={false}
                              activeDot={{ r: 4, fill: 'rgba(156,163,175,0.6)', strokeWidth: 1, stroke: 'var(--card)' }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-muted-foreground text-base">
                      Nenhum dado disponível
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card rounded-xl border border-border/50 flex flex-col">
          {/* Header padronizado com ícone + botão Ver todos */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Pedidos Recentes</h3>
                <p className="text-xs text-muted-foreground">Últimos pedidos do estabelecimento</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/pedidos')}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-5 pb-5">
            {ordersLoading ? (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                    <div className="skeleton h-4 w-10 rounded" />
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-4 w-32 rounded flex-1" />
                    <div className="skeleton h-4 w-14 rounded" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div>
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[20px_70px_1fr_80px_80px] gap-2 px-2 pb-2 border-b border-border/50">
                  <span></span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pedido</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Item</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Tempo</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Valor</span>
                </div>

                {/* Linhas da tabela com timeline */}
                {(() => {
                  const sortedOrders = [...recentOrders].sort((a, b) => {
                    const statusOrder: Record<string, number> = { new: 0, preparing: 1, ready: 2, out_for_delivery: 3, completed: 4, cancelled: 5 };
                    const aOrder = statusOrder[a.status] ?? 99;
                    const bOrder = statusOrder[b.status] ?? 99;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  });
                  const displayOrders = sortedOrders.slice(0, 7);
                  return (
                    <div className="relative">
                      {/* Linha vertical contínua da timeline - do primeiro ao último dot */}
                      {displayOrders.length > 1 && (
                        <div 
                          className="absolute left-[17px] top-[20px] bottom-[20px] w-[2px] bg-border"
                          style={{ zIndex: 0 }}
                        />
                      )}
                      {displayOrders.map((order, idx) => {
                        const items = order.items || [];
                        const firstName = (items[0] as any)?.name || (items[0] as any)?.productName || 'Item';
                        const extraCount = items.length - 1;
                        const itemSummary = extraCount > 0 ? `${firstName} +${extraCount}` : firstName;

                        const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                        const isInactive = order.status === 'completed' || order.status === 'cancelled';
                        const timeColor = isInactive
                          ? 'text-muted-foreground'
                          : minutesAgo <= 10 ? 'text-emerald-600 dark:text-emerald-400'
                          : minutesAgo <= 25 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400';

                        const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
                          new: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                          preparing: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                          ready: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                          out_for_delivery: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                          completed: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
                          cancelled: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
                        };
                        const sc = statusColors[order.status] || statusColors.completed;
                        const timeText = minutesAgo < 1 ? 'agora' : minutesAgo < 60 ? `${minutesAgo} min` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}min`;

                        return (
                          <div
                            key={order.id}
                            className="grid grid-cols-[20px_70px_1fr_80px_80px] gap-2 items-center px-2 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer relative"
                            onClick={() => navigate(`/pedidos?order=${order.id}`)}
                          >
                            {/* Timeline dot */}
                            <div className="flex items-center justify-center" style={{ zIndex: 1 }}>
                              <div className={`w-3 h-3 rounded-full shrink-0 ${sc.dot} ring-[3px] ring-card`} />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {(order as any).orderNumber?.startsWith('#') ? (order as any).orderNumber : `#${(order as any).orderNumber || order.id}`}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {itemSummary}
                            </span>
                            <span className={`text-xs font-medium text-right ${timeColor}`}>
                              {timeText}
                            </span>
                            <span className="text-sm font-bold text-foreground text-right">
                              {formatCurrency(Number(order.total))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Nenhum pedido"
                description="Os pedidos aparecerão aqui"
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
