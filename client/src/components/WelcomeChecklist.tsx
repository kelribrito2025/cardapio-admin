import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  Circle,
  Rocket,
  PartyPopper,
  ArrowRight,
  FolderPlus,
  ShoppingBag,
  Clock,
  MessageCircle,
  ClipboardCheck,
  Camera,
  Sparkles,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";

const stepConfig: Record<string, {
  icon: React.ElementType;
  subtitle: string;
  description: string;
  whyImportant: string[];
}> = {
  category: {
    icon: FolderPlus,
    subtitle: "Organize seus produtos",
    description: "Crie categorias para organizar seu cardapio. Exemplo: Entradas, Pratos Principais, Bebidas, Sobremesas.",
    whyImportant: [
      "Facilita a navegacao dos clientes pelo cardapio",
      "Organiza seus produtos de forma profissional",
      "Melhora a experiencia de compra",
    ],
  },
  products: {
    icon: ShoppingBag,
    subtitle: "Monte seu cardapio",
    description: "Adicione os produtos que seu restaurante oferece, com fotos, precos e descricoes.",
    whyImportant: [
      "Seus clientes poderao ver e pedir seus produtos",
      "Fotos atraentes aumentam as vendas",
      "Descricoes claras reduzem duvidas",
    ],
  },
  business_hours: {
    icon: Clock,
    subtitle: "Defina horarios",
    description: "Configure os dias e horarios de funcionamento do seu restaurante para receber pedidos.",
    whyImportant: [
      "Clientes sabem quando podem fazer pedidos",
      "Evita pedidos fora do horario de atendimento",
      "Automatiza a abertura e fechamento do cardapio",
    ],
  },
  whatsapp: {
    icon: MessageCircle,
    subtitle: "Receba pedidos",
    description: "Conecte seu WhatsApp para receber notificacoes de novos pedidos e se comunicar com clientes.",
    whyImportant: [
      "Permite que seus clientes facam pedidos diretamente",
      "Automatiza o processo de atendimento",
      "Reduz erros em pedidos",
    ],
  },
  test_order: {
    icon: ClipboardCheck,
    subtitle: "Simule um pedido",
    description: "Faca um pedido de teste para verificar se tudo esta funcionando corretamente antes de abrir para clientes.",
    whyImportant: [
      "Garante que o fluxo de pedidos funciona",
      "Identifica problemas antes dos clientes",
      "Voce ve exatamente o que o cliente vera",
    ],
  },
  photos: {
    icon: Camera,
    subtitle: "Personalize visual",
    description: "Adicione o logo e a foto de capa do seu restaurante para criar uma identidade visual profissional.",
    whyImportant: [
      "Transmite profissionalismo e confianca",
      "Clientes reconhecem sua marca facilmente",
      "Destaca seu restaurante da concorrencia",
    ],
  },
};

interface WelcomeChecklistProps {
  establishmentId: number;
  establishmentName?: string;
}

