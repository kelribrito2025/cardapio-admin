/**
 * SEO Module - Dynamic meta tags, Schema.org, and OpenGraph for public menus
 * 
 * Intercepts /menu/:slug requests and injects SEO-optimized HTML head content
 * before the SPA takes over rendering.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { getEstablishmentBySlug, getDb } from "./db";
import { categories, products } from "../drizzle/schema";
import { eq, asc } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EstablishmentSEO {
  id: number;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  whatsapp: string | null;
  menuSlug: string | null;
  rating: string | null;
  reviewCount: number;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  latitude: string | null;
  longitude: string | null;
}

interface ProductSEO {
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  categoryName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildFullAddress(est: EstablishmentSEO): string {
  const parts: string[] = [];
  if (est.street) parts.push(est.street);
  if (est.number) parts.push(est.number);
  if (est.neighborhood) parts.push(est.neighborhood);
  if (est.city) parts.push(est.city);
  if (est.state) parts.push(est.state);
  return parts.join(", ");
}

function buildServiceTypes(est: EstablishmentSEO): string[] {
  const types: string[] = [];
  if (est.allowsDelivery) types.push("Delivery");
  if (est.allowsPickup) types.push("Retirada");
  if (est.allowsDineIn) types.push("Consumo no local");
  return types.length > 0 ? types : ["Delivery"];
}

function formatPhone(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+55${digits}`;
  }
  return null;
}

// ─── Meta Tags Generator ─────────────────────────────────────────────────────

function generateMetaTags(est: EstablishmentSEO, menuUrl: string): string {
  const name = escapeHtml(est.name);
  const city = est.city ? escapeHtml(est.city) : "";
  const state = est.state ? escapeHtml(est.state) : "";
  const location = [city, state].filter(Boolean).join(" - ");
  const serviceTypes = buildServiceTypes(est).join(", ");

  // Title: "Nome do Restaurante | Cardápio Digital | Cidade - UF"
  const title = location
    ? `${name} | Cardápio Digital | ${location}`
    : `${name} | Cardápio Digital`;

  // Description: "Faça seu pedido online no Nome. Delivery, Retirada em Cidade. Cardápio completo com preços atualizados."
  const description = location
    ? `Faça seu pedido online no ${name}. ${serviceTypes} em ${city || location}. Cardápio completo com preços atualizados. Peça agora!`
    : `Faça seu pedido online no ${name}. ${serviceTypes}. Cardápio completo com preços atualizados. Peça agora!`;

  const ogImage = est.coverImage || est.logo || "";

  const tags: string[] = [
    // Basic SEO
    `<title>${title}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${escapeHtml(menuUrl)}" />`,

    // OpenGraph (WhatsApp, Facebook, etc.)
    `<meta property="og:type" content="restaurant" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(menuUrl)}" />`,
    `<meta property="og:site_name" content="${name}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
  ];

  if (ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
    tags.push(`<meta property="og:image:alt" content="${name}" />`);
  }

  // Twitter Card
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${title}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  if (ogImage) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);
  }

  // Geo tags
  if (est.latitude && est.longitude) {
    tags.push(`<meta name="geo.position" content="${est.latitude};${est.longitude}" />`);
    tags.push(`<meta name="ICBM" content="${est.latitude}, ${est.longitude}" />`);
  }
  if (location) {
    tags.push(`<meta name="geo.placename" content="${location}" />`);
    tags.push(`<meta name="geo.region" content="BR${est.state ? `-${escapeHtml(est.state)}` : ""}" />`);
  }

  return tags.join("\n    ");
}

// ─── Schema.org JSON-LD Generator ────────────────────────────────────────────

function generateSchemaOrg(
  est: EstablishmentSEO,
  menuUrl: string,
  productsList: ProductSEO[]
): string {
  const address = buildFullAddress(est);
  const phone = formatPhone(est.whatsapp);

  // Main Restaurant schema
  const restaurant: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: est.name,
    url: menuUrl,
  };

  if (est.logo) {
    restaurant.image = est.logo;
  }
  if (est.coverImage) {
    restaurant.photo = est.coverImage;
  }

  if (address) {
    restaurant.address = {
      "@type": "PostalAddress",
      streetAddress: [est.street, est.number].filter(Boolean).join(", ") || undefined,
      addressLocality: est.city || undefined,
      addressRegion: est.state || undefined,
      addressCountry: "BR",
    };
  }

  if (est.latitude && est.longitude) {
    restaurant.geo = {
      "@type": "GeoCoordinates",
      latitude: parseFloat(est.latitude),
      longitude: parseFloat(est.longitude),
    };
  }

  if (phone) {
    restaurant.telephone = phone;
  }

  // Rating
  if (est.rating && parseFloat(est.rating) > 0 && est.reviewCount > 0) {
    restaurant.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(est.rating),
      reviewCount: est.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Service types
  const serviceTypes = buildServiceTypes(est);
  if (serviceTypes.length > 0) {
    restaurant.servesCuisine = serviceTypes;
  }

  // Menu with products
  if (productsList.length > 0) {
    const menuSections: Record<string, any[]> = {};
    for (const p of productsList) {
      if (!menuSections[p.categoryName]) {
        menuSections[p.categoryName] = [];
      }
      const menuItem: Record<string, any> = {
        "@type": "MenuItem",
        name: p.name,
        offers: {
          "@type": "Offer",
          price: parseFloat(p.price).toFixed(2),
          priceCurrency: "BRL",
        },
      };
      if (p.description) {
        menuItem.description = p.description;
      }
      if (p.image) {
        menuItem.image = p.image;
      }
      menuSections[p.categoryName].push(menuItem);
    }

    restaurant.hasMenu = {
      "@type": "Menu",
      name: `Cardápio ${est.name}`,
      hasMenuSection: Object.entries(menuSections).map(([name, items]) => ({
        "@type": "MenuSection",
        name,
        hasMenuItem: items,
      })),
    };
  }

  return `<script type="application/ld+json">${JSON.stringify(restaurant)}</script>`;
}

// ─── Product List Fetcher ────────────────────────────────────────────────────

async function getProductsForSEO(establishmentId: number): Promise<ProductSEO[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const cats = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.establishmentId, establishmentId))
      .orderBy(asc(categories.sortOrder));

    const catMap = new Map<number, string>();
    for (const c of cats) {
      catMap.set(c.id, c.name);
    }

    const prods = await db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        images: products.images,
        categoryId: products.categoryId,
        status: products.status,
      })
      .from(products)
      .where(eq(products.establishmentId, establishmentId));

    return prods
      .filter((p) => p.status === "active" && p.categoryId)
      .map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.images && p.images.length > 0 ? p.images[0] : null,
        categoryName: catMap.get(p.categoryId!) || "Outros",
      }));
  } catch (error) {
    console.error("[SEO] Error fetching products:", error);
    return [];
  }
}

// ─── HTML Injector ───────────────────────────────────────────────────────────

/**
 * Injects SEO meta tags into the HTML template for /menu/:slug routes.
 * Replaces the static <title> and adds meta tags, OpenGraph, and Schema.org JSON-LD.
 */
