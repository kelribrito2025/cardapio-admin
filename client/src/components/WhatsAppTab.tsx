import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  MessageCircle, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Send,
  FileText,
  Smartphone,
  Unplug
} from "lucide-react";

export function WhatsAppTab() {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do Cardápio Admin.");
  const [isPolling, setIsPolling] = useState(false);
  
  // Notification settings
  const [requireOrderConfirmation, setRequireOrderConfirmation] = useState(false);
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnPreparing, setNotifyOnPreparing] = useState(true);
  const [notifyOnReady, setNotifyOnReady] = useState(true);
  const [notifyOnCompleted, setNotifyOnCompleted] = useState(false);
  const [notifyOnCancelled, setNotifyOnCancelled] = useState(true);
  
  // Templates padrão
  const DEFAULT_TEMPLATES = {
    newOrder: `Olá *{{customerName}}!* 👋🏻 {{greeting}}! Tudo bem?\n\nSeu pedido *{{orderNumber}}* foi recebido com sucesso!\n\n🔔 Você será notificado por aqui em cada atualização.`,
    preparing: `👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!`,
    ready: `✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{deliveryMessage}}`,
    completed: `Seu pedido {{orderNumber}} foi finalizado!\n\n📌 Atualização de fidelidade\n\n*+1 carimbo* adicionado ao seu cartão.\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`,
    cancelled: `Olá *{{customerName}}!*\n\n❌ Infelizmente seu pedido {{orderNumber}} foi cancelado.\n\nMotivo: *{{cancellationReason}}*`,
  };
  
  // Templates
  const [templateNewOrder, setTemplateNewOrder] = useState(DEFAULT_TEMPLATES.newOrder);
  const [templatePreparing, setTemplatePreparing] = useState(DEFAULT_TEMPLATES.preparing);
  const [templateReady, setTemplateReady] = useState(DEFAULT_TEMPLATES.ready);
  const [templateCompleted, setTemplateCompleted] = useState(DEFAULT_TEMPLATES.completed);
  const [templateCancelled, setTemplateCancelled] = useState(DEFAULT_TEMPLATES.cancelled);
  
  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const statusQuery = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: isPolling ? 3000 : false,
  });
  
  const saveNotificationsMutation = trpc.whatsapp.saveNotificationSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      configQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });
  
  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: (data) => {
      if (data.qrcode) {
        toast.success("QR Code gerado! Escaneie com seu WhatsApp.");
        setIsPolling(true);
      } else if (data.status === 'connected') {
        toast.success("WhatsApp já está conectado!");
      }
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar");
    },
  });
  
  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado!");
      setIsPolling(false);
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    },
  });
  
  const sendTestMutation = trpc.whatsapp.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Mensagem de teste enviada!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });
  
  const saveTemplatesMutation = trpc.whatsapp.saveTemplates.useMutation({
    onSuccess: () => {
      toast.success("Templates salvos com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar templates");
    },
  });
  
  // Load config data
  useEffect(() => {
    if (configQuery.data) {
      setRequireOrderConfirmation((configQuery.data as any).requireOrderConfirmation ?? false);
      setNotifyOnNewOrder(configQuery.data.notifyOnNewOrder ?? true);
      setNotifyOnPreparing(configQuery.data.notifyOnPreparing ?? true);
      setNotifyOnReady(configQuery.data.notifyOnReady ?? true);
      setNotifyOnCompleted(configQuery.data.notifyOnCompleted ?? false);
      setNotifyOnCancelled(configQuery.data.notifyOnCancelled ?? true);
      // Usar templates salvos ou manter os padrões
      setTemplateNewOrder(configQuery.data.templateNewOrder || DEFAULT_TEMPLATES.newOrder);
      setTemplatePreparing(configQuery.data.templatePreparing || DEFAULT_TEMPLATES.preparing);
      setTemplateReady(configQuery.data.templateReady || DEFAULT_TEMPLATES.ready);
      setTemplateCompleted(configQuery.data.templateCompleted || DEFAULT_TEMPLATES.completed);
      setTemplateCancelled(configQuery.data.templateCancelled || DEFAULT_TEMPLATES.cancelled);
    }
  }, [configQuery.data]);
  
  // Stop polling when connected
  useEffect(() => {
    if (statusQuery.data?.status === 'connected') {
      setIsPolling(false);
    }
  }, [statusQuery.data?.status]);
  
  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate({
      requireOrderConfirmation,
      notifyOnNewOrder,
      notifyOnPreparing,
      notifyOnReady,
      notifyOnCompleted,
      notifyOnCancelled,
    });
  };
  
  const handleConnect = () => {
    connectMutation.mutate();
  };
  
  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };
  
  const handleSendTest = () => {
    if (!testPhone) {
      toast.error("Digite um número de telefone");
      return;
    }
    sendTestMutation.mutate({ phone: testPhone, message: testMessage });
  };
  
  const handleSaveTemplates = () => {
    saveTemplatesMutation.mutate({
      templateNewOrder: templateNewOrder || null,
      templatePreparing: templatePreparing || null,
      templateReady: templateReady || null,
      templateCompleted: templateCompleted || null,
      templateCancelled: templateCancelled || null,
    });
  };
  
  const status = statusQuery.data?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Status da Conexão
          </CardTitle>
          <CardDescription>
            Conecte seu WhatsApp para enviar notificações automáticas aos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600">Conectado</p>
                    {statusQuery.data?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {statusQuery.data.phone}
                      </p>
                    )}
                  </div>
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                  <div>
                    <p className="font-medium text-yellow-600">Aguardando conexão...</p>
                    <p className="text-sm text-muted-foreground">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium text-red-600">Desconectado</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em Conectar para gerar o QR Code
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusQuery.refetch()}
                disabled={statusQuery.isRefetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statusQuery.isRefetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              {isConnected ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                >
                  <Unplug className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending}
                  size="sm"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Conectar
                </Button>
              )}
            </div>
          </div>
          
          {/* QR Code Display */}
          {(isConnecting || connectMutation.data?.qrcode || statusQuery.data?.qrcode) && !isConnected && (
            <div className="mt-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                {(connectMutation.data?.qrcode || statusQuery.data?.qrcode) ? (
                  <img 
                    src={connectMutation.data?.qrcode || statusQuery.data?.qrcode} 
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Abra o WhatsApp no seu celular, vá em <strong>Dispositivos conectados</strong> e escaneie o QR Code
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Teste</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações Automáticas</CardTitle>
              <CardDescription>
                Configure quando enviar mensagens automáticas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Confirmação de Pedido com Botões */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-amber-800 font-semibold flex items-center gap-2">
                        📱 Confirmação via Botões
                      </Label>
                      <p className="text-sm text-amber-700">
                        Enviar botões interativos para o cliente confirmar ou cancelar o pedido antes de começar a preparar
                      </p>
                    </div>
                    <Switch
                      checked={requireOrderConfirmation}
                      onCheckedChange={setRequireOrderConfirmation}
                    />
                  </div>
                  {requireOrderConfirmation && (
                    <div className="mt-3 p-3 bg-white rounded-md border border-amber-100">
                      <p className="text-xs text-amber-600 mb-2">
                        <strong>Como funciona:</strong>
                      </p>
                      <ol className="text-xs text-amber-600 list-decimal list-inside space-y-1">
                        <li>Cliente faz o pedido no cardápio</li>
                        <li>Recebe mensagem com botões: "✅ Ok, pode fazer" ou "❌ Não quero mais"</li>
                        <li>Se confirmar, o pedido aparece na página de Pedidos</li>
                        <li>Se cancelar, o pedido é automaticamente cancelado</li>
                      </ol>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Notificações de Status</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novo Pedido</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando um novo pedido for recebido
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnNewOrder}
                    onCheckedChange={setNotifyOnNewOrder}
                    disabled={requireOrderConfirmation}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preparando</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido começar a ser preparado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnPreparing}
                    onCheckedChange={setNotifyOnPreparing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pronto</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido estiver pronto
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnReady}
                    onCheckedChange={setNotifyOnReady}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Finalizado</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido for entregue/retirado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnCompleted}
                    onCheckedChange={setNotifyOnCompleted}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancelado</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar quando o pedido for cancelado
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnCancelled}
                    onCheckedChange={setNotifyOnCancelled}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveNotifications}
                disabled={saveNotificationsMutation.isPending}
              >
                {saveNotificationsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>
                Personalize as mensagens enviadas aos clientes. Use as variáveis: 
                <code className="mx-1 px-1 bg-muted rounded">{"{{customerName}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{orderNumber}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{establishmentName}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{greeting}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{deliveryMessage}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{cancellationReason}}"}</code>,
                <code className="mx-1 px-1 bg-muted rounded">{"{{itensPedido}}"}</code>
                <span className="text-xs block mt-1 text-muted-foreground">
                  • {"{{greeting}}"} - saudação automática baseada no horário (Bom dia/Boa tarde/Boa noite)
                  <br />• {"{{deliveryMessage}}"} - mensagem automática de retirada ou entrega (apenas no status Pronto)
                  <br />• {"{{cancellationReason}}"} - motivo do cancelamento (apenas no status Cancelado)
                  <br />• {"{{itensPedido}}"} - lista completa dos itens do pedido (produtos, complementos, observações e total)
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Novo Pedido</Label>
                  <Textarea
                    value={templateNewOrder}
                    onChange={(e) => setTemplateNewOrder(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preparando</Label>
                  <Textarea
                    value={templatePreparing}
                    onChange={(e) => setTemplatePreparing(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pronto</Label>
                  <Textarea
                    value={templateReady}
                    onChange={(e) => setTemplateReady(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="px-1 bg-muted rounded">{"{{deliveryMessage}}"}</code> para mensagem automática:
                    <br />• <strong>Retirada:</strong> "Você já pode vir retirar. 😄"
                    <br />• <strong>Entrega:</strong> "🛵 Nosso entregador já está a caminho."
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Finalizado</Label>
                  <Textarea
                    value={templateCompleted}
                    onChange={(e) => setTemplateCompleted(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cancelado</Label>
                  <Textarea
                    value={templateCancelled}
                    onChange={(e) => setTemplateCancelled(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="px-1 bg-muted rounded">{"{{cancellationReason}}"}</code> para incluir o motivo do cancelamento informado no modal.
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Personalize as mensagens conforme sua preferência. Use as variáveis para inserir dados do pedido automaticamente.
              </p>
              
              <Button 
                onClick={handleSaveTemplates}
                disabled={saveTemplatesMutation.isPending}
              >
                {saveTemplatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem de Teste</CardTitle>
              <CardDescription>
                Teste a conexão enviando uma mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Conecte seu WhatsApp primeiro para enviar mensagens de teste
                  </p>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="testPhone">Telefone</Label>
                  <Input
                    id="testPhone"
                    placeholder="(11) 99999-9999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    disabled={!isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testMessage">Mensagem</Label>
                  <Input
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={!isConnected}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending || !isConnected}
                variant="outline"
              >
                {sendTestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Teste
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
