import { Rocket } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { WelcomeChecklist } from "./WelcomeChecklist";
import { cn } from "@/lib/utils";

/**
 * OnboardingFAB - Botão flutuante global com ícone de foguete.
 * Aparece em TODAS as páginas enquanto o onboarding não estiver completo.
 * É o único ponto de abertura da sidebar de Primeiros Passos.
 * 
 * NÃO tem query própria — recebe o estado do WelcomeChecklist via callbacks.
 * Isto garante que o FAB nunca desmonta o WelcomeChecklist antes da celebração.
 */
export function OnboardingFAB() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const hasAutoOpened = useRef(false);

  // Estado recebido do WelcomeChecklist via onStateChange
  const [checklistState, setChecklistState] = useState<{
    completedCount: number;
    totalSteps: number;
    allCompleted: boolean;
    isDismissed: boolean;
  } | null>(null);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;

  // Auto-abrir na primeira visita do utilizador (novo utilizador)
  useEffect(() => {
    if (!establishmentId || !checklistState || checklistState.isDismissed || checklistState.allCompleted) return;
    if (hasAutoOpened.current) return;
    
    const autoOpenKey = `onboarding_auto_opened_${establishmentId}`;
    const alreadyAutoOpened = localStorage.getItem(autoOpenKey) === 'true';
    
    if (!alreadyAutoOpened) {
      hasAutoOpened.current = true;
      localStorage.setItem(autoOpenKey, 'true');
      setSidebarOpen(true);
    }
  }, [establishmentId, checklistState]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleRequestOpen = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCelebrationChange = useCallback((celebrating: boolean) => {
    setIsCelebrating(celebrating);
    if (celebrating) {
      // Garantir que a sidebar está aberta durante a celebração
      setSidebarOpen(true);
    }
    if (!celebrating) {
      setSidebarOpen(false);
    }
  }, []);

  const handleStateChange = useCallback((state: {
    completedCount: number;
    totalSteps: number;
    allCompleted: boolean;
    isDismissed: boolean;
  }) => {
    setChecklistState(state);
  }, []);

  // Não mostrar se sem establishment
  if (!establishmentId) {
    return null;
  }

  // Verificar se deve esconder (dismissed ou allCompleted sem celebração)
  const shouldHideFAB = checklistState?.isDismissed || (checklistState?.allCompleted && !isCelebrating);

  return (
    <>
      {/* FAB Button - só aparece quando a sidebar está fechada, não está a celebrar, e o checklist não está completo/dismissed */}
      {!sidebarOpen && !isCelebrating && !shouldHideFAB && checklistState && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 group",
            "w-14 h-14 rounded-full",
            "bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600",
            "shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40",
            "flex items-center justify-center",
            "transition-all duration-300 hover:scale-110",
            "print:hidden"
          )}
          title="Primeiros Passos"
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400/30" style={{ animationDuration: '2s' }} />
          
          {/* Badge de progresso */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-600">
              {checklistState.completedCount}/{checklistState.totalSteps}
            </span>
          </div>

          <Rocket className="h-6 w-6 text-white relative z-10" />
        </button>
      )}

      {/* WelcomeChecklist sidebar - SEMPRE montado enquanto houver establishmentId */}
      <WelcomeChecklist
        establishmentId={establishmentId}
        establishmentName={establishment?.name}
        externalOpen={sidebarOpen}
        onExternalClose={closeSidebar}
        onRequestOpen={handleRequestOpen}
        onCelebrationChange={handleCelebrationChange}
        onStateChange={handleStateChange}
        hideMinimizedBar
      />
    </>
  );
}
