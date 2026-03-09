import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Check, ImageIcon, Search, Palette, Camera, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const ENHANCE_STEPS = [
  { icon: Search, label: "Identificando tipo de comida...", duration: 2000 },
  { icon: Palette, label: "Ajustando iluminação e cores...", duration: 2500 },
  { icon: Camera, label: "Criando cenário profissional...", duration: 3000 },
];

interface ImageEnhanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  imageUrl: string;
  imageIndex: number;
  onEnhanced: (enhancedUrl: string) => void;
}

export default function ImageEnhanceModal({
  open,
  onOpenChange,
  productId,
  imageUrl,
  imageIndex,
  onEnhanced,
}: ImageEnhanceModalProps) {
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Etapas visuais progressivas
  useEffect(() => {
    if (isEnhancing) {
      setCurrentStep(0);
      let step = 0;
      const advanceStep = () => {
        step++;
        if (step < ENHANCE_STEPS.length) {
          setCurrentStep(step);
          stepTimerRef.current = setTimeout(advanceStep, ENHANCE_STEPS[step].duration);
        }
      };
      stepTimerRef.current = setTimeout(advanceStep, ENHANCE_STEPS[0].duration);
    } else {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }
    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, [isEnhancing]);

  const enhanceMutation = trpc.product.enhanceImage.useMutation({
    onSuccess: (data) => {
      setEnhancedUrl(data.enhancedUrl);
      setShowComparison(true);
      setIsEnhancing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao melhorar imagem. Tente novamente.");
      setIsEnhancing(false);
    },
  });

  const handleEnhance = () => {
    setIsEnhancing(true);
    setShowComparison(false);
    setEnhancedUrl(null);
    enhanceMutation.mutate({
      productId,
      imageUrl,
      imageIndex,
    });
  };

  const handleAccept = () => {
    if (enhancedUrl) {
      onEnhanced(enhancedUrl);
      toast.success("Foto profissional aplicada com sucesso!");
    }
    handleClose();
  };

  const handleClose = () => {
    setEnhancedUrl(null);
    setShowComparison(false);
    setIsEnhancing(false);
    setCurrentStep(0);
    onOpenChange(false);
  };

  const StepIcon = ENHANCE_STEPS[currentStep]?.icon || Search;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto !p-0 !gap-0 border-t-4 border-t-red-500"
        style={{ borderRadius: '16px' }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Melhorar Foto com IA</DialogTitle>

        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30">
              <Sparkles className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Foto Profissional com IA</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!showComparison
                  ? "Transforme a foto do seu produto em uma imagem profissional"
                  : "Compare e escolha a melhor versão para o seu cardápio"}
              </p>
            </div>
          </div>
        </div>

        {!showComparison ? (
          /* Estado inicial ou processando */
          <div className="p-5 space-y-4">
            {/* Imagem com overlay de processamento */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted">
              <img
                src={imageUrl}
                alt="Imagem original"
                className="w-full h-full object-cover"
              />
              {isEnhancing && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 flex flex-col items-center justify-center">
                  {/* Etapas visuais */}
                  <div className="space-y-4 w-full max-w-xs px-4">
                    {ENHANCE_STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isActive = idx === currentStep;
                      const isDone = idx < currentStep;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 transition-all duration-500 ${
                            isActive ? "opacity-100 scale-100" : isDone ? "opacity-50 scale-95" : "opacity-30 scale-95"
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors duration-300 ${
                            isActive ? "bg-red-500/90" : isDone ? "bg-green-500/70" : "bg-white/10"
                          }`}>
                            {isDone ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Icon className={`h-4 w-4 text-white ${isActive ? "animate-pulse" : ""}`} />
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            isActive ? "text-white" : "text-white/60"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full max-w-xs px-4 mt-6">
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${((currentStep + 1) / ENHANCE_STEPS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info box */}
            {!isEnhancing && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-3.5">
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  <strong>Como funciona:</strong> A IA identifica o tipo de comida e cria um cenário temático profissional.
                  Por exemplo, um hambúrguer será colocado sobre uma tábua de madeira rústica com atmosfera de churrasqueira.
                  A comida em si não é alterada — apenas o cenário, iluminação e qualidade são melhorados.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isEnhancing}
                className="flex-1 rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex-1 rounded-xl h-11 font-semibold"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                {isEnhancing ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Melhorar Foto
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Estado de comparação */
          <div className="p-5 space-y-4">
            {/* Grid antes/depois */}
            <div className="grid grid-cols-2 gap-3">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted">
                  <img
                    src={imageUrl}
                    alt="Imagem original"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Foto Profissional</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-red-300 dark:border-red-700 bg-muted shadow-lg shadow-red-500/10">
                  <img
                    src={enhancedUrl!}
                    alt="Imagem profissional"
                    className="w-full h-full object-cover"
                  />
                  {/* Badge */}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    IA
                  </div>
                </div>
              </div>
            </div>

            {/* Dica SaaS */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 flex-shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                  Produtos com foto profissional vendem até 3x mais.
                </p>
                <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">
                  Sua foto foi otimizada automaticamente para o cardápio.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("Imagem original mantida");
                  handleClose();
                }}
                className="flex-1 rounded-xl h-11 text-sm"
              >
                <ImageIcon className="h-4 w-4 mr-1.5" />
                Usar original
              </Button>
              <Button
                variant="outline"
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex-1 rounded-xl h-11 text-sm"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                {isEnhancing ? "Gerando..." : "Tentar outra versão"}
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 rounded-xl h-11 text-sm font-semibold"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                <Check className="h-4 w-4 mr-1.5" />
                Usar foto profissional
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
