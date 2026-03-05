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
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const stepIcons: Record<string, React.ElementType> = {
  category: FolderPlus,
  products: ShoppingBag,
  business_hours: Clock,
  whatsapp: MessageCircle,
  test_order: ClipboardCheck,
  photos: Camera,
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

  const { data: checklist, isLoading } = trpc.dashboard.onboardingChecklist.useQuery(
    { establishmentId },
    { enabled: !!establishmentId && !dismissed, staleTime: 30000 }
  );

  // Se já completou tudo, marcar como dismissed automaticamente
  useEffect(() => {
    if (checklist?.allCompleted) {
      localStorage.setItem("welcome_checklist_dismissed", "true");
      setDismissed(true);
    }
  }, [checklist?.allCompleted]);

  if (dismissed || isLoading || !checklist || checklist.allCompleted) {
    return null;
  }

  const progress = (checklist.completedCount / checklist.totalSteps) * 100;

  const handleDismiss = () => {
    localStorage.setItem("welcome_checklist_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm overflow-hidden">
      {/* Header compacto */}
      <div className="px-5 pt-5 pb-3 md:px-6 md:pt-5 md:pb-3 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <PartyPopper className="h-5 w-5 md:h-5.5 md:w-5.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                Bem-vindo ao Mindi!
              </h2>
              <span className="text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
                <Rocket className="h-3 w-3 text-primary" />
                {checklist.completedCount}/{checklist.totalSteps}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Seu restaurante <span className="font-medium text-foreground">{establishmentName || "foi criado"}</span> com sucesso.
              <span className="hidden md:inline"> Vamos configurar o basico para voce comecar a receber pedidos.</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5 md:hidden">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              Primeiros passos
            </span>
            <span className="text-xs font-semibold text-foreground">
              {checklist.completedCount}/{checklist.totalSteps}
            </span>
          </div>
          <div className="h-1.5 md:h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items - grid 2 colunas no desktop, 1 coluna no mobile */}
      <div className="px-5 pb-4 md:px-6 md:pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          {checklist.steps.map((step) => {
            const StepIcon = stepIcons[step.id] || Circle;
            return (
              <button
                key={step.id}
                onClick={() => navigate(step.href)}
                className={cn(
                  "group flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-2.5 rounded-xl text-left transition-all duration-200",
                  step.completed
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                    : "bg-muted/30 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                )}
              >
                {/* Check icon */}
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-4.5 w-4.5 md:h-5 md:w-5 text-emerald-500" />
                  ) : (
                    <div className="h-4.5 w-4.5 md:h-5 md:w-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors" />
                  )}
                </div>

                {/* Step icon */}
                <div className={cn(
                  "flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors",
                  step.completed
                    ? "bg-emerald-100/80 dark:bg-emerald-900/30"
                    : "bg-muted/60 group-hover:bg-primary/10"
                )}>
                  <StepIcon className={cn(
                    "h-3.5 w-3.5 md:h-4 md:w-4",
                    step.completed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground group-hover:text-primary"
                  )} />
                </div>

                {/* Label */}
                <span className={cn(
                  "flex-1 text-sm font-medium transition-colors",
                  step.completed
                    ? "text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-400/50"
                    : "text-foreground"
                )}>
                  {step.label}
                </span>

                {/* Arrow for incomplete */}
                {!step.completed && (
                  <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                )}
              </button>
            );
          })}
        </div>

        {/* Motivational footer */}
        {checklist.completedCount > 0 && checklist.completedCount < checklist.totalSteps && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {checklist.completedCount === checklist.totalSteps - 1
                ? "Quase la! Falta apenas 1 passo."
                : `Voce ja completou ${checklist.completedCount} de ${checklist.totalSteps} passos. Continue assim!`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
