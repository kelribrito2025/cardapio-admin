import { ReactNode } from "react";
import { Check, BarChart3, MessageCircle, DollarSign, UtensilsCrossed } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  {
    icon: Check,
    title: "Gestão Simplificada",
    description: "Controle pedidos, mesas e equipe",
    color: "bg-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Análises Detalhadas",
    description: "Acompanhe métricas importantes",
    color: "bg-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Atendimento IA WhatsApp",
    description: "Automação inteligente de vendas",
    color: "bg-green-500",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description: "Fluxo de caixa e relatórios",
    color: "bg-orange-500",
  },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Features */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-8 xl:p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,237,213,1) 50%, rgba(254,215,170,0.8) 100%)"
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -left-20 top-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-orange-300/30 rounded-full blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-primary/10 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cardápio Admin</h1>
            <p className="text-sm text-gray-600">IA que vende e gerencia, enquanto você cozinha.</p>
          </div>
        </div>

        {/* Welcome message */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Bem-vindo de volta!
          </h2>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Acesse sua conta para gerenciar seu restaurante de forma eficiente e profissional.
          </p>

          {/* Features list */}
          <div className="space-y-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-gray-500">
            © 2025 Cardápio Admin. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 bg-gray-50/50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
