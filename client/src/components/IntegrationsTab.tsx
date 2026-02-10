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
    <div className="space-y-6">
      {/* iFood Integration Card */}
      <SectionCard 
        title="Integração iFood"
      >
        <div className="space-y-6">
          {/* Status da Integração */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected && config?.isActive ? "bg-green-500" : 
                isConnected ? "bg-yellow-500" : "bg-muted-foreground/50"
              )} />
              <div>
                <p className="font-medium">
                  {isConnected && config?.isActive ? "Integração Ativa" : 
                   isConnected ? "Conectado (Inativo)" : "Não Conectado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? config?.merchantName || `Merchant ID: ${config?.merchantId}`
                    : "Configure o Merchant ID da sua loja"}
                </p>
              </div>
            </div>
            {isConnected && (
              <Switch
                checked={config?.isActive || false}
                onCheckedChange={handleToggleActive}
                disabled={toggleActiveMutation.isPending}
              />
            )}
          </div>

          {/* Se conectado - Mostrar informações */}
          {isConnected ? (
            <div className="space-y-4">
              {/* Informações da Loja */}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <Store className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    {config.merchantName || "Loja Conectada"}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Merchant ID: {config.merchantId}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              {/* Opções */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Opções</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAccept">Aceitar pedidos automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Pedidos serão aceitos automaticamente ao chegar
                    </p>
                  </div>
                  <Switch
                    id="autoAccept"
                    checked={config?.autoAcceptOrders || false}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyNewOrder">Notificar novos pedidos</Label>
                    <p className="text-xs text-muted-foreground">
                      Receber notificação sonora quando chegar pedido do iFood
                    </p>
                  </div>
                  <Switch
                    id="notifyNewOrder"
                    checked={true}
                    disabled
                  />
                </div>
              </div>

              {/* Botão Desconectar */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Desconectar iFood
                </Button>
              </div>
            </div>
          ) : (
            /* Se não conectado - Mostrar formulário simples */
            <div className="space-y-4">
              {/* Informações de ajuda */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Como obter o Merchant ID:</p>
                  <ol className="mt-2 space-y-1 text-blue-600 dark:text-blue-400 list-decimal list-inside">
                    <li>Acesse o <a href="https://portal.ifood.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Portal do Parceiro iFood</a></li>
                    <li>Vá em Configurações da Loja</li>
                    <li>Copie o ID da loja (Merchant ID)</li>
                    <li>Cole no campo abaixo</li>
                  </ol>
                </div>
              </div>

              {/* Campo Merchant ID */}
              <div className="space-y-2">
                <Label htmlFor="merchantId">Merchant ID *</Label>
                <Input
                  id="merchantId"
                  placeholder="Ex: 21e5dcf5-2e41-4d15-9564-32b6b5c78a40"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  disabled={saveMerchantMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  O Merchant ID é o identificador único da sua loja no iFood
                </p>
              </div>

              {/* Aviso de validação */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  O Merchant ID será validado com a API do iFood antes de conectar. 
                  Certifique-se de que o ID está correto.
                </p>
              </div>

              <Button
                onClick={handleSaveMerchant}
                disabled={saveMerchantMutation.isPending || !merchantId.trim()}
                className="w-full"
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
          )}
        </div>
      </SectionCard>

    </div>
  );
}
