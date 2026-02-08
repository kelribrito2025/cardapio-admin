import { AlertTriangle, Rocket } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Modal obrigatório de upgrade quando o trial expira.
 * Não pode ser fechado (sem clique fora, sem ESC, sem botão de fechar).
 * O único botão redireciona para a página de planos.
 */
export function TrialExpiredModal() {
  const [, navigate] = useLocation();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      // Não permite fechar clicando fora
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Bloquear ESC
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-5">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Seu período de teste expirou
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Seu trial gratuito de 15 dias chegou ao fim. Escolha um plano que melhor se adapta ao seu negócio.
        </p>

        {/* Highlights */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            O que está bloqueado
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              Cardápio público (Menu online)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              Recebimento de pedidos
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              Todas as funcionalidades do painel
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/planos")}
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
        >
          <Rocket className="h-5 w-5" />
          Ver planos
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Escolha um plano para desbloquear todas as funcionalidades
        </p>
      </div>
    </div>
  );
}
