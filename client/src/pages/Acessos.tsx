import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatCard, EmptyState, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  Search,
  UserCheck,
  UserX,
  MoreHorizontal,
  X,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Permission definitions matching the sidebar pages
const PERMISSION_GROUPS = [
  {
    title: "PRINCIPAL",
    permissions: [
      { key: "dashboard", label: "Dashboard" },
      { key: "pdv", label: "Frente de Caixa" },
      { key: "mesas", label: "Mapa de Mesas" },
    ],
  },
  {
    title: "OPERACIONAL",
    permissions: [
      { key: "pedidos", label: "Pedidos" },
      { key: "entregadores", label: "Entregadores" },
    ],
  },
  {
    title: "CATÁLOGO",
    permissions: [
      { key: "catalogo", label: "Cardápio" },
      { key: "complementos", label: "Grupos" },
      { key: "avaliacoes", label: "Avaliações" },
      { key: "estoque", label: "Estoque" },
    ],
  },
  {
    title: "FINANCEIRO",
    permissions: [
      { key: "financas", label: "Finanças" },
    ],
  },
  {
    title: "MARKETING",
    permissions: [
      { key: "stories", label: "Stories" },
      { key: "cupons", label: "Cupons" },
      { key: "campanhas", label: "Campanhas" },
      { key: "fidelizacao", label: "Fidelização" },
    ],
  },
  {
    title: "SISTEMA",
    permissions: [
      { key: "bot-whatsapp", label: "Bot WhatsApp" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

const PERMISSION_LABEL_MAP: Record<string, string> = {};
PERMISSION_GROUPS.forEach((g) => g.permissions.forEach((p) => { PERMISSION_LABEL_MAP[p.key] = p.label; }));

function pluralPermissions(count: number) {
  return count === 1 ? "1 permissão" : `${count} permissões`;
}

// ---- Collaborator Form Sheet ----
function CollaboratorFormSheet({
  open,
  onOpenChange,
  editingCollab,
  establishmentId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCollab: any | null;
  establishmentId: number | undefined;
  onSuccess: () => void;
}) {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const createMutation = trpc.collaborator.create.useMutation();
  const updateMutation = trpc.collaborator.update.useMutation();

  // Sync form when editingCollab or open changes
  useState(() => {
    // This is handled in the useEffect below
  });

  // Reset form when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingCollab) {
      setFormName(editingCollab.name || "");
      setFormEmail(editingCollab.email || "");
      setFormPassword("");
      setFormPermissions(editingCollab.permissions || []);
      setFormIsActive(editingCollab.isActive ?? true);
      setShowPassword(false);
    } else if (isOpen) {
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormPermissions([]);
      setFormIsActive(true);
      setShowPassword(false);
    }
    onOpenChange(isOpen);
  };

  // Initialize form when sheet opens
  if (open && formName === "" && editingCollab) {
    setFormName(editingCollab.name || "");
    setFormEmail(editingCollab.email || "");
    setFormPermissions(editingCollab.permissions || []);
    setFormIsActive(editingCollab.isActive ?? true);
  }

  function togglePermission(key: string) {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function selectAllPermissions() {
    setFormPermissions([...ALL_PERMISSIONS]);
  }

  function clearAllPermissions() {
    setFormPermissions([]);
  }

  async function handleSave() {
    if (!establishmentId) return;

    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    if (!editingCollab && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (editingCollab && formPassword && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (formPermissions.length === 0) {
      toast.error("Selecione pelo menos uma permissão");
      return;
    }

    setSaving(true);
    try {
      if (editingCollab) {
        const updateData: any = {
          id: editingCollab.id,
          name: formName.trim(),
          email: formEmail.trim(),
          permissions: formPermissions,
          isActive: formIsActive,
        };
        if (formPassword) {
          updateData.password = formPassword;
        }
        await updateMutation.mutateAsync(updateData);
        toast.success("Colaborador atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          establishmentId,
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          permissions: formPermissions,
        });
        toast.success("Colaborador cadastrado com sucesso");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">{editingCollab ? "Editar Colaborador" : "Novo Colaborador"}</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header - gradient style */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingCollab ? "Editar Colaborador" : "Novo Colaborador"}
                </h2>
                <p className="text-sm text-white/80">
                  {editingCollab ? "Atualize os dados e permissões" : "Cadastre um novo colaborador"}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="collab-name" className="text-sm font-medium">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="h-10 rounded-xl bg-background border-border/50 pl-9"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="collab-email" className="text-sm font-medium">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="h-10 rounded-xl bg-background border-border/50 pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="collab-password" className="text-sm font-medium">
                {editingCollab ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-password"
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingCollab ? "Deixe vazio para manter" : "Mínimo 8 caracteres"}
                  className="h-10 rounded-xl bg-background border-border/50 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Active toggle (only for editing) */}
            {editingCollab && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formIsActive ? "Colaborador pode fazer login" : "Colaborador bloqueado"}
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            )}

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Permissões de Acesso
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-xs text-primary hover:underline"
                  >
                    Selecionar todas
                  </button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-3 rounded-xl border bg-muted/20">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                            formPermissions.includes(perm.key)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-card hover:bg-muted border border-transparent"
                          )}
                        >
                          <Checkbox
                            checked={formPermissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {formPermissions.length} de {ALL_PERMISSIONS.length} permissões selecionadas
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl h-11"
              style={{ backgroundColor: '#db262f', color: 'white' }}
            >
              {saving ? "Salvando..." : editingCollab ? "Salvar Alterações" : "Cadastrar Colaborador"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- Main Page ----
export default function Acessos() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  const { data: collaborators, isLoading, refetch } = trpc.collaborator.list.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collabToDelete, setCollabToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const deleteMutation = trpc.collaborator.delete.useMutation();
  const toggleMutation = trpc.collaborator.update.useMutation();

  const filteredCollaborators = useMemo(() => {
    if (!collaborators) return [];
    if (!searchQuery.trim()) return collaborators;
    const q = searchQuery.toLowerCase();
    return collaborators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [collaborators, searchQuery]);

  // Metrics
  const totalCollabs = collaborators?.length ?? 0;
  const activeCollabs = collaborators?.filter((c) => c.isActive).length ?? 0;
  const inactiveCollabs = collaborators?.filter((c) => !c.isActive).length ?? 0;

  const handleNew = () => {
    setEditingCollab(null);
    setSheetOpen(true);
  };

  const handleEdit = (collab: any) => {
    setEditingCollab(collab);
    setSheetOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDelete = async () => {
    if (!collabToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: collabToDelete.id });
      toast.success("Colaborador removido");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro ao remover", { description: error.message });
    }
    setDeleteDialogOpen(false);
    setCollabToDelete(null);
  };

  const handleToggleActive = async (collab: any) => {
    try {
      await toggleMutation.mutateAsync({ id: collab.id, isActive: !collab.isActive });
      toast.success(collab.isActive ? "Colaborador desativado" : "Colaborador ativado");
      handleRefresh();
    } catch (error: any) {
      toast.error("Erro", { description: error.message });
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Acessos"
        description="Colaboradores acessam o painel usando email e senha cadastrados aqui. Eles verão apenas as páginas autorizadas."
        icon={<Users className="h-6 w-6 text-blue-600" />}
        actions={
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo colaborador
          </Button>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatCard
          title="Cadastrados"
          value={isLoading ? "..." : totalCollabs}
          icon={Users}
          variant="blue"
          loading={isLoading}
        />
        <StatCard
          title="Ativos"
          value={isLoading ? "..." : activeCollabs}
          icon={UserCheck}
          variant="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Desativados"
          value={isLoading ? "..." : inactiveCollabs}
          icon={UserX}
          variant="gray"
          loading={isLoading}
        />
      </div>

      {/* Search */}
      {collaborators && collaborators.length > 0 && (
        <div className="relative max-w-sm mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Collaborators Table */}
      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !collaborators || collaborators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador cadastrado"
            description="Crie acessos para seus funcionários com permissões específicas. Cada colaborador terá acesso apenas às páginas autorizadas."
            action={{ label: "Novo colaborador", onClick: handleNew }}
          />
        ) : filteredCollaborators.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description={`Nenhum colaborador encontrado para "${searchQuery}"`}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Colaborador</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Permissões</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Último acesso</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborators.map((collab) => {
                    const perms = collab.permissions as string[];
                    return (
                      <tr
                        key={collab.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${collab.isActive ? "bg-blue-500" : "bg-gray-400"}`}>
                              {collab.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{collab.name}</p>
                              <p className="text-xs text-muted-foreground">{collab.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {perms.slice(0, 3).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs font-normal">
                                {PERMISSION_LABEL_MAP[perm] || perm}
                              </Badge>
                            ))}
                            {perms.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{perms.length - 3}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pluralPermissions(perms.length)}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={collab.isActive ? "default" : "secondary"}
                            className={collab.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                          >
                            {collab.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {collab.lastLoginAt ? (
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(collab.lastLoginAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca acessou</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(collab)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(collab)}>
                                {collab.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                {collab.isActive ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setCollabToDelete(collab);
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {filteredCollaborators.map((collab) => {
                const perms = collab.permissions as string[];
                return (
                  <div key={collab.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${collab.isActive ? "bg-blue-500" : "bg-gray-400"}`}>
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{collab.name}</p>
                          <p className="text-xs text-muted-foreground">{collab.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(collab)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(collab)}>
                            {collab.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {collab.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setCollabToDelete(collab);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={collab.isActive ? "default" : "secondary"}
                        className={collab.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                      >
                        {collab.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {pluralPermissions(perms.length)}
                      </Badge>
                      {collab.lastLoginAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(collab.lastLoginAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Collaborator Form Sheet */}
      <CollaboratorFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingCollab(null);
        }}
        editingCollab={editingCollab}
        establishmentId={estId}
        onSuccess={handleRefresh}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setCollabToDelete(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{collabToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e o colaborador perderá o acesso ao painel imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
