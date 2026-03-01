import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bug, Lightbulb, HelpCircle, MessageSquare, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const feedbackTypes = [
  { value: "bug", label: "Reportar Bug", icon: Bug, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" },
  { value: "suggestion", label: "Sugestão", icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
  { value: "question", label: "Dúvida", icon: HelpCircle, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
  { value: "other", label: "Outro", icon: MessageSquare, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-950/30", borderColor: "border-gray-200 dark:border-gray-800" },
] as const;

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId?: number;
}

export function FeedbackModal({ open, onOpenChange, establishmentId }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<"bug" | "suggestion" | "question" | "other">("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback enviado com sucesso!", {
        description: "Agradecemos pela sua contribuição. Vamos analisar em breve.",
      });
      setType("suggestion");
      setSubject("");
      setMessage("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar feedback", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    submitMutation.mutate({
      type,
      subject: subject.trim(),
      message: message.trim(),
      establishmentId,
      page: window.location.pathname,
    });
  };

  const selectedType = feedbackTypes.find(t => t.value === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Enviar Feedback</DialogTitle>
          <DialogDescription>
            Relate um problema, sugira melhorias ou tire dúvidas. Sua opinião é muito importante para nós.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Tipo de feedback - cards selecionáveis */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de feedback</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map((ft) => {
                const Icon = ft.icon;
                const isSelected = type === ft.value;
                return (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => setType(ft.value)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? `${ft.bgColor} ${ft.borderColor} shadow-sm`
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isSelected ? ft.color : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                      {ft.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="feedback-subject" className="text-sm font-medium">
              Assunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feedback-subject"
              placeholder={
                type === "bug" ? "Ex: Erro ao salvar produto..."
                : type === "suggestion" ? "Ex: Adicionar filtro por data..."
                : type === "question" ? "Ex: Como configurar entrega..."
                : "Descreva brevemente..."
              }
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message" className="text-sm font-medium">
              Descrição detalhada <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback-message"
              placeholder={
                type === "bug"
                  ? "Descreva o problema em detalhes: o que aconteceu, o que esperava que acontecesse, e os passos para reproduzir..."
                  : type === "suggestion"
                  ? "Descreva sua sugestão em detalhes: o que gostaria de ver melhorado e como isso ajudaria..."
                  : "Descreva sua dúvida ou mensagem em detalhes..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Info do remetente */}
          {user && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <span>Enviando como:</span>
              <span className="font-medium text-foreground">{user.name || user.email}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending || !subject.trim() || !message.trim()}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