export function injectSEOIntoHTML(
  html: string,
  metaTags: string,
  schemaOrg: string
): string {
  // Replace the static title and add meta tags after it
  // Find the closing </title> and inject after it
  const titleEndIndex = html.indexOf("</title>");
  if (titleEndIndex === -1) return html;

  // Find the opening <title> to replace the whole title block
  const titleStartIndex = html.indexOf("<title>");
  if (titleStartIndex === -1) return html;

  // Remove old title and description meta
  let modified = html;
  
  // Replace old title with new meta tags (which include the new title)
  const oldTitleBlock = modified.substring(titleStartIndex, titleEndIndex + "</title>".length);
  modified = modified.replace(oldTitleBlock, metaTags);

  // Remove old static description meta tag
  modified = modified.replace(
    /<meta name="description" content="Sistema de gerenciamento de pedidos e card[^"]*" \/>/,
    ""
  );

  // Inject Schema.org JSON-LD before closing </head>
  modified = modified.replace("</head>", `    ${schemaOrg}\n  </head>`);

  return modified;
}

// ─── Express Middleware ──────────────────────────────────────────────────────

/**
 * Creates an Express middleware that intercepts /menu/:slug requests
 * and generates SEO-optimized HTML with dynamic meta tags.
 */
export function createSEOMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;

    // Only intercept /menu/:slug routes (not API, not assets)
    const menuMatch = url.match(/^\/menu\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
    if (!menuMatch) {
      return next();
    }

    const slug = menuMatch[1];

    try {
      const establishment = await getEstablishmentBySlug(slug);
      if (!establishment) {
        return next(); // Let the SPA handle 404
      }

      // Build the canonical URL
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "";
      const menuUrl = `${protocol}://${host}/menu/${slug}`;

      // Fetch products for Schema.org
      const productsList = await getProductsForSEO(establishment.id);

      // Generate SEO content
      const metaTags = generateMetaTags(establishment as any, menuUrl);
      const schemaOrg = generateSchemaOrg(establishment as any, menuUrl, productsList);

      // Store SEO data for the HTML transformer to use
      (req as any).__seoData = { metaTags, schemaOrg };

      next();
    } catch (error) {
      console.error("[SEO] Error generating meta tags:", error);
      next(); // Fallback to default HTML
    }
  };
}

