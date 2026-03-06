import { Rocket } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { WelcomeChecklist } from "./WelcomeChecklist";
import { cn } from "@/lib/utils";
import { useNewOrders } from "@/contexts/NewOrdersContext";

/**
 * OnboardingFAB - Botão flutuante global com ícone de foguete.
 * Aparece em TODAS as páginas enquanto o onboarding não estiver completo.
 * É o único ponto de abertura da sidebar de Primeiros Passos.
 * 
 * Arquitectura simplificada:
 * - sidebarOpen é o ÚNICO estado que controla a sidebar
 * - Sem debounce — mudanças são directas e síncronas
 * - Auto-abre na primeira visita do utilizador
 * - onRequestOpen é chamado pelo WelcomeChecklist ao completar um passo
 */
export function OnboardingFAB() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasAutoOpened = useRef(false);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const { isAudioUnlocked } = useNewOrders();
  const establishmentId = establishment?.id;

  const { data: checklist } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId: establishmentId || 0 },
    { enabled: !!establishmentId, staleTime: 30000 }
  );

  // Verificar se o checklist foi dismissed via localStorage
  const dismissedKey = establishmentId ? `welcome_checklist_dismissed_${establishmentId}` : '';
  const isDismissed = typeof window !== 'undefined' && dismissedKey && localStorage.getItem(dismissedKey) === 'true';

  // Override local para sound_notification
  const soundActivatedKey = establishmentId ? `welcome_checklist_sound_activated_${establishmentId}` : '';
  const soundActivated = typeof window !== 'undefined' && soundActivatedKey && localStorage.getItem(soundActivatedKey) === 'true';

  // Calcular completedCount ajustado (incluindo sound_notification override)
  const adjustedCompletedCount = checklist ? checklist.steps.filter(s => {
    if (s.id === 'sound_notification') return soundActivated || isAudioUnlocked || s.completed;
    return s.completed;
  }).length : 0;

  const adjustedAllCompleted = checklist ? adjustedCompletedCount === checklist.steps.length : false;

  // Auto-abrir na primeira visita do utilizador (novo utilizador)
  // Usa localStorage para saber se já abriu antes
  useEffect(() => {
    if (!establishmentId || !checklist || isDismissed || adjustedAllCompleted) return;
    if (hasAutoOpened.current) return;
    
    const autoOpenKey = `onboarding_auto_opened_${establishmentId}`;
    const alreadyAutoOpened = localStorage.getItem(autoOpenKey) === 'true';
    
    if (!alreadyAutoOpened) {
      // Novo utilizador — abrir automaticamente
      hasAutoOpened.current = true;
      localStorage.setItem(autoOpenKey, 'true');
      setSidebarOpen(true);
    }
  }, [establishmentId, checklist, isDismissed, adjustedAllCompleted]);

  // Fechar sidebar (chamado pelo WelcomeChecklist quando o utilizador fecha)
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Callback: WelcomeChecklist pede para abrir (ex: passo concluído)
  // Directamente seta o estado — sem debounce
  const handleRequestOpen = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  // Não mostrar se dismissed, completo, ou sem dados
  if (isDismissed || adjustedAllCompleted || !checklist || !establishmentId) {
    return null;
  }

  return (
    <>
      {/* FAB Button - só aparece quando a sidebar está fechada */}
      {!sidebarOpen && (
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
              {adjustedCompletedCount}/{checklist.totalSteps}
            </span>
          </div>

          <Rocket className="h-6 w-6 text-white relative z-10" />
        </button>
      )}

      {/* WelcomeChecklist sidebar */}
      <WelcomeChecklist
        establishmentId={establishmentId}
        establishmentName={establishment?.name}
        externalOpen={sidebarOpen}
        onExternalClose={closeSidebar}
        onRequestOpen={handleRequestOpen}
        hideMinimizedBar
      />
    </>
  );
}
