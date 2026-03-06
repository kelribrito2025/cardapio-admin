import { useEffect, useState, useRef } from "react";
import { X, ClipboardList, Ticket, Star, ArrowRight } from "lucide-react";

interface MenuSpotlightProps {
  targetRef: React.RefObject<HTMLElement | null>;
  onDismiss: () => void;
  onOpenMenu: () => void;
}

export function MenuSpotlight({ targetRef, onDismiss, onOpenMenu }: MenuSpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calcular posição do botão alvo
  useEffect(() => {
    const updateRect = () => {
      if (targetRef.current) {
        setTargetRect(targetRef.current.getBoundingClientRect());
      }
    };
    
    updateRect();
    // Pequeno delay para a animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [targetRef]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!targetRect) return null;

  // Dimensões do spotlight (círculo ao redor do botão)
  const padding = 8;
  const spotlightCx = targetRect.left + targetRect.width / 2;
  const spotlightCy = targetRect.top + targetRect.height / 2;
  const spotlightR = Math.max(targetRect.width, targetRect.height) / 2 + padding;

  // Posição do tooltip (abaixo e à esquerda do botão)
  const tooltipTop = targetRect.bottom + 16;
  const tooltipRight = window.innerWidth - targetRect.right + targetRect.width / 2 - 12;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={(e) => {
        // Se clicou no overlay (fora do spotlight), fechar
        const clickX = e.clientX;
        const clickY = e.clientY;
        const dist = Math.sqrt((clickX - spotlightCx) ** 2 + (clickY - spotlightCy) ** 2);
        if (dist > spotlightR) {
          onDismiss();
        }
      }}
    >
      {/* SVG Overlay com recorte circular */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={spotlightCx} cy={spotlightCy} r={spotlightR} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
        />
      </svg>

      {/* Anel pulsante ao redor do botão */}
      <div
        className="absolute rounded-full border-2 border-white/80 animate-ping"
        style={{
          left: spotlightCx - spotlightR - 4,
          top: spotlightCy - spotlightR - 4,
          width: (spotlightR + 4) * 2,
          height: (spotlightR + 4) * 2,
          animationDuration: "2s",
          pointerEvents: "none",
        }}
      />
      
      {/* Anel estático branco */}
      <div
        className="absolute rounded-full border-2 border-white/60"
        style={{
          left: spotlightCx - spotlightR - 2,
          top: spotlightCy - spotlightR - 2,
          width: (spotlightR + 2) * 2,
          height: (spotlightR + 2) * 2,
          pointerEvents: "none",
        }}
      />

      {/* Área clicável sobre o botão - abre o menu */}
      <div
        className="absolute cursor-pointer"
        style={{
          left: spotlightCx - spotlightR,
          top: spotlightCy - spotlightR,
          width: spotlightR * 2,
          height: spotlightR * 2,
          borderRadius: "50%",
          zIndex: 201,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu();
          onDismiss();
        }}
      />

      {/* Tooltip / Card informativo */}
      <div
        className={`absolute transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
        style={{
          top: tooltipTop,
          right: Math.max(tooltipRight - 100, 16),
          maxWidth: "min(320px, calc(100vw - 32px))",
          zIndex: 202,
          pointerEvents: "auto",
        }}
      >
        {/* Seta apontando para cima */}
        <div
          className="absolute -top-2 w-4 h-4 bg-white rotate-45 rounded-sm"
          style={{
            right: Math.min(tooltipRight + 100 - 16, 280) > 0 
              ? Math.min(100, Math.max(20, targetRect.width / 2 + (window.innerWidth - targetRect.right) - Math.max(tooltipRight - 100, 16)))
              : 24,
          }}
        />
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🎉</span> Pedido enviado!
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          
          {/* Body */}
          <div className="px-5 py-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Toque no <strong>menu</strong> para acessar:
            </p>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <span><strong className="text-gray-800">Meus Pedidos</strong> — acompanhe em tempo real</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Ticket className="h-4 w-4 text-green-500" />
                </div>
                <span><strong className="text-gray-800">Cupons</strong> — descontos exclusivos</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
                <span><strong className="text-gray-800">Avaliações</strong> — deixe sua opinião</span>
              </div>
            </div>
            
            {/* CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu();
                onDismiss();
              }}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-500/20 active:scale-[0.98]"
            >
              Abrir Menu
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