export function WelcomeChecklist({ establishmentId, establishmentName }: WelcomeChecklistProps) {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("welcome_checklist_dismissed") === "true";
    }
    return false;
  });
  // Modal aberto/fechado (desktop) - começa aberto
  const [modalOpen, setModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("welcome_checklist_minimized") !== "true";
    }
    return true;
  });
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef<number | null>(null);

  const { data: checklist, isLoading } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && !dismissed, staleTime: 30000 }
  );

  // Auto-selecionar o primeiro passo incompleto
  useEffect(() => {
    if (checklist && !selectedStepId) {
      const firstIncomplete = checklist.steps.find(s => !s.completed);
      if (firstIncomplete) {
        setSelectedStepId(firstIncomplete.id);
      } else if (checklist.steps.length > 0) {
        setSelectedStepId(checklist.steps[0].id);
      }
    }
  }, [checklist, selectedStepId]);

  // Se completou tudo, mostrar confetti e celebração antes de dismiss
  useEffect(() => {
    if (!checklist) return;
    // Detectar transição para allCompleted
    if (checklist.allCompleted && prevCompletedRef.current !== null && prevCompletedRef.current < checklist.totalSteps) {
      setShowConfetti(true);
      setShowCelebration(true);
      setModalOpen(true);
      // Dismiss após a celebração
      const timer = setTimeout(() => {
        localStorage.setItem("welcome_checklist_dismissed", "true");
        setDismissed(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else if (checklist.allCompleted && prevCompletedRef.current === null) {
      // Já estava completo ao carregar — dismiss direto
      localStorage.setItem("welcome_checklist_dismissed", "true");
      setDismissed(true);
    }
    prevCompletedRef.current = checklist.completedCount;
  }, [checklist?.allCompleted, checklist?.completedCount]);

  const selectedStep = useMemo(() => {
    if (!checklist || !selectedStepId) return null;
    return checklist.steps.find(s => s.id === selectedStepId) || null;
  }, [checklist, selectedStepId]);

  const selectedConfig = selectedStepId ? stepConfig[selectedStepId] : null;

  if (dismissed || isLoading || !checklist) {
    return null;
  }

  // Se está celebrando, mostrar tela de celebração em vez de null
  if (checklist.allCompleted && !showCelebration) {
    return null;
  }

  const progress = (checklist.completedCount / checklist.totalSteps) * 100;

  const handleDismiss = () => {
    localStorage.setItem("welcome_checklist_dismissed", "true");
    setDismissed(true);
  };

  const handleMinimize = () => {
    setModalOpen(false);
    localStorage.setItem("welcome_checklist_minimized", "true");
  };

  const handleReopen = () => {
    setModalOpen(true);
    localStorage.removeItem("welcome_checklist_minimized");
  };

  const handleStartStep = () => {
    if (selectedStep) {
      navigate(selectedStep.href);
    }
  };

  const handleSkipStep = () => {
    if (!checklist) return;
    const currentIdx = checklist.steps.findIndex(s => s.id === selectedStepId);
    // Encontrar o próximo passo incompleto
    for (let i = 1; i < checklist.steps.length; i++) {
      const nextIdx = (currentIdx + i) % checklist.steps.length;
      if (!checklist.steps[nextIdx].completed) {
        setSelectedStepId(checklist.steps[nextIdx].id);
        return;
      }
    }
  };

  const stepNumber = checklist.steps.findIndex(s => s.id === selectedStepId) + 1;

  // ==================== MOBILE: Card compacto (mantém o layout atual) ====================
  const MobileView = () => (
    <div className="md:hidden mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PartyPopper className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Bem-vindo ao Mindi!</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seu restaurante <span className="font-medium text-foreground">{establishmentName || "foi criado"}</span> com sucesso.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              Primeiros passos
            </span>
            <span className="text-xs font-semibold text-foreground">
              {checklist.completedCount}/{checklist.totalSteps}
            </span>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="grid grid-cols-1 gap-1.5">
          {checklist.steps.map((step) => {
            const cfg = stepConfig[step.id];
            const StepIcon = cfg?.icon || Circle;
            return (
              <button
                key={step.id}
                onClick={() => navigate(step.href)}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                  step.completed
                    ? "bg-primary/5 dark:bg-primary/10"
                    : "bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                )}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors" />
                  )}
                </div>
                <div className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  step.completed ? "bg-primary/10 dark:bg-primary/20" : "bg-muted/60 group-hover:bg-primary/10"
                )}>
                  <StepIcon className={cn("h-3.5 w-3.5", step.completed ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                </div>
                <span className={cn("flex-1 text-sm font-medium", step.completed ? "text-primary line-through decoration-primary/50" : "text-foreground")}>
                  {step.label}
                </span>
                {!step.completed && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ==================== DESKTOP: Barra minimizada ====================
  const MinimizedBar = () => (
    <div className="hidden md:block mb-6">
      <button
        onClick={handleReopen}
        className="w-full flex items-center gap-4 px-5 py-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 shadow-sm transition-all duration-200 group"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Rocket className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Configuracao Inicial</span>
            <span className="text-xs font-medium text-muted-foreground">{checklist.completedCount}/{checklist.totalSteps} concluidos</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-muted/60 rounded-full overflow-hidden max-w-md">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
          Completar tarefas
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );

  // ==================== DESKTOP: Modal wizard ====================
  const DesktopModal = () => (
    <div className="hidden md:block fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleMinimize} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full max-w-[860px] max-h-[540px] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden flex">
          
          {/* Sidebar esquerda - vermelho Mindi */}
          <div className="w-[300px] flex-shrink-0 bg-gradient-to-b from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 text-white p-6 flex flex-col">
            {/* Logo + Título */}
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <h2 className="text-lg font-bold text-white">Configuracao Inicial</h2>
              <p className="text-sm text-white/70 mt-1">Configure seu restaurante passo a passo</p>
            </div>

            {/* Steps timeline */}
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                {/* Linha vertical conectora */}
                <div className="absolute left-[18px] top-[36px] bottom-[18px] w-[2px] bg-white/20" />

                <div className="space-y-1">
                  {checklist.steps.map((step, idx) => {
                    const cfg = stepConfig[step.id];
                    const StepIcon = cfg?.icon || Circle;
                    const isSelected = selectedStepId === step.id;
                    const isCompleted = step.completed;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStepId(step.id)}
                        className={cn(
                          "relative w-full flex items-center gap-3 py-2.5 px-2 rounded-lg text-left transition-all duration-200",
                          isSelected && !isCompleted && "bg-white/15",
                          !isSelected && "hover:bg-white/10"
                        )}
                      >
                        {/* Circle indicator */}
                        <div className={cn(
                          "relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                          isCompleted
                            ? "bg-white"
                            : isSelected
                              ? "bg-white ring-2 ring-white/30"
                              : "bg-white/20 border border-white/30"
                        )}>
                          {isCompleted ? (
                            <Check className="h-4 w-4 text-red-600" />
                          ) : (
                            <StepIcon className={cn("h-4 w-4", isSelected ? "text-red-600" : "text-white/60")} />
                          )}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "block text-sm font-medium truncate",
                            isCompleted
                              ? "text-white/70 line-through decoration-white/40"
                              : isSelected
                                ? "text-white font-semibold"
                                : "text-white/80"
                          )}>
                            {step.label}
                          </span>
                          <span className={cn(
                            "block text-xs truncate mt-0.5",
                            isCompleted ? "text-white/40" : isSelected ? "text-white/60" : "text-white/40"
                          )}>
                            {cfg?.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Progress footer */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Progresso</span>
                <span className="font-semibold text-white">{checklist.completedCount}/{checklist.totalSteps}</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Conteúdo direito */}
          <div className="flex-1 p-8 flex flex-col overflow-y-auto">
            {/* Close button */}
            <button
              onClick={handleMinimize}
              className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Minimizar"
            >
              <X className="h-4 w-4" />
            </button>

            {selectedStep && selectedConfig ? (
              <>
                {/* Step indicator */}
                <div className="mb-6">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full",
                    selectedStep.completed
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                      : "bg-primary/10 text-primary"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      selectedStep.completed ? "bg-primary" : "bg-primary"
                    )} />
                    {selectedStep.completed ? "Concluido" : `Passo ${stepNumber} de ${checklist.totalSteps}`}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {selectedStep.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {selectedConfig.description}
                </p>

                {/* Why important box */}
                <div className="mt-6 p-5 rounded-xl border border-border/60 bg-muted/20">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Por que isso e importante?</h4>
                  <div className="space-y-2.5">
                    {selectedConfig.whyImportant.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-auto pt-6 flex items-center gap-3">
                  {!selectedStep.completed ? (
                    <>
                      <button
                        onClick={handleStartStep}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
                      >
                        Comecar este passo
                      </button>
                      <button
                        onClick={handleSkipStep}
                        className="h-11 px-6 border border-border/60 text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted/40 hover:text-foreground transition-colors"
                      >
                        Pular por agora
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Este passo ja foi concluido!</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione um passo para ver os detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== CELEBRAÇÃO: Tela de conclusão ====================
  const CelebrationModal = () => (
    <div className="hidden md:block fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full max-w-[520px] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden text-center p-10">
          <button
            onClick={() => {
              setShowCelebration(false);
              setShowConfetti(false);
              localStorage.setItem("welcome_checklist_dismissed", "true");
              setDismissed(true);
            }}
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Parabens! Tudo configurado!</h2>
          <p className="text-muted-foreground mb-6">
            Seu restaurante <span className="font-semibold text-foreground">{establishmentName}</span> esta pronto para receber pedidos.
            Todas as configuracoes iniciais foram concluidas com sucesso.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>{checklist.totalSteps}/{checklist.totalSteps} passos concluidos</span>
            </div>

            <button
              onClick={() => {
                setShowCelebration(false);
                setShowConfetti(false);
                localStorage.setItem("welcome_checklist_dismissed", "true");
                setDismissed(true);
              }}
              className="mt-4 h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Ir para o Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const CelebrationMobile = () => (
    <div className="md:hidden mb-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-center p-8">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <PartyPopper className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Parabens! Tudo configurado!</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Seu restaurante esta pronto para receber pedidos.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium mb-4">
        <CheckCircle2 className="h-4 w-4" />
        <span>{checklist.totalSteps}/{checklist.totalSteps} passos concluidos</span>
      </div>
      <button
        onClick={() => {
          setShowCelebration(false);
          setShowConfetti(false);
          localStorage.setItem("welcome_checklist_dismissed", "true");
          setDismissed(true);
        }}
        className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Ir para o Dashboard
      </button>
    </div>
  );

  // Se está em modo celebração
  if (showCelebration) {
    return (
      <>
        <Confetti
          active={showConfetti}
          duration={5000}
          particleCount={200}
          onComplete={() => setShowConfetti(false)}
        />
        <CelebrationMobile />
        <CelebrationModal />
      </>
    );
  }

  return (
    <>
      {/* Mobile: sempre card */}
      <MobileView />

      {/* Desktop: modal ou barra minimizada */}
      {modalOpen ? <DesktopModal /> : <MinimizedBar />}
    </>
  );
}
