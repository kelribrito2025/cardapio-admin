/**
 * AdminRelatorios - Página de Relatórios do Admin
 * KPIs, gráfico donut de distribuição por status, receita anual, ticket médio, churn rate
 */
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import {
  BarChart3,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function AdminRelatorios() {
  const { data, isLoading } = trpc.admin.reports.data.useQuery();

  if (isLoading) {
    return (
      <AdminPanelLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      </AdminPanelLayout>
    );
  }

  if (!data) {
    return (
      <AdminPanelLayout>
        <div className="text-center text-muted-foreground py-12">
          Erro ao carregar relatórios.
        </div>
      </AdminPanelLayout>
    );
  }

  // Donut chart data
  const donutData = [
    { name: "Ativos", value: data.activeRestaurants, color: "#22c55e" },
    { name: "Em Teste", value: data.activeTrials, color: "#3b82f6" },
    { name: "Expirados", value: data.expiredTrials, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Se todos são zero, mostrar placeholder
  if (donutData.length === 0) {
    donutData.push({ name: "Sem dados", value: 1, color: "#e5e7eb" });
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <AdminPanelLayout>
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da plataforma e métricas de negócio
          </p>
        </div>
      </div>

      {/* KPI Cards - Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Restaurantes"
          value={data.totalRestaurants.toString()}
          subtitle="Cadastrados na plataforma"
          icon={Building2}
          color="blue"
        />
        <KPICard
          title="Receita Mensal"
          value={formatCurrency(data.monthlyRevenue)}
          subtitle="Baseada nos planos ativos"
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${data.conversionRate}%`}
          subtitle="Trial → Plano pago"
          icon={TrendingUp}
          color="orange"
        />
        <KPICard
          title="Restaurantes Ativos"
          value={data.activeRestaurants.toString()}
          subtitle="Com plano pago"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Middle Row: Donut Chart + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="bg-card rounded-xl border border-border/50">
          <div className="px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
            <h2 className="font-semibold text-base">
              Distribuição por Status
            </h2>
          </div>
          <div className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "none",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => {
                      const item = donutData.find((d) => d.name === value);
                      return (
                        <span className="text-sm text-muted-foreground">
                          {value}: <span className="font-semibold">{item?.value ?? 0}</span>
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Plan Distribution Details */}
        <div className="bg-card rounded-xl border border-border/50">
          <div className="px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
            <h2 className="font-semibold text-base">
              Detalhes por Plano
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <PlanRow
                label="Essencial"
                count={data.planDistribution?.basic ?? 0}
                price="R$ 29/mês"
                color="#3b82f6"
                total={data.totalRestaurants}
              />
              <PlanRow
                label="Pro"
                count={data.planDistribution?.pro ?? 0}
                price="R$ 59/mês"
                color="#8b5cf6"
                total={data.totalRestaurants}
              />
              <PlanRow
                label="Enterprise"
                count={data.planDistribution?.enterprise ?? 0}
                price="R$ 99/mês"
                color="#f59e0b"
                total={data.totalRestaurants}
              />
              <PlanRow
                label="Trial Ativo"
                count={data.activeTrials}
                price="Gratuito"
                color="#22c55e"
                total={data.totalRestaurants}
              />
              <PlanRow
                label="Trial Expirado"
                count={data.expiredTrials}
                price="Bloqueado"
                color="#ef4444"
                total={data.totalRestaurants}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">{data.totalRestaurants} restaurantes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Revenue, Ticket, Churn */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Receita Anual Projetada"
          value={formatCurrency(data.annualRevenue)}
          subtitle="Baseado nos restaurantes ativos atuais"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(data.ticketMedio)}
          subtitle="Por restaurante ativo"
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.churnRate}%`}
          subtitle="Restaurantes suspensos/cancelados"
        />
      </div>
    </div>
    </AdminPanelLayout>
  );
}

// ============ Sub-components ============

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      border: "border-t-blue-500",
      dot: "bg-blue-500",
    },
    green: {
      bg: "bg-emerald-100",
      icon: "text-emerald-600",
      border: "border-t-emerald-500",
      dot: "bg-emerald-500",
    },
    orange: {
      bg: "bg-orange-100",
      icon: "text-orange-600",
      border: "border-t-orange-500",
      dot: "bg-orange-500",
    },
    purple: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      border: "border-t-purple-500",
      dot: "bg-purple-500",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className={`bg-card rounded-xl border border-border/50 border-t-4 ${c.border}`}
    >
      <div className="px-5 py-5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            <span className="text-2xl font-bold tracking-tight">{value}</span>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/50">
      <div className="px-5 py-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function PlanRow({
  label,
  count,
  price,
  color,
  total,
}: {
  label: string;
  count: number;
  price: string;
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{price}</span>
          <span className="font-semibold text-foreground w-6 text-right">{count}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