// ─── Sitemap Generator ───────────────────────────────────────────────────────

export async function generateSitemap(baseUrl: string): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return generateEmptySitemap(baseUrl);

    const { establishments } = await import("../drizzle/schema");

    const allEstablishments = await db
      .select({
        menuSlug: establishments.menuSlug,
        updatedAt: establishments.updatedAt,
        name: establishments.name,
      })
      .from(establishments);

    const activeEstablishments = allEstablishments.filter(
      (e) => e.menuSlug && e.menuSlug.length > 0
    );

    const urls: string[] = [
      `  <url>`,
      `    <loc>${baseUrl}/</loc>`,
      `    <changefreq>weekly</changefreq>`,
      `    <priority>1.0</priority>`,
      `  </url>`,
    ];

    for (const est of activeEstablishments) {
      const lastmod = est.updatedAt
        ? new Date(est.updatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      urls.push(`  <url>`);
      urls.push(`    <loc>${baseUrl}/menu/${est.menuSlug}</loc>`);
      urls.push(`    <lastmod>${lastmod}</lastmod>`);
      urls.push(`    <changefreq>daily</changefreq>`);
      urls.push(`    <priority>0.8</priority>`);
      urls.push(`  </url>`);
    }

    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join("\n");
  } catch (error) {
    console.error("[SEO] Error generating sitemap:", error);
    return generateEmptySitemap(baseUrl);
  }
}

function generateEmptySitemap(baseUrl: string): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <url>`,
    `    <loc>${baseUrl}/</loc>`,
    `    <changefreq>weekly</changefreq>`,
    `    <priority>1.0</priority>`,
    `  </url>`,
    `</urlset>`,
  ].join("\n");
}

// ─── Robots.txt Generator ────────────────────────────────────────────────────

export function generateRobotsTxt(baseUrl: string): string {
  return [
    `User-agent: *`,
    `Allow: /menu/`,
    `Allow: /$`,
    `Disallow: /api/`,
    `Disallow: /dashboard`,
    `Disallow: /pedidos`,
    `Disallow: /catalogo`,
    `Disallow: /complementos`,
    `Disallow: /configuracoes`,
    `Disallow: /financas`,
    `Disallow: /clientes`,
    `Disallow: /cupons`,
    `Disallow: /stories`,
    `Disallow: /entregadores`,
    `Disallow: /mesas`,
    `Disallow: /avaliacoes`,
    `Disallow: /admin`,
    `Disallow: /login`,
    `Disallow: /register`,
    `Disallow: /printer-app`,
    ``,
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n");
}
