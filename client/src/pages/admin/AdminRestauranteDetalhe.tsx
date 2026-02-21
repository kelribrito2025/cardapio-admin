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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Store,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
  Pencil,
  RotateCcw,
  Zap,
  Lock,
  Unlock,
  Timer,
  Loader2,
  Users,
  Settings,
  Phone,
  Mail,
  History,
  MessageSquare,
  AlertCircle,
  UserPlus,
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
  const [activeTab, setActiveTab] = useState("cobranca");

  // Contact editing state
  const [editingContact, setEditingContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

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

  const impersonateMutation = trpc.admin.restaurants.impersonate.useMutation({
    onSuccess: () => {
      toast.success("Sessão criada! Redirecionando...");
      window.open("/", "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.admin.restaurants.updateSubscriptionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateContactMutation = trpc.admin.restaurants.updateContact.useMutation({
    onSuccess: () => {
      toast.success("Contato atualizado!");
      refetch();
      setEditingContact(false);
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
    free: "bg-gray-100 text-gray-700",
    basic: "bg-green-100 text-green-700",
    pro: "bg-purple-100 text-purple-700",
    enterprise: "bg-indigo-100 text-indigo-700",
  };

  const subscriptionStatusMap: Record<string, string> = {
    trial: "trial",
    active: "active",
    expiring_soon: "active",
    expired: "cancelled",
    not_trial: "active",
  };

  const currentSubscriptionStatus = (() => {
    if (restaurant.planType === "trial") {
      if (restaurant.trialStatus === "expired") return "cancelled";
      return "trial";
    }
    if (restaurant.manuallyClosed) return "suspended";
    return "active";
  })();

  const subscriptionStatusLabels: Record<string, string> = {
    trial: "Período de Teste",
    active: "Ativo",
    suspended: "Suspenso",
    cancelled: "Cancelado",
  };

  const startDate = restaurant.trialStartDate
    ? new Date(restaurant.trialStartDate).toLocaleDateString("pt-BR")
    : restaurant.createdAt
    ? new Date(restaurant.createdAt).toLocaleDateString("pt-BR")
    : "—";

  const handleStartEditContact = () => {
    setContactName(restaurant.responsibleName || restaurant.owner?.name || "");
    setContactPhone(restaurant.responsiblePhone || restaurant.whatsapp || "");
    setContactEmail(restaurant.email || restaurant.owner?.email || "");
    setEditingContact(true);
  };

  return (
    <AdminPanelLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/restaurantes")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${planColors[restaurant.planType] || "bg-muted text-foreground"}`}>
                  {restaurant.planLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">/{restaurant.menuSlug || restaurant.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {restaurant.menuSlug && (
              <Button
                variant="outline"
                onClick={() => window.open(`/menu/${restaurant.menuSlug}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Cardápio
              </Button>
            )}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={impersonateMutation.isPending}
              onClick={() => impersonateMutation.mutate({ id: restaurant.id })}
            >
              {impersonateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Acessar Painel
            </Button>
          </div>
        </div>

        {/* 4 Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mensalidade */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mensalidade</p>
                <p className="text-lg font-bold text-foreground">
                  {restaurant.planPrice > 0
                    ? `R$ ${restaurant.planPrice.toFixed(2).replace(".", ",")}`
                    : "Grátis"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Início */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Início</p>
                <p className="text-lg font-bold text-foreground">{startDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Admins */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admins</p>
                <p className="text-lg font-bold text-foreground">{restaurant.adminCount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Loja */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loja</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    !restaurant.manuallyClosed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {!restaurant.manuallyClosed ? "Ativa" : "Inativa"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    restaurant.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {restaurant.isOpen ? "Aberta" : "Fechada"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-0 h-auto p-0">
            <TabsTrigger
              value="cobranca"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Cobrança
            </TabsTrigger>
            <TabsTrigger
              value="contato"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              Contato
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <History className="h-4 w-4 mr-1.5" />
              Histórico
            </TabsTrigger>
            <TabsTrigger
              value="administradores"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              Administradores
            </TabsTrigger>
            <TabsTrigger
              value="comunicacoes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Comunicações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cobrança */}
          <TabsContent value="cobranca" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cobrança
                </h3>

                {/* Alert: no payment configured */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">
                    O Mercado Pago não está configurado. Configure em <strong>Configurações → Mercado Pago</strong> para gerar cobranças automáticas.
                  </p>
                </div>

                {/* Subscription Status */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Gerenciar Status Manualmente</Label>
                  <Select
                    value={currentSubscriptionStatus}
                    onValueChange={(val) => {
                      updateStatusMutation.mutate({
                        id: restaurant.id,
                        status: val as any,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Período de Teste</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Actions */}
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ações Administrativas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangePlanOpen(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Alterar plano
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMenuMutation.mutate({ id: restaurant.id, isOpen: !restaurant.isOpen })}
                    >
                      {restaurant.isOpen ? (
                        <><Lock className="h-3.5 w-3.5 mr-1.5" /> Bloquear menu</>
                      ) : (
                        <><Unlock className="h-3.5 w-3.5 mr-1.5" /> Reabrir menu</>
                      )}
                    </Button>
                    {restaurant.planType === "trial" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExtendTrialOpen(true)}
                        >
                          <Timer className="h-3.5 w-3.5 mr-1.5" /> Estender trial
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction("resetTrial")}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Resetar trial
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setConfirmAction("forceExpire")}
                        >
                          <Zap className="h-3.5 w-3.5 mr-1.5" /> Forçar expiração
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contato */}
          <TabsContent value="contato" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados de Contato
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Informações do responsável pelo restaurante</p>
                  </div>
                  {!editingContact && (
                    <Button variant="outline" size="sm" onClick={handleStartEditContact}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  )}
                </div>

                {editingContact ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" /> Nome do Proprietário
                        </Label>
                        <Input
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="João da Silva"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp
                        </Label>
                        <Input
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="(35) 99999-9999"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> E-mail de Contato
                      </Label>
                      <Input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contato@restaurante.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        E-mail para comunicações (pode ser diferente do e-mail de cobrança)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingContact(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        disabled={updateContactMutation.isPending}
                        onClick={() => updateContactMutation.mutate({
                          id: restaurant.id,
                          responsibleName: contactName,
                          responsiblePhone: contactPhone,
                          email: contactEmail,
                        })}
                      >
                        {updateContactMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Nome do Proprietário
                      </Label>
                      <p className="text-sm font-medium text-foreground border rounded-md px-3 py-2 bg-muted/30">
                        {restaurant.responsibleName || restaurant.owner?.name || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp
                      </Label>
                      <p className="text-sm font-medium text-foreground border rounded-md px-3 py-2 bg-muted/30">
                        {restaurant.responsiblePhone || restaurant.whatsapp || "—"}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> E-mail de Contato
                      </Label>
                      <p className="text-sm font-medium text-foreground border rounded-md px-3 py-2 bg-muted/30">
                        {restaurant.email || restaurant.owner?.email || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        E-mail para comunicações (pode ser diferente do e-mail de cobrança)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">Histórico de Pagamentos</h3>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Nenhum pagamento registrado</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Administradores */}
          <TabsContent value="administradores" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Administradores
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Gerencie quem pode acessar o painel do restaurante</p>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => toast.info("Funcionalidade em breve")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Novo Admin
                  </Button>
                </div>

                {restaurant.owner ? (
                  <div className="border rounded-lg divide-y">
                    <div className="flex items-center gap-4 p-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{restaurant.owner.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.owner.email || "—"}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Proprietário
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mb-3 opacity-40" />
                    <p className="font-medium">Nenhum administrador cadastrado</p>
                    <p className="text-sm mt-1">Crie um administrador para permitir o acesso ao painel.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Comunicações */}
          <TabsContent value="comunicacoes" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                  <MessageSquare className="h-5 w-5" />
                  Comunicações
                </h3>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
                  <p className="font-medium">Nenhuma comunicação enviada</p>
                  <p className="text-sm mt-1">As comunicações com este restaurante aparecerão aqui.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
