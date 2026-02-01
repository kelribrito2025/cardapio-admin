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
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
  Link2,
  Unlink,
  Copy,
  Store,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function IntegrationsTab() {
  // Estados do fluxo de conexão
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [connectionStep, setConnectionStep] = useState<"idle" | "waiting_code" | "entering_code">("idle");
  const [userCodeData, setUserCodeData] = useState<{
    userCode: string;
    verificationUrl: string;
    expiresIn: number;
  } | null>(null);

  // Buscar configuração existente
  const { data: config, isLoading, refetch } = trpc.ifood.getConfig.useQuery();

  // Mutations
  const startConnectionMutation = trpc.ifood.startConnection.useMutation({
    onSuccess: (result) => {
      setUserCodeData({
        userCode: result.userCode,
        verificationUrl: result.verificationUrlComplete || result.verificationUrl,
        expiresIn: result.expiresIn,
      });
      setConnectionStep("waiting_code");
      toast.success("Código gerado! Siga as instruções abaixo.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar conexão");
      setConnectionStep("idle");
    }
  });

  const completeConnectionMutation = trpc.ifood.completeConnection.useMutation({
    onSuccess: () => {
      toast.success("Conexão estabelecida com sucesso!");
      setConnectionStep("idle");
      setAuthorizationCode("");
      setUserCodeData(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao completar conexão");
    }
  });

  const disconnectMutation = trpc.ifood.disconnect.useMutation({
    onSuccess: () => {
      toast.success("iFood desconectado com sucesso");
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

  const handleStartConnection = () => {
    setConnectionStep("waiting_code");
    startConnectionMutation.mutate();
  };

  const handleCompleteConnection = () => {
    if (!authorizationCode.trim()) {
      toast.error("Cole o código de autorização");
      return;
    }
    completeConnectionMutation.mutate({ authorizationCode: authorizationCode.trim() });
  };

  const handleCopyCode = () => {
    if (userCodeData?.userCode) {
      navigator.clipboard.writeText(userCodeData.userCode);
      toast.success("Código copiado!");
    }
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

  return (
    <div className="space-y-6">
      {/* iFood Integration Card */}
      <SectionCard 
        title="Integração iFood" 
        description="Receba pedidos do iFood diretamente no seu painel"
      >
        <div className="space-y-6">
          {/* Status da Integração */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                config?.isConnected && config?.isActive ? "bg-green-500" : 
                config?.isConnected ? "bg-yellow-500" : "bg-gray-400"
              )} />
              <div>
                <p className="font-medium">
                  {config?.isConnected && config?.isActive ? "Integração Ativa" : 
                   config?.isConnected ? "Conectado (Inativo)" : "Não Conectado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config?.isConnected 
                    ? config?.merchantName || "Loja conectada" 
                    : "Conecte sua conta do iFood"}
                </p>
              </div>
            </div>
            {config?.isConnected && (
              <Switch
                checked={config?.isActive || false}
                onCheckedChange={handleToggleActive}
                disabled={toggleActiveMutation.isPending}
              />
            )}
          </div>

          {/* Se conectado - Mostrar informações */}
          {config?.isConnected ? (
            <div className="space-y-4">
              {/* Informações da Loja */}
              {config.merchantName && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <Store className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {config.merchantName}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ID: {config.merchantId}
                    </p>
                  </div>
                </div>
              )}

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
                    onCheckedChange={(checked) => {
                      // TODO: Implementar mutation para atualizar
                    }}
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
                    checked={config?.notifyOnNewOrder || true}
                    onCheckedChange={(checked) => {
                      // TODO: Implementar mutation para atualizar
                    }}
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
            /* Se não conectado - Mostrar fluxo de conexão */
            <div className="space-y-4">
              {connectionStep === "idle" && (
                <>
                  {/* Informações de ajuda */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300">Como funciona:</p>
                      <ol className="mt-2 space-y-1 text-blue-600 dark:text-blue-400 list-decimal list-inside">
                        <li>Clique em "Conectar iFood"</li>
                        <li>Um código será gerado para você</li>
                        <li>Acesse o Partner Portal do iFood e insira o código</li>
                        <li>Autorize o acesso e cole o código de confirmação aqui</li>
                      </ol>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartConnection}
                    disabled={startConnectionMutation.isPending}
                    className="w-full"
                  >
                    {startConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Conectar iFood
                  </Button>
                </>
              )}

              {connectionStep === "waiting_code" && userCodeData && (
                <div className="space-y-4">
                  {/* Código para o usuário */}
                  <div className="p-6 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      Seu código de conexão:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-bold text-amber-700 dark:text-amber-300 tracking-widest">
                        {userCodeData.userCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-500">
                      <Clock className="h-3 w-3" />
                      <span>Válido por {Math.floor(userCodeData.expiresIn / 60)} minutos</span>
                    </div>
                  </div>

                  {/* Instruções */}
                  <div className="space-y-3">
                    <p className="font-medium">Siga os passos:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>
                        Acesse o{" "}
                        <a 
                          href={userCodeData.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline inline-flex items-center gap-1"
                        >
                          Partner Portal do iFood
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>Faça login com sua conta do iFood Parceiros</li>
                      <li>Insira o código <strong>{userCodeData.userCode}</strong> quando solicitado</li>
                      <li>Autorize o acesso do Mindi à sua conta</li>
                      <li>Copie o código de autorização que será exibido</li>
                    </ol>
                  </div>

                  {/* Campo para código de autorização */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="authCode">Código de Autorização</Label>
                    <Input
                      id="authCode"
                      value={authorizationCode}
                      onChange={(e) => setAuthorizationCode(e.target.value)}
                      placeholder="Cole aqui o código de autorização do iFood"
                    />
                    <p className="text-xs text-muted-foreground">
                      Após autorizar no Partner Portal, você receberá um código. Cole-o acima.
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConnectionStep("idle");
                        setUserCodeData(null);
                        setAuthorizationCode("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCompleteConnection}
                      disabled={completeConnectionMutation.isPending || !authorizationCode.trim()}
                      className="flex-1"
                    >
                      {completeConnectionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Conexão
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Outras Integrações (Em breve) */}
      <SectionCard 
        title="Outras Integrações" 
        description="Em breve você poderá conectar outras plataformas"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Rappi", color: "bg-orange-100 text-orange-600" },
            { name: "Uber Eats", color: "bg-green-100 text-green-600" },
            { name: "99Food", color: "bg-yellow-100 text-yellow-600" },
            { name: "Aiqfome", color: "bg-purple-100 text-purple-600" },
          ].map((platform) => (
            <div 
              key={platform.name}
              className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center opacity-50"
            >
              <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-full mb-2", platform.color)}>
                <Store className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{platform.name}</p>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
