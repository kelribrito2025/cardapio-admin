import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Printer, Save, RotateCcw, Smartphone, Loader2, FileText } from "lucide-react";
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
    
    // URL do recibo de teste no servidor
    const testUrl = `${window.location.origin}/api/print/test/${establishmentId}`;
    
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Usar app-link do ESC POS Wifi Print Service
      const printUrl = `print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src=${encodeURIComponent(testUrl)}`;
      window.location.href = printUrl;
      toast.info("Enviando para impressora térmica...");
    } else {
      // Em outros dispositivos, abrir o recibo em nova aba
      window.open(testUrl, '_blank');
      toast.info("Recibo aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app ESC POS Wifi Print Service.");
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

  const generateReceiptHTML = () => {
    const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
    
    const itemsHtml = sampleOrder.items.map(item => {
      const complementsHtml = item.complements.length > 0 
        ? item.complements.map(c => `<div class="complement">+ ${c.name} (${formatCurrency(c.price)})</div>`).join('')
        : '';
      const obsHtml = item.observation ? `<div class="observation">Obs: ${item.observation}</div>` : '';
      
      if (itemBorderStyle === "rounded") {
        return `
          <div class="item-box">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x</span>
              <span class="item-name">${item.name}</span>
              <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>
            ${complementsHtml}
            ${obsHtml}
          </div>
        `;
      } else {
        return `
          <div class="item-dashed">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x</span>
              <span class="item-name">${item.name}</span>
              <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>
            ${complementsHtml}
            ${obsHtml}
          </div>
        `;
      }
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: 1.4;
      background: white;
    }
    .receipt {
      width: ${maxWidth};
      padding: 10px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      ${showDividers ? 'border-bottom: 1px dashed #000;' : ''}
    }
    .header h1 {
      font-size: ${titleFontSize}px;
      font-weight: ${titleFontWeight};
      margin-bottom: 5px;
    }
    .order-number {
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin: 10px 0;
    }
    .order-info {
      margin-bottom: 15px;
      padding-bottom: 10px;
      ${showDividers ? 'border-bottom: 1px dashed #000;' : ''}
    }
    .items {
      margin-bottom: 15px;
    }
    .item-box {
      background: #f5f5f5;
      border-radius: 8px;
      padding: ${boxPadding}px;
      margin-bottom: 8px;
    }
    .item-dashed {
      padding: 8px 0;
      ${showDividers ? 'border-bottom: 1px dashed #ccc;' : ''}
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .item-qty {
      font-weight: ${itemFontWeight};
      font-size: ${itemFontSize}px;
      min-width: 30px;
    }
    .item-name {
      flex: 1;
      font-weight: ${itemFontWeight};
      font-size: ${itemFontSize}px;
    }
    .item-price {
      font-weight: ${itemFontWeight};
      font-size: ${itemFontSize}px;
      white-space: nowrap;
    }
    .complement, .observation {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      color: #666;
      margin-top: 4px;
      padding-left: 30px;
    }
    .totals {
      margin-top: 15px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px dashed #000;' : ''}
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .total-final {
      font-size: ${titleFontSize}px;
      font-weight: ${titleFontWeight};
      margin-top: 10px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 2px solid #000;' : ''}
    }
    .section {
      margin-bottom: 10px;
    }
    .section-title {
      font-weight: ${titleFontWeight};
      font-size: ${fontSize}px;
      margin-bottom: 3px;
    }
    .section-content {
      font-size: ${fontSize}px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px dashed #000;' : ''}
      font-size: ${fontSize - 2}px;
      color: #666;
    }
    .qr-section {
      text-align: center;
      margin: 15px 0;
      padding: 10px;
      ${showDividers ? 'border-top: 1px dashed #000; border-bottom: 1px dashed #000;' : ''}
    }
    .qr-section img {
      max-width: 150px;
      margin: 10px auto;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Restaurante Exemplo</h1>
      <p>Pedido de Teste</p>
    </div>
    
    <div class="order-number">
      #${sampleOrder.orderNumber}
    </div>
    
    <div class="order-info">
      <p>${formatDate(sampleOrder.createdAt)}</p>
      <p><strong>${sampleOrder.deliveryType === 'delivery' ? '🛵 ENTREGA' : '🏪 RETIRADA'}</strong></p>
    </div>
    
    <div class="items">
      ${itemsHtml}
    </div>
    
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
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
        <span>TOTAL</span>
        <span>${formatCurrency(sampleOrder.total)}</span>
      </div>
    </div>
    
    ${showQrCode && qrCodeUrl ? `
    <div class="qr-section">
      <p><strong>Escaneie para pagar</strong></p>
      <img src="${qrCodeUrl}" alt="QR Code PIX" />
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Pagamento</div>
      <div class="section-content">${sampleOrder.paymentMethod}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="section-content">
        ${sampleOrder.customerName}<br>
        ${sampleOrder.customerPhone}
      </div>
    </div>
    
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Configurações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Fonte</CardTitle>
              <CardDescription>Ajuste o tamanho e peso das fontes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fonte do corpo */}
              <div className="space-y-3">
                <Label>Texto geral: {fontSize}px / peso {fontWeight}</Label>
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
                <Label>Títulos/Pedido: {titleFontSize}px / peso {titleFontWeight}</Label>
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
                <Label>Nome dos itens: {itemFontSize}px / peso {itemFontWeight}</Label>
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
                <Label>Observações/Complementos: {obsFontSize}px / peso {obsFontWeight}</Label>
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

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Layout</CardTitle>
              <CardDescription>Ajuste o layout do recibo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Largura do papel</Label>
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
                <Label>Mostrar divisores</Label>
                <Switch
                  checked={showDividers}
                  onCheckedChange={setShowDividers}
                />
              </div>

              <div className="space-y-3">
                <Label>Espaçamento interno das caixas: {boxPadding}px</Label>
                <Slider
                  value={[boxPadding]}
                  onValueChange={(v) => setBoxPadding(v[0])}
                  min={4}
                  max={20}
                  step={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Estilo dos itens</Label>
                <Select value={itemBorderStyle} onValueChange={(v) => setItemBorderStyle(v as "rounded" | "dashed")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">Caixas arredondadas</SelectItem>
                    <SelectItem value="dashed">Linhas tracejadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Mostrar QR Code PIX</Label>
                <Switch
                  checked={showQrCode}
                  onCheckedChange={setShowQrCode}
                />
              </div>

              {showQrCode && (
                <div className="space-y-2">
                  <Label>Imagem do QR Code PIX</Label>
                  <div className="flex items-center gap-2">
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
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-24 h-24 object-contain border rounded" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto Personalizado</CardTitle>
              <CardDescription>Imprima um texto personalizado para teste</CardDescription>
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
                Imprimir Texto Personalizado
              </Button>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button variant="secondary" onClick={handleTestPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Teste Normal
            </Button>
            <Button variant="secondary" onClick={handleTestThermalPrint}>
              <Smartphone className="h-4 w-4 mr-2" />
              Teste Térmica (Android)
            </Button>
          </div>
        </div>

        {/* Preview do Recibo */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview do Recibo</CardTitle>
              <CardDescription>Visualize como ficará o recibo impresso</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white border rounded-lg overflow-auto max-h-[800px]"
                dangerouslySetInnerHTML={{ __html: generateReceiptHTML() }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
