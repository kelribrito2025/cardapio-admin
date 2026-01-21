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
import { addConnection, removeConnection, sendHeartbeat, addCustomerConnection, removeCustomerConnection, sendCustomerHeartbeat } from "./sse";
import { getUserByOpenId, getEstablishmentByUserId } from "../db";
import { sdk } from "./sdk";

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
  
  // SSE endpoint para clientes acompanharem pedidos em tempo real (por telefone)
  app.get("/api/customer/orders/stream", async (req, res) => {
    try {
      const customerPhone = req.query.phone as string;
      
      if (!customerPhone) {
        console.log("[SSE-Customer] Sem telefone fornecido");
        res.status(400).json({ error: "Phone number required" });
        return;
      }
      
      // Normalizar telefone (remover caracteres não numéricos)
      const normalizedPhone = customerPhone.replace(/\D/g, "");
      
      if (normalizedPhone.length < 10) {
        console.log("[SSE-Customer] Telefone inválido:", customerPhone);
        res.status(400).json({ error: "Invalid phone number" });
        return;
      }
      
      // Configurar headers SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para nginx
      res.flushHeaders();
      
      // Enviar evento de conexão estabelecida
      res.write(`event: connected\ndata: ${JSON.stringify({ phone: normalizedPhone })}\n\n`);
      
      // Adicionar conexão ao pool de clientes
      addCustomerConnection(normalizedPhone, res);
      
      // Configurar heartbeat a cada 30 segundos
      const heartbeatInterval = setInterval(() => {
        sendCustomerHeartbeat(normalizedPhone);
      }, 30000);
      
      // Cleanup quando conexão fechar
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        removeCustomerConnection(normalizedPhone, res);
        console.log(`[SSE-Customer] Conexão fechada para cliente ${normalizedPhone}`);
      });
      
    } catch (error) {
      console.error("[SSE-Customer] Erro ao estabelecer conexão:", error);
      res.status(500).json({ error: "Internal server error" });
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
