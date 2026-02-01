import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function IntegrationsTab() {
  // Estados do formulário iFood
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Buscar configuração existente
  const { data: config, isLoading, refetch } = trpc.ifood.getConfig.useQuery();

  // Atualizar estados quando config mudar
  React.useEffect(() => {
    if (config) {
      setClientId(config.clientId || "");
      setClientSecret(config.clientSecret || "");
      setMerchantId(config.merchantId || "");
      setIsActive(config.isActive);
      setAutoAcceptOrders(config.autoAcceptOrders);
      setNotifyOnNewOrder(config.notifyOnNewOrder);
    }
  }, [config]);

  // Mutations
  const saveConfigMutation = trpc.ifood.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configuração");
    }
  });

  const testConnectionMutation = trpc.ifood.testConnection.useMutation({
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        toast.success(result.message || "Conexão estabelecida!");
      } else {
        toast.error(result.error || "Falha na conexão");
      }
      setIsTesting(false);
    },
    onError: (error) => {
      setTestResult({ success: false, error: error.message });
      toast.error(error.message || "Erro ao testar conexão");
      setIsTesting(false);
    }
  });

  const toggleActiveMutation = trpc.ifood.toggleActive.useMutation({
    onSuccess: () => {
      toast.success(isActive ? "Integração desativada" : "Integração ativada");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar status");
    }
  });

  const handleSave = () => {
    if (!clientId || !clientSecret) {
      toast.error("Client ID e Client Secret são obrigatórios");
      return;
    }

    saveConfigMutation.mutate({
      clientId,
      clientSecret,
      merchantId: merchantId || undefined,
      isActive,
      autoAcceptOrders,
      notifyOnNewOrder,
    });
  };

  const handleTestConnection = () => {
    if (!clientId || !clientSecret) {
      toast.error("Preencha Client ID e Client Secret para testar");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    testConnectionMutation.mutate({ clientId, clientSecret });
  };

  const handleToggleActive = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    toggleActiveMutation.mutate({ isActive: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* iFood Integration Card */}
      <SectionCard 
        title="Integração iFood" 
        description="Conecte sua conta do iFood para receber pedidos automaticamente"
      >
        <div className="space-y-6">
          {/* Status da Integração */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                config?.hasCredentials && isActive ? "bg-green-500" : "bg-gray-400"
              )} />
              <div>
                <p className="font-medium">
                  {config?.hasCredentials && isActive ? "Integração Ativa" : "Integração Inativa"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config?.hasCredentials 
                    ? "Credenciais configuradas" 
                    : "Configure suas credenciais abaixo"}
                </p>
              </div>
            </div>
            {config?.hasCredentials && (
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={toggleActiveMutation.isPending}
              />
            )}
          </div>

          {/* Informações de ajuda */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">Como obter as credenciais:</p>
              <ol className="mt-2 space-y-1 text-blue-600 dark:text-blue-400 list-decimal list-inside">
                <li>Acesse o <a href="https://developer.ifood.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">Portal do Desenvolvedor iFood</a></li>
                <li>Crie ou selecione seu aplicativo</li>
                <li>Copie o Client ID e Client Secret</li>
                <li>Configure o Webhook URL: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">https://v2.mindi.com.br/api/ifood/webhook</code></li>
              </ol>
            </div>
          </div>

          {/* Formulário de Credenciais */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ex: 6a88bf27-4329-49ad-a074-d5c1676787d6"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Cole seu Client Secret aqui"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="merchantId">Merchant ID (opcional)</Label>
              <Input
                id="merchantId"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="ID da sua loja no iFood"
              />
              <p className="text-xs text-muted-foreground">
                O Merchant ID é preenchido automaticamente quando você recebe o primeiro pedido
              </p>
            </div>
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-lg",
              testResult.success 
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" 
                : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            )}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <p className={cn(
                "text-sm",
                testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              )}>
                {testResult.success ? testResult.message : testResult.error}
              </p>
            </div>
          )}

          {/* Opções Adicionais */}
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
                checked={autoAcceptOrders}
                onCheckedChange={setAutoAcceptOrders}
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
                checked={notifyOnNewOrder}
                onCheckedChange={setNotifyOnNewOrder}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || !clientId || !clientSecret}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>

            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending || !clientId || !clientSecret}
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configuração
            </Button>

            <Button
              variant="ghost"
              asChild
            >
              <a href="https://developer.ifood.com.br" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Portal iFood
              </a>
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Futuras Integrações */}
      <SectionCard 
        title="Outras Integrações" 
        description="Em breve mais integrações estarão disponíveis"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rappi */}
          <div className="p-4 border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">R</span>
              </div>
              <div>
                <p className="font-medium">Rappi</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>

          {/* Uber Eats */}
          <div className="p-4 border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">UE</span>
              </div>
              <div>
                <p className="font-medium">Uber Eats</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>

          {/* 99Food */}
          <div className="p-4 border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-sm">99</span>
              </div>
              <div>
                <p className="font-medium">99Food</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>

          {/* Aiqfome */}
          <div className="p-4 border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">AQ</span>
              </div>
              <div>
                <p className="font-medium">Aiqfome</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
