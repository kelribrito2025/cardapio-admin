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
  Lock,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Confetti } from "./Confetti";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

const stepConfig: Record<string, {
  icon: React.ElementType;
  subtitle: string;
  description: string;
  whyImportant: string[];
}> = {
  category: {
    icon: FolderPlus,
    subtitle: "Organize seus produtos",
    description: "Crie categorias para organizar seu cardápio. Exemplo: Entradas, Pratos Principais, Bebidas, Sobremesas.",
    whyImportant: [
      "Facilita a navegação dos clientes pelo cardápio",
      "Organiza seus produtos de forma profissional",
      "Melhora a experiência de compra",
    ],
  },
  products: {
    icon: ShoppingBag,
    subtitle: "Monte seu cardápio",
    description: "Adicione os produtos que seu restaurante oferece, com fotos, preços e descrições.",
    whyImportant: [
      "Seus clientes poderão ver e pedir seus produtos",
      "Fotos atraentes aumentam as vendas",
      "Descrições claras reduzem dúvidas",
    ],
  },
  business_hours: {
    icon: Clock,
    subtitle: "Defina horários",
    description: "Configure os dias e horários de funcionamento do seu restaurante para receber pedidos.",
    whyImportant: [
      "Clientes sabem quando podem fazer pedidos",
      "Evita pedidos fora do horário de atendimento",
      "Automatiza a abertura e fechamento do cardápio",
    ],
  },
  whatsapp: {
    icon: MessageCircle,
    subtitle: "Receba pedidos",
    description: "Conecte seu WhatsApp para receber notificações de novos pedidos e se comunicar com clientes.",
    whyImportant: [
      "Permite que seus clientes façam pedidos diretamente",
      "Automatiza o processo de atendimento",
      "Reduz erros em pedidos",
    ],
  },
  test_order: {
    icon: ClipboardCheck,
    subtitle: "Simule um pedido",
    description: "Faça um pedido de teste para verificar se tudo está funcionando corretamente antes de abrir para clientes.",
    whyImportant: [
      "Garante que o fluxo de pedidos funciona",
      "Identifica problemas antes dos clientes",
      "Você vê exatamente o que o cliente verá",
    ],
  },
  photos: {
    icon: Camera,
    subtitle: "Personalize visual",
    description: "Adicione o logo e a foto de capa do seu restaurante para criar uma identidade visual profissional.",
    whyImportant: [
      "Transmite profissionalismo e confiança",
      "Clientes reconhecem sua marca facilmente",
      "Destaca seu restaurante da concorrência",
    ],
  },
};

interface WelcomeChecklistProps {
  establishmentId: number;
  establishmentName?: string;
}

