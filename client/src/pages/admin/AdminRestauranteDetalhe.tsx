import { useState } from "react";
import { useLocation, useParams } from "wouter";
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
  ArrowLeft,
  Store,
  User,
  Calendar,
  Clock,
  CreditCard,
  Globe,
  GlobeLock,
  Pencil,
  RotateCcw,
  Zap,
  Lock,
  Unlock,
  Timer,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function AdminRestauranteDetalhe() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const restaurantId = parseInt(params.id || "0");

  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("basic");
  const [extendTrialOpen, setExtendTrialOpen] = useState(false);
  const [extraDays, setExtraDays] = useState("7");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const { data: restaurant, isLoading, refetch } = trpc.admin.restaurants.detail.useQuery(
    { id: restaurantId },
    { enabled: restaurantId > 0 }
  );

  const changePlanMutation = trpc.admin.restaurants.changePlan.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado!");
      refetch();
      setChangePlanOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMenuMutation = trpc.admin.restaurants.toggleMenu.useMutation({
    onSuccess: () => {
      toast.success("Menu atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const extendTrialMutation = trpc.admin.restaurants.extendTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial estendido!");
      refetch();
      setExtendTrialOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetTrialMutation = trpc.admin.restaurants.resetTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial resetado!");
      refetch();
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const forceExpireMutation = trpc.admin.restaurants.forceExpire.useMutation({
    onSuccess: () => {
      toast.success("Trial expirado!");
      refetch();
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <AdminPanelLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPanelLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminPanelLayout>
        <div className="text-center py-20">
          <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-muted-foreground">Restaurante não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/restaurantes")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AdminPanelLayout>
    );
  }

  const planColors: Record<string, string> = {
    trial: "bg-blue-100 text-blue-700",
    basic: "bg-green-100 text-green-700",
    pro: "bg-purple-100 text-purple-700",
    enterprise: "bg-indigo-100 text-indigo-700",
  };

  const statusColors: Record<string, string> = {
    active: "text-green-600",
    expiring_soon: "text-amber-600",
    expired: "text-red-600",
    not_trial: "text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    active: "Trial ativo",
    expiring_soon: "Expirando em breve",
    expired: "Expirado",
    not_trial: "Plano ativo",
  };

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/restaurantes")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {restaurant.logo ? (
                <img src={restaurant.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{restaurant.name}</h1>
                <p className="text-sm text-muted-foreground">ID: {restaurant.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                Informações Gerais
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-28">Email</span>
                  <span className="text-foreground font-medium">{restaurant.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-28">WhatsApp</span>
                  <span className="text-foreground font-medium">{restaurant.whatsapp || "—"}</span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-28">Localização</span>
                  <span className="text-foreground font-medium">
                    {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ""}{!restaurant.city && "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-28">Cadastro</span>
                  <span className="text-foreground font-medium">
                    {restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-28">Menu público</span>
                  <span className={`font-medium ${restaurant.isOpen ? "text-green-600" : "text-muted-foreground"}`}>
                    {restaurant.isOpen ? "Ativo" : "Inativo"}
                  </span>
                  {restaurant.menuSlug && (
                    <a
                      href={`/menu/${restaurant.menuSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 ml-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              {restaurant.owner && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2 pt-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Proprietário
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                      <span className="text-muted-foreground w-28 ml-7">Nome</span>
                      <span className="text-foreground font-medium">{restaurant.owner.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 py-2 border-b border-gray-50">
                      <span className="text-muted-foreground w-28 ml-7">Email</span>
                      <span className="text-foreground font-medium">{restaurant.owner.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-muted-foreground w-28 ml-7">Último acesso</span>
                      <span className="text-foreground font-medium">
                        {restaurant.owner.lastSignedIn
                          ? new Date(restaurant.owner.lastSignedIn).toLocaleString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Plan & Trial Card */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Plano & Trial
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-muted-foreground">Plano atual</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planColors[restaurant.planType] || "bg-muted text-foreground"}`}>
                      {restaurant.planType.charAt(0).toUpperCase() + restaurant.planType.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold ${statusColors[restaurant.trialStatus]}`}>
                      {statusLabels[restaurant.trialStatus]}
                    </span>
                  </div>
                  {restaurant.planType === "trial" && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-muted-foreground">Início do trial</span>
                        <span className="text-foreground font-medium">
                          {restaurant.trialStartDate
                            ? new Date(restaurant.trialStartDate).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-muted-foreground">Expiração</span>
                        <span className="text-foreground font-medium">
                          {restaurant.expirationDate
                            ? new Date(restaurant.expirationDate).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Dias restantes</span>
                        <span className={`font-bold text-lg ${
                          restaurant.daysRemaining === 0 ? "text-red-500" :
                          (restaurant.daysRemaining ?? 0) <= 3 ? "text-amber-500" : "text-green-500"
                        }`}>
                          {restaurant.daysRemaining ?? 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Ações Administrativas
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setChangePlanOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Alterar plano
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toggleMenuMutation.mutate({ id: restaurant.id, isOpen: !restaurant.isOpen })}
                >
                  {restaurant.isOpen ? (
                    <><Lock className="h-4 w-4 mr-2" /> Bloquear menu público</>
                  ) : (
                    <><Unlock className="h-4 w-4 mr-2" /> Reabrir menu público</>
                  )}
                </Button>
                {restaurant.planType === "trial" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setExtendTrialOpen(true)}
                    >
                      <Timer className="h-4 w-4 mr-2" /> Estender trial
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setConfirmAction("resetTrial")}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Resetar trial (15 dias)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setConfirmAction("forceExpire")}
                    >
                      <Zap className="h-4 w-4 mr-2" /> Forçar expiração
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>Alterar o plano de {restaurant.name}</DialogDescription>
          </DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial (resetar)</SelectItem>
              <SelectItem value="basic">Essencial</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOpen(false)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={changePlanMutation.isPending}
              onClick={() => changePlanMutation.mutate({ id: restaurant.id, planType: newPlan as any })}
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={extendTrialOpen} onOpenChange={setExtendTrialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Trial</DialogTitle>
            <DialogDescription>Adicionar dias extras ao trial de {restaurant.name}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendTrialOpen(false)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              disabled={extendTrialMutation.isPending}
              onClick={() => extendTrialMutation.mutate({ id: restaurant.id, extraDays: parseInt(extraDays) || 7 })}
            >
              {extendTrialMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Estender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {confirmAction === "resetTrial" && "Resetar o trial dará 15 dias novos a este restaurante."}
              {confirmAction === "forceExpire" && "Forçar a expiração bloqueará o menu público imediatamente."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (confirmAction === "resetTrial") {
                  resetTrialMutation.mutate({ id: restaurant.id });
                } else if (confirmAction === "forceExpire") {
                  forceExpireMutation.mutate({ id: restaurant.id });
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
