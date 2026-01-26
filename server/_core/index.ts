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

// Função para gerar HTML do recibo - Layout Simples (mesmo da Impressão Normal)
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
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };
  
  const paymentMethodText: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit': 'Cartao Credito',
    'debit': 'Cartao Debito',
    'card': 'Cartao',
    'pix': 'PIX',
    'boleto': 'Boleto'
  };
  
  // Gerar HTML dos itens
  let itemsHTML = '';
  for (const item of items) {
    let complementsHTML = '';
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                const priceStr = ci.price > 0 ? ` (${formatCurrency(ci.price)})` : '';
                complementsHTML += `<div class="item-complement">+ ${ci.name}${priceStr}</div>`;
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    itemsHTML += `
      <div class="item">
        <div class="item-header">
          <span class="item-qty">${item.quantity}x ${item.productName}</span>
          <span class="item-price">${formatCurrency(item.totalPrice)}</span>
        </div>
        ${complementsHTML}
        ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
      </div>
    `;
  }
  
  const discount = order.discount ? parseFloat(order.discount) : 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido #${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      font-weight: 500;
      padding: 20px; 
      max-width: 320px; 
      margin: 0 auto; 
      background: #fff;
      color: #333;
    }
    .receipt {
      background: #fff;
      padding: 10px;
    }
    .logo {
      text-align: center;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .logo h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 1px;
    }
    .logo p {
      font-size: 11px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 2px;
    }
    .order-info {
      margin-bottom: 15px;
    }
    .order-info h2 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .order-info p {
      font-size: 11px;
      font-weight: 700;
      color: #666;
    }
    .divider {
      border: none;
      border-top: 1px solid #ccc;
      margin: 12px 0;
    }
    .divider-dashed {
      border: none;
      border-top: 1px dashed #bbb;
      margin: 10px 0;
    }
    .item {
      margin-bottom: 10px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
    }
    .item-obs {
      font-size: 11px;
      font-weight: 500;
      color: #666;
      margin-top: 2px;
      padding-left: 5px;
    }
    .item-complement {
      font-size: 11px;
      font-weight: 500;
      color: #555;
      margin-top: 2px;
      padding-left: 10px;
    }
    .totals {
      margin: 15px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .total-row.final {
      font-weight: 700;
      font-size: 14px;
      margin-top: 8px;
    }
    .section {
      margin: 15px 0;
    }
    .section-title {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .section-content {
      font-size: 12px;
      font-weight: 500;
      color: #444;
      line-height: 1.4;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
    }
    .footer p {
      font-size: 11px;
      font-weight: 700;
      color: #666;
    }
    @media print { 
      body { 
        padding: 0; 
        background: white;
      }
      .receipt {
        background: white;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <h1>${establishment?.name || 'Cardapio'}</h1>
      <p>Sistema de Pedidos</p>
    </div>
    
    <div class="order-info">
      <h2>Pedido #${order.orderNumber}</h2>
      <p>Realizado em: ${formatDate(order.createdAt)}</p>
    </div>
    
    <hr class="divider">
    
    <div class="items">
      ${itemsHTML}
    </div>
    
    <hr class="divider-dashed">
    
    <div class="totals">
      <div class="total-row">
        <span>Valor dos produtos</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      ${order.couponCode ? `
      <div class="total-row">
        <span>Cupom aplicado</span>
        <span>${order.couponCode}</span>
      </div>
      ` : ''}
      ${discount > 0 ? `
      <div class="total-row">
        <span>Desconto</span>
        <span>- ${formatCurrency(discount)}</span>
      </div>
      ` : ''}
      <div class="total-row">
        <span>Taxa de entrega</span>
        <span>${parseFloat(order.deliveryFee || '0') > 0 ? formatCurrency(order.deliveryFee) : 'Gratis'}</span>
      </div>
      <div class="total-row final">
        <span>Total</span>
        <span>${formatCurrency(order.total)}</span>
      </div>
    </div>
    
    ${order.notes ? `
    <hr class="divider">
    <div class="section">
      <div class="section-title">Observacoes:</div>
      <div class="section-content">${order.notes}</div>
    </div>
    ` : ''}
    
    <hr class="divider">
    
    <div class="section">
      <div class="section-title">${order.deliveryType === 'delivery' ? 'Endereco de Entrega' : 'Retirada no Local'}</div>
      <div class="section-content">
        ${order.deliveryType === 'delivery' ? 
          (order.customerAddress || 'Endereco nao informado') : 
          'Cliente ira retirar no estabelecimento'
        }
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Pagamento</div>
      <div class="section-content">${paymentMethodText[order.paymentMethod] || order.paymentMethod}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="section-content">
        ${order.customerName || 'Nao informado'}<br>
        ${order.customerPhone || ''}
      </div>
    </div>
    
    <div class="footer">
      <p>Pedido realizado via Cardapio Admin</p>
      <p>manus.space</p>
    </div>
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
