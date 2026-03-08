import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Heart, Save, Coins, CreditCard, AlertTriangle, Check, Loader2, Users, Stamp, Gift, Wallet, TrendingUp, Ban, Settings2, X, ChevronRight, ChevronLeft, Clock, ArrowUpRight, ArrowDownRight, Trophy, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function Fidelizacao() {
  // Get establishment
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id || 0;

  // Loyalty settings
  const { data: loyaltySettings, refetch: refetchLoyalty } = trpc.loyalty.getSettings.useQuery();
  // Cashback settings
  const { data: cashbackConfig, refetch: refetchCashback } = trpc.cashback.getConfig.useQuery();
  // Categories for cashback
  const { data: categoriesData } = trpc.category.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Metrics queries
  const { data: loyaltyMetrics, isLoading: loyaltyMetricsLoading } = trpc.loyalty.getMetrics.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && (cashbackConfig?.rewardProgramType === 'loyalty' || cashbackConfig?.loyaltyEnabled) }
  );
  const { data: cashbackMetrics, isLoading: cashbackMetricsLoading } = trpc.cashback.getMetrics.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && cashbackConfig?.rewardProgramType === 'cashback' }
  );
  const { data: loyaltyEvolution } = trpc.loyalty.getEvolution.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && (cashbackConfig?.rewardProgramType === 'loyalty' || cashbackConfig?.loyaltyEnabled) }
  );
  const { data: cashbackEvolution } = trpc.cashback.getEvolution.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && cashbackConfig?.rewardProgramType === 'cashback' }
  );

  // Pagination & filter state
  const PAGE_SIZE = 10;
  const [loyaltyClientsPage, setLoyaltyClientsPage] = useState(0);
  const [loyaltyEventsPage, setLoyaltyEventsPage] = useState(0);
  const [loyaltyEventsPeriod, setLoyaltyEventsPeriod] = useState<'today' | 'week' | 'month' | undefined>(undefined);
  const [cashbackClientsPage, setCashbackClientsPage] = useState(0);
  const [cashbackEventsPage, setCashbackEventsPage] = useState(0);
  const [cashbackEventsPeriod, setCashbackEventsPeriod] = useState<'today' | 'week' | 'month' | undefined>(undefined);

  // Search state
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [loyaltySearchDebounced, setLoyaltySearchDebounced] = useState("");
  const [cashbackSearch, setCashbackSearch] = useState("");
  const [cashbackSearchDebounced, setCashbackSearchDebounced] = useState("");
  const [loyaltyEventsSearch, setLoyaltyEventsSearch] = useState("");
  const [loyaltyEventsSearchDebounced, setLoyaltyEventsSearchDebounced] = useState("");
  const [cashbackEventsSearch, setCashbackEventsSearch] = useState("");
  const [cashbackEventsSearchDebounced, setCashbackEventsSearchDebounced] = useState("");

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoyaltySearchDebounced(loyaltySearch);
      setLoyaltyClientsPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [loyaltySearch]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCashbackSearchDebounced(cashbackSearch);
      setCashbackClientsPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [cashbackSearch]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoyaltyEventsSearchDebounced(loyaltyEventsSearch);
      setLoyaltyEventsPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [loyaltyEventsSearch]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCashbackEventsSearchDebounced(cashbackEventsSearch);
      setCashbackEventsPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [cashbackEventsSearch]);

  // History queries with pagination
  const { data: loyaltyClientsData, isLoading: loyaltyClientsLoading } = trpc.loyalty.getClients.useQuery(
    { establishmentId, limit: PAGE_SIZE, offset: loyaltyClientsPage * PAGE_SIZE, search: loyaltySearchDebounced || undefined },
    { enabled: !!establishmentId && (cashbackConfig?.rewardProgramType === 'loyalty' || cashbackConfig?.loyaltyEnabled) }
  );
  const { data: loyaltyEventsData, isLoading: loyaltyEventsLoading } = trpc.loyalty.getEventHistory.useQuery(
    { establishmentId, limit: PAGE_SIZE, offset: loyaltyEventsPage * PAGE_SIZE, period: loyaltyEventsPeriod, search: loyaltyEventsSearchDebounced || undefined },
    { enabled: !!establishmentId && (cashbackConfig?.rewardProgramType === 'loyalty' || cashbackConfig?.loyaltyEnabled) }
  );
  const { data: cashbackClientsData, isLoading: cashbackClientsLoading } = trpc.cashback.getClients.useQuery(
    { establishmentId, limit: PAGE_SIZE, offset: cashbackClientsPage * PAGE_SIZE, search: cashbackSearchDebounced || undefined },
    { enabled: !!establishmentId && cashbackConfig?.rewardProgramType === 'cashback' }
  );
  const { data: cashbackEventsData, isLoading: cashbackEventsLoading } = trpc.cashback.getEventHistory.useQuery(
    { establishmentId, limit: PAGE_SIZE, offset: cashbackEventsPage * PAGE_SIZE, period: cashbackEventsPeriod, search: cashbackEventsSearchDebounced || undefined },
    { enabled: !!establishmentId && cashbackConfig?.rewardProgramType === 'cashback' }
  );

  // Extract items from paginated responses
  const loyaltyClients = loyaltyClientsData?.items ?? [];
  const loyaltyEvents = loyaltyEventsData?.items ?? [];
  const cashbackClients = cashbackClientsData?.items ?? [];
  const cashbackEvents = cashbackEventsData?.items ?? [];

  // Reset pages when period changes
  useEffect(() => { setLoyaltyEventsPage(0); }, [loyaltyEventsPeriod]);
  useEffect(() => { setCashbackEventsPage(0); }, [cashbackEventsPeriod]);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  // Reward program type state
  const [rewardType, setRewardType] = useState<"none" | "loyalty" | "cashback">("none");

  // Loyalty form state
  const [stampsRequired, setStampsRequired] = useState(6);
  const [couponType, setCouponType] = useState<"fixed" | "percentage" | "free_delivery">("fixed");
  const [couponValue, setCouponValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("0");

  // Cashback form state
  const [cashbackPercent, setCashbackPercent] = useState("5");
  const [cashbackApplyMode, setCashbackApplyMode] = useState<"all" | "categories">("all");
  const [cashbackCategoryIds, setCashbackCategoryIds] = useState<number[]>([]);
  const cashbackAllowPartialUse = false;

  // Load loyalty settings
  useEffect(() => {
    if (loyaltySettings) {
      setStampsRequired(loyaltySettings.loyaltyStampsRequired || 6);
      setCouponType(loyaltySettings.loyaltyCouponType || "fixed");
      setCouponValue(loyaltySettings.loyaltyCouponValue || "10");
      setMinOrderValue(loyaltySettings.loyaltyMinOrderValue || "0");
    }
  }, [loyaltySettings]);

  // Load cashback settings
  useEffect(() => {
    if (cashbackConfig) {
      setRewardType(cashbackConfig.rewardProgramType as "none" | "loyalty" | "cashback" || "none");
      setCashbackPercent(cashbackConfig.cashbackPercent || "5");
      setCashbackApplyMode(cashbackConfig.cashbackApplyMode as "all" | "categories" || "all");
      setCashbackCategoryIds(cashbackConfig.cashbackCategoryIds as number[] || []);
    }
  }, [cashbackConfig]);

  // Save loyalty mutation
  const saveLoyaltyMutation = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => {
      refetchLoyalty();
      refetchCashback();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de fidelidade");
    },
  });

  // Save cashback mutation
  const saveCashbackMutation = trpc.cashback.saveConfig.useMutation({
    onSuccess: () => {
      refetchCashback();
      refetchLoyalty();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de cashback");
    },
  });

  const handleSave = () => {
    saveCashbackMutation.mutate({
      establishmentId,
      rewardProgramType: rewardType,
      cashbackPercent,
      cashbackApplyMode,
      cashbackCategoryIds,
      cashbackAllowPartialUse,
    });

    saveLoyaltyMutation.mutate({
      establishmentId,
      loyaltyEnabled: rewardType === "loyalty",
      loyaltyStampsRequired: stampsRequired,
      loyaltyCouponType: couponType,
      loyaltyCouponValue: couponValue,
      loyaltyMinOrderValue: minOrderValue,
    });

    toast.success("Configurações do programa de recompensas salvas!");
    setSheetOpen(false);
  };

  const isSaving = saveLoyaltyMutation.isPending || saveCashbackMutation.isPending;

  const toggleCategory = (catId: number) => {
    setCashbackCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Active program from server (not local state which may not be saved yet)
  const activeProgram = cashbackConfig?.rewardProgramType || "none";

  // Chart data
  const chartData = useMemo(() => {
    const evolution = activeProgram === 'loyalty' ? loyaltyEvolution : cashbackEvolution;
    if (!evolution || evolution.length === 0) return [];
    return evolution.map((d: { date: string; count: number }) => ({
      date: d.date,
      label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count: d.count,
    }));
  }, [activeProgram, loyaltyEvolution, cashbackEvolution]);

  const chartTotal = useMemo(() => chartData.reduce((sum: number, d: { count: number }) => sum + d.count, 0), [chartData]);

  const formatCurrency = (val: string) => {
    return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to get program label and badge
  const getProgramInfo = () => {
    if (activeProgram === "loyalty") {
      return {
        label: "Cartão Fidelidade",
        icon: CreditCard,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-500/15",
        badgeBg: "bg-emerald-50 dark:bg-emerald-900/30",
        badgeBorder: "border-emerald-200 dark:border-emerald-800/50",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        dotColor: "bg-emerald-500",
      };
    }
    if (activeProgram === "cashback") {
      return {
        label: "Cashback",
        icon: Coins,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-500/15",
        badgeBg: "bg-blue-50 dark:bg-blue-900/30",
        badgeBorder: "border-blue-200 dark:border-blue-800/50",
        badgeText: "text-blue-700 dark:text-blue-300",
        dotColor: "bg-blue-500",
      };
    }
    return null;
  };

  const programInfo = getProgramInfo();

  // Stamps required from settings
  const stampsRequiredConfig = loyaltySettings?.loyaltyStampsRequired || 6;

  // Helper to format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Separate near-reward clients (>= 70% stamps)
  const nearRewardClients = useMemo(() => {
    if (!loyaltyClients || loyaltyClients.length === 0 || activeProgram !== 'loyalty') return [];
    return loyaltyClients.filter((c: any) => {
      const progress = c.stamps / stampsRequiredConfig;
      return progress >= 0.7 && c.stamps < stampsRequiredConfig;
    });
  }, [loyaltyClients, activeProgram, stampsRequiredConfig]);

  // Pagination helper component
  const PaginationControls = ({ page, setPage, total, pageSize, label }: { page: number; setPage: (p: number) => void; total: number; pageSize: number; label: string }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-3">
        <span className="text-xs text-muted-foreground">
          {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} de {total} {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              page === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-muted-foreground px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              page >= totalPages - 1 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Period filter component
  const PeriodFilter = ({ value, onChange }: { value: 'today' | 'week' | 'month' | undefined; onChange: (v: 'today' | 'week' | 'month' | undefined) => void }) => {
    const options: { label: string; value: 'today' | 'week' | 'month' | undefined }[] = [
      { label: 'Todos', value: undefined },
      { label: 'Hoje', value: 'today' },
      { label: 'Semana', value: 'week' },
      { label: 'M\u00eas', value: 'month' },
    ];
    return (
      <div className="flex items-center gap-1 ml-auto">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              value === opt.value
                ? "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with program status inline */}
        <PageHeader
          title="Fidelização de Clientes"
          description="Configure estratégias para incentivar seus clientes a voltar e comprar novamente."
          icon={<Heart className="h-6 w-6 text-rose-600" />}
          actions={
            <div className="flex items-center gap-3">
              {/* Program status badge */}
              {programInfo ? (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
                  programInfo.badgeBg, programInfo.badgeBorder, programInfo.badgeText
                )}>
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", programInfo.dotColor)} />
                  {programInfo.label}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Nenhum programa ativo
                </div>
              )}
              {/* Configure button */}
              <Button
                onClick={() => setSheetOpen(true)}
                variant="outline"
                className="rounded-xl gap-2"
              >
                <Settings2 className="h-4 w-4" />
                {activeProgram === "none" ? "Ativar programa" : "Configurar"}
              </Button>
            </div>
          }
        />

        {/* Seção de Métricas - Desempenho da Fidelização */}
        {activeProgram === "none" ? (
          <SectionCard title="Desempenho da Fidelização" description="Métricas do seu programa de recompensas">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Ban className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum programa de fidelização ativo no momento.
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Ative um programa para começar a fidelizar seus clientes e acompanhar as métricas de desempenho.
              </p>
              <Button
                onClick={() => setSheetOpen(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Heart className="h-4 w-4" />
                Ativar programa de fidelização
              </Button>
            </div>
          </SectionCard>
        ) : activeProgram === "loyalty" ? (
          <>
            {/* Métricas do Cartão Fidelidade */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
                Desempenho da Fidelização
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  title="Clientes com Cartão Ativo"
                  value={loyaltyMetrics?.activeCards ?? 0}
                  tooltip="Clientes que já começaram a acumular carimbos"
                  icon={Users}
                  loading={loyaltyMetricsLoading}
                  variant="emerald"
                />
                <StatCard
                  title="Carimbos Distribuídos"
                  value={loyaltyMetrics?.totalStamps ?? 0}
                  tooltip="Total de carimbos já concedidos aos clientes"
                  icon={Stamp}
                  loading={loyaltyMetricsLoading}
                  variant="blue"
                />
                <StatCard
                  title="Recompensas Resgatadas"
                  value={loyaltyMetrics?.rewardsRedeemed ?? 0}
                  tooltip="Vezes que clientes completaram o cartão e usaram a recompensa"
                  icon={Gift}
                  loading={loyaltyMetricsLoading}
                  variant="amber"
                />
                <StatCard
                  title="Clientes Fidelizados"
                  value={loyaltyMetrics?.loyalCustomers ?? 0}
                  tooltip="Clientes que já completaram pelo menos um cartão"
                  icon={Heart}
                  loading={loyaltyMetricsLoading}
                  variant="red"
                />
              </div>
            </div>

            {/* Gráfico de Evolução - Loyalty */}
            {chartData.length > 0 && (
              <div className="bg-card rounded-xl border border-border/50 p-5">
                {/* Header estilo Acumulado da semana */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                      <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">Evolução da Fidelização</h3>
                      <p className="text-xs text-muted-foreground">Novos clientes com cartão fidelidade nos últimos 30 dias</p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl font-bold text-foreground">{chartTotal}</span>
                  <span className="text-xs text-muted-foreground">novos cartões</span>
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="loyaltyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        allowDecimals={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} clientes`, 'Novos cartões']}
                        labelFormatter={(label: string) => `Data: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#loyaltyGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Métricas do Cashback */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
                Desempenho da Fidelização
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  title="Clientes com Cashback"
                  value={cashbackMetrics?.customersWithBalance ?? 0}
                  tooltip="Clientes que possuem saldo de cashback"
                  icon={Users}
                  loading={cashbackMetricsLoading}
                  variant="blue"
                />
                <StatCard
                  title="Cashback Distribuído"
                  value={formatCurrency(cashbackMetrics?.totalDistributed ?? '0.00')}
                  tooltip="Valor total já distribuído em cashback"
                  icon={Coins}
                  loading={cashbackMetricsLoading}
                  variant="emerald"
                />
                <StatCard
                  title="Cashback Utilizado"
                  value={formatCurrency(cashbackMetrics?.totalUsed ?? '0.00')}
                  tooltip="Valor total já usado pelos clientes em pedidos"
                  icon={Wallet}
                  loading={cashbackMetricsLoading}
                  variant="amber"
                />
                <StatCard
                  title="Saldo em Aberto"
                  value={formatCurrency(cashbackMetrics?.totalBalance ?? '0.00')}
                  tooltip="Saldo que ainda está disponível para os clientes utilizarem"
                  icon={TrendingUp}
                  loading={cashbackMetricsLoading}
                  variant="red"
                />
              </div>
            </div>

            {/* Gráfico de Evolução - Cashback */}
            {chartData.length > 0 && (
              <div className="bg-card rounded-xl border border-border/50 p-5">
                {/* Header estilo Acumulado da semana */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">Evolução do Cashback</h3>
                      <p className="text-xs text-muted-foreground">Transações de cashback nos últimos 30 dias</p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl font-bold text-foreground">{chartTotal}</span>
                  <span className="text-xs text-muted-foreground">transações</span>
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="cashbackGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        allowDecimals={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`R$ ${Number(value).toFixed(2)}`, 'Cashback']}
                        labelFormatter={(label: string) => `Data: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#cashbackGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== HISTÓRICO DE FIDELIZAÇÃO ==================== */}
        {activeProgram === "loyalty" && (
          <div className="space-y-5">
            {/* Clientes perto da recompensa */}
            {nearRewardClients.length > 0 && (
              <div className="bg-card rounded-xl border border-border/50 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">Clientes Perto da Recompensa</h3>
                    <p className="text-xs text-muted-foreground">Clientes com 70% ou mais dos carimbos necessários</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                    {nearRewardClients.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {nearRewardClients.map((client: any) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {(client.customerName || 'C')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.customerName || client.customerPhone}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {Array.from({ length: stampsRequiredConfig }, (_, i) => {
                            const hasStamp = i < client.stamps;
                            const stampDate = hasStamp && client.stampDates?.[i] ? new Date(client.stampDates[i]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded-md transition-all cursor-pointer",
                                      hasStamp
                                        ? "bg-amber-500 dark:bg-amber-400"
                                        : "bg-muted/60 dark:bg-muted/30"
                                    )}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {hasStamp ? `Carimbo ${i + 1} • ${stampDate}` : `Carimbo ${i + 1} • Pendente`}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap ml-1">
                            {client.stamps} / {stampsRequiredConfig}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid 50/50: Clientes Fidelizados + Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lista de clientes com cartão fidelidade */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Clientes Fidelizados</h3>
                  <p className="text-xs text-muted-foreground">Progresso dos clientes no cartão fidelidade</p>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={loyaltySearch}
                  onChange={(e) => setLoyaltySearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/30 border-border/50"
                />
              </div>

              {loyaltyClientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : loyaltyClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum cliente com cartão fidelidade ainda.</p>
                </div>
              ) : (
                <>
                <div className="space-y-2">
                  {loyaltyClients.map((client: any) => {
                    const isComplete = client.stamps >= stampsRequiredConfig;
                    const progressPct = Math.min((client.stamps / stampsRequiredConfig) * 100, 100);
                    return (
                      <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                        <div className={cn(
                          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                          isComplete ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-muted/60"
                        )}>
                          <span className={cn(
                            "text-sm font-bold",
                            isComplete ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                          )}>
                            {(client.customerName || 'C')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">{client.customerName || client.customerPhone}</p>
                            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                              {formatRelativeTime(client.lastStampDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {Array.from({ length: stampsRequiredConfig }, (_, i) => {
                              const hasStamp = i < client.stamps;
                              const stampDate = hasStamp && client.stampDates?.[i] ? new Date(client.stampDates[i]).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                              return (
                                <Tooltip key={i}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded-md transition-all cursor-pointer",
                                        hasStamp
                                          ? isComplete
                                            ? "bg-emerald-500 dark:bg-emerald-400"
                                            : "bg-emerald-400 dark:bg-emerald-500/80"
                                          : "bg-muted/60 dark:bg-muted/30"
                                      )}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    {hasStamp ? `Carimbo ${i + 1} • ${stampDate}` : `Carimbo ${i + 1} • Pendente`}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            <span className={cn(
                              "text-xs font-medium whitespace-nowrap ml-1",
                              isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                            )}>
                              {client.stamps} / {stampsRequiredConfig}
                            </span>
                          </div>
                          {isComplete && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                              <Gift className="h-3 w-3" /> Recompensa liberada ({client.couponsEarned}x resgatada)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <PaginationControls page={loyaltyClientsPage} setPage={setLoyaltyClientsPage} total={loyaltyClientsData?.total ?? 0} pageSize={PAGE_SIZE} label="clientes" />
                </>
              )}
            </div>

            {/* Histórico de eventos - Loyalty */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">Histórico de Fidelização</h3>
                  <p className="text-xs text-muted-foreground">Atividade recente dos clientes no programa</p>
                </div>
                <PeriodFilter value={loyaltyEventsPeriod} onChange={setLoyaltyEventsPeriod} />
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={loyaltyEventsSearch}
                  onChange={(e) => setLoyaltyEventsSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {loyaltyEventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : loyaltyEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{loyaltyEventsPeriod ? 'Nenhuma atividade neste período.' : 'Nenhuma atividade registrada ainda.'}</p>
                </div>
              ) : (
                <>
                <div className="space-y-1">
                  {loyaltyEvents.map((event: any) => {
                    const isCompletion = event.currentStamps >= stampsRequiredConfig;
                    return (
                      <div key={event.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors" style={{height: '71px'}}>
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          isCompletion ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-blue-100 dark:bg-blue-500/15"
                        )}>
                          {isCompletion ? (
                            <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Stamp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{event.customerName}</span>
                            {isCompletion
                              ? " completou o cartão fidelidade 🎉"
                              : " ganhou 1 carimbo"
                            }
                          </p>
                          {event.orderNumber && (
                            <p className="text-xs text-muted-foreground">Pedido #{event.orderNumber}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <PaginationControls page={loyaltyEventsPage} setPage={setLoyaltyEventsPage} total={loyaltyEventsData?.total ?? 0} pageSize={PAGE_SIZE} label="eventos" />
                </>
              )}
            </div>
            </div>{/* Fecha grid 50/50 loyalty */}
          </div>
        )}

        {/* Histórico de Cashback */}
        {activeProgram === "cashback" && (
          <div className="space-y-5">
            {/* Grid 50/50: Clientes com Cashback + Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lista de clientes com cashback */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">Clientes com Cashback</h3>
                  <p className="text-xs text-muted-foreground">Saldo e atividade de cashback dos clientes</p>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={cashbackSearch}
                  onChange={(e) => setCashbackSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/30 border-border/50"
                />
              </div>

              {cashbackClientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : cashbackClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum cliente com cashback ainda.</p>
                </div>
              ) : (
                <>
                <div className="space-y-2">
                  {cashbackClients.map((client: any) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          {(client.customerName || 'C')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.customerName || client.customerPhone}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            Saldo: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(client.balance)}</span>
                          </span>
                          {Number(client.cashbackToday) > 0 && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <ArrowUpRight className="h-3 w-3" />
                              +{formatCurrency(client.cashbackToday)} hoje
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total ganho</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(client.totalEarned)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls page={cashbackClientsPage} setPage={setCashbackClientsPage} total={cashbackClientsData?.total ?? 0} pageSize={PAGE_SIZE} label="clientes" />
                </>
              )}
            </div>

            {/* Histórico de eventos - Cashback */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                  <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">Histórico de Cashback</h3>
                  <p className="text-xs text-muted-foreground">Transações recentes de cashback dos clientes</p>
                </div>
                <PeriodFilter value={cashbackEventsPeriod} onChange={setCashbackEventsPeriod} />
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={cashbackEventsSearch}
                  onChange={(e) => setCashbackEventsSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {cashbackEventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : cashbackEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{cashbackEventsPeriod ? 'Nenhuma transação neste período.' : 'Nenhuma transação de cashback registrada ainda.'}</p>
                </div>
              ) : (
                <>
                <div className="space-y-1">
                  {cashbackEvents.map((event: any) => {
                    const isCredit = event.type === 'credit';
                    return (
                      <div key={event.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          isCredit ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-orange-100 dark:bg-orange-500/15"
                        )}>
                          {isCredit ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{event.customerName}</span>
                            {isCredit
                              ? ` ganhou ${formatCurrency(event.amount)} de cashback`
                              : ` usou ${formatCurrency(event.amount)} de cashback`
                            }
                          </p>
                          {event.orderNumber && (
                            <p className="text-xs text-muted-foreground">Pedido #{event.orderNumber}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt))}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <PaginationControls page={cashbackEventsPage} setPage={setCashbackEventsPage} total={cashbackEventsData?.total ?? 0} pageSize={PAGE_SIZE} label="transações" />
                </>
              )}
            </div>
            </div>{/* Fecha grid 50/50 cashback */}
          </div>
        )}

        {/* ==================== SIDEBAR DE CONFIGURAÇÃO ==================== */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            hideCloseButton
            className="!w-[440px] !max-w-[440px] p-0 gap-0 border-l border-border/40 bg-background overflow-hidden flex flex-col"
          >
            <SheetTitle className="sr-only">Configurar Programa de Recompensas</SheetTitle>
            <SheetDescription className="sr-only">Escolha e configure o programa de fidelização</SheetDescription>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Programa de Recompensas</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Escolha e configure o programa de fidelização
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Aviso */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Apenas um programa pode estar ativo por vez.
                </p>
              </div>

              {/* Program options */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Escolha o programa
                </Label>

                {/* Nenhum */}
                <button
                  type="button"
                  onClick={() => setRewardType("none")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    rewardType === "none"
                      ? "border-gray-400 bg-gray-50 dark:bg-gray-800/50 shadow-sm"
                      : "border-border/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    rewardType === "none" ? "bg-gray-200 dark:bg-gray-700" : "bg-muted/50"
                  )}>
                    <Ban className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm block">Nenhum</span>
                    <span className="text-xs text-muted-foreground">Desativar programa de recompensas</span>
                  </div>
                  {rewardType === "none" && (
                    <Check className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Cartão Fidelidade */}
                <button
                  type="button"
                  onClick={() => setRewardType("loyalty")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    rewardType === "loyalty"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                      : "border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    rewardType === "loyalty" ? "bg-emerald-200 dark:bg-emerald-800" : "bg-muted/50"
                  )}>
                    <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm block">Cartão Fidelidade</span>
                    <span className="text-xs text-muted-foreground">Ganhe carimbos a cada pedido</span>
                  </div>
                  {rewardType === "loyalty" ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                </button>

                {/* Cashback */}
                <button
                  type="button"
                  onClick={() => setRewardType("cashback")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    rewardType === "cashback"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                      : "border-border/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    rewardType === "cashback" ? "bg-blue-200 dark:bg-blue-800" : "bg-muted/50"
                  )}>
                    <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm block">Cashback</span>
                    <span className="text-xs text-muted-foreground">Percentual de volta por pedido</span>
                  </div>
                  {rewardType === "cashback" ? (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                </button>
              </div>

              {/* Configurações do Cartão Fidelidade */}
              {rewardType === "loyalty" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border/40" />
                  <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Configurações do Cartão Fidelidade
                  </h4>

                  <div className="space-y-4">
                    {/* Carimbos necessários */}
                    <div>
                      <Label htmlFor="stampsRequired" className="text-xs font-semibold text-muted-foreground">
                        Carimbos necessários
                      </Label>
                      <Input
                        id="stampsRequired"
                        type="number"
                        min={1}
                        max={20}
                        value={stampsRequired}
                        onChange={(e) => setStampsRequired(parseInt(e.target.value) || 6)}
                        className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                      />
                    </div>

                    {/* Tipo de cupom */}
                    <div>
                      <Label htmlFor="couponType" className="text-xs font-semibold text-muted-foreground">
                        Tipo de cupom
                      </Label>
                      <Select value={couponType} onValueChange={(v) => setCouponType(v as typeof couponType)}>
                        <SelectTrigger className="mt-1 h-9 rounded-lg border-border/50 text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                          <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                          <SelectItem value="free_delivery">Frete grátis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Valor do desconto */}
                    {couponType !== "free_delivery" && (
                      <div>
                        <Label htmlFor="couponValue" className="text-xs font-semibold text-muted-foreground">
                          {couponType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                        </Label>
                        <Input
                          id="couponValue"
                          type="number"
                          min={1}
                          max={couponType === "percentage" ? 100 : 1000}
                          value={couponValue}
                          onChange={(e) => setCouponValue(e.target.value)}
                          className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                        />
                      </div>
                    )}

                    {/* Valor mínimo */}
                    <div>
                      <Label htmlFor="minOrderValue" className="text-xs font-semibold text-muted-foreground">
                        Valor mínimo (R$)
                      </Label>
                      <Input
                        id="minOrderValue"
                        type="number"
                        min={0}
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(e.target.value)}
                        className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Configurações do Cashback */}
              {rewardType === "cashback" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border/40" />
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Configurações do Cashback
                  </h4>

                  <div className="space-y-4">
                    {/* Percentual de cashback */}
                    <div>
                      <Label htmlFor="cashbackPercent" className="text-xs font-semibold text-muted-foreground">
                        Percentual de cashback (%)
                      </Label>
                      <Input
                        id="cashbackPercent"
                        type="number"
                        min={1}
                        max={50}
                        step={1}
                        value={cashbackPercent}
                        onChange={(e) => setCashbackPercent(e.target.value)}
                        className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                        placeholder="5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Ex: 5% = R$ 5,00 de cashback em um pedido de R$ 100,00
                      </p>
                    </div>

                    {/* Uso do saldo */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Uso do saldo:</strong> O cliente deve usar todo o saldo disponível ou nenhum.
                      </p>
                    </div>

                    {/* Aplicar cashback em */}
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Aplicar cashback em
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setCashbackApplyMode("all")}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                            cashbackApplyMode === "all"
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "border-border/50 text-muted-foreground hover:border-blue-300"
                          )}
                        >
                          Todos os produtos
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashbackApplyMode("categories")}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                            cashbackApplyMode === "categories"
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "border-border/50 text-muted-foreground hover:border-blue-300"
                          )}
                        >
                          Categorias específicas
                        </button>
                      </div>
                    </div>

                    {/* Lista de categorias */}
                    {cashbackApplyMode === "categories" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Selecione as categorias elegíveis
                        </Label>
                        {categoriesData && categoriesData.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                            {categoriesData.map((cat: any) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                                  cashbackCategoryIds.includes(cat.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-border/50 text-muted-foreground hover:border-blue-300"
                                )}
                              >
                                <div className={cn(
                                  "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                  cashbackCategoryIds.includes(cat.id)
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-300 dark:border-gray-600"
                                )}>
                                  {cashbackCategoryIds.includes(cat.id) && (
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  )}
                                </div>
                                <span className="truncate">{cat.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Nenhuma categoria encontrada. Adicione categorias ao seu cardápio primeiro.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with save button */}
            <div className="px-6 py-4 border-t border-border/40 bg-background">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 h-10"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
