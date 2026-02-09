import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, CheckCircle2, AlertCircle, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ImportMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onImportComplete: () => void;
}

type ImportStatus = "idle" | "running" | "done" | "error";

interface ProgressState {
  progress: number;
  message: string;
  status: ImportStatus;
  result?: {
    categoriesCreated: number;
    productsCreated: number;
    complementsCreated: number;
  };
  error?: string;
}

export function ImportMenuModal({ open, onOpenChange, establishmentId, onImportComplete }: ImportMenuModalProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ProgressState["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isImportingRef = useRef(false);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUrl("");
      setStatus("idle");
      setProgress(0);
      setMessage("");
      setResult(null);
      setError(null);
      isImportingRef.current = false;
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [open]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/menu-import/progress/${establishmentId}`);
    eventSourceRef.current = sse;

    sse.addEventListener("progress", (event) => {
      try {
        const data: ProgressState = JSON.parse(event.data);
        setProgress(data.progress);
        setMessage(data.message);
        setStatus(data.status);

        if (data.status === "done") {
          setResult(data.result || null);
          sse.close();
          eventSourceRef.current = null;
          isImportingRef.current = false;
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            onImportComplete();
            onOpenChange(false);
          }, 3000);
        }

        if (data.status === "error") {
          setError(data.error || "Erro desconhecido");
          sse.close();
          eventSourceRef.current = null;
          isImportingRef.current = false;
        }
      } catch (e) {
        console.error("[Import SSE] Parse error:", e);
      }
    });

    sse.onerror = () => {
      // SSE connection error - might be normal if import finished
      if (isImportingRef.current) {
        console.log("[Import SSE] Connection error, will retry...");
      }
    };
  }, [establishmentId, onImportComplete, onOpenChange]);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Cole o link do cardápio que deseja importar.");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      toast.error("O link fornecido não é válido. Verifique e tente novamente.");
      return;
    }

    setStatus("running");
    setProgress(2);
    setMessage("Iniciando importação...");
    setError(null);
    setResult(null);
    isImportingRef.current = true;

    // Connect SSE first to receive progress
    connectSSE();

    // Start import
    try {
      const response = await fetch("/api/menu-import/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao iniciar importação");
      }
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Erro ao iniciar importação");
      isImportingRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };

  const isRunning = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <Dialog open={open} onOpenChange={(v) => {
      // Block closing while importing
      if (isRunning) return;
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-[480px]" onPointerDownOutside={(e) => {
        if (isRunning) e.preventDefault();
      }} onEscapeKeyDown={(e) => {
        if (isRunning) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-blue-600" />
            Importar Cardápio
          </DialogTitle>
          <DialogDescription>
            Importe automaticamente categorias, produtos e complementos de outro cardápio online.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* URL Input - only show when idle or error */}
          {(status === "idle" || isError) && (
            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cole o link do cardápio aqui..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && url.trim()) handleImport();
                  }}
                />
              </div>

              {isError && error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!url.trim()}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Importar com IA
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Funciona com a maioria dos cardápios online (iFood, Anota AI, Goomer, etc.)
              </p>
            </div>
          )}

          {/* Progress - show when running */}
          {isRunning && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">{progress}%</span>
                  </div>
                  <Loader2 className="absolute -top-1 -left-1 h-[72px] w-[72px] text-blue-600 animate-spin" />
                </div>
              </div>

              <Progress value={progress} className="h-2 rounded-full" />

              <p className="text-sm text-center text-muted-foreground font-medium">
                {message}
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 text-center font-medium">
                  Estamos importando seu cardápio. Isso pode levar alguns instantes.
                  <br />
                  <span className="font-semibold">Não feche esta janela.</span>
                </p>
              </div>
            </div>
          )}

          {/* Success - show when done */}
          {isDone && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-700">
                  Cardápio importado com sucesso! 🎉
                </h3>
              </div>

              {result && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{result.categoriesCreated}</p>
                    <p className="text-xs text-blue-600/70">Categorias</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{result.productsCreated}</p>
                    <p className="text-xs text-emerald-600/70">Produtos</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{result.complementsCreated}</p>
                    <p className="text-xs text-purple-600/70">Complementos</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Fechando automaticamente...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
