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
  Settings, 
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
  const [subdomain, setSubdomain] = useState("");
  const [token, setToken] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do Cardápio Admin.");
  const [isPolling, setIsPolling] = useState(false);
  
  // Notification settings
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnPreparing, setNotifyOnPreparing] = useState(true);
  const [notifyOnReady, setNotifyOnReady] = useState(true);
  const [notifyOnCompleted, setNotifyOnCompleted] = useState(false);
  const [notifyOnCancelled, setNotifyOnCancelled] = useState(true);
  
  // Templates
  const [templateNewOrder, setTemplateNewOrder] = useState("");
  const [templatePreparing, setTemplatePreparing] = useState("");
  const [templateReady, setTemplateReady] = useState("");
  const [templateCompleted, setTemplateCompleted] = useState("");
  const [templateCancelled, setTemplateCancelled] = useState("");
  
  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const statusQuery = trpc.whatsapp.getStatus.useQuery(undefined, {
    enabled: !!configQuery.data,
    refetchInterval: isPolling ? 3000 : false,
  });
  
  const saveConfigMutation = trpc.whatsapp.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
      configQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configuração");
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
      setSubdomain(configQuery.data.subdomain || "");
      // Token is masked, don't overwrite if user is editing
      setNotifyOnNewOrder(configQuery.data.notifyOnNewOrder ?? true);
      setNotifyOnPreparing(configQuery.data.notifyOnPreparing ?? true);
      setNotifyOnReady(configQuery.data.notifyOnReady ?? true);
      setNotifyOnCompleted(configQuery.data.notifyOnCompleted ?? false);
      setNotifyOnCancelled(configQuery.data.notifyOnCancelled ?? true);
      setTemplateNewOrder(configQuery.data.templateNewOrder || "");
      setTemplatePreparing(configQuery.data.templatePreparing || "");
      setTemplateReady(configQuery.data.templateReady || "");
      setTemplateCompleted(configQuery.data.templateCompleted || "");
      setTemplateCancelled(configQuery.data.templateCancelled || "");
    }
  }, [configQuery.data]);
  
  // Stop polling when connected
  useEffect(() => {
    if (statusQuery.data?.status === 'connected') {
      setIsPolling(false);
    }
  }, [statusQuery.data?.status]);
  
  const handleSaveConfig = () => {
    if (!subdomain || !token) {
      toast.error("Preencha o subdomínio e token da UAZAPI");
      return;
    }
    
    saveConfigMutation.mutate({
      subdomain,
      token,
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
                      Configure e conecte seu WhatsApp
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
                  disabled={connectMutation.isPending || !configQuery.data}
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
      
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuração</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais UAZAPI</CardTitle>
              <CardDescription>
                Configure suas credenciais da UAZAPI para conectar o WhatsApp.
                Acesse <a href="https://uazapi.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">uazapi.com</a> para criar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomínio</Label>
                  <Input
                    id="subdomain"
                    placeholder="ex: free, premium, etc"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    O subdomínio da sua instância (ex: free.uazapi.com → "free")
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="token">Token de Autenticação</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Cole seu token aqui"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token encontrado no painel da UAZAPI
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
          
          {/* Test Message */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Enviar Mensagem de Teste</CardTitle>
                <CardDescription>
                  Teste a conexão enviando uma mensagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Telefone</Label>
                    <Input
                      id="testPhone"
                      placeholder="(11) 99999-9999"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testMessage">Mensagem</Label>
                    <Input
                      id="testMessage"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending}
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
          )}
        </TabsContent>
        
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
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
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
                <code className="mx-1 px-1 bg-muted rounded">{"{{establishmentName}}"}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Novo Pedido</Label>
                  <Textarea
                    placeholder="Olá {{customerName}}! 🎉 Seu pedido {{orderNumber}} foi recebido..."
                    value={templateNewOrder}
                    onChange={(e) => setTemplateNewOrder(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preparando</Label>
                  <Textarea
                    placeholder="Olá {{customerName}}! 👨‍🍳 Seu pedido {{orderNumber}} está sendo preparado..."
                    value={templatePreparing}
                    onChange={(e) => setTemplatePreparing(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pronto</Label>
                  <Textarea
                    placeholder="Olá {{customerName}}! ✅ Seu pedido {{orderNumber}} está pronto..."
                    value={templateReady}
                    onChange={(e) => setTemplateReady(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Finalizado</Label>
                  <Textarea
                    placeholder="Olá {{customerName}}! 🙏 Seu pedido {{orderNumber}} foi finalizado..."
                    value={templateCompleted}
                    onChange={(e) => setTemplateCompleted(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cancelado</Label>
                  <Textarea
                    placeholder="Olá {{customerName}}! ❌ Seu pedido {{orderNumber}} foi cancelado..."
                    value={templateCancelled}
                    onChange={(e) => setTemplateCancelled(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Deixe em branco para usar o template padrão
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
      </Tabs>
    </div>
  );
}
