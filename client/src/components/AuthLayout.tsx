import { ReactNode } from "react";
import { Utensils, Smartphone, BarChart3, Clock } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with promotional content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/gerente-restaurante.png)' }}
        />
        {/* Red overlay with 60% opacity (40% transparency) */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/60 via-red-700/60 to-red-900/60" />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Logo - Fixed at top */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-white text-2xl font-bold">Mindi</span>
        </div>
        
        {/* Content - Bottom aligned */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
          {/* Main text */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{marginRight: '-130px'}}>
              Gerencie seu restaurante de um jeito simples e inteligente.
            </h1>
            <p className="text-white/80 text-lg mb-8" style={{marginRight: '-130px'}}>
              Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3" style={{marginRight: '-123px'}}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Cardápio Digital</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Relatórios Completos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>Gestão de Pedidos</span>
              </div>
            </div>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">JM</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">AS</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">PL</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">RC</div>
            </div>
            <span className="text-white/80 text-sm">
              Junte-se a mais de <strong className="text-white">500+</strong> restaurantes satisfeitos
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-muted/50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
