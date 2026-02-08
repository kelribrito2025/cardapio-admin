import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import {
  Search,
  Store,
  Eye,
  Pencil,
  Lock,
  Unlock,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  GlobeLock,
  Calendar,
  Crown,
  Clock,
  AlertTriangle,
  ExternalLink,
  Timer,
  Zap,
} from "lucide-react";

type PlanFilter = "all" | "trial" | "active_trial" | "basic" | "pro" | "enterprise" | "expired" | "paid";

const planFilterLabels: Record<PlanFilter, string> = {
  all: "Todos",
  trial: "Trial (todos)",
  active_trial: "Trial ativo",
  expired: "Trial expirado",
  basic: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
  paid: "Pagos",
};

const planBadge = (planType: string, trialStatus: string) => {
  if (planType === "trial") {
    if (trialStatus === "expired") {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expirado</span>;
    }
    if (trialStatus === "expiring_soon") {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Expirando</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Trial</span>;
  }
  const colors: Record<string, string> = {
    basic: "bg-green-100 text-green-700",
    pro: "bg-purple-100 text-purple-700",
    enterprise: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[planType] || "bg-gray-100 text-gray-700"}`}>
      {planType.charAt(0).toUpperCase() + planType.slice(1)}
    </span>
  );
};

export default function AdminRestaurantes() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlFilter = new URLSearchParams(searchParams).get("filter") || "all";

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>(urlFilter as PlanFilter);
  const [page, setPage] = useState(1);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [changePlanDialog, setChangePlanDialog] = useState<{ id: number; name: string } | null>(null);
  const [newPlan, setNewPlan] = useState<string>("basic");
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; name: string; action: string } | null>(null);

  // Map "paid" filter to query filter
  const queryFilter = planFilter === "paid" ? undefined : planFilter;
  const querySearch = search.trim() || undefined;

  const { data, isLoading, refetch } = trpc.admin.restaurants.list.useQuery({
    search: querySearch,
    planFilter: planFilter === "paid" ? "basic" : queryFilter, // Will be handled below
    page,
    limit: 20,
  });

  const changePlanMutation = trpc.admin.restaurants.changePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado com sucesso!");
      refetch();
      setChangePlanDialog(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMenuMutation = trpc.admin.restaurants.toggleMenu.useMutation({
    onSuccess: () => {
      toast.success("Menu público atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetTrialMutation = trpc.admin.restaurants.resetTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial resetado com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.restaurants.forceExpire.useMutation({
    onSuccess: () => {
      toast.success("Trial expirado forçadamente!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurantes</h1>
          <p className="text-sm text-gray-500">Gerenciar todos os restaurantes da plataforma</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v as PlanFilter); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(planFilterLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Restaurante</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Plano</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Trial</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Menu</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.restaurants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum restaurante encontrado
                        </td>
                      </tr>
                    ) : (
                      data?.restaurants.map((r) => (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {r.logo ? (
                                <img src={r.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Store className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 truncate max-w-[200px]">{r.name}</p>
                                <p className="text-xs text-gray-400">{r.city}{r.state ? `, ${r.state}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-gray-600 text-xs">{r.email || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {planBadge(r.planType, r.trialStatus)}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {r.planType === "trial" ? (
                              <div className="flex items-center gap-1.5">
                                {r.trialStatus === "expired" ? (
                                  <span className="text-xs text-red-500 font-medium">Expirado</span>
                                ) : r.trialStatus === "expiring_soon" ? (
                                  <span className="text-xs text-amber-500 font-medium">{r.daysRemaining}d restantes</span>
                                ) : (
                                  <span className="text-xs text-gray-500">{r.daysRemaining}d restantes</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.isOpen ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Globe className="h-3.5 w-3.5" /> Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <GlobeLock className="h-3.5 w-3.5" /> Inativo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Ver detalhes"
                                onClick={() => navigate(`/admin/restaurantes/${r.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Alterar plano"
                                onClick={() => setChangePlanDialog({ id: r.id, name: r.name })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title={r.isOpen ? "Bloquear menu" : "Desbloquear menu"}
                                onClick={() => toggleMenuMutation.mutate({ id: r.id, isOpen: !r.isOpen })}
                              >
                                {r.isOpen ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </Button>
                              {r.planType === "trial" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Resetar trial"
                                  onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "resetTrial" })}
                                >
                                  <RotateCcw className="h-4 w-4" />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {data?.total ?? 0} restaurantes encontrados
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-gray-600">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanDialog} onOpenChange={() => setChangePlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterar o plano de <strong>{changePlanDialog?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial (resetar)</SelectItem>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={changePlanMutation.isPending}
              onClick={() => {
                if (changePlanDialog) {
                  changePlanMutation.mutate({
                    id: changePlanDialog.id,
                    planType: newPlan as any,
                  });
                }
              }}
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "resetTrial" && (
                <>Tem certeza que deseja resetar o trial de <strong>{confirmDialog?.name}</strong>? Isso dará mais 15 dias de trial.</>
              )}
              {confirmDialog?.action === "forceExpire" && (
                <>Tem certeza que deseja forçar a expiração do trial de <strong>{confirmDialog?.name}</strong>? O menu público será bloqueado.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={resetTrialMutation.isPending || forceExpireMutation.isPending}
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.action === "resetTrial") {
                  resetTrialMutation.mutate({ id: confirmDialog.id });
                } else if (confirmDialog.action === "forceExpire") {
                  forceExpireMutation.mutate({ id: confirmDialog.id });
                }
                setConfirmDialog(null);
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
