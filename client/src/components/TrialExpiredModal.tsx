import { Rocket, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Modal obrigatório de upgrade quando o trial expira.
 * Não pode ser fechado (sem clique fora, sem ESC, sem botão de fechar).
 * O único botão redireciona para a página de planos.
 * Design: degradê vermelho da marca com glassmorphism.
 */
export function TrialExpiredModal() {
  const [, navigate] = useLocation();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className="relative max-w-md w-full mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #dc2626 0%, #ef4444 40%, #f87171 70%, #fca5a5 100%)",
        }}
      >
        {/* Content */}
        <div className="flex flex-col items-center px-8 pt-10 pb-8">
          {/* Rocket Icon Circle */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Rocket className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Hora de Decolar
          </h2>

          {/* Description */}
          <p className="text-white/80 text-sm leading-relaxed text-center mb-8 max-w-xs">
            Seu trial de 15 dias foi incrível. Agora é hora de desbloquear todo o potencial.
          </p>

          {/* Glassmorphism Features Box */}
          <div
            className="w-full rounded-2xl p-5 mb-8"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <ul className="space-y-3.5">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                <span className="text-white font-medium text-sm">Cardápio público ilimitado</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                <span className="text-white font-medium text-sm">Pedidos sem restrições</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                <span className="text-white font-medium text-sm">Suporte prioritário</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate("/planos")}
            className="w-full py-4 px-6 bg-white hover:bg-gray-50 text-red-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg text-base active:scale-[0.98]"
          >
            Ver Planos Premium
          </button>
        </div>
      </div>
    </div>
  );
}
