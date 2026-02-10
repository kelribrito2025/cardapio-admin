import { useState } from "react";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

// Planos definidos estaticamente (mesmos da página pública)
const plans = [
  {
    id: "basic",
    name: "Essencial",
    icon: CreditCard,
    priceMonthly: "R$ 79,90",
    priceAnnual: "R$ 66,58",
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-t-blue-500",
    iconColor: "text-blue-500",
    features: [
      "1 estabelecimento",
      "Cardápio digital ilimitado",
      "Pedidos online",
      "Suporte por email",
      "Relatórios básicos",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    priceMonthly: "R$ 59,90",
    priceAnnual: "R$ 39,90",
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-t-purple-500",
    iconColor: "text-purple-500",
    popular: true,
    features: [
      "Tudo do plano Essencial",
      "Estabelecimentos ilimitados",
      "Análises avançadas",
      "Assistente de IA",
      "Relatórios personalizados",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    priceMonthly: "R$ 99,90",
    priceAnnual: "R$ 69,90",
    color: "indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-t-indigo-500",
    iconColor: "text-indigo-500",
    features: [
      "Tudo do plano Pro",
      "API dedicada",
      "Integrações personalizadas",
      "Gerente de conta dedicado",
      "SLA garantido",
      "Treinamento da equipe",
    ],
  },
];

export default function AdminPlanos() {
  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos & Assinaturas</h1>
          <p className="text-sm text-muted-foreground">Gerenciar planos disponíveis na plataforma</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative border-t-4 ${plan.borderColor}`}>
              {plan.popular && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${plan.bgColor} flex items-center justify-center`}>
                    <plan.icon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {plan.id}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{plan.priceMonthly}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou {plan.priceAnnual}/mês no plano anual
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recursos inclusos</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className={`h-4 w-4 flex-shrink-0 ${plan.iconColor}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Status: <span className="text-green-500 font-medium">Ativo</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Gerenciamento de Planos</h3>
                <p className="text-sm text-muted-foreground">
                  Os planos são configurados via Stripe. Para criar novos planos ou alterar preços,
                  acesse o <strong>Stripe Dashboard</strong> e atualize os produtos e preços.
                  As alterações serão refletidas automaticamente na plataforma.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Para alterar o plano de um restaurante manualmente, acesse a página de{" "}
                  <a href="/admin/restaurantes" className="text-red-500 hover:underline">Restaurantes</a>{" "}
                  e use a ação "Alterar plano".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}
