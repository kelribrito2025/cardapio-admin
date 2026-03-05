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
import { TemplatesEditor } from "@/components/TemplatesEditor";

interface WhatsAppTabProps {
  hideConnectionCard?: boolean;
  activeSubTab?: "notifications" | "templates";
  showOnlyContent?: boolean;
}

export function WhatsAppTab({ hideConnectionCard = false, activeSubTab, showOnlyContent = false }: WhatsAppTabProps) {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do Cardápio Admin.");
  const [isPolling, setIsPolling] = useState(false);
  
  // Get establishment data for restaurant name
  const { data: establishment } = trpc.establishment.get.useQuery();
  
  // Notification settings
  const [requireOrderConfirmation, setRequireOrderConfirmation] = useState(false);
  const [notifyOnNewOrder, setNotifyOnNewOrder] = useState(true);
  const [notifyOnPreparing, setNotifyOnPreparing] = useState(true);
  const [notifyOnReady, setNotifyOnReady] = useState(true);
  const [notifyOnCompleted, setNotifyOnCompleted] = useState(false);
  const [notifyOnCancelled, setNotifyOnCancelled] = useState(true);
  const [notifyOnReservation, setNotifyOnReservation] = useState(false);
  
  // Templates padrão
  const DEFAULT_TEMPLATES = {
    newOrder: `Olá *{{customerName}}!* 👋🏻 {{greeting}}! Tudo bem?\n\nSeu pedido *{{orderNumber}}* foi recebido com sucesso!\n\n🔔 Você será notificado por aqui em cada atualização.`,
    preparing: `👨‍🍳 *{{customerName}},* seu pedido *{{orderNumber}}* está sendo preparado!`,
    ready: `✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{deliveryMessage}}`,
    readyPickup: `✅ Seu pedido *{{orderNumber}}* está pronto!\n\n{{pickupMessage}}`,
    completed: `Seu pedido {{orderNumber}} foi finalizado!\n\n📌 Atualização de fidelidade\n\n*+1 carimbo* adicionado ao seu cartão.\n\n❤️ Obrigado pela preferência!\n\n*{{establishmentName}}*`,
    cancelled: `Olá *{{customerName}}!*\n\n❌ Infelizmente seu pedido {{orderNumber}} foi cancelado.\n\nMotivo: *{{cancellationReason}}*`,
    reservation: `Olá *{{cliente}}*! \ud83d\udc4b\ud83c\udffb\n\nSua reserva na *Mesa {{mesa}}* foi confirmada!\n\n\ud83d\udcc5 Horário: *{{horario}}*\n\ud83d\udc65 Pessoas: *{{pessoas}}*\n\n⚠️ *Obs:* Em caso de atraso, a mesa poderá ser ocupada.\n\nAguardamos você! \ud83d\ude0a`,
  };
  
  // Templates
  const [templateNewOrder, setTemplateNewOrder] = useState(DEFAULT_TEMPLATES.newOrder);
  const [templatePreparing, setTemplatePreparing] = useState(DEFAULT_TEMPLATES.preparing);
  const [templateReady, setTemplateReady] = useState(DEFAULT_TEMPLATES.ready);
  const [templateReadyPickup, setTemplateReadyPickup] = useState(DEFAULT_TEMPLATES.readyPickup);
  const [templateCompleted, setTemplateCompleted] = useState(DEFAULT_TEMPLATES.completed);
  const [templateCancelled, setTemplateCancelled] = useState(DEFAULT_TEMPLATES.cancelled);
  const [templateReservation, setTemplateReservation] = useState(DEFAULT_TEMPLATES.reservation);
  
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
      setNotifyOnReservation((configQuery.data as any).notifyOnReservation ?? false);
      // Usar templates salvos ou manter os padrões
      setTemplateNewOrder(configQuery.data.templateNewOrder || DEFAULT_TEMPLATES.newOrder);
      setTemplatePreparing(configQuery.data.templatePreparing || DEFAULT_TEMPLATES.preparing);
      setTemplateReady(configQuery.data.templateReady || DEFAULT_TEMPLATES.ready);
      setTemplateReadyPickup((configQuery.data as any).templateReadyPickup || DEFAULT_TEMPLATES.readyPickup);
      setTemplateCompleted(configQuery.data.templateCompleted || DEFAULT_TEMPLATES.completed);
      setTemplateCancelled(configQuery.data.templateCancelled || DEFAULT_TEMPLATES.cancelled);
      setTemplateReservation((configQuery.data as any).templateReservation || DEFAULT_TEMPLATES.reservation);
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
      requireOrderConfirmation: false, // Feature bloqueada temporariamente
      notifyOnNewOrder,
      notifyOnPreparing,
      notifyOnReady,
      notifyOnCompleted,
      notifyOnCancelled,
      notifyOnReservation,
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
      templateReadyPickup: templateReadyPickup || null,
      templateCompleted: templateCompleted || null,
      templateCancelled: templateCancelled || null,
      templateReservation: templateReservation || null,
    });
  };
  
  const status = statusQuery.data?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  
  return (
    <div className="space-y-6">
      {/* Status Card - oculto quando hideConnectionCard=true */}
      {!hideConnectionCard && (
        <Card className="shadow-none">
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
                <div className="bg-card p-4 rounded-lg shadow-inner">
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
      )}
      
      {/* Modo showOnlyContent - renderiza apenas o conteúdo da aba selecionada */}
      {showOnlyContent && activeSubTab === "notifications" && (
        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Notificações Automáticas</CardTitle>
              <CardDescription>
                Configure quando enviar mensagens automáticas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Confirmação de Pedido com Botões */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                        📱 Confirmação via Botões
                      </Label>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Enviar botões interativos para o cliente confirmar ou cancelar o pedido antes de começar a preparar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={false}
                        disabled
                      />
                      <span className="text-xs text-muted-foreground italic">Indisponível</span>
                    </div>
                  </div>
                  {false && (
                    <div className="mt-3 p-3 bg-card rounded-md border border-amber-100 dark:border-amber-800/30">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                        <strong>Como funciona:</strong>
                      </p>
                      <ol className="text-xs text-amber-600 dark:text-amber-400 list-decimal list-inside space-y-1">
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
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Reserva de Mesa</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de Reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar confirmação por WhatsApp ao reservar mesa
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnReservation}
                    onCheckedChange={setNotifyOnReservation}
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
        </div>
      )}
      
      {showOnlyContent && activeSubTab === "templates" && (
        <TemplatesEditor
          templateNewOrder={templateNewOrder}
          setTemplateNewOrder={setTemplateNewOrder}
          templatePreparing={templatePreparing}
          setTemplatePreparing={setTemplatePreparing}
          templateReady={templateReady}
          setTemplateReady={setTemplateReady}
          templateReadyPickup={templateReadyPickup}
          setTemplateReadyPickup={setTemplateReadyPickup}
          templateCompleted={templateCompleted}
          setTemplateCompleted={setTemplateCompleted}
          templateCancelled={templateCancelled}
          setTemplateCancelled={setTemplateCancelled}
          templateReservation={templateReservation}
          setTemplateReservation={setTemplateReservation}
          onSave={handleSaveTemplates}
          isSaving={saveTemplatesMutation.isPending}
          defaultTemplates={DEFAULT_TEMPLATES}
          restaurantName={establishment?.name}
          restaurantLogo={establishment?.logo}
          enabledNotifications={{
            notifyOnNewOrder,
            notifyOnPreparing,
            notifyOnReady,
            notifyOnCompleted,
            notifyOnCancelled,
            notifyOnReservation,
          }}
        />
      )}
      
      {/* Modo normal com abas internas */}
      {!showOnlyContent && (
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Notificações Automáticas</CardTitle>
              <CardDescription>
                Configure quando enviar mensagens automáticas para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Confirmação de Pedido com Botões */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                        📱 Confirmação via Botões
                      </Label>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Enviar botões interativos para o cliente confirmar ou cancelar o pedido antes de começar a preparar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={false}
                        disabled
                      />
                      <span className="text-xs text-muted-foreground italic">Indisponível</span>
                    </div>
                  </div>
                  {false && (
                    <div className="mt-3 p-3 bg-card rounded-md border border-amber-100 dark:border-amber-800/30">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                        <strong>Como funciona:</strong>
                      </p>
                      <ol className="text-xs text-amber-600 dark:text-amber-400 list-decimal list-inside space-y-1">
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
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Reserva de Mesa</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de Reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar confirmação por WhatsApp ao reservar mesa
                    </p>
                  </div>
                  <Switch
                    checked={notifyOnReservation}
                    onCheckedChange={setNotifyOnReservation}
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
          <TemplatesEditor
            templateNewOrder={templateNewOrder}
            setTemplateNewOrder={setTemplateNewOrder}
            templatePreparing={templatePreparing}
            setTemplatePreparing={setTemplatePreparing}
            templateReady={templateReady}
            setTemplateReady={setTemplateReady}
            templateReadyPickup={templateReadyPickup}
            setTemplateReadyPickup={setTemplateReadyPickup}
            templateCompleted={templateCompleted}
            setTemplateCompleted={setTemplateCompleted}
            templateCancelled={templateCancelled}
            setTemplateCancelled={setTemplateCancelled}
            templateReservation={templateReservation}
            setTemplateReservation={setTemplateReservation}
            onSave={handleSaveTemplates}
            isSaving={saveTemplatesMutation.isPending}
            defaultTemplates={DEFAULT_TEMPLATES}
            restaurantName={establishment?.name}
            restaurantLogo={establishment?.logo}
            enabledNotifications={{
              notifyOnNewOrder,
              notifyOnPreparing,
              notifyOnReady,
              notifyOnCompleted,
              notifyOnCancelled,
              notifyOnReservation,
            }}
          />
        </TabsContent>

      </Tabs>
      )}
    </div>
  );
}
