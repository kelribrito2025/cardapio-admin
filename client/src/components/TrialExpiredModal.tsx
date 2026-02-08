import { Rocket, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Modal obrigatório de upgrade quando o trial expira.
 * Não pode ser fechado (sem clique fora, sem ESC, sem botão de fechar).
 * O único botão redireciona para a página de planos.
 * Design: fundo branco com degradê vermelho sutil no canto superior.
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
        className="relative max-w-md w-full mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 bg-white border border-red-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle red gradient in top-right corner */}
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 40%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center px-8 pt-10 pb-8">
          {/* Rocket Icon Circle */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50">
            <Rocket className="h-10 w-10 text-red-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Hora de Decolar
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed text-center mb-8 max-w-xs">
            Seu trial de 15 dias foi incrível. Agora é hora de desbloquear todo o potencial.
          </p>

          {/* Divider with label */}
          <div className="w-full flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">O que está incluso:</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Features list */}
          <ul className="w-full space-y-4 mb-8 px-2">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm">Cardápio público ilimitado</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm">Pedidos sem restrições</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm">Suporte prioritário</span>
            </li>
          </ul>

          {/* CTA Button */}
          <button
            onClick={() => navigate("/planos")}
            className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 text-base active:scale-[0.98]"
          >
            Ver Planos Premium
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Para mais detalhes <span className="underline cursor-pointer" onClick={() => navigate("/planos")}>Clique aqui</span>
          </p>
        </div>
      </div>
    </div>
  );
}
