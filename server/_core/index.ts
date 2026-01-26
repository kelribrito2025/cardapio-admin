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
    'credit': 'Cartão de Crédito',
    'debit': 'Cartão de Débito',
    'pix': 'PIX',
    'boleto': 'Boleto'
  };
  
  let itemsHTML = '';
  for (const item of items) {
    itemsHTML += `
      <tr>
        <td style="text-align:left;padding:2px 0;">${item.quantity}x ${item.productName}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `;
    if (item.notes) {
      itemsHTML += `<tr><td colspan="2" style="font-size:10px;color:#666;padding-left:10px;">Obs: ${item.notes}</td></tr>`;
    }
    // Parse complements if exists
    if (item.complements) {
      try {
        const complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : item.complements;
        if (Array.isArray(complements)) {
          for (const comp of complements) {
            if (comp.items && Array.isArray(comp.items)) {
              for (const ci of comp.items) {
                itemsHTML += `<tr><td colspan="2" style="font-size:10px;color:#666;padding-left:10px;">+ ${ci.name}${ci.price > 0 ? ` (${formatCurrency(ci.price)})` : ''}</td></tr>`;
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      font-size: 12px; 
      width: 100%; 
      max-width: 300px; 
      margin: 0 auto;
      padding: 5px;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header h2 { font-size: 14px; margin-top: 5px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .info { margin: 5px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .items-table { width: 100%; border-collapse: collapse; }
    .totals { margin-top: 10px; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .total-final { font-weight: bold; font-size: 14px; margin-top: 5px; }
    .footer { text-align: center; margin-top: 15px; font-size: 10px; }
    .customer { margin: 10px 0; }
    .notes { background: #f5f5f5; padding: 5px; margin: 5px 0; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${establishment?.name || 'Estabelecimento'}</h1>
    <h2>PEDIDO #${order.orderNumber}</h2>
    <p>${formatDate(order.createdAt)}</p>
    <p style="font-weight:bold;margin-top:5px;">${deliveryTypeText}</p>
  </div>
  
  <div class="divider"></div>
  
  <div class="customer">
    <strong>Cliente:</strong> ${order.customerName || 'Não informado'}<br>
    ${order.customerPhone ? `<strong>Tel:</strong> ${order.customerPhone}<br>` : ''}
    ${order.deliveryType === 'delivery' && order.customerAddress ? `<strong>Endereço:</strong> ${order.customerAddress}` : ''}
  </div>
  
  <div class="divider"></div>
  
  <table class="items-table">
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>
  
  <div class="divider"></div>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.deliveryType === 'delivery' ? `
    <div class="total-row">
      <span>Taxa de entrega:</span>
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
  
  <div class="divider"></div>
  
  <div class="info">
    <strong>Pagamento:</strong> ${paymentMethodText[order.paymentMethod] || order.paymentMethod}
    ${order.paymentMethod === 'cash' && order.changeFor ? `<br><strong>Troco para:</strong> ${formatCurrency(order.changeFor)}` : ''}
  </div>
  
  ${order.notes ? `
  <div class="notes">
    <strong>Observações:</strong> ${order.notes}
  </div>
  ` : ''}
  
  ${settings?.footerMessage ? `
  <div class="footer">
    <p>${settings.footerMessage}</p>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Obrigado pela preferência!</p>
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
