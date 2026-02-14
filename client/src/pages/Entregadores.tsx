import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, EmptyState, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  UserCheck,
  UserX,
  DollarSign,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ---- Format helpers ----
function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function getStrategyLabel(strategy: string) {
  switch (strategy) {
    case "neighborhood": return "Valor por bairro";
    case "fixed": return "Valor fixo";
    case "percentage": return "Percentual";
    default: return strategy;
  }
}

function getStrategyBadgeVariant(strategy: string): "default" | "secondary" | "outline" {
  switch (strategy) {
    case "neighborhood": return "default";
    case "fixed": return "secondary";
    case "percentage": return "outline";
    default: return "default";
  }
}

// ---- Driver Form Sheet ----
interface DriverFormData {
  name: string;
  email: string;
  whatsapp: string;
  isActive: boolean;
  repasseStrategy: "neighborhood" | "fixed" | "percentage";
  fixedValue: string;
  percentageValue: string;
}

const defaultFormData: DriverFormData = {
  name: "",
  email: "",
  whatsapp: "",
  isActive: true,
  repasseStrategy: "neighborhood",
  fixedValue: "",
  percentageValue: "",
};

function DriverFormSheet({
  open,
  onOpenChange,
  editingDriver,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDriver: any | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<DriverFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const createMutation = trpc.driver.create.useMutation();
  const updateMutation = trpc.driver.update.useMutation();

  // Reset form when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingDriver) {
      setForm({
        name: editingDriver.name || "",
        email: editingDriver.email || "",
        whatsapp: editingDriver.whatsapp || "",
        isActive: editingDriver.isActive ?? true,
        repasseStrategy: editingDriver.repasseStrategy || "neighborhood",
        fixedValue: editingDriver.fixedValue || "",
        percentageValue: editingDriver.percentageValue || "",
      });
    } else if (isOpen) {
      setForm(defaultFormData);
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.whatsapp.trim()) {
      toast.error("WhatsApp é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingDriver) {
        await updateMutation.mutateAsync({
          id: editingDriver.id,
          name: form.name,
          email: form.email || "",
          whatsapp: form.whatsapp,
          isActive: form.isActive,
          repasseStrategy: form.repasseStrategy,
          fixedValue: form.repasseStrategy === "fixed" ? form.fixedValue : null,
          percentageValue: form.repasseStrategy === "percentage" ? form.percentageValue : null,
        });
        toast.success("Entregador atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          email: form.email || "",
          whatsapp: form.whatsapp,
          isActive: form.isActive,
          repasseStrategy: form.repasseStrategy,
          fixedValue: form.repasseStrategy === "fixed" ? form.fixedValue : undefined,
          percentageValue: form.repasseStrategy === "percentage" ? form.percentageValue : undefined,
        });
        toast.success("Entregador cadastrado com sucesso");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp mask
  const handleWhatsappChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let masked = digits;
    if (digits.length > 6) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 2) {
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    setForm((f) => ({ ...f, whatsapp: masked }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingDriver ? "Editar Entregador" : "Novo Entregador"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="driver-name">Nome completo *</Label>
            <Input
              id="driver-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do entregador"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="driver-email">E-mail (opcional)</Label>
            <Input
              id="driver-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="driver-whatsapp">WhatsApp *</Label>
            <Input
              id="driver-whatsapp"
              value={form.whatsapp}
              onChange={(e) => handleWhatsappChange(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Entregador ativo</Label>
              <p className="text-sm text-muted-foreground">Disponível para receber pedidos</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
          </div>

          {/* Estratégia de repasse */}
          <div className="space-y-3">
            <Label>Estratégia de repasse</Label>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.repasseStrategy === "neighborhood" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="neighborhood"
                  checked={form.repasseStrategy === "neighborhood"}
                  onChange={() => setForm((f) => ({ ...f, repasseStrategy: "neighborhood" }))}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">Valor por bairro</span>
                  <p className="text-sm text-muted-foreground">Repasse igual ao valor cobrado na zona de entrega.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.repasseStrategy === "fixed" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="fixed"
                  checked={form.repasseStrategy === "fixed"}
                  onChange={() => setForm((f) => ({ ...f, repasseStrategy: "fixed" }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="font-medium">Valor fixo por entrega</span>
                  <p className="text-sm text-muted-foreground">Valor fixo independente da distância.</p>
                  {form.repasseStrategy === "fixed" && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.fixedValue}
                        onChange={(e) => setForm((f) => ({ ...f, fixedValue: e.target.value }))}
                        placeholder="R$ 0,00"
                        className="w-40"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.repasseStrategy === "percentage" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <input
                  type="radio"
                  name="strategy"
                  value="percentage"
                  checked={form.repasseStrategy === "percentage"}
                  onChange={() => setForm((f) => ({ ...f, repasseStrategy: "percentage" }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <span className="font-medium">Percentual por entrega</span>
                  <p className="text-sm text-muted-foreground">Ex: 70% da taxa de entrega.</p>
                  {form.repasseStrategy === "percentage" && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={form.percentageValue}
                        onChange={(e) => setForm((f) => ({ ...f, percentageValue: e.target.value }))}
                        placeholder="70"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : editingDriver ? "Salvar Alterações" : "Cadastrar Entregador"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- Main Page ----
export default function Entregadores() {
  const [, navigate] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any | null>(null);

  const { data: driversList, isLoading: driversLoading, refetch: refetchDrivers } = trpc.driver.list.useQuery();
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.driver.metrics.useQuery();

  const deleteMutation = trpc.driver.delete.useMutation();
  const toggleMutation = trpc.driver.update.useMutation();

  const handleRefresh = () => {
    refetchDrivers();
    refetchMetrics();
  };

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditingDriver(null);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!driverToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: driverToDelete.id });
      toast.success("Entregador excluído");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro ao excluir", { description: error.message });
    }
    setDeleteDialogOpen(false);
    setDriverToDelete(null);
  };

  const handleToggleActive = async (driver: any) => {
    try {
      await toggleMutation.mutateAsync({ id: driver.id, isActive: !driver.isActive });
      toast.success(driver.isActive ? "Entregador desativado" : "Entregador ativado");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro", { description: error.message });
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Entregadores"
        description="Cadastre entregadores, acompanhe entregas e visualize repasses recentes."
        icon={<Truck className="h-6 w-6 text-blue-600" />}
        actions={
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo entregador
          </Button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        <StatCard
          title="Cadastrados"
          value={metricsLoading ? "..." : metrics?.total ?? 0}
          icon={Truck}
          variant="blue"
          loading={metricsLoading}
        />
        <StatCard
          title="Ativos"
          value={metricsLoading ? "..." : metrics?.active ?? 0}
          icon={UserCheck}
          variant="emerald"
          loading={metricsLoading}
        />
        <StatCard
          title="Desativados"
          value={metricsLoading ? "..." : metrics?.inactive ?? 0}
          icon={UserX}
          variant="gray"
          loading={metricsLoading}
        />
        <StatCard
          title="Repasses (7 dias)"
          value={metricsLoading ? "..." : formatCurrency(metrics?.repasses7d ?? 0)}
          icon={DollarSign}
          variant="amber"
          loading={metricsLoading}
        />
        <StatCard
          title="Entregas (7 dias)"
          value={metricsLoading ? "..." : metrics?.entregas7d ?? 0}
          icon={Package}
          variant="primary"
          loading={metricsLoading}
        />
      </div>

      {/* Drivers Table */}
      <div className="mt-6">
        {driversLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : !driversList || driversList.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhum entregador cadastrado"
            description="Cadastre seu primeiro entregador para começar a gerenciar entregas."
            action={{ label: "Novo entregador", onClick: handleNew }}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">WhatsApp</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estratégia</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Entregas (7d)</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">A receber</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {driversList.map((driver) => (
                    <tr
                      key={driver.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/entregadores/${driver.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            {driver.email && <p className="text-xs text-muted-foreground">{driver.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatPhone(driver.whatsapp)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={driver.isActive ? "default" : "secondary"} className={driver.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                          {driver.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStrategyBadgeVariant(driver.repasseStrategy)}>
                          {getStrategyLabel(driver.repasseStrategy)}
                          {driver.repasseStrategy === "fixed" && driver.fixedValue ? ` (R$ ${parseFloat(driver.fixedValue).toFixed(2).replace(".", ",")})` : ""}
                          {driver.repasseStrategy === "percentage" && driver.percentageValue ? ` (${driver.percentageValue}%)` : ""}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium">{driver.deliveriesLast7Days}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${driver.pendingTotal > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {formatCurrency(driver.pendingTotal)}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/entregadores/${driver.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(driver)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(driver)}>
                              {driver.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                              {driver.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDriverToDelete(driver);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
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
              {driversList.map((driver) => (
                <div
                  key={driver.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/entregadores/${driver.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"}`}>
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(driver.whatsapp)}
                        </p>
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
                          <DropdownMenuItem onClick={() => navigate(`/entregadores/${driver.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(driver)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(driver)}>
                            {driver.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {driver.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDriverToDelete(driver);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={driver.isActive ? "default" : "secondary"} className={driver.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                      {driver.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={getStrategyBadgeVariant(driver.repasseStrategy)}>
                      {getStrategyLabel(driver.repasseStrategy)}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {driver.deliveriesLast7Days} entregas · <span className={driver.pendingTotal > 0 ? "text-amber-600 font-medium" : ""}>{formatCurrency(driver.pendingTotal)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Driver Form Sheet */}
      <DriverFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingDriver={editingDriver}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entregador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{driverToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
