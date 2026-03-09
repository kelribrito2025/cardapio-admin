import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    enhanceMutation.mutate({
      productId,
      imageUrl,
      imageIndex,
    });
  };

  const handleAccept = () => {
    if (enhancedUrl) {
      onEnhanced(enhancedUrl);
      toast.success("Imagem melhorada aplicada com sucesso!");
    }
    handleClose();
  };

  const handleReject = () => {
    // Simplesmente fechar - a imagem original permanece
    toast.info("Imagem original mantida");
    handleClose();
  };

  const handleClose = () => {
    setEnhancedUrl(null);
    setShowComparison(false);
    setIsEnhancing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Melhorar Foto com IA
          </DialogTitle>
          <DialogDescription>
            {!showComparison
              ? "A IA irá identificar o tipo de comida e criar um cenário profissional temático, melhorando iluminação, cores e nitidez."
              : "Compare a foto original com a versão melhorada pela IA. Escolha qual deseja usar."}
          </DialogDescription>
        </DialogHeader>

        {!showComparison ? (
          // Estado inicial - mostrar imagem e botão de melhorar
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted">
              <img
                src={imageUrl}
                alt="Imagem original"
                className="w-full h-full object-cover"
              />
              {isEnhancing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <Sparkles className="h-10 w-10 text-amber-400 animate-pulse" />
                    <div className="absolute -inset-2 border-2 border-amber-400/30 rounded-full animate-ping" />
                  </div>
                  <div className="text-white text-sm font-medium">Melhorando com IA...</div>
                  <div className="text-white/60 text-xs">Isso pode levar alguns segundos</div>
                  <Loader2 className="h-5 w-5 text-amber-400 animate-spin mt-1" />
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Como funciona:</strong> A IA identifica o tipo de comida (hambúrguer, pizza, sushi, etc.) e cria um cenário temático profissional. 
                Por exemplo, um hambúrguer será colocado sobre uma tábua de madeira rústica com atmosfera de churrasqueira.
                A comida em si não é alterada — apenas o cenário, iluminação e qualidade da foto são melhorados.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isEnhancing}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Melhorar Foto
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Estado de comparação - antes/depois
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
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

              {/* Melhorada */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Melhorada com IA</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-400/50 bg-muted shadow-lg shadow-amber-500/10">
                  <img
                    src={enhancedUrl!}
                    alt="Imagem melhorada"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("Imagem original mantida");
                  handleClose();
                }}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Manter Original
              </Button>
              <Button
                variant="outline"
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isEnhancing ? "Gerando..." : "Gerar Novamente"}
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Usar Melhorada
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
