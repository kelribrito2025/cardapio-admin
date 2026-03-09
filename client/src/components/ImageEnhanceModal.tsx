import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Check, ImageIcon, Search, Palette, Camera, TrendingUp, ShoppingCart, Zap } from "lucide-react";
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
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buscar créditos disponíveis + elegibilidade
  const creditsQuery = trpc.aiCredits.getBalance.useQuery(undefined, {
    enabled: open,
  });
  const credits = creditsQuery.data?.credits ?? 0;
  const eligible = creditsQuery.data?.eligible ?? false;

  // Buscar pacotes de créditos
  const packagesQuery = trpc.aiCredits.getPackages.useQuery(undefined, {
    enabled: showBuyCredits,
  });

  // Mutation para comprar créditos
  const buyMutation = trpc.aiCredits.createCheckout.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.info("Redirecionando para a página de pagamento...");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar sessão de pagamento.");
    },
  });

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
      // Atualizar créditos após uso
      creditsQuery.refetch();
    },
    onError: (error) => {
      if (error.message?.includes("créditos")) {
        setShowBuyCredits(true);
      }
      toast.error(error.message || "Erro ao melhorar imagem. Tente novamente.");
      setIsEnhancing(false);
    },
  });

  const handleEnhance = () => {
    if (!eligible && credits <= 0) {
      return; // Não elegível, botão já está desabilitado
    }
    if (credits <= 0) {
      setShowBuyCredits(true);
      return;
    }
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
    setShowBuyCredits(false);
    onOpenChange(false);
  };

  const handleBuyPackage = (packageId: string) => {
    buyMutation.mutate({ packageId });
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
        <DialogTitle className="sr-only">Mindi Vision</DialogTitle>

        {/* Header com créditos */}
        <div className="p-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30">
                <Sparkles className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Mindi Vision</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Transforme suas fotos em imagens profissionais</p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden">
                  {showBuyCredits
                    ? "Compre créditos para continuar melhorando suas fotos"
                    : !showComparison
                    ? "Transforme a foto do seu produto em uma imagem profissional"
                    : "Compare e escolha a melhor versão para o seu cardápio"}
                </p>
              </div>
            </div>
            {/* Badge de créditos */}
            {!creditsQuery.isLoading && (
              !eligible && credits <= 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  Não elegível
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  credits > 5
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : credits > 0
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                }`}>
                  <Zap className="h-3 w-3" />
                  {credits} {credits === 1 ? "crédito" : "créditos"}
                </div>
              )
            )}
          </div>
        </div>

        {showBuyCredits ? (
          /* Tela de compra de créditos */
          <div className="p-5 space-y-4">
            {/* Mensagem */}
            <div className="text-center py-2">
              {credits <= 0 ? (
                <>
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-red-400" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Seus créditos de melhoria de imagem acabaram</h4>
                  <p className="text-xs text-muted-foreground mt-1">Compre um pacote para continuar transformando suas fotos em imagens profissionais.</p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-foreground">Comprar mais créditos</h4>
                  <p className="text-xs text-muted-foreground mt-1">Cada crédito = 1 melhoria de foto com IA</p>
                </>
              )}
            </div>

            {/* Pacotes */}
            <div className="space-y-2.5">
              {packagesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : (
                packagesQuery.data?.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuyPackage(pkg.id)}
                    disabled={buyMutation.isPending}
                    className={`w-full relative flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      (pkg as any).popular
                        ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400"
                        : "border-border hover:border-red-200 dark:hover:border-red-800"
                    } ${buyMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {(pkg as any).popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                        MAIS POPULAR
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        (pkg as any).popular ? "bg-red-100 dark:bg-red-900/50" : "bg-muted"
                      }`}>
                        <Sparkles className={`h-4 w-4 ${(pkg as any).popular ? "text-red-500" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                        <p className="text-[11px] text-muted-foreground">{pkg.pricePerImage} por melhoria</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{pkg.priceFormatted}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-1">
              {credits > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setShowBuyCredits(false)}
                  className="flex-1 rounded-xl h-11"
                >
                  Voltar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-xl h-11"
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>
        ) : !showComparison ? (
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

            {/* Info box com shimmer */}
            {!isEnhancing && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-3.5 overflow-hidden">
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    background: 'linear-gradient(90deg, #b91c1c 0%, #ef4444 40%, #fca5a5 50%, #ef4444 60%, #b91c1c 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'shimmer-text 3s ease-in-out infinite',
                  }}
                >
<strong>Como funciona:</strong> Nossa IA Mindi Vision melhora iluminação, cores e cria um cenário profissional.
                   A comida em si não é alterada.
                </p>
                <style>{`
                  @keyframes shimmer-text {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
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
              {!eligible && credits <= 0 ? (
                <Button
                  disabled
                  className="flex-1 rounded-xl h-11 font-semibold opacity-50 cursor-not-allowed"
                  style={{ backgroundColor: '#999', color: 'white' }}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Não elegível
                  </span>
                </Button>
              ) : credits > 0 ? (
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
              ) : (
                <Button
                  onClick={() => setShowBuyCredits(true)}
                  className="flex-1 rounded-xl h-11 font-semibold"
                  style={{ backgroundColor: '#db262f', color: 'white' }}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Comprar créditos
                  </span>
                </Button>
              )}
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
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Mindi Vision</span>
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
                disabled={isEnhancing || credits <= 0}
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
