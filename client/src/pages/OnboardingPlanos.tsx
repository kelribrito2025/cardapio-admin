import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  buttonText: string;
  highlighted?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuito",
    description: "Ideal para começar e testar a plataforma",
    price: "R$ 0",
    period: "/mês",
    icon: <Star className="h-6 w-6" />,
    features: [
      { text: "Até 20 produtos no cardápio", included: true },
      { text: "1 categoria", included: true },
      { text: "Link do cardápio público", included: true },
      { text: "Suporte por email", included: true },
      { text: "Gestão de pedidos", included: false },
      { text: "Relatórios avançados", included: false },
    ],
    buttonText: "Começar grátis",
  },
  {
    id: "lite",
    name: "Lite",
    description: "Para restaurantes em crescimento",
    price: "R$ 49",
    period: "/mês",
    icon: <Zap className="h-6 w-6" />,
    features: [
      { text: "Até 100 produtos no cardápio", included: true },
      { text: "Categorias ilimitadas", included: true },
      { text: "Link do cardápio público", included: true },
      { text: "Suporte por email", included: true },
      { text: "Gestão de pedidos", included: true },
      { text: "Relatórios básicos", included: true },
    ],
    buttonText: "Assinar Lite",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Recursos completos para seu negócio",
    price: "R$ 99",
    period: "/mês",
    icon: <Crown className="h-6 w-6" />,
    highlighted: true,
    badge: "Mais popular",
    features: [
      { text: "Produtos ilimitados", included: true },
      { text: "Categorias ilimitadas", included: true },
      { text: "Gestão de pedidos avançada", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Múltiplas formas de pagamento", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    buttonText: "Assinar Pro",
  },
];

export default function OnboardingPlanos() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (planId === "free") {
      toast.success("Plano gratuito ativado! Bem-vindo ao Mindi!");
      window.location.href = "/";
    } else {
      // Para planos pagos, redirecionar para página de pagamento
      toast.info("Redirecionando para pagamento...");
      // Por enquanto, apenas redireciona para o dashboard
      // Futuramente integrar com Stripe ou outro gateway
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img src="/logo.svg" alt="Mindi" className="w-10 h-10" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Escolha seu plano
          </h1>
          <p className="text-gray-600 text-lg">
            Comece com o plano gratuito ou escolha um plano que atenda às suas necessidades
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                plan.highlighted
                  ? "ring-2 ring-blue-500"
                  : "border border-gray-200"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className={cn(
                "p-6 pb-4",
                plan.highlighted && "bg-blue-50"
              )}>
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                  plan.highlighted
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {plan.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-800">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 pt-4 border-t border-gray-100">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        feature.included
                          ? "text-gray-700"
                          : "text-gray-400"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        feature.included
                          ? plan.highlighted
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      )}>
                        <Check className="h-3 w-3" />
                      </div>
                      <span className={cn(
                        !feature.included && "line-through"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  className={cn(
                    "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : plan.id === "free"
                      ? "bg-gray-800 hover:bg-gray-900 text-white"
                      : "bg-gray-800 hover:bg-gray-900 text-white"
                  )}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Todos os planos incluem 15 dias de teste grátis com acesso a todos os recursos.
            <br />
            Cancele a qualquer momento sem compromisso.
          </p>
        </div>
      </div>
    </div>
  );
}
