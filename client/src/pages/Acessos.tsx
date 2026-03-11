import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Copy,
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

// Permission key to label map
const PERMISSION_LABEL_MAP: Record<string, string> = {};
PERMISSION_GROUPS.forEach((g) => g.permissions.forEach((p) => { PERMISSION_LABEL_MAP[p.key] = p.label; }));

export default function Acessos() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  const { data: collaborators, refetch } = trpc.collaborator.list.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = trpc.collaborator.create.useMutation({
    onSuccess: () => {
      toast.success("Colaborador criado com sucesso!");
      refetch();
      closeModal();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar colaborador.");
    },
  });

  const updateMutation = trpc.collaborator.update.useMutation({
    onSuccess: () => {
      toast.success("Colaborador atualizado com sucesso!");
      refetch();
      closeModal();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar colaborador.");
    },
  });

  const deleteMutation = trpc.collaborator.delete.useMutation({
    onSuccess: () => {
      toast.success("Colaborador removido com sucesso!");
      refetch();
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao remover colaborador.");
    },
  });

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

  function openCreateModal() {
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPermissions([]);
    setFormIsActive(true);
    setShowPassword(false);
    setShowModal(true);
  }

  function openEditModal(collab: any) {
    setEditingId(collab.id);
    setFormName(collab.name);
    setFormEmail(collab.email);
    setFormPassword("");
    setFormPermissions(collab.permissions || []);
    setFormIsActive(collab.isActive);
    setShowPassword(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!estId) return;

    if (!formName.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    if (!formEmail.trim()) {
      toast.error("Email é obrigatório.");
      return;
    }
    if (!editingId && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (editingId && formPassword && formPassword.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (formPermissions.length === 0) {
      toast.error("Selecione pelo menos uma permissão.");
      return;
    }

    if (editingId) {
      const updateData: any = {
        id: editingId,
        name: formName.trim(),
        email: formEmail.trim(),
        permissions: formPermissions,
        isActive: formIsActive,
      };
      if (formPassword) {
        updateData.password = formPassword;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate({
        establishmentId: estId,
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        permissions: formPermissions,
      });
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const deleteTarget = collaborators?.find((c) => c.id === deleteId);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Acessos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os colaboradores e suas permissões de acesso ao painel
            </p>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>

        {/* Search */}
        {collaborators && collaborators.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Collaborators list */}
        {!collaborators ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collaborators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum colaborador cadastrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Crie acessos para seus funcionários com permissões específicas. Cada colaborador terá acesso apenas às páginas autorizadas.
              </p>
              <Button onClick={openCreateModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Colaborador
              </Button>
            </CardContent>
          </Card>
        ) : filteredCollaborators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum colaborador encontrado para "{searchQuery}"</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredCollaborators.map((collab) => (
              <Card key={collab.id} className={cn("transition-all", !collab.isActive && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                    {/* Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        collab.isActive ? "bg-primary/10" : "bg-muted"
                      )}>
                        {collab.isActive ? (
                          <UserCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <UserX className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{collab.name}</h3>
                          {!collab.isActive && (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{collab.email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(collab.permissions as string[]).slice(0, 5).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs font-normal">
                              {PERMISSION_LABEL_MAP[perm] || perm}
                            </Badge>
                          ))}
                          {(collab.permissions as string[]).length > 5 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{(collab.permissions as string[]).length - 5}
                            </Badge>
                          )}
                        </div>
                        {collab.lastLoginAt && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Último acesso: {new Date(collab.lastLoginAt).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(collab)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(collab.id)}
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info card */}
        {collaborators && collaborators.length > 0 && (
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-300">Como funciona o acesso de colaboradores?</p>
                  <p className="text-blue-700/80 dark:text-blue-400/70 mt-1">
                    Colaboradores fazem login na tela de login clicando em "Sou colaborador" e usando o email e senha cadastrados aqui. 
                    Eles terão acesso apenas às páginas autorizadas. Os menus não autorizados ficam ocultos na sidebar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Editar Colaborador
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Novo Colaborador
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize as informações e permissões do colaborador."
                : "Preencha os dados do novo colaborador e selecione as permissões de acesso."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="collab-name" className="text-sm font-medium">
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-name"
                  placeholder="Nome do colaborador"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="collab-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="collab-password" className="text-sm font-medium">
                {editingId ? "Nova Senha (deixe vazio para manter)" : "Senha"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collab-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingId ? "Deixe vazio para manter a senha atual" : "Mínimo 8 caracteres"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="pl-9 pr-10"
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
            {editingId && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Status do Colaborador</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formIsActive ? "O colaborador pode fazer login" : "O colaborador não pode fazer login"}
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

              <div className="space-y-4 p-3 rounded-lg border bg-muted/20">
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
                            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Salvar Alterações" : "Criar Colaborador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? 
              Esta ação não pode ser desfeita e o colaborador perderá o acesso ao painel imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
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