export function WelcomeChecklist({ establishmentId, establishmentName }: WelcomeChecklistProps) {
  const [, navigate] = useLocation();
  const dismissedKey = `welcome_checklist_dismissed_${establishmentId}`;
  const minimizedKey = `welcome_checklist_minimized_${establishmentId}`;

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(dismissedKey) === "true";
    }
    return false;
  });

  const [sheetOpen, setSheetOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(minimizedKey) !== "true";
    }
    return true;
  });

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef<number | null>(null);
  const [justUnlockedStepId, setJustUnlockedStepId] = useState<string | null>(null);

  const { data: checklist, isLoading } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && !dismissed, staleTime: 5000, refetchInterval: 5000 }
  );

  // Auto-expandir o primeiro passo incompleto
  useEffect(() => {
    if (checklist && !expandedStepId) {
      const firstIncomplete = checklist.steps.find(s => !s.completed);
      if (firstIncomplete) {
        setExpandedStepId(firstIncomplete.id);
      }
    }
  }, [checklist, expandedStepId]);

  // Detectar quando um passo é concluído — abrir sidebar automaticamente e animar desbloqueio
  useEffect(() => {
    if (!checklist) return;
    if (prevCompletedRef.current !== null && checklist.completedCount > prevCompletedRef.current && !checklist.allCompleted) {
      // Abrir a sidebar automaticamente ao completar um passo
      setSheetOpen(true);
      localStorage.removeItem(minimizedKey);
      const firstIncomplete = checklist.steps.find(s => !s.completed);
      if (firstIncomplete) {
        setJustUnlockedStepId(firstIncomplete.id);
        setExpandedStepId(firstIncomplete.id);
        const timer = setTimeout(() => setJustUnlockedStepId(null), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [checklist?.completedCount]);

  // Se completou tudo, mostrar confetti e celebração antes de dismiss
  useEffect(() => {
    if (!checklist) return;
    if (checklist.allCompleted && prevCompletedRef.current !== null && prevCompletedRef.current < checklist.totalSteps) {
      setShowConfetti(true);
      setShowCelebration(true);
      setSheetOpen(true);
      const timer = setTimeout(() => {
        localStorage.setItem(dismissedKey, "true");
        setDismissed(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else if (checklist.allCompleted && prevCompletedRef.current === null) {
      localStorage.setItem(dismissedKey, "true");
      setDismissed(true);
    }
    prevCompletedRef.current = checklist.completedCount;
  }, [checklist?.allCompleted, checklist?.completedCount]);

  if (dismissed || isLoading || !checklist) {
    return null;
  }

  if (checklist.allCompleted && !showCelebration) {
    return null;
  }

  const progress = (checklist.completedCount / checklist.totalSteps) * 100;

  const handleMinimize = () => {
    setSheetOpen(false);
    localStorage.setItem(minimizedKey, "true");
  };

  const handleReopen = () => {
    setSheetOpen(true);
    localStorage.removeItem(minimizedKey);
  };

  const handleStartStep = (href: string) => {
    navigate(href);
    handleMinimize();
  };

  const toggleStep = (stepId: string) => {
    setExpandedStepId(prev => prev === stepId ? null : stepId);
  };

  // ==================== MOBILE: Card compacto ====================
  const MobileView = () => (
    <div className="md:hidden mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 relative">
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
    <div className="hidden md:block mb-4">
      <div className="relative rounded-xl overflow-hidden border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200/50 dark:border-red-800/30">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h4v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2H0v-2h20v-2H0v-2h20v-2H0v-2h20' fill='%23dc2626' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%, transparent 100%)',
              animation: 'banner-shimmer 3s ease-in-out infinite',
              animationDelay: '1s'
            }}
          />
        </div>

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Ícone pulsante */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30 dark:bg-red-500/20" />
            <div className="relative p-2 rounded-full bg-red-100 dark:bg-red-900/40">
              <Rocket className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-tight">
              Configuração Inicial — <span className="text-red-600 dark:text-red-400">{checklist.completedCount}/{checklist.totalSteps}</span> concluídos
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              Complete os passos para começar a receber pedidos!
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={handleReopen}
            className="flex-shrink-0 text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm inline-flex items-center transition-colors"
          >
            Completar tarefas
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ==================== DESKTOP: Sheet/Sidebar lateral ====================
  const DesktopSheet = () => (
    <Sheet open={sheetOpen} onOpenChange={(open) => {
      if (!open) handleMinimize();
    }}>
      <SheetContent
        side="right"
        hideCloseButton
        className="!w-[440px] !max-w-[440px] p-0 gap-0 border-l border-border/40 bg-background overflow-hidden"
      >
        {/* SR-only title for accessibility */}
        <SheetTitle className="sr-only">Configuração Inicial</SheetTitle>
        <SheetDescription className="sr-only">Passos para configurar seu restaurante</SheetDescription>

        {/* Header com degradê suave e glow */}
        <div className="relative overflow-hidden">
          {/* Fundo degradê suave */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/90 via-red-400/80 to-rose-400/70 dark:from-red-600/80 dark:via-red-500/70 dark:to-rose-500/60" />
          {/* Glow effect */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl" />

          <div className="relative px-6 pt-6 pb-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Primeiros Passos</h2>
                  <p className="text-sm text-white/70 mt-1">Configuração rápida e simples</p>
                </div>
              </div>
              <button
                onClick={handleMinimize}
                className="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress card */}
            <div className="mt-5 bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/90">Progresso Total</span>
                <span className="text-2xl font-bold text-white">
                  {checklist.completedCount}/{checklist.totalSteps}
                </span>
              </div>
              {/* Segmented progress bar */}
              <div className="flex gap-1.5">
                {checklist.steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-all duration-500",
                      step.completed
                        ? "bg-white shadow-sm shadow-white/30"
                        : "bg-white/25"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Steps list - scrollable area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {checklist.steps.map((step, index) => {
            const cfg = stepConfig[step.id];
            const StepIcon = cfg?.icon || Circle;
            const isCompleted = step.completed;
            // Determinar o índice do primeiro passo incompleto
            const firstIncompleteIndex = checklist.steps.findIndex(s => !s.completed);
            // Só o passo atual (primeiro incompleto) pode ser expandido
            const isCurrentStep = index === firstIncompleteIndex;
            const isLocked = !isCompleted && !isCurrentStep;
            const isExpanded = expandedStepId === step.id && isCurrentStep;

            const isJustUnlocked = justUnlockedStepId === step.id;

            const stepCard = (
              <div key={step.id} className={cn(
                "relative transition-all duration-500",
                isLocked && "opacity-50",
                isJustUnlocked && "animate-[step-unlock_0.6s_ease-out]"
              )}>
                {/* Glow effect for just-unlocked step */}
                {isJustUnlocked && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-red-500/20 rounded-2xl blur-md animate-pulse" />
                )}
                {/* Step card */}
                <div
                  className={cn(
                    "relative w-full rounded-xl transition-all duration-300 text-left",
                    isExpanded && !isCompleted
                      ? "bg-card shadow-lg shadow-red-500/5 ring-1 ring-red-100 dark:ring-red-900/30"
                      : isCompleted
                        ? "bg-red-50/60 dark:bg-red-950/20 border border-red-100/60 dark:border-red-900/20"
                        : isLocked
                          ? "bg-muted/20 dark:bg-muted/10 border border-border/20"
                          : isJustUnlocked
                            ? "bg-card shadow-lg ring-2 ring-red-300/60 dark:ring-red-700/40"
                            : "bg-muted/40 dark:bg-muted/20 border border-border/40 hover:border-red-200/60 dark:hover:border-red-800/30"
                  )}
                >
                  {/* Card header - always visible */}
                  <button
                    onClick={() => isCurrentStep && toggleStep(step.id)}
                    disabled={isLocked}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left rounded-xl transition-colors",
                      isCurrentStep && !isExpanded && "cursor-pointer",
                      isExpanded && !isCompleted && "pb-0",
                      (isCompleted || isLocked) && "cursor-default"
                    )}
                  >
                    {/* Icon circle */}
                    <div className={cn(
                      "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                      isCompleted
                        ? "bg-gradient-to-br from-red-500 to-rose-500 shadow-sm shadow-red-500/20"
                        : isExpanded
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-muted/60 dark:bg-muted/40"
                    )}>
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <StepIcon className={cn(
                          "h-5 w-5",
                          isExpanded ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )} />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block text-sm font-semibold truncate",
                        isCompleted
                          ? "text-red-600/70 dark:text-red-400/70 line-through decoration-red-300/50 dark:decoration-red-700/50"
                          : isExpanded
                            ? "text-foreground"
                            : isLocked
                              ? "text-muted-foreground/60"
                              : "text-foreground/80"
                      )}>
                        {step.label}
                      </span>
                      <span className={cn(
                        "block text-xs truncate mt-0.5",
                        isCompleted
                          ? "text-red-400/50 dark:text-red-500/40"
                          : isLocked
                            ? "text-muted-foreground/40"
                            : "text-muted-foreground"
                      )}>
                        {cfg?.subtitle}
                      </span>
                    </div>

                    {/* Chevron / Check / Lock indicator */}
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-red-500/60 dark:text-red-400/60 flex-shrink-0" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                    ) : (
                      <ChevronRight className={cn(
                        "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                        isExpanded
                          ? "text-red-500 rotate-90"
                          : "text-muted-foreground/50"
                      )} />
                    )}
                  </button>

                  {/* Expanded content - only for current (non-completed) step */}
                  {isExpanded && !isCompleted && (
                    <div className="px-4 pb-4 pt-3">
                      {/* Separator */}
                      <div className="border-t border-border/30 dark:border-border/20 mb-4" />

                      {/* Why important list */}
                      <div className="space-y-2.5 mb-5">
                        {cfg?.whyImportant.map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartStep(step.href);
                        }}
                        className="w-full h-11 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-sm shadow-red-500/20"
                      >
                        Começar este passo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );

            // Passos bloqueados: mostrar toast ao clicar
            if (isLocked) {
              return (
                <div
                  key={step.id}
                  className="cursor-not-allowed [&_button]:pointer-events-none"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.info("Complete o passo anterior primeiro", {
                      icon: <Lock className="h-4 w-4" />,
                      duration: 2000,
                    });
                  }}
                >
                  {stepCard}
                </div>
              );
            }

            return stepCard;
          })}
        </div>
      </SheetContent>
    </Sheet>
  );

  // ==================== CELEBRAÇÃO: Tela de conclusão (Sheet) ====================
  const CelebrationSheet = () => (
    <Sheet open={true} onOpenChange={() => {}}>
      <SheetContent
        side="right"
        hideCloseButton
        className="!w-[440px] !max-w-[440px] p-0 gap-0 border-l border-border/40 overflow-hidden"
      >
        <SheetTitle className="sr-only">Configuração Concluída</SheetTitle>
        <SheetDescription className="sr-only">Todas as etapas foram concluídas</SheetDescription>

        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center h-full">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <PartyPopper className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Parabéns! Tudo configurado!</h2>
          <p className="text-muted-foreground mb-6">
            Seu restaurante <span className="font-semibold text-foreground">{establishmentName}</span> está pronto para receber pedidos.
            Todas as configurações iniciais foram concluídas com sucesso.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium mb-6">
            <CheckCircle2 className="h-5 w-5" />
            <span>{checklist.totalSteps}/{checklist.totalSteps} passos concluídos</span>
          </div>

          <button
            onClick={() => {
              setShowCelebration(false);
              setShowConfetti(false);
              localStorage.setItem(dismissedKey, "true");
              setDismissed(true);
            }}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Ir para o Dashboard
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );

  const CelebrationMobile = () => (
    <div className="md:hidden mb-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-center p-8">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <PartyPopper className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Parabéns! Tudo configurado!</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Seu restaurante está pronto para receber pedidos.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium mb-4">
        <CheckCircle2 className="h-4 w-4" />
        <span>{checklist.totalSteps}/{checklist.totalSteps} passos concluídos</span>
      </div>
      <button
        onClick={() => {
          setShowCelebration(false);
          setShowConfetti(false);
          localStorage.setItem(dismissedKey, "true");
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
        <div className="hidden md:block">
          <CelebrationSheet />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile: sempre card */}
      <MobileView />

      {/* Desktop: sheet sidebar ou barra minimizada */}
      <div className="hidden md:block">
        {sheetOpen ? <DesktopSheet /> : <MinimizedBar />}
      </div>
    </>
  );
}
