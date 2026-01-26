import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Printer, Save, RotateCcw, Smartphone, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TesteImpressao() {
  // Buscar estabelecimento
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;

  // Buscar configurações salvas
  const { data: savedSettings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId! },
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

  const generateReceiptHTML = () => {
    const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
    const establishmentName = establishment?.name || "Restaurante";
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teste de Impressão</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: ${fontSize}px; 
      font-weight: ${fontWeight};
      padding: 15px; 
      max-width: ${maxWidth}; 
      margin: 0 auto; 
      background: #fff;
      color: #333;
    }
    .receipt {
      background: #fff;
      padding: 8px;
    }
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #ccc;' : ''}
    }
    .logo h1 {
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .order-info {
      margin-bottom: 12px;
    }
    .order-info h2 {
      font-size: ${titleFontSize}px;
      font-weight: ${titleFontWeight};
      margin-bottom: 2px;
    }
    .order-info p {
      font-size: ${obsFontSize}px;
      font-weight: ${titleFontWeight};
      color: #666;
    }
    .divider {
      border: none;
      ${showDividers ? 'border-top: 1px solid #ccc;' : ''}
      margin: 10px 0;
    }
    .divider-dashed {
      border: none;
      ${showDividers ? 'border-top: 1px dashed #bbb;' : ''}
      margin: 8px 0;
    }
    .item {
      margin-bottom: 8px;
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
      color: #666;
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${obsFontSize}px;
      font-weight: ${obsFontWeight};
      color: #555;
      margin-top: 2px;
      padding-left: 10px;
    }
    .totals {
      margin: 12px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
    }
    .total-row.final {
      font-weight: ${titleFontWeight};
      font-size: ${titleFontSize - 2}px;
      margin-top: 6px;
      ${showDividers ? 'border-top: 1px solid #333; padding-top: 6px;' : ''}
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
      color: #444;
      line-height: 1.4;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px solid #ccc;' : ''}
    }
    .footer p {
      font-size: ${obsFontSize}px;
      font-weight: ${titleFontWeight};
      color: #666;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <h1>${establishmentName}</h1>
      <p>Sistema de Pedidos</p>
    </div>
    
    <div class="order-info">
      <h2>Pedido #${sampleOrder.orderNumber}</h2>
      <p>Realizado em: ${formatDate(sampleOrder.createdAt)}</p>
    </div>
    
    <hr class="divider">
    
    ${sampleOrder.items.map(item => `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.name}</span>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
        ${item.observation ? `<div class="item-obs">Obs: ${item.observation}</div>` : ''}
        ${item.complements.map(c => `
          <div class="item-complement">+ ${c.name} (${formatCurrency(c.price)})</div>
        `).join('')}
      </div>
    `).join('')}
    
    <hr class="divider-dashed">
    
    <div class="totals">
      <div class="total-row">
        <span>Valor dos produtos</span>
        <span>${formatCurrency(sampleOrder.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Taxa de entrega</span>
        <span>${formatCurrency(sampleOrder.deliveryFee)}</span>
      </div>
      <div class="total-row final">
        <span>Total</span>
        <span>${formatCurrency(sampleOrder.total)}</span>
      </div>
    </div>
    
    <hr class="divider">
    
    <div class="section">
      <div class="section-title">Entrega</div>
      <div class="section-content">
        ${sampleOrder.address}<br>
        ${sampleOrder.addressComplement ? sampleOrder.addressComplement + '<br>' : ''}
        ${sampleOrder.neighborhood}
      </div>
    </div>
    
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

  if (establishmentLoading || settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Teste de Impressão</h1>
          <p className="text-muted-foreground">
            Configure e teste o layout do recibo antes de usar na impressora térmica
          </p>
        </div>

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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveSettings} 
                  className="w-full"
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Configurações
                </Button>
                <Button onClick={handleTestPrint} variant="secondary" className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Testar Impressão Normal
                </Button>
                <Button onClick={handleTestThermalPrint} variant="secondary" className="w-full">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Testar Impressora Térmica (Android)
                </Button>
                <Button onClick={resetToDefaults} variant="outline" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar Padrão
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview do Recibo */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Preview do Recibo</CardTitle>
              <CardDescription>
                Visualize como o recibo ficará na impressão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white border rounded-lg overflow-auto"
                style={{ maxHeight: '700px' }}
              >
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: `${fontSize}px`,
                    fontWeight: fontWeight,
                    padding: '15px',
                    maxWidth: paperWidth === "58mm" ? "220px" : "300px",
                    margin: '0 auto',
                    background: '#fff',
                    color: '#333'
                  }}
                >
                  {/* Logo */}
                  <div style={{ 
                    textAlign: 'center', 
                    paddingBottom: '12px', 
                    marginBottom: '12px',
                    borderBottom: showDividers ? '1px solid #ccc' : 'none'
                  }}>
                    <h1 style={{ 
                      fontSize: `${titleFontSize + 4}px`, 
                      fontWeight: titleFontWeight,
                      margin: 0
                    }}>
                      {establishment?.name || "Restaurante"}
                    </h1>
                    <p style={{ 
                      fontSize: `${obsFontSize}px`, 
                      fontWeight: obsFontWeight,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginTop: '2px'
                    }}>
                      Sistema de Pedidos
                    </p>
                  </div>

                  {/* Order Info */}
                  <div style={{ marginBottom: '12px' }}>
                    <h2 style={{ 
                      fontSize: `${titleFontSize}px`, 
                      fontWeight: titleFontWeight,
                      marginBottom: '2px'
                    }}>
                      Pedido #{sampleOrder.orderNumber}
                    </h2>
                    <p style={{ 
                      fontSize: `${obsFontSize}px`, 
                      fontWeight: titleFontWeight,
                      color: '#666'
                    }}>
                      Realizado em: {formatDate(sampleOrder.createdAt)}
                    </p>
                  </div>

                  {showDividers && <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />}

                  {/* Items */}
                  {sampleOrder.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: `${itemFontSize}px`,
                        fontWeight: itemFontWeight
                      }}>
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      {item.observation && (
                        <div style={{ 
                          fontSize: `${obsFontSize}px`, 
                          fontWeight: obsFontWeight,
                          color: '#666',
                          marginTop: '2px',
                          paddingLeft: '5px'
                        }}>
                          Obs: {item.observation}
                        </div>
                      )}
                      {item.complements.map((c, cIdx) => (
                        <div key={cIdx} style={{ 
                          fontSize: `${obsFontSize}px`, 
                          fontWeight: obsFontWeight,
                          color: '#555',
                          marginTop: '2px',
                          paddingLeft: '10px'
                        }}>
                          + {c.name} ({formatCurrency(c.price)})
                        </div>
                      ))}
                    </div>
                  ))}

                  {showDividers && <hr style={{ border: 'none', borderTop: '1px dashed #bbb', margin: '8px 0' }} />}

                  {/* Totals */}
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: `${fontSize}px`,
                      fontWeight: fontWeight
                    }}>
                      <span>Valor dos produtos</span>
                      <span>{formatCurrency(sampleOrder.subtotal)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: `${fontSize}px`,
                      fontWeight: fontWeight
                    }}>
                      <span>Taxa de entrega</span>
                      <span>{formatCurrency(sampleOrder.deliveryFee)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontWeight: titleFontWeight,
                      fontSize: `${titleFontSize - 2}px`,
                      marginTop: '6px',
                      borderTop: showDividers ? '1px solid #333' : 'none',
                      paddingTop: showDividers ? '6px' : '0'
                    }}>
                      <span>Total</span>
                      <span>{formatCurrency(sampleOrder.total)}</span>
                    </div>
                  </div>

                  {showDividers && <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />}

                  {/* Sections */}
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ 
                      fontWeight: titleFontWeight, 
                      fontSize: `${itemFontSize}px`,
                      marginBottom: '4px'
                    }}>
                      Entrega
                    </div>
                    <div style={{ 
                      fontSize: `${fontSize}px`, 
                      fontWeight: fontWeight,
                      color: '#444',
                      lineHeight: 1.4
                    }}>
                      {sampleOrder.address}<br />
                      {sampleOrder.addressComplement}<br />
                      {sampleOrder.neighborhood}
                    </div>
                  </div>

                  <div style={{ margin: '12px 0' }}>
                    <div style={{ 
                      fontWeight: titleFontWeight, 
                      fontSize: `${itemFontSize}px`,
                      marginBottom: '4px'
                    }}>
                      Pagamento
                    </div>
                    <div style={{ 
                      fontSize: `${fontSize}px`, 
                      fontWeight: fontWeight,
                      color: '#444'
                    }}>
                      {sampleOrder.paymentMethod}
                    </div>
                  </div>

                  <div style={{ margin: '12px 0' }}>
                    <div style={{ 
                      fontWeight: titleFontWeight, 
                      fontSize: `${itemFontSize}px`,
                      marginBottom: '4px'
                    }}>
                      Cliente
                    </div>
                    <div style={{ 
                      fontSize: `${fontSize}px`, 
                      fontWeight: fontWeight,
                      color: '#444',
                      lineHeight: 1.4
                    }}>
                      {sampleOrder.customerName}<br />
                      {sampleOrder.customerPhone}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '15px',
                    paddingTop: '10px',
                    borderTop: showDividers ? '1px solid #ccc' : 'none'
                  }}>
                    <p style={{ 
                      fontSize: `${obsFontSize}px`, 
                      fontWeight: titleFontWeight,
                      color: '#666'
                    }}>
                      Pedido realizado via Cardapio Admin
                    </p>
                    <p style={{ 
                      fontSize: `${obsFontSize}px`, 
                      fontWeight: titleFontWeight,
                      color: '#666'
                    }}>
                      manus.space
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
