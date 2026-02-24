import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Key,
  Activity,
  Clock,
  Shield,
  Loader2,
  ExternalLink,
  Code,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/AdminLayout";

export default function BotWhatsApp() {
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [deleteKeyId, setDeleteKeyId] = useState<number | null>(null);

  const { data: establishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;

  const { data: apiKeys, isLoading, refetch } = trpc.botApiKeys.list.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const createMutation = trpc.botApiKeys.create.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.apiKey);
      setNewKeyName("");
      refetch();
      toast.success("API Key criada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar API Key");
    },
  });

  const toggleMutation = trpc.botApiKeys.toggleActive.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status atualizado!");
    },
  });

  const deleteMutation = trpc.botApiKeys.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteKeyId(null);
      toast.success("API Key excluída!");
    },
  });

  const createGlobalMutation = trpc.botApiKeys.createGlobal.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.apiKey);
      refetch();
      toast.success("API Key Global criada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar API Key Global");
    },
  });

  const handleCreateGlobal = () => {
    if (!estId) return;
    createGlobalMutation.mutate({ establishmentId: estId, name: "API Key Global (n8n)" });
  };

  const handleCreate = () => {
    if (!newKeyName.trim() || !estId) return;
    createMutation.mutate({ establishmentId: estId, name: newKeyName.trim() });
  };

  const toggleKeyVisibility = (id: number) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "•".repeat(32) + key.substring(key.length - 8);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AdminLayout>
      <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Bot WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as API Keys para integração com bots de atendimento via WhatsApp (n8n, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCreateGlobal} disabled={createGlobalMutation.isPending}>
            {createGlobalMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
            Nova Key Global
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setCreatedKey(null);
              setNewKeyName("");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova API Key
              </Button>
            </DialogTrigger>
          <DialogContent>
            {!createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Dê um nome para identificar esta chave (ex: "Bot n8n Produção", "Bot Teste").
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Nome da chave</Label>
                    <Input
                      id="keyName"
                      placeholder="Ex: Bot n8n Produção"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreate}
                    disabled={!newKeyName.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar API Key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <Shield className="h-5 w-5" />
                    API Key Criada!
                  </DialogTitle>
                  <DialogDescription>
                    Copie esta chave agora. Por segurança, ela não será exibida novamente na íntegra.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm break-all select-all">{createdKey}</code>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(createdKey)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar API Key
                  </Button>
                  <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Guarde esta chave em local seguro. Ela dá acesso ao cardápio e permite criar pedidos no seu estabelecimento.</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setShowCreateDialog(false); setCreatedKey(null); }}>
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Info Card - Endpoints */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Como integrar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Use a API Key no header <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer SUA_API_KEY</code> para acessar os endpoints abaixo:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { method: "GET", path: "/api/bot/establishment", desc: "Dados do estabelecimento" },
              { method: "GET", path: "/api/bot/menu", desc: "Cardápio completo" },
              { method: "GET", path: "/api/bot/menu/search?q=", desc: "Buscar no cardápio" },
              { method: "GET", path: "/api/bot/products/:id", desc: "Detalhes + complementos" },
              { method: "GET", path: "/api/bot/stock/:id", desc: "Verificar estoque" },
              { method: "GET", path: "/api/bot/delivery-fees", desc: "Taxas de entrega" },
              { method: "GET", path: "/api/bot/delivery-fees/search?neighborhood=", desc: "Taxa por bairro" },
              { method: "POST", path: "/api/bot/coupons/validate", desc: "Validar cupom" },
              { method: "POST", path: "/api/bot/orders", desc: "Criar pedido" },
              { method: "GET", path: "/api/bot/orders?phone=", desc: "Pedidos do cliente" },
              { method: "GET", path: "/api/bot/orders/:id", desc: "Detalhes do pedido" },
              { method: "GET", path: "/api/bot/whatsapp-config?phone=", desc: "Buscar estabelecimento pelo WhatsApp" },
              { method: "GET", path: "/api/bot/api-key?establishmentId=", desc: "Buscar API Key pelo estabelecimento" },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-2 bg-background rounded px-3 py-2 border"
              >
                <Badge
                  variant={ep.method === "GET" ? "secondary" : "default"}
                  className={cn(
                    "text-[10px] font-mono w-12 justify-center shrink-0",
                    ep.method === "GET"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}
                >
                  {ep.method}
                </Badge>
                <code className="text-xs truncate flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground shrink-0 hidden lg:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground pt-1">
            URL base: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{baseUrl}</code>
          </p>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </CardTitle>
          <CardDescription>
            {apiKeys?.length
              ? `${apiKeys.length} chave${apiKeys.length > 1 ? "s" : ""} cadastrada${apiKeys.length > 1 ? "s" : ""}`
              : "Nenhuma chave cadastrada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !apiKeys?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma API Key cadastrada</p>
              <p className="text-sm mt-1">Crie uma API Key para começar a integrar seu bot de atendimento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    key.isActive
                      ? "bg-background"
                      : "bg-muted/50 opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name + Status */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge
                          variant={key.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-[10px]",
                            key.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : ""
                          )}
                        >
                          {key.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                        {(key as any).isGlobal && (
                          <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                            Global
                          </Badge>
                        )}
                      </div>

                      {/* API Key */}
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-md">
                          {visibleKeys.has(key.id) ? key.apiKey : maskKey(key.apiKey)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(key.apiKey)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {key.requestCount} requisições
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último uso: {formatDate(key.lastUsedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={key.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: key.id, isActive: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteKeyId(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Qualquer bot que esteja usando esta chave perderá o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteKeyId && deleteMutation.mutate({ id: deleteKeyId })}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminLayout>
  );
}
