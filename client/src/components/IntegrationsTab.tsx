import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
  Link2,
  Unlink,
  Store,
  Save,
  AlertCircle,
  Settings2,
  Bell,
  Zap,
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function IntegrationsTab() {
  const [merchantId, setMerchantId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Buscar configuração existente
  const { data: config, isLoading, refetch } = trpc.ifood.getConfig.useQuery();

  // Atualizar merchantId quando config carregar
  useEffect(() => {
    if (config?.merchantId) {
      setMerchantId(config.merchantId);
    }
  }, [config?.merchantId]);

  // Mutations
  const saveMerchantMutation = trpc.ifood.saveMerchantId.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Conexão estabelecida com sucesso!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar com iFood");
    }
  });

  const disconnectMutation = trpc.ifood.disconnect.useMutation({
    onSuccess: () => {
      toast.success("iFood desconectado com sucesso");
      setMerchantId("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    }
  });

  const toggleActiveMutation = trpc.ifood.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status alterado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar status");
    }
  });

  const handleSaveMerchant = () => {
    if (!merchantId.trim()) {
      toast.error("Informe o Merchant ID da sua loja no iFood");
      return;
    }
    saveMerchantMutation.mutate({ merchantId: merchantId.trim() });
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate({ isActive: !config?.isActive });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = config?.isConnected && config?.merchantId;

  return (
    <div className="space-y-5">
      {/* Layout em duas colunas */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Coluna esquerda (40%) - Status e Conexão */}
        <div className="w-full lg:w-[40%] space-y-5">

          {/* Card Status iFood */}
          <SectionCard
            title="iFood"
            description="Integração com marketplace"
            icon={
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            }
            iconBg="bg-red-100 dark:bg-red-500/15"
          >
            <div className="space-y-4">
              {/* Badge de status */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isConnected && config?.isActive
                    ? "bg-green-100 dark:bg-green-500/15"
                    : isConnected
                      ? "bg-yellow-100 dark:bg-yellow-500/15"
                      : "bg-slate-100 dark:bg-slate-500/15"
                )}>
                  {isConnected && config?.isActive ? (
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isConnected ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Link2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {isConnected && config?.isActive
                        ? "Integração Ativa"
                        : isConnected
                          ? "Conectado (Inativo)"
                          : "Não Conectado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isConnected
                      ? config?.merchantName || `ID: ${config?.merchantId}`
                      : "Configure o Merchant ID da sua loja"}
                  </p>
                </div>
                {isConnected && (
                  <Switch
                    checked={config?.isActive || false}
                    onCheckedChange={handleToggleActive}
                    disabled={toggleActiveMutation.isPending}
                  />
                )}
              </div>

              {/* Info da loja conectada */}
              {isConnected && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <Store className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-green-700 dark:text-green-300">
                      {config.merchantName || "Loja Conectada"}
                    </p>
                    <p className="text-[10px] text-green-600 dark:text-green-400 truncate">
                      {config.merchantId}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                </div>
              )}

              {/* Botão desconectar */}
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="w-full rounded-xl h-9 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5 mr-2" />
                  )}
                  Desconectar iFood
                </Button>
              )}
            </div>
          </SectionCard>

          {/* Card Como Conectar (quando não conectado) */}
          {!isConnected && (
            <SectionCard
              title="Como conectar"
              description="Passo a passo"
              icon={<HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              iconBg="bg-blue-100 dark:bg-blue-500/15"
            >
              <div className="space-y-3">
                {[
                  { step: "1", text: "Acesse o Portal do Parceiro iFood" },
                  { step: "2", text: "Vá em Configurações da Loja" },
                  { step: "3", text: "Copie o ID da loja (Merchant ID)" },
                  { step: "4", text: "Cole no campo ao lado e conecte" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.step}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
                <a
                  href="https://portal.ifood.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir Portal do Parceiro iFood
                </a>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Coluna direita (60%) - Configuração e Opções */}
        <div className="flex-1 space-y-5">

          {/* Card Formulário de Conexão (quando não conectado) */}
          {!isConnected && (
            <SectionCard
              title="Conectar loja"
              description="Informe o Merchant ID da sua loja no iFood"
              icon={<Link2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-100 dark:bg-amber-500/15"
            >
              <div className="space-y-4">
                {/* Campo Merchant ID */}
                <div className="space-y-2">
                  <Label htmlFor="merchantId" className="text-sm font-semibold">Merchant ID *</Label>
                  <Input
                    id="merchantId"
                    placeholder="Ex: 21e5dcf5-2e41-4d15-9564-32b6b5c78a40"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    disabled={saveMerchantMutation.isPending}
                    className="rounded-xl h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    O Merchant ID é o identificador único da sua loja no iFood
                  </p>
                </div>

                {/* Aviso de validação */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    O Merchant ID será validado com a API do iFood antes de conectar.
                    Certifique-se de que o ID está correto.
                  </p>
                </div>

                <Button
                  onClick={handleSaveMerchant}
                  disabled={saveMerchantMutation.isPending || !merchantId.trim()}
                  className="w-full rounded-xl h-10"
                >
                  {saveMerchantMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando Merchant ID...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Conectar iFood
                    </>
                  )}
                </Button>
              </div>
            </SectionCard>
          )}

          {/* Card Opções (quando conectado) */}
          {isConnected && (
            <SectionCard
              title="Opções"
              description="Configurações da integração"
              icon={<Settings2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
              iconBg="bg-slate-100 dark:bg-slate-500/15"
            >
              <div className="space-y-3">
                {/* Aceitar pedidos automaticamente */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                      <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Aceitar pedidos automaticamente</p>
                      <p className="text-xs text-muted-foreground">
                        Pedidos serão aceitos automaticamente ao chegar
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="autoAccept"
                    checked={config?.autoAcceptOrders || false}
                    disabled
                  />
                </div>

                {/* Notificar novos pedidos */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Notificar novos pedidos</p>
                      <p className="text-xs text-muted-foreground">
                        Receber notificação sonora quando chegar pedido do iFood
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifyNewOrder"
                    checked={true}
                    disabled
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Card Funcionalidades (quando conectado) */}
          {isConnected && (
            <SectionCard
              title="Funcionalidades"
              description="O que a integração oferece"
              icon={<Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              iconBg="bg-amber-100 dark:bg-amber-500/15"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Store, label: "Receber pedidos", desc: "Pedidos do iFood no painel", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                  { icon: Bell, label: "Notificações", desc: "Alertas em tempo real", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                  { icon: Settings2, label: "Gestão de status", desc: "Aceitar, preparar, entregar", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/10" },
                  { icon: Zap, label: "Sincronização", desc: "Cardápio sincronizado", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                    <div className={cn("p-2 rounded-lg", item.bg)}>
                      <item.icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-xs">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
