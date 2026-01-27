import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { addConnection, removeConnection, sendHeartbeat, addOrderConnectionForMultiple, removeOrderConnectionFromMultiple, sendAllOrdersHeartbeat } from "./sse";
import { getUserByOpenId, getEstablishmentByUserId, getOrdersByOrderNumbers, getOrderById, getOrderItems, getEstablishmentById, getPrinterSettings } from "../db";
import { sdk } from "./sdk";

// Função para gerar HTML do recibo otimizado para impressora térmica
// OTIMIZADO para melhor legibilidade em impressoras ESC POS 58mm/80mm
function generateReceiptHTML(
  order: any,
  items: any[],
  establishment: any,
  settings: any
): string {
  const formatCurrency = (value: number | string | null) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const deliveryTypeText = order.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA';
  const paymentMethodText: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit': 'Cartao Credito',
    'debit': 'Cartao Debito',
    'card': 'Cartao',
    'pix': 'PIX',
    'boleto': 'Boleto'
  };
  
  // Configurar largura do papel
  const is58mm = settings?.paperWidth === '58mm';
  const paperWidth = is58mm ? '48mm' : '72mm'; // Largura real do papel térmico
  
  // Usar configurações de fonte salvas ou valores padrão
  const baseFontSize = `${settings?.fontSize || (is58mm ? 11 : 12)}px`;
  const baseFontWeight = settings?.fontWeight || 500;
  const headerFontSize = `${settings?.titleFontSize || (is58mm ? 14 : 16)}px`;
  const headerFontWeight = settings?.titleFontWeight || 700;
  const orderNumberSize = `${(settings?.titleFontSize || (is58mm ? 14 : 16)) + 4}px`;
  const itemFontSize = `${settings?.itemFontSize || (is58mm ? 11 : 12)}px`;
  const itemFontWeight = settings?.itemFontWeight || 700;
  const totalFontSize = `${(settings?.titleFontSize || (is58mm ? 13 : 14)) - 2}px`;
  const smallFontSize = `${settings?.obsFontSize || (is58mm ? 10 : 11)}px`;
  const smallFontWeight = settings?.obsFontWeight || 500;
  const showDividers = settings?.showDividers ?? true;
  
  // Logo URL (usa o personalizado ou o do estabelecimento)
  const logoUrl = settings?.logoUrl || establishment?.logo;
  
  // Mensagem de cabeçalho personalizada
  const headerMessage = settings?.headerMessage;
  
  let itemsHTML = '';
  for (const item of items) {
    let itemHTML = `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.productName}</span>
          <span>${formatCurrency(item.totalPrice)}</span>
        </div>
    `;
    if (item.notes) {
      itemHTML += `<div class="item-obs">Obs: ${item.notes}</div>`;
    }
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                itemHTML += `<div class="item-complement">+ ${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price)})` : ''}</div>`;
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    itemHTML += `</div>`;
    itemsHTML += itemHTML;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido #${order.orderNumber}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      font-size: ${baseFontSize}; 
      font-weight: ${baseFontWeight};
      line-height: 1.4;
      width: 100%; 
      max-width: 100%;
      padding: 8px;
      background: #fff;
      color: #000;
      -webkit-font-smoothing: antialiased;
    }
    
    /* CABEÇALHO */
    .logo {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #000;' : ''}
    }
    .logo h1 {
      font-size: ${orderNumberSize};
      font-weight: ${headerFontWeight};
      margin: 0;
    }
    .logo p {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
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
      font-weight: ${headerFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
    }
    .delivery-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: ${smallFontSize};
      font-weight: ${headerFontWeight};
      padding: 6px 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: center;
    }
    
    /* DIVISOR */
    .divider { 
      border: none;
      ${showDividers ? 'border-top: 2px dashed #000;' : ''} 
      margin: 10px 0; 
    }
    .divider-double {
      ${showDividers ? 'border-top: 3px double #000;' : ''}
      margin: 12px 0;
    }
    
    /* CLIENTE */
    .customer { 
      margin: 10px 0; 
      font-size: ${itemFontSize};
    }
    .customer-label {
      font-weight: ${baseFontWeight};
    }
    .customer-value {
      display: block;
      margin-left: 0;
      word-wrap: break-word;
      font-weight: ${baseFontWeight};
    }
    .customer-row {
      margin: 6px 0;
    }
    
    /* ITENS */
    .item {
      margin: 8px 0;
      padding: 10px 12px;
      border: 2px solid #000;
      border-radius: 8px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
    }
    .item-obs {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: ${smallFontSize};
      font-weight: ${smallFontWeight};
      margin-top: 2px;
      padding-left: 10px;
    }
    
    /* TOTAIS */
    .totals { 
      margin: 12px 0; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin: 6px 0; 
      font-size: ${itemFontSize};
    }
    .total-final { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      font-weight: ${headerFontWeight}; 
      font-size: ${itemFontSize}; 
      margin-top: 10px;
      padding: 8px 12px;
      text-transform: uppercase;
    }
    
    /* SEÇÕES (Entrega, Pagamento, Cliente) */
    .section-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 8px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    .section-inline {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      line-height: 1.4;
    }
    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .payment-badge {
      background: #000;
      color: #fff;
      padding: 4px 10px;
      font-weight: ${headerFontWeight};
      font-size: ${smallFontSize};
    }
    
    /* PAGAMENTO */
    .payment {
      margin: 10px 0;
      font-size: ${itemFontSize};
    }
    .payment-method {
      font-weight: ${baseFontWeight};
      font-size: ${itemFontSize};
    }
    
    /* OBSERVAÇÕES */
    .notes { 
      background: #f0f0f0; 
      padding: 8px; 
      margin: 10px 0; 
      font-size: ${smallFontSize};
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
    }
    
    /* QR CODE */
    .qrcode-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 120px;
      height: 120px;
      display: block;
      margin: 0 auto;
    }
    
    /* RODAPÉ */
    .footer { 
      text-align: center; 
      margin-top: 16px; 
      font-size: ${smallFontSize}; 
    }
    .footer-thanks {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-top: 8px;
    }
    
    /* PRINT STYLES */
    @media print {
      body {
        width: ${paperWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <p>Sistema de Pedidos</p>
  </div>
  
  <div class="order-info">
    <div class="order-text">
      <div class="order-number">Pedido #${order.orderNumber}</div>
      <div class="order-date">📅 ${formatDate(order.createdAt)}</div>
    </div>
    <div class="delivery-badge">${deliveryTypeText}</div>
  </div>
  
  <hr class="divider">
  
  <div class="items">
    ${itemsHTML}
  </div>
  
  <hr class="divider">
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.deliveryType === 'delivery' ? `
    <div class="total-row">
      <span>Taxa entrega:</span>
      <span>${formatCurrency(order.deliveryFee)}</span>
    </div>
    ` : ''}
    ${order.discount && parseFloat(order.discount) > 0 ? `
    <div class="total-row">
      <span>Desconto${order.couponCode ? ` (${order.couponCode})` : ''}:</span>
      <span>-${formatCurrency(order.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
  </div>
  
  <hr class="divider">
  
  ${order.deliveryType === 'delivery' ? `
  <div class="section-box">
    <div class="section-title">Endereço:</div>
    <div class="section-content">
      ${order.customerAddress || ''} - ${order.neighborhood || ''}
      ${order.addressComplement ? '<br>' + order.addressComplement : ''}
    </div>
  </div>
  ` : `
  <div class="section-box">
    <div class="section-content"><strong>Retirada:</strong> Cliente irá retirar no estabelecimento</div>
  </div>
  `}
  
  <div class="section-box">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: ${headerFontWeight};">Pagamento</span>
      <span style="font-weight: ${headerFontWeight};">${paymentMethodText[order.paymentMethod] || order.paymentMethod}</span>
    </div>
    ${order.paymentMethod === 'cash' && order.changeFor ? `<div style="margin-top: 8px; font-size: ${smallFontSize};">Troco para: ${formatCurrency(order.changeFor)}</div>` : ''}
  </div>
  
  <div class="section-box">
    <div class="section-inline">
      <strong>Cliente:</strong> ${order.customerName || 'Nao informado'}${order.customerPhone ? ' - ' + order.customerPhone : ''}
    </div>
  </div>
  
  ${settings?.showQrCode && settings?.qrCodeUrl ? `
  <div class="qrcode-box">
    <div class="section-title">PIX - Escaneie para pagar</div>
    <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
  </div>
  ` : ''}
  
  ${order.notes ? `
  <div class="notes">
    <div class="notes-title">OBSERVACOES:</div>
    ${order.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    ${settings?.footerMessage ? `<p>${settings.footerMessage}</p>` : ''}
    <p>Pedido realizado via Cardapio Admin</p>
    <p>manus.space</p>
  </div>
</body>
</html>
  `.trim();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // SSE endpoint para pedidos em tempo real
  app.get("/api/orders/stream", async (req, res) => {
    try {
      // Extrair token do cookie ou header
      const token = req.cookies?.app_session_id || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        console.log("[SSE] Sem token de autenticação");
        res.status(401).json({ error: "Unauthorized - no token" });
        return;
      }
      
      // Verificar token e obter usuário
      let payload;
      try {
        payload = await sdk.verifySession(token);
      } catch (verifyError) {
        console.log("[SSE] Erro ao verificar token:", verifyError);
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      
      if (!payload?.openId) {
        console.log("[SSE] Token sem openId");
        res.status(401).json({ error: "Invalid token - no openId" });
        return;
      }
      
      const user = await getUserByOpenId(payload.openId);
      if (!user) {
        console.log("[SSE] Usuário não encontrado para openId:", payload.openId);
        res.status(401).json({ error: "User not found" });
        return;
      }
      
      // Obter estabelecimento do usuário
      const establishment = await getEstablishmentByUserId(user.id);
      if (!establishment) {
        console.log("[SSE] Estabelecimento não encontrado para usuário:", user.id);
        res.status(404).json({ error: "Establishment not found" });
        return;
      }
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ establishmentId: establishment.id })}\n\n`);
      
      // Adicionar conexão ao pool
      addConnection(establishment.id, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        sendHeartbeat(establishment.id);
      }, 30000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeConnection(establishment.id, res);
        console.log(`[SSE] Conexão fechada para estabelecimento ${establishment.id}`);
      });
      
    } catch (error) {
      console.error("[SSE] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // SSE endpoint para clientes acompanharem pedidos em tempo real (por orderNumbers)
  app.get("/api/orders/track/stream", async (req, res) => {
    try {
      const orderNumbersParam = req.query.orders as string;
      
      if (!orderNumbersParam) {
        console.log("[SSE-Order] Sem orderNumbers fornecidos");
        res.status(400).json({ error: "Order numbers required" });
        return;
      }
      
      // Parse dos orderNumbers (separados por vírgula)
      const orderNumbers = orderNumbersParam.split(',').map(o => o.trim()).filter(o => o.length > 0);
      
      if (orderNumbers.length === 0) {
        console.log("[SSE-Order] Lista de orderNumbers vazia");
        res.status(400).json({ error: "At least one order number required" });
        return;
      }
      
      console.log(`[SSE-Order] Iniciando conexão para pedidos: ${orderNumbers.join(', ')}`);
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ orders: orderNumbers })}\n\n`);
      
      // Buscar e enviar o status atual de cada pedido
      // Isso garante que o cliente receba o status correto mesmo que tenha se conectado depois de mudanças
      try {
        const currentOrders = await getOrdersByOrderNumbers(orderNumbers);
        console.log(`[SSE-Order] Enviando status atual de ${currentOrders.length} pedidos`);
        
        for (const order of currentOrders) {
          const statusUpdate = {
            orderNumber: order.orderNumber,
            status: order.status,
            cancellationReason: order.cancellationReason || undefined
          };
          res.write(`event: order_status_update\ndata: ${JSON.stringify(statusUpdate)}\n\n`);
          console.log(`[SSE-Order] Enviado status inicial: ${order.orderNumber} -> ${order.status}`);
        }
      } catch (error) {
        console.error('[SSE-Order] Erro ao buscar status inicial dos pedidos:', error);
      }
      
      // Adicionar conexão ao pool para cada pedido
      addOrderConnectionForMultiple(orderNumbers, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        // Enviar heartbeat genérico para esta conexão
        try {
          res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
        } catch (error) {
          console.error("[SSE-Order] Erro ao enviar heartbeat:", error);
        }
      }, 30000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeOrderConnectionFromMultiple(orderNumbers, res);
        console.log(`[SSE-Order] Conexão fechada para pedidos: ${orderNumbers.join(', ')}`);
      });
      
    } catch (error) {
      console.error("[SSE-Order] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Rota pública para gerar HTML do recibo de impressão (para app ESC POS)
  app.get("/api/print/receipt/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        res.status(400).send("ID do pedido inválido");
        return;
      }
      
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).send("Pedido não encontrado");
        return;
      }
      
      const orderItemsList = await getOrderItems(orderId);
      const establishment = await getEstablishmentById(order.establishmentId);
      const settings = await getPrinterSettings(order.establishmentId);
      
      // Gerar HTML otimizado para impressora térmica 58mm/80mm
      const html = generateReceiptHTML(order, orderItemsList, establishment, settings);
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print] Erro ao gerar recibo:", error);
      res.status(500).send("Erro ao gerar recibo");
    }
  });
  
  // Rota para teste de impressão com dados de exemplo (mesmo modelo do Preview)
  app.get("/api/print/test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Configurações de fonte
      const fontSize = settings?.fontSize || 12;
      const fontWeight = settings?.fontWeight || 500;
      const titleFontSize = settings?.titleFontSize || 16;
      const titleFontWeight = settings?.titleFontWeight || 700;
      const itemFontSize = settings?.itemFontSize || 12;
      const itemFontWeight = settings?.itemFontWeight || 700;
      const obsFontSize = settings?.obsFontSize || 11;
      const obsFontWeight = settings?.obsFontWeight || 500;
      const paperWidth = settings?.paperWidth || '80mm';
      const showDividers = settings?.showDividers ?? true;
      
      const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
      const establishmentName = establishment?.name || "Restaurante";
      
      // Dados de exemplo para teste
      const sampleOrder = {
        orderNumber: "P999",
        createdAt: new Date(),
        deliveryType: "delivery",
        customerName: "João Silva",
        customerPhone: "11999998888",
        address: "Rua das Flores, 123 - Centro",
        addressComplement: "Apto 45",
        neighborhood: "Centro",
        subtotal: 90.80,
        deliveryFee: 5.00,
        total: 95.80,
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
        ]
      };
      
      const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
      const formatDate = (date: Date) => date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Gerar HTML otimizado para impressão térmica (mesmos estilos do generateReceiptHTML)
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste de Impressão</title>
  <style>
    @page {
      size: ${paperWidth} auto;
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
      font-size: ${titleFontSize + 4}px;
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
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin-bottom: 2px;
    }
    .order-date {
      font-size: ${obsFontSize}px;
      font-weight: ${titleFontWeight};
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
      padding: 10px 12px;
      border: 2px solid #000;
      border-radius: 8px;
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
      padding: 12px;
      margin: 12px 0;
    }
    .address-box .section-title {
      margin-bottom: 8px;
    }
    .payment-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 12px;
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
      padding: 12px;
      margin: 12px 0;
    }
    .client-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      text-align: center;
    }
    .qrcode-box .section-title {
      margin-bottom: 8px;
    }
    .qrcode-box img {
      width: 120px;
      height: 120px;
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
      <h1>${establishmentName}</h1>
      <p>Sistema de Pedidos</p>
    </div>
    
    <div class="order-info">
      <div class="order-text">
        <div class="order-number">Pedido #${sampleOrder.orderNumber}</div>
        <div class="order-date">📅 ${formatDate(sampleOrder.createdAt)}</div>
      </div>
      <div class="delivery-badge">${sampleOrder.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</div>
    </div>
    
    <hr class="divider">
    
    ${sampleOrder.items.map(item => `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.name}</span>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
        ${item.observation ? `<div class="item-obs">Obs: ${item.observation}</div>` : ''}
        ${item.complements.map((c: any) => `
          <div class="item-complement">+ ${c.name} (${formatCurrency(c.price)})</div>
        `).join('')}
      </div>
    `).join('')}
    
    <hr class="divider">
    
    <div class="totals">
      <div class="total-row">
        <span>Valor dos produtos</span>
        <span>${formatCurrency(sampleOrder.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Taxa de entrega</span>
        <span>${formatCurrency(sampleOrder.deliveryFee)}</span>
      </div>
      <div class="total-row total-final">
        <span>Total</span>
        <span>${formatCurrency(sampleOrder.total)}</span>
      </div>
    </div>
    
    <hr class="divider">
    
    <div class="address-box">
      <div class="section-title">Endereço:</div>
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
      <div class="section-content">
        <strong>Cliente:</strong> ${sampleOrder.customerName} - ${sampleOrder.customerPhone}
      </div>
    </div>
    
    ${settings?.showQrCode && settings?.qrCodeUrl ? `
    <div class="qrcode-box">
      <div class="section-title">PIX - Escaneie para pagar</div>
      <img src="${settings.qrCodeUrl}" alt="QR Code PIX" />
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
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print Test] Erro ao gerar recibo de teste:", error);
      res.status(500).send("Erro ao gerar recibo de teste");
    }
  });
  
  // Rota para impressão de texto personalizado
  app.get("/api/print/custom/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      const customText = req.query.text as string || '';
      
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Configurações de fonte
      const fontSize = settings?.fontSize || 12;
      const fontWeight = settings?.fontWeight || 500;
      const titleFontSize = settings?.titleFontSize || 16;
      const titleFontWeight = settings?.titleFontWeight || 700;
      const paperWidth = settings?.paperWidth || '80mm';
      const showDividers = settings?.showDividers ?? true;
      
      const maxWidth = paperWidth === "58mm" ? "220px" : "300px";
      const establishmentName = establishment?.name || "Restaurante";
      
      // Converter quebras de linha para <br>
      const formattedText = customText.replace(/\n/g, '<br>');
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Impressão Personalizada</title>
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
    .header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 12px;
      ${showDividers ? 'border-bottom: 1px solid #ccc;' : ''}
    }
    .header h1 {
      font-size: ${titleFontSize + 4}px;
      font-weight: ${titleFontWeight};
      margin: 0;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      ${showDividers ? 'border-top: 1px solid #ccc;' : ''}
      font-size: ${fontSize - 2}px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${establishmentName}</h1>
    </div>
    <div class="content">
      ${formattedText}
    </div>
    <div class="footer">
      <p>Cardapio Admin</p>
    </div>
  </div>
</body>
</html>
      `;
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print Custom] Erro ao gerar impressão personalizada:", error);
      res.status(500).send("Erro ao gerar impressão personalizada");
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
