import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Clock,
  AlertTriangle,
  Timer,
  RotateCcw,
  Zap,
  CreditCard,
  Loader2,
  Store,
  Eye,
} from "lucide-react";

type TrialFilter = "all" | "active" | "expiring_3days" | "expiring_1day" | "expired";

const filterLabels: Record<TrialFilter, string> = {
  all: "Todos",
  active: "Ativos",
  expiring_3days: "Vencendo em 3 dias",
  expiring_1day: "Vencendo em 1 dia",
  expired: "Expirados",
};

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expiring_soon: "bg-amber-100 text-amber-700",
    expired: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    expiring_soon: "Expirando",
    expired: "Expirado",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-muted text-foreground"}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AdminTrials() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlFilter = new URLSearchParams(searchParams).get("filter") || "all";

  const [filter, setFilter] = useState<TrialFilter>(urlFilter as TrialFilter);
  const [actionDialog, setActionDialog] = useState<{
    id: number;
    name: string;
    action: "extend" | "reset" | "forceExpire" | "convert";
  } | null>(null);
  const [extraDays, setExtraDays] = useState("7");
  const [convertPlan, setConvertPlan] = useState("basic");

  const { data: trials, isLoading, refetch } = trpc.admin.trials.list.useQuery({ filter });

  const extendMutation = trpc.admin.trials.extend.useMutation({
    onSuccess: () => { toast.success("Trial estendido!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.admin.trials.resetTrial.useMutation({
    onSuccess: () => { toast.success("Trial resetado!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.trials.forceExpire.useMutation({
    onSuccess: () => { toast.success("Trial expirado!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  const convertMutation = trpc.admin.trials.convertToPaid.useMutation({
    onSuccess: () => { toast.success("Convertido para plano pago!"); refetch(); setActionDialog(null); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trials</h1>
            <p className="text-sm text-muted-foreground">Gerenciar períodos de avaliação</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(filterLabels) as [TrialFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === key
                  ? "bg-red-500 text-white"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted/50"
              }`}
            >
              {label}
              {key === "expired" && trials && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-600 text-white">
                  {trials.filter((t: any) => t.status === "expired").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trials List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Restaurante</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tempo Restante</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!trials || trials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum trial encontrado
                        </td>
                      </tr>
                    ) : (
                      trials.map((t: any) => (
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{t.name}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-muted-foreground text-xs">{t.email || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {statusBadge(t.status)}
                          </td>
                          <td className="px-4 py-3">
                            {t.status === "expired" ? (
                              <span className="text-red-500 font-semibold">Expirado</span>
                            ) : t.daysRemaining > 1 ? (
                              <span className={`font-medium ${t.daysRemaining <= 3 ? "text-amber-500" : "text-foreground"}`}>
                                {t.daysRemaining} dias
                              </span>
                            ) : (
                              <span className="text-amber-500 font-medium">{t.hoursRemaining}h</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Ver detalhes"
                                onClick={() => navigate(`/admin/restaurantes/${t.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Estender trial"
                                onClick={() => setActionDialog({ id: t.id, name: t.name, action: "extend" })}
                              >
                                <Timer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Converter para pago"
                                onClick={() => setActionDialog({ id: t.id, name: t.name, action: "convert" })}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Resetar trial"
                                onClick={() => setActionDialog({ id: t.id, name: t.name, action: "reset" })}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              {t.status !== "expired" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500"
                                  title="Forçar expiração"
                                  onClick={() => setActionDialog({ id: t.id, name: t.name, action: "forceExpire" })}
                                >
                                  <Zap className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "extend" && "Estender Trial"}
              {actionDialog?.action === "reset" && "Resetar Trial"}
              {actionDialog?.action === "forceExpire" && "Forçar Expiração"}
              {actionDialog?.action === "convert" && "Converter para Plano Pago"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "extend" && `Adicionar dias extras ao trial de ${actionDialog?.name}`}
              {actionDialog?.action === "reset" && `Resetar o trial de ${actionDialog?.name} para 15 dias`}
              {actionDialog?.action === "forceExpire" && `Forçar a expiração do trial de ${actionDialog?.name}. O menu público será bloqueado.`}
              {actionDialog?.action === "convert" && `Converter ${actionDialog?.name} para um plano pago`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.action === "extend" && (
            <div className="space-y-2">
              <Label>Dias extras</Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
              />
            </div>
          )}

          {actionDialog?.action === "convert" && (
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={convertPlan} onValueChange={setConvertPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={extendMutation.isPending || resetMutation.isPending || forceExpireMutation.isPending || convertMutation.isPending}
              onClick={() => {
                if (!actionDialog) return;
                switch (actionDialog.action) {
                  case "extend":
                    extendMutation.mutate({ id: actionDialog.id, extraDays: parseInt(extraDays) || 7 });
                    break;
                  case "reset":
                    resetMutation.mutate({ id: actionDialog.id });
                    break;
                  case "forceExpire":
                    forceExpireMutation.mutate({ id: actionDialog.id });
                    break;
                  case "convert":
                    convertMutation.mutate({ id: actionDialog.id, planType: convertPlan as any });
                    break;
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPanelLayout>
  );
}
