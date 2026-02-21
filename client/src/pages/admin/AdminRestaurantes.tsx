import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  MoreHorizontal,
  Filter,
  Zap,
  Timer,
  Crown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

type PlanFilter = "all" | "trial" | "active_trial" | "basic" | "pro" | "enterprise" | "expired" | "paid";

const planFilterLabels: Record<PlanFilter, string> = {
  all: "Todos",
  trial: "Trial (todos)",
  active_trial: "Trial ativo",
  expired: "Trial expirado",
  basic: "Essencial",
  pro: "Pro",
  enterprise: "Enterprise",
  paid: "Pagos",
};

const planBadgeConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  trial: { label: "Trial", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: <Timer className="h-3.5 w-3.5" /> },
  expired: { label: "Expirado", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  expiring_soon: { label: "Expirando", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  basic: { label: "Essencial", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  pro: { label: "Pro", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200", icon: <Zap className="h-3.5 w-3.5" /> },
  enterprise: { label: "Enterprise", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", icon: <Crown className="h-3.5 w-3.5" /> },
};

function getPlanBadge(planType: string, trialStatus: string) {
  if (planType === "trial") {
    if (trialStatus === "expired") {
      const cfg = planBadgeConfig.expired;
      return (
        <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
          {cfg.icon} {cfg.label}
        </Badge>
      );
    }
    if (trialStatus === "expiring_soon") {
      const cfg = planBadgeConfig.expiring_soon;
      return (
        <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
          {cfg.icon} {cfg.label}
        </Badge>
      );
    }
    const cfg = planBadgeConfig.trial;
    return (
      <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
        {cfg.icon} {cfg.label}
      </Badge>
    );
  }
  const cfg = planBadgeConfig[planType] || planBadgeConfig.basic;
  return (
    <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} gap-1`}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

export default function AdminRestaurantes() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlFilter = new URLSearchParams(searchParams).get("filter") || "all";

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>(urlFilter as PlanFilter);
  const [page, setPage] = useState(1);
  const [changePlanDialog, setChangePlanDialog] = useState<{ id: number; name: string } | null>(null);
  const [newPlan, setNewPlan] = useState<string>("basic");
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; name: string; action: string } | null>(null);

  const queryFilter = planFilter === "paid" ? undefined : planFilter;

  const { data, isLoading, refetch } = trpc.admin.restaurants.list.useQuery({
    search: search.trim() || undefined,
    planFilter: planFilter === "paid" ? "basic" : queryFilter,
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Restaurantes</h1>
            <p className="text-sm text-muted-foreground">Gerenciar todos os restaurantes da plataforma</p>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v as PlanFilter); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(planFilterLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : !data?.restaurants.length ? (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Store className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">Nenhum restaurante encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Restaurante</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plano</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Trial</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Menu</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.restaurants.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/restaurantes/${r.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {r.logo ? (
                            <img src={r.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Store className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{r.email || "—"}</span>
                      </td>
                      <td className="p-4">
                        {getPlanBadge(r.planType, r.trialStatus)}
                      </td>
                      <td className="p-4">
                        {r.planType === "trial" ? (
                          r.trialStatus === "expired" ? (
                            <span className="text-sm text-red-500 font-medium">Expirado</span>
                          ) : r.trialStatus === "expiring_soon" ? (
                            <span className="text-sm text-amber-500 font-medium">{r.daysRemaining}d restantes</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">{r.daysRemaining}d restantes</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {r.isOpen ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <Globe className="h-3.5 w-3.5" /> Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
                            <GlobeLock className="h-3.5 w-3.5" /> Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${r.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setChangePlanDialog({ id: r.id, name: r.name })}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Alterar plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleMenuMutation.mutate({ id: r.id, isOpen: !r.isOpen })}>
                              {r.isOpen ? (
                                <><Lock className="h-4 w-4 mr-2 text-orange-600" /> Bloquear menu</>
                              ) : (
                                <><Unlock className="h-4 w-4 mr-2 text-green-600" /> Desbloquear menu</>
                              )}
                            </DropdownMenuItem>
                            {r.planType === "trial" && (
                              <>
                                <DropdownMenuItem onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "resetTrial" })}>
                                  <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                                  Resetar trial
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "forceExpire" })}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Expirar trial
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {data.restaurants.map((r) => (
                <div
                  key={r.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/admin/restaurantes/${r.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {r.logo ? (
                        <img src={r.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${r.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setChangePlanDialog({ id: r.id, name: r.name })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Alterar plano
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleMenuMutation.mutate({ id: r.id, isOpen: !r.isOpen })}>
                            {r.isOpen ? (
                              <><Lock className="h-4 w-4 mr-2 text-orange-600" /> Bloquear menu</>
                            ) : (
                              <><Unlock className="h-4 w-4 mr-2 text-green-600" /> Desbloquear menu</>
                            )}
                          </DropdownMenuItem>
                          {r.planType === "trial" && (
                            <DropdownMenuItem onClick={() => setConfirmDialog({ id: r.id, name: r.name, action: "resetTrial" })}>
                              <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                              Resetar trial
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPlanBadge(r.planType, r.trialStatus)}
                    {r.isOpen ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-xs">
                        <Globe className="h-3 w-3" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 text-xs">
                        <GlobeLock className="h-3 w-3" /> Inativo
                      </Badge>
                    )}
                    {r.planType === "trial" && r.daysRemaining !== undefined && (
                      <span className={cn(
                        "text-xs font-medium",
                        r.trialStatus === "expired" ? "text-red-500" :
                        r.trialStatus === "expiring_soon" ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {r.trialStatus === "expired" ? "Expirado" : `${r.daysRemaining}d restantes`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {data?.total ?? 0} restaurantes encontrados
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
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
              <SelectItem value="basic">Essencial</SelectItem>
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
