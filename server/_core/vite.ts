import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getEstablishmentBySlug } from "../db";

/**
 * Escapa caracteres especiais de HTML para prevenir XSS nas meta tags
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extrai o slug de menu de uma URL no formato /menu/:slug
 * Retorna null se a URL não corresponder ao padrão
 */
export function extractMenuSlug(url: string): string | null {
  const match = url.match(/^\/menu\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Gera as meta tags OG dinâmicas para um estabelecimento
 */
export function generateOgMetaTags(establishment: {
  name: string;
  logo?: string | null;
  coverImage?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  menuSlug?: string | null;
}): string {
  const restaurantName = escapeHtml(establishment.name);
  const description = establishment.city
    ? `Confira o cardápio de ${restaurantName} em ${escapeHtml(establishment.city)}. Faça seu pedido online!`
    : `Confira o cardápio de ${restaurantName}. Faça seu pedido online!`;

  // Prioriza coverImage, depois logo como imagem de preview
  const ogImage = establishment.coverImage || establishment.logo || "";

  const tags = [
    `<meta property="og:title" content="${restaurantName} - Cardápio Digital" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
  ];

  if (ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
  }

  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />`);
  tags.push(`<meta name="twitter:title" content="${restaurantName} - Cardápio Digital" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  if (ogImage) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);
  }

  return tags.join("\n    ");
}

/**
 * Injeta meta tags OG no HTML template para páginas de menu público
 * Substitui o <title> e adiciona as meta tags no <head>
 */
export function injectOgTags(html: string, establishment: {
  name: string;
  logo?: string | null;
  coverImage?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  menuSlug?: string | null;
}): string {
  const ogTags = generateOgMetaTags(establishment);
  const restaurantName = escapeHtml(establishment.name);

  // Substituir o título da página
  let result = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${restaurantName} - Cardápio Digital</title>`
  );

  // Substituir a meta description existente
  result = result.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="Confira o cardápio de ${restaurantName}. Faça seu pedido online!" />`
  );

  // Injetar OG tags antes do </head>
  result = result.replace(
    "</head>",
    `    <!-- Open Graph Meta Tags -->\n    ${ogTags}\n  </head>`
  );

  return result;
}

/**
 * Busca dados do estabelecimento pelo slug e injeta OG tags no HTML
 * Retorna o HTML modificado ou null se o slug não existir
 */
async function getOgEnhancedHtml(slug: string, html: string): Promise<string> {
  try {
    const establishment = await getEstablishmentBySlug(slug);
    if (establishment) {
      return injectOgTags(html, establishment);
    }
  } catch (error) {
    console.error("[OG Tags] Erro ao buscar establishment:", error);
  }
  // Se não encontrar o establishment, retorna o HTML original
  return html;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);

      // Injetar OG tags dinâmicas para páginas de menu público
      const menuSlug = extractMenuSlug(url);
      if (menuSlug) {
        page = await getOgEnhancedHtml(menuSlug, page);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (_req, res) => {
    const url = _req.originalUrl;
    const indexPath = path.resolve(distPath, "index.html");

    // Injetar OG tags dinâmicas para páginas de menu público em produção
    const menuSlug = extractMenuSlug(url);
    if (menuSlug) {
      try {
        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = await getOgEnhancedHtml(menuSlug, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
        return;
      } catch (error) {
        console.error("[OG Tags] Erro ao servir HTML com OG tags:", error);
      }
    }

    res.sendFile(indexPath);
  });
}
