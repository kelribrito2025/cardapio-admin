import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserPlus,
  Clock,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

type Period = "today" | "7days" | "30days" | "all";

const periodLabels: Record<Period, string> = {
  today: "Hoje",
  "7days": "7 dias",
  "30days": "30 dias",
  all: "Total",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("all");

  const { data: stats, isLoading } = trpc.admin.dashboard.stats.useQuery({ period });

  const cards = [
    {
      title: "Novos Cadastros",
      value: stats?.newRegistrations ?? 0,
      icon: UserPlus,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      borderColor: "border-t-blue-500",
      onClick: () => navigate("/admin/restaurantes"),
    },
    {
      title: "Em Trial",
      value: stats?.inTrial ?? 0,
      icon: Clock,
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-500",
      borderColor: "border-t-amber-500",
      onClick: () => navigate("/admin/trials"),
    },
    {
      title: "Planos Pagos",
      value: stats?.paidPlans ?? 0,
      icon: CreditCard,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      borderColor: "border-t-green-500",
      onClick: () => navigate("/admin/restaurantes?filter=paid"),
    },
    {
      title: "Trials Expirados",
      value: stats?.expiredTrials ?? 0,
      icon: AlertTriangle,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      borderColor: "border-t-red-500",
      onClick: () => navigate("/admin/trials?filter=expired"),
    },
  ];

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Visão geral da plataforma</p>
          </div>

          {/* Period Filter */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? "bg-red-500 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Card
                key={card.title}
                className={`cursor-pointer hover:shadow-md transition-shadow border-t-4 ${card.borderColor}`}
                onClick={card.onClick}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {card.title}
                    </span>
                    <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Resumo Rápido</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Total de restaurantes</span>
                  <span className="font-semibold text-gray-900">
                    {(stats?.newRegistrations ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Taxa de conversão (trial → pago)</span>
                  <span className="font-semibold text-gray-900">
                    {stats && (stats.paidPlans + stats.inTrial + stats.expiredTrials) > 0
                      ? `${Math.round((stats.paidPlans / (stats.paidPlans + stats.inTrial + stats.expiredTrials)) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">Trials aguardando upgrade</span>
                  <span className="font-semibold text-red-500">
                    {stats?.expiredTrials ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/admin/restaurantes")}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                >
                  <span className="font-medium text-gray-900">Ver todos os restaurantes</span>
                  <p className="text-xs text-gray-500 mt-0.5">Gerenciar planos, trials e status</p>
                </button>
                <button
                  onClick={() => navigate("/admin/trials?filter=expiring_3days")}
                  className="w-full text-left px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-sm"
                >
                  <span className="font-medium text-amber-700">Trials vencendo em 3 dias</span>
                  <p className="text-xs text-amber-600 mt-0.5">Ação urgente necessária</p>
                </button>
                <button
                  onClick={() => navigate("/admin/trials?filter=expired")}
                  className="w-full text-left px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-sm"
                >
                  <span className="font-medium text-red-700">Trials expirados</span>
                  <p className="text-xs text-red-600 mt-0.5">Converter ou bloquear</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPanelLayout>
  );
}
