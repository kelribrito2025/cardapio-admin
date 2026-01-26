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
    itemsHTML += `
      <div class="item">
        <div class="item-line">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${item.productName}</span>
        </div>
        <div class="item-price">${formatCurrency(item.totalPrice)}</div>
      </div>
    `;
    if (item.notes) {
      itemsHTML += `<div class="item-obs">OBS: ${item.notes}</div>`;
    }
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                itemsHTML += `<div class="item-complement">+ ${ci.name}${ci.price > 0 ? ` ${formatCurrency(ci.price)}` : ''}</div>`;
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
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
    .header { 
      text-align: center; 
      margin-bottom: 12px; 
    }
    .header h1 { 
      font-size: ${headerFontSize}; 
      font-weight: ${headerFontWeight}; 
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .order-number {
      font-size: ${orderNumberSize};
      font-weight: 700;
      margin: 8px 0;
      letter-spacing: 1px;
    }
    .header-date {
      font-size: ${smallFontSize};
      margin: 4px 0;
      font-weight: 700;
    }
    .delivery-type {
      font-size: ${itemFontSize};
      font-weight: 700;
      background: #000;
      color: #fff;
      padding: 6px 12px;
      display: inline-block;
      margin: 8px 0;
    }
    .header-message { 
      font-size: ${smallFontSize}; 
      margin-top: 4px; 
      font-weight: 700;
    }
    .logo { 
      max-width: ${is58mm ? '100px' : '140px'}; 
      max-height: ${is58mm ? '50px' : '70px'}; 
      margin-bottom: 8px; 
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
      padding: 4px 0;
    }
    .item-line {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .item-qty {
      font-weight: ${itemFontWeight};
      font-size: ${itemFontSize};
      min-width: 30px;
    }
    .item-name {
      font-size: ${itemFontSize};
      font-weight: ${itemFontWeight};
      flex: 1;
      word-wrap: break-word;
    }
    .item-price {
      font-size: ${itemFontSize};
      font-weight: ${baseFontWeight};
      text-align: right;
      margin-top: 2px;
    }
    .item-obs {
      font-size: ${smallFontSize};
      margin: 4px 0 4px 36px;
      font-style: italic;
      font-weight: ${smallFontWeight};
    }
    .item-complement {
      font-size: ${smallFontSize};
      margin: 2px 0 2px 36px;
      font-weight: ${smallFontWeight};
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
      font-weight: ${headerFontWeight}; 
      font-size: ${totalFontSize}; 
      margin-top: 10px;
      padding: 8px 0;
      ${showDividers ? 'border-top: 2px solid #000; border-bottom: 2px solid #000;' : ''}
    }
    
    /* SEÇÕES (Entrega, Pagamento, Cliente) */
    .section {
      margin: 12px 0;
    }
    .section-title {
      font-weight: ${headerFontWeight};
      font-size: ${itemFontSize};
      margin-bottom: 4px;
    }
    .section-content {
      font-size: ${baseFontSize};
      font-weight: ${baseFontWeight};
      color: #333;
      line-height: 1.4;
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
      border: 1px solid #ccc;
    }
    .notes-title {
      font-weight: ${baseFontWeight};
      margin-bottom: 4px;
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
  <div class="header">
    ${logoUrl && settings?.showLogo ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    ${headerMessage ? `<p class="header-message">${headerMessage}</p>` : ''}
    <div class="order-number">#${order.orderNumber}</div>
    <p class="header-date">${formatDate(order.createdAt)}</p>
    <span class="delivery-type">${deliveryTypeText}</span>
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
  <div class="section">
    <div class="section-title">Entrega</div>
    <div class="section-content">
      ${order.customerAddress || ''}
      ${order.addressComplement ? '<br>' + order.addressComplement : ''}
      ${order.neighborhood ? '<br>' + order.neighborhood : ''}
    </div>
  </div>
  ` : `
  <div class="section">
    <div class="section-title">Retirada</div>
    <div class="section-content">Cliente irá retirar no estabelecimento</div>
  </div>
  `}
  
  <div class="section">
    <div class="section-title">Pagamento</div>
    <div class="section-content">
      ${paymentMethodText[order.paymentMethod] || order.paymentMethod}
      ${order.paymentMethod === 'cash' && order.changeFor ? '<br>Troco para: ' + formatCurrency(order.changeFor) : ''}
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="section-content">
      ${order.customerName || 'Nao informado'}
      ${order.customerPhone ? '<br>' + order.customerPhone : ''}
    </div>
  </div>
  
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
  
  // Rota para teste de impressão com dados de exemplo
  app.get("/api/print/test/:establishmentId", async (req, res) => {
    try {
      const establishmentId = parseInt(req.params.establishmentId);
      if (isNaN(establishmentId)) {
        res.status(400).send("ID do estabelecimento inválido");
        return;
      }
      
      const establishment = await getEstablishmentById(establishmentId);
      const settings = await getPrinterSettings(establishmentId);
      
      // Dados de exemplo para teste
      const sampleOrder = {
        orderNumber: "P999",
        createdAt: new Date(),
        deliveryType: "delivery",
        customerName: "João Silva",
        customerPhone: "11999998888",
        customerAddress: "Rua das Flores, 123 - Centro",
        addressComplement: "Apto 45",
        neighborhood: "Centro",
        subtotal: 90.80,
        deliveryFee: 5.00,
        discount: 0,
        total: 95.80,
        paymentMethod: "pix",
        notes: ""
      };
      
      const sampleItems = [
        { 
          productName: "X-Burger Especial", 
          quantity: 2, 
          totalPrice: 51.80,
          notes: "Sem cebola",
          complements: JSON.stringify([{ items: [{ name: "Bacon extra", price: 5.00 }, { name: "Queijo cheddar", price: 3.00 }] }])
        },
        { 
          productName: "Batata Frita Grande", 
          quantity: 1, 
          totalPrice: 15.00,
          notes: "",
          complements: null
        },
        { 
          productName: "Refrigerante 600ml", 
          quantity: 2, 
          totalPrice: 16.00,
          notes: "Bem gelado",
          complements: null
        }
      ];
      
      // Gerar HTML otimizado para impressora térmica
      const html = generateReceiptHTML(sampleOrder, sampleItems, establishment, settings);
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("[Print Test] Erro ao gerar recibo de teste:", error);
      res.status(500).send("Erro ao gerar recibo de teste");
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
