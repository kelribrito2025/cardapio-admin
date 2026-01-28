import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Save, RotateCcw, Smartphone, Loader2, FileText, Settings, Eye, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PrintTestTabProps {
  establishmentId: number;
}

export function PrintTestTab({ establishmentId }: PrintTestTabProps) {
  // Buscar configurações salvas
  const { data: savedSettings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Mutation para salvar configurações
  const saveSettingsMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetchSettings();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  // Mutation para upload de imagem
  const uploadImageMutation = trpc.upload.image.useMutation();

  // Configurações de fonte
  const [fontSize, setFontSize] = useState(12);
  const [fontWeight, setFontWeight] = useState(500);
  const [titleFontSize, setTitleFontSize] = useState(16);
  const [titleFontWeight, setTitleFontWeight] = useState(700);
  const [itemFontSize, setItemFontSize] = useState(12);
  const [itemFontWeight, setItemFontWeight] = useState(700);
  const [obsFontSize, setObsFontSize] = useState(11);
  const [obsFontWeight, setObsFontWeight] = useState(500);
  
  // Configurações de layout
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [showDividers, setShowDividers] = useState(true);
  const [boxPadding, setBoxPadding] = useState(12);
  
  // Texto personalizado
  const [customText, setCustomText] = useState("");
  
  // Estilo de borda dos itens
  const [itemBorderStyle, setItemBorderStyle] = useState<"rounded" | "dashed">("rounded");
  
  // QR Code para pagamento
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeUploading, setQrCodeUploading] = useState(false);

  // Carregar configurações salvas quando disponíveis
  useEffect(() => {
    if (savedSettings) {
      setFontSize(savedSettings.fontSize || 12);
      setFontWeight(savedSettings.fontWeight || 500);
      setTitleFontSize(savedSettings.titleFontSize || 16);
      setTitleFontWeight(savedSettings.titleFontWeight || 700);
      setItemFontSize(savedSettings.itemFontSize || 12);
      setItemFontWeight(savedSettings.itemFontWeight || 700);
      setObsFontSize(savedSettings.obsFontSize || 11);
      setObsFontWeight(savedSettings.obsFontWeight || 500);
      setPaperWidth(savedSettings.paperWidth || "80mm");
      setShowDividers(savedSettings.showDividers ?? true);
      setBoxPadding((savedSettings as any).boxPadding || 12);
      setShowQrCode(savedSettings.showQrCode ?? false);
      setQrCodeUrl((savedSettings as any).qrCodeUrl || null);
      setItemBorderStyle((savedSettings as any).itemBorderStyle || "rounded");
    }
  }, [savedSettings]);
  
  // Dados de exemplo para preview
  const sampleOrder = {
    orderNumber: "P999",
    createdAt: new Date().toISOString(),
    deliveryType: "delivery",
    customerName: "João Silva",
    customerPhone: "11999998888",
    address: "Rua das Flores, 123 - Centro",
    addressComplement: "Apto 45",
    neighborhood: "Centro",
    paymentMethod: "PIX",
    items: [
      { 
        name: "X-Burger Especial", 
        quantity: 2, 
        price: 25.90,
        observation: "Sem cebola",
        complements: [
          { name: "Bacon extra", price: 5.00 },
          { name: "Queijo cheddar", price: 3.00 }
        ]
      },
      { 
        name: "Batata Frita Grande", 
        quantity: 1, 
        price: 15.00,
        observation: "",
        complements: []
      },
      { 
        name: "Refrigerante 600ml", 
        quantity: 2, 
        price: 8.00,
        observation: "Bem gelado",
        complements: []
      }
    ],
    subtotal: 90.80,
    deliveryFee: 5.00,
    discount: 0,
    total: 95.80
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetToDefaults = () => {
    setFontSize(12);
    setFontWeight(500);
    setTitleFontSize(16);
    setTitleFontWeight(700);
    setItemFontSize(12);
    setItemFontWeight(700);
    setObsFontSize(11);
    setObsFontWeight(500);
    setPaperWidth("80mm");
    setShowDividers(true);
    toast.success("Configurações restauradas para o padrão");
  };

  const handleSaveSettings = () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    saveSettingsMutation.mutate({
      establishmentId,
      fontSize,
      fontWeight,
      titleFontSize,
      titleFontWeight,
      itemFontSize,
      itemFontWeight,
      obsFontSize,
      obsFontWeight,
      paperWidth: paperWidth as "58mm" | "80mm",
      showDividers,
      boxPadding,
      showQrCode,
      qrCodeUrl,
      itemBorderStyle,
    });
  };

  const handleTestPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    // Primeiro salvar as configurações atuais
    await saveSettingsMutation.mutateAsync({
      establishmentId,
      fontSize,
      fontWeight,
      titleFontSize,
      titleFontWeight,
      itemFontSize,
      itemFontWeight,
      obsFontSize,
      obsFontWeight,
      paperWidth: paperWidth as "58mm" | "80mm",
      showDividers,
      boxPadding,
      showQrCode,
      qrCodeUrl,
    });
    
    // Abrir o recibo de teste em nova janela
    const testUrl = `${window.location.origin}/api/print/test/${establishmentId}`;
    const printWindow = window.open(testUrl, '_blank');
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.");
      return;
    }
  };

  const handleTestThermalPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    // Primeiro salvar as configurações atuais
    try {
      await saveSettingsMutation.mutateAsync({
        establishmentId,
        fontSize,
        fontWeight,
        titleFontSize,
        titleFontWeight,
        itemFontSize,
        itemFontWeight,
        obsFontSize,
        obsFontWeight,
        paperWidth: paperWidth as "58mm" | "80mm",
        showDividers,
        showQrCode,
        qrCodeUrl,
      });
    } catch (e) {
      // Continuar mesmo se falhar o save
    }
    
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) {
      const testUrl = `${window.location.origin}/api/print/test/${establishmentId}`;
      window.open(testUrl, '_blank');
      toast.info("Recibo aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app Multi Printer Network Print Service.");
      return;
    }
    
    try {
      // Buscar deep link do servidor (igual à página de Pedidos)
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-test/${establishmentId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        // Abrir o deep link para o app Multi Printer
        window.location.href = data.deepLink;
        toast.success(`Enviando para ${data.printers.length} impressora(s)...`);
      } else {
        toast.error(data.error || "Erro ao gerar link de impressão. Verifique se há impressoras configuradas.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const handleTestCustomPrint = async () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }
    
    if (!customText.trim()) {
      toast.error("Digite um texto para imprimir");
      return;
    }
    
    // Primeiro salvar as configurações atuais
    try {
      await saveSettingsMutation.mutateAsync({
        establishmentId,
        fontSize,
        fontWeight,
        titleFontSize,
        titleFontWeight,
        itemFontSize,
        itemFontWeight,
        obsFontSize,
        obsFontWeight,
        paperWidth: paperWidth as "58mm" | "80mm",
        showDividers,
        showQrCode,
        qrCodeUrl,
      });
    } catch (e) {
      // Continuar mesmo se falhar o save
    }
    
    // URL do texto personalizado no servidor
    const customUrl = `${window.location.origin}/api/print/custom/${establishmentId}?text=${encodeURIComponent(customText)}`;
    
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Usar app-link do ESC POS Wifi Print Service
      const printUrl = `print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src=${encodeURIComponent(customUrl)}`;
      window.location.href = printUrl;
      toast.info("Enviando texto para impressora térmica...");
    } else {
      // Em outros dispositivos, abrir em nova aba
      window.open(customUrl, '_blank');
      toast.info("Texto aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app ESC POS Wifi Print Service.");
    }
  };

  // Gerar HTML do recibo com os mesmos estilos do servidor (generateReceiptHTML)
  const generateReceiptHTML = () => {
    // Usar os mesmos estilos do servidor para garantir consistência
    const is58mm = paperWidth === '58mm';
    const paperWidthValue = is58mm ? '48mm' : '72mm';
    const orderNumberSize = `${titleFontSize + 4}px`;
    
    const itemsHtml = sampleOrder.items.map(item => {
      const complementsHtml = item.complements.length > 0 
        ? item.complements.map(c => `<div class="item-complement">+ ${c.name} (${formatCurrency(c.price)})</div>`).join('')
        : '';
      
      const obsHtml = item.observation 
        ? `<div class="item-obs">Obs: ${item.observation}</div>`
        : '';
      
      const itemTotal = item.quantity * item.price + item.complements.reduce((sum, c) => sum + c.price, 0);
      
      return `
        <div class="item">
          <div class="item-header">
            <span>${item.quantity}x ${item.name}</span>
            <span>${formatCurrency(itemTotal)}</span>
          </div>
          ${complementsHtml}
          ${obsHtml}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste de Impressão</title>
  <style>
    @page {
      size: ${paperWidthValue} auto;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${fontSize}px; 
      font-weight: ${fontWeight};
      line-height: 1.4;
      width: 100%;
      max-width: 100%;
      padding: 8px;
      background: #fff;
      color: #000;
      -webkit-font-smoothing: antialiased;
    }
    .receipt {
      background: #fff;
    }
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${titleFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .order-text {
      display: flex;
      flex-direction: column;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: ${titleFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${obsFontSize}px;
      font-weight: ${titleFontWeight};
      display: inline-flex;
      align-items: center;
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${obsFontSize}px;
      font-weight: ${titleFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    .divider {
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''}
      margin: 10px 0;
    }
    .divider-double {
      ${showDividers ? 'border-top: 3px double #000;' : ''}
      margin: 12px 0;
    }
    .item {
      margin: 8px 0;
      padding: ${itemBorderStyle === 'rounded' ? boxPadding + 'px' : '8px 0'};
      ${itemBorderStyle === 'rounded' ? 'border: 2px solid #000; border-radius: 8px;' : 'border: none; border-top: 1px dashed #000; border-bottom: 1px dashed #000;'}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize}px;
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    .totals {
      margin: 12px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 6px 0;
      font-size: ${itemFontSize}px;
    }
    .total-final {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${titleFontWeight};
      font-size: ${titleFontSize - 2}px;
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    .section {
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${titleFontWeight};
      font-size: ${itemFontSize}px;
      margin-bottom: 4px;
    }
    .section-content {
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: 1.4;
    }
    .address-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding}px;
      margin: 12px 0;
    }
    .address-box .section-title {
      margin-bottom: 8px;
    }
    .payment-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding}px;
      margin: 12px 0;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .payment-title {
      font-weight: ${titleFontWeight};
      font-size: ${obsFontSize}px;
      text-transform: uppercase;
      color: #666;
    }
    .payment-badge {
      font-weight: ${titleFontWeight};
      font-size: ${itemFontSize}px;
    }
    .client-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: ${boxPadding}px;
      margin: 12px 0;
    }
    .client-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box {
      padding: 12px 0;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 144px;
      height: 144px;
      display: block;
      margin: 0 auto;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
      font-size: ${obsFontSize}px;
    }
    .footer-thanks {
      font-weight: ${titleFontWeight};
      font-size: ${itemFontSize}px;
      margin-top: 8px;
    }
    @media print {
      body { padding: 0; }
      .receipt { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <h1>Restaurante</h1>
      <p>Sistema de Pedidos</p>
    </div>
    
    <div class="order-info">
      <div class="order-text">
        <div class="order-number">Pedido #${sampleOrder.orderNumber}</div>
        <div class="order-date">${formatDate(sampleOrder.createdAt)}</div>
      </div>
      <div class="delivery-badge">${sampleOrder.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</div>
    </div>
    
    <hr class="divider">
    
    ${itemsHtml}
    
    <hr class="divider">
    
    <div class="totals">
      <div class="total-row">
        <span>Valor dos produtos</span>
        <span>${formatCurrency(sampleOrder.subtotal)}</span>
      </div>
      ${sampleOrder.deliveryFee > 0 ? `
      <div class="total-row">
        <span>Taxa de entrega</span>
        <span>${formatCurrency(sampleOrder.deliveryFee)}</span>
      </div>
      ` : ''}
      ${sampleOrder.discount > 0 ? `
      <div class="total-row">
        <span>Desconto</span>
        <span>-${formatCurrency(sampleOrder.discount)}</span>
      </div>
      ` : ''}
      <div class="total-row total-final">
        <span>Total</span>
        <span>${formatCurrency(sampleOrder.total)}</span>
      </div>
    </div>
    
    <hr class="divider">
    
    <div class="address-box">
      <div class="section-title">Endereço</div>
      <div class="section-content">
        ${sampleOrder.address} - ${sampleOrder.neighborhood}${sampleOrder.addressComplement ? ' - ' + sampleOrder.addressComplement : ''}
      </div>
    </div>
    
    <div class="payment-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: ${titleFontWeight};">Pagamento</span>
        <span style="font-weight: ${titleFontWeight};">${sampleOrder.paymentMethod}</span>
      </div>
    </div>
    
    <div class="client-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: ${titleFontWeight};">Cliente</span>
        <span style="font-weight: ${titleFontWeight};">${sampleOrder.customerName} - ${sampleOrder.customerPhone}</span>
      </div>
    </div>
    
    ${showQrCode && qrCodeUrl ? `
    <div class="qrcode-box">
      <div class="section-title">PIX - Escaneie para pagar</div>
      <img src="${qrCodeUrl}" alt="QR Code PIX" />
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Pedido realizado via Cardapio Admin</p>
      <p>manus.space</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Fontes</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Teste</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Layout</CardTitle>
              <CardDescription>
                Ajuste o layout e aparência do recibo impresso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Largura do papel</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione o tamanho da bobina térmica
                  </p>
                </div>
                <Select value={paperWidth} onValueChange={setPaperWidth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar divisores</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir linhas tracejadas entre seções
                  </p>
                </div>
                <Switch
                  checked={showDividers}
                  onCheckedChange={setShowDividers}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Estilo dos itens</Label>
                  <p className="text-sm text-muted-foreground">
                    Aparência das caixas de produtos
                  </p>
                </div>
                <Select value={itemBorderStyle} onValueChange={(v) => setItemBorderStyle(v as "rounded" | "dashed")}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">Caixas arredondadas</SelectItem>
                    <SelectItem value="dashed">Linhas tracejadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Espaçamento interno: {boxPadding}px</Label>
                </div>
                <Slider
                  value={[boxPadding]}
                  onValueChange={(v) => setBoxPadding(v[0])}
                  min={4}
                  max={20}
                  step={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar QR Code PIX</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir QR Code para pagamento no recibo
                  </p>
                </div>
                <Switch
                  checked={showQrCode}
                  onCheckedChange={setShowQrCode}
                />
              </div>

              {showQrCode && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <Label>Imagem do QR Code PIX</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setQrCodeUploading(true);
                        try {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const base64 = reader.result as string;
                            const result = await uploadImageMutation.mutateAsync({
                              base64,
                              mimeType: file.type,
                            });
                            setQrCodeUrl(result.url);
                            toast.success("QR Code carregado!");
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          toast.error("Erro ao carregar imagem");
                        } finally {
                          setQrCodeUploading(false);
                        }
                      }}
                      className="text-sm"
                    />
                    {qrCodeUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-24 h-24 object-contain border rounded bg-white" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </TabsContent>
        
        {/* Fonts Tab */}
        <TabsContent value="fonts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Fonte</CardTitle>
              <CardDescription>
                Ajuste o tamanho e peso das fontes do recibo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fonte do corpo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Texto geral</Label>
                  <span className="text-sm text-muted-foreground">{fontSize}px / peso {fontWeight}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Tamanho</span>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(v) => setFontSize(v[0])}
                      min={8}
                      max={18}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Peso</span>
                    <Slider
                      value={[fontWeight]}
                      onValueChange={(v) => setFontWeight(v[0])}
                      min={300}
                      max={900}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Fonte do título */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Títulos/Pedido</Label>
                  <span className="text-sm text-muted-foreground">{titleFontSize}px / peso {titleFontWeight}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Tamanho</span>
                    <Slider
                      value={[titleFontSize]}
                      onValueChange={(v) => setTitleFontSize(v[0])}
                      min={12}
                      max={24}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Peso</span>
                    <Slider
                      value={[titleFontWeight]}
                      onValueChange={(v) => setTitleFontWeight(v[0])}
                      min={300}
                      max={900}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Fonte dos itens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Nome dos itens</Label>
                  <span className="text-sm text-muted-foreground">{itemFontSize}px / peso {itemFontWeight}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Tamanho</span>
                    <Slider
                      value={[itemFontSize]}
                      onValueChange={(v) => setItemFontSize(v[0])}
                      min={8}
                      max={18}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Peso</span>
                    <Slider
                      value={[itemFontWeight]}
                      onValueChange={(v) => setItemFontWeight(v[0])}
                      min={300}
                      max={900}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Fonte das observações */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Observações/Complementos</Label>
                  <span className="text-sm text-muted-foreground">{obsFontSize}px / peso {obsFontWeight}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Tamanho</span>
                    <Slider
                      value={[obsFontSize]}
                      onValueChange={(v) => setObsFontSize(v[0])}
                      min={8}
                      max={16}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Peso</span>
                    <Slider
                      value={[obsFontWeight]}
                      onValueChange={(v) => setObsFontWeight(v[0])}
                      min={300}
                      max={900}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </TabsContent>
        
        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Imprimir Recibo de Teste</CardTitle>
              <CardDescription>
                Teste a impressão com um pedido de exemplo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={handleTestPrint} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Teste Normal (Nova Aba)
                </Button>
                <Button onClick={handleTestThermalPrint}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Teste Térmica (Android)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Para impressão térmica, use um dispositivo Android com o app Multi Printer Network Print Service instalado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto Personalizado</CardTitle>
              <CardDescription>
                Imprima um texto personalizado para teste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite o texto que deseja imprimir..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={handleTestCustomPrint}
                disabled={!customText.trim()}
                className="w-full"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Imprimir Texto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
