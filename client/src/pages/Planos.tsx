import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
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
      { text: "Múltiplas formas de pagamento", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    buttonText: "Plano atual",
  },
  {
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
      { text: "Múltiplas formas de pagamento", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    buttonText: "Assinar Lite",
  },
  {
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
      { text: "Link do cardápio público", included: true },
      { text: "Suporte por email e WhatsApp", included: true },
      { text: "Gestão de pedidos avançada", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Múltiplas formas de pagamento", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
    buttonText: "Assinar Pro",
  },
];

export default function Planos() {
  return (
    <AdminLayout>
      <PageHeader
        title="Planos"
        description="Escolha o plano ideal para o seu negócio"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative bg-card rounded-2xl border shadow-soft overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1",
              plan.highlighted
                ? "border-primary ring-2 ring-primary/20"
                : "border-border/50"
            )}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              </div>
            )}

            {/* Header */}
            <div className={cn(
              "p-6 pb-4",
              plan.highlighted && "bg-primary/5"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                plan.highlighted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {plan.icon}
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="p-6 pt-4 border-t border-border/50">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-start gap-3 text-sm",
                      feature.included
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      feature.included
                        ? plan.highlighted
                          ? "bg-primary/10 text-primary"
                          : "bg-green-100 text-green-600"
                        : "bg-muted text-muted-foreground/50"
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
                className={cn(
                  "w-full",
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90"
                    : plan.name === "Gratuito"
                    ? "bg-muted text-muted-foreground hover:bg-muted cursor-default"
                    : "bg-foreground hover:bg-foreground/90"
                )}
                disabled={plan.name === "Gratuito"}
              >
                {plan.buttonText}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ ou informações adicionais */}
      <div className="mt-12 bg-card rounded-2xl border border-border/50 shadow-soft p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Perguntas frequentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Posso mudar de plano a qualquer momento?
            </h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor imediatamente.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Como funciona o período de teste?
            </h4>
            <p className="text-sm text-muted-foreground">
              Novos usuários têm 15 dias de acesso gratuito a todos os recursos do plano Pro para testar a plataforma.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Quais formas de pagamento são aceitas?
            </h4>
            <p className="text-sm text-muted-foreground">
              Aceitamos cartão de crédito, débito, Pix e boleto bancário para pagamento das assinaturas.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Posso cancelar minha assinatura?
            </h4>
            <p className="text-sm text-muted-foreground">
              Sim, você pode cancelar sua assinatura a qualquer momento sem multas. O acesso continua até o fim do período pago.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
