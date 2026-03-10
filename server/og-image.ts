/**
 * Dynamic OG Image Generator
 * 
 * Generates a 1200x630 Open Graph image for /menu/:slug pages.
 * Composition: cover image as background + logo overlay + restaurant name + service info.
 * Uses sharp for image processing with SVG overlay for text/layout.
 */

import type { Express, Request, Response } from "express";
import sharp from "sharp";
import { getEstablishmentBySlug } from "./db";

// ─── Constants ──────────────────────────────────────────────────────────────

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const CACHE_DURATION = 60 * 60; // 1 hour in seconds
const FALLBACK_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663232987165/enmWmXpAt34diouyKU4TE2/og-fallback-restaurant-59Pg6eq6bi2fQgZCkkFtJp.png";

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + "…";
}

function buildServiceBadges(est: {
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
}): string[] {
  const types: string[] = [];
  if (est.allowsDelivery) types.push("Delivery");
  if (est.allowsPickup) types.push("Retirada");
  if (est.allowsDineIn) types.push("Consumo no local");
  return types.length > 0 ? types : ["Delivery"];
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[OG-Image] Failed to fetch image:", url);
    return null;
  }
}

async function processCoverImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function processLogo(buffer: Buffer, size: number): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
}

// ─── SVG Overlay (with cover background) ────────────────────────────────────

function generateOverlaySVG(params: {
  name: string;
  location: string;
  services: string[];
  rating: string | null;
  reviewCount: number;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  hasLogo: boolean;
}): string {
  const { name, location, services, rating, reviewCount, deliveryTimeMin, deliveryTimeMax, hasLogo } = params;

  const displayName = escapeXml(truncate(name, 35));
  const displayLocation = location ? escapeXml(truncate(location, 50)) : "";
  const serviceText = escapeXml(services.join("  ·  "));

  let timeText = "";
  if (deliveryTimeMin && deliveryTimeMax) {
    timeText = `${deliveryTimeMin}-${deliveryTimeMax}min`;
  } else if (deliveryTimeMin) {
    timeText = `${deliveryTimeMin}min`;
  }

  let ratingText = "";
  if (rating && parseFloat(rating) > 0 && reviewCount > 0) {
    ratingText = `★ ${parseFloat(rating).toFixed(1)} (${reviewCount})`;
  }

  const infoItems: string[] = [];
  if (serviceText) infoItems.push(serviceText);
  if (timeText) infoItems.push(timeText);
  const infoBarText = escapeXml(infoItems.join("  |  "));

  const logoAreaX = 60;
  const logoAreaY = 340;
  const logoSize = 120;
  const textX = hasLogo ? logoAreaX + logoSize + 30 : 80;
  const nameY = 410;
  const locationY = nameY + 45;
  const ratingY = locationY + (displayLocation ? 38 : 0);

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darkOverlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="40%" stop-color="rgba(0,0,0,0.1)" />
      <stop offset="70%" stop-color="rgba(0,0,0,0.6)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
    </linearGradient>
    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)" />
    </filter>
    ${hasLogo ? `<clipPath id="logoCircle"><circle cx="${logoAreaX + logoSize / 2}" cy="${logoAreaY + logoSize / 2}" r="${logoSize / 2}" /></clipPath>` : ""}
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#darkOverlay)" />

  ${hasLogo ? `<circle cx="${logoAreaX + logoSize / 2}" cy="${logoAreaY + logoSize / 2}" r="${logoSize / 2 + 4}" fill="white" opacity="0.95" />` : ""}

  <text x="${textX}" y="${nameY}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="bold" fill="white" filter="url(#textShadow)">${displayName}</text>

  ${displayLocation ? `<text x="${textX}" y="${locationY}" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="rgba(255,255,255,0.85)" filter="url(#textShadow)">${displayLocation}</text>` : ""}

  ${ratingText ? `<text x="${textX}" y="${ratingY}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#fbbf24" filter="url(#textShadow)">${escapeXml(ratingText)}</text>` : ""}

  <rect x="0" y="${OG_HEIGHT - 65}" width="${OG_WIDTH}" height="65" fill="url(#barGradient)" opacity="0.95" />
  <text x="${OG_WIDTH / 2}" y="${OG_HEIGHT - 25}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${infoBarText}</text>

  <text x="${OG_WIDTH - 30}" y="35" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="rgba(255,255,255,0.7)" text-anchor="end">mindi.com.br</text>
</svg>`;
}

// ─── No-Cover SVG (full design without background image) ────────────────────

function generateNoCoverSVG(params: {
  name: string;
  location: string;
  services: string[];
  rating: string | null;
  reviewCount: number;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
}): string {
  const { name, location, services, rating, reviewCount, deliveryTimeMin, deliveryTimeMax } = params;

  const displayName = escapeXml(truncate(name, 30));
  const displayLocation = location ? escapeXml(truncate(location, 50)) : "";
  const serviceText = escapeXml(services.join("  ·  "));

  let timeText = "";
  if (deliveryTimeMin && deliveryTimeMax) {
    timeText = `${deliveryTimeMin}-${deliveryTimeMax}min`;
  } else if (deliveryTimeMin) {
    timeText = `${deliveryTimeMin}min`;
  }

  let ratingText = "";
  if (rating && parseFloat(rating) > 0 && reviewCount > 0) {
    ratingText = `★ ${parseFloat(rating).toFixed(1)} (${reviewCount})`;
  }

  const infoItems: string[] = [];
  if (serviceText) infoItems.push(serviceText);
  if (timeText) infoItems.push(timeText);
  const infoBarText = escapeXml(infoItems.join("  |  "));

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e" />
      <stop offset="50%" stop-color="#16213e" />
      <stop offset="100%" stop-color="#0f3460" />
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bgGrad)" />
  <circle cx="100" cy="100" r="200" fill="rgba(220,38,38,0.08)" />
  <circle cx="1100" cy="500" r="250" fill="rgba(220,38,38,0.06)" />

  <text x="${OG_WIDTH / 2}" y="320" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle">${displayName}</text>
  <text x="${OG_WIDTH / 2}" y="370" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle">Cardápio Digital</text>

  ${displayLocation ? `<text x="${OG_WIDTH / 2}" y="415" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="rgba(255,255,255,0.6)" text-anchor="middle">${displayLocation}</text>` : ""}

  ${ratingText ? `<text x="${OG_WIDTH / 2}" y="${displayLocation ? 455 : 415}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#fbbf24" text-anchor="middle">${escapeXml(ratingText)}</text>` : ""}

  <rect x="0" y="${OG_HEIGHT - 65}" width="${OG_WIDTH}" height="65" fill="url(#barGrad)" opacity="0.95" />
  <text x="${OG_WIDTH / 2}" y="${OG_HEIGHT - 25}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${infoBarText}</text>

  <text x="${OG_WIDTH - 30}" y="35" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="end">mindi.com.br</text>
</svg>`;
}

// ─── Image Composer ─────────────────────────────────────────────────────────

async function composeOGImage(est: {
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  rating: string | null;
  reviewCount: number;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  allowsDineIn: boolean;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  menuSlug: string | null;
}): Promise<Buffer> {
  const city = est.city || "";
  const state = est.state || "";
  const location = [city, state].filter(Boolean).join(" - ");
  const services = buildServiceBadges(est);

  // Try to fetch cover image
  let coverBuffer: Buffer | null = null;
  if (est.coverImage) {
    coverBuffer = await fetchImageBuffer(est.coverImage);
    if (coverBuffer) {
      coverBuffer = await processCoverImage(coverBuffer);
    }
  }

  // Try to fetch logo
  let logoBuffer: Buffer | null = null;
  if (est.logo) {
    logoBuffer = await fetchImageBuffer(est.logo);
    if (logoBuffer) {
      logoBuffer = await processLogo(logoBuffer, 120);
    }
  }

  const hasCover = !!coverBuffer;
  const hasLogo = !!logoBuffer;

  if (hasCover) {
    const overlaySVG = generateOverlaySVG({
      name: est.name,
      location,
      services,
      rating: est.rating,
      reviewCount: est.reviewCount,
      deliveryTimeMin: est.deliveryTimeMin,
      deliveryTimeMax: est.deliveryTimeMax,
      hasLogo,
    });

    const composites: sharp.OverlayOptions[] = [
      { input: Buffer.from(overlaySVG), top: 0, left: 0 },
    ];

    if (logoBuffer) {
      composites.push({ input: logoBuffer, top: 340, left: 60 });
    }

    return sharp(coverBuffer!)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    const svgContent = generateNoCoverSVG({
      name: est.name,
      location,
      services,
      rating: est.rating,
      reviewCount: est.reviewCount,
      deliveryTimeMin: est.deliveryTimeMin,
      deliveryTimeMax: est.deliveryTimeMax,
    });

    const baseImage = sharp(Buffer.from(svgContent))
      .resize(OG_WIDTH, OG_HEIGHT);

    if (logoBuffer) {
      const logoSmall = await processLogo(logoBuffer, 100);
      return baseImage
        .composite([{ input: logoSmall, top: 100, left: Math.floor((OG_WIDTH - 100) / 2) }])
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    return baseImage.jpeg({ quality: 90 }).toBuffer();
  }
}

// ─── Route Registration ─────────────────────────────────────────────────────

export function registerOGImageRoute(app: Express): void {
  app.get("/api/og-image/:slug", async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      const establishment = await getEstablishmentBySlug(slug);
      if (!establishment) {
        res.status(404).send("Not found");
        return;
      }

      const imageBuffer = await composeOGImage(establishment as any);

      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
        "CDN-Cache-Control": `public, max-age=${CACHE_DURATION}`,
      });

      res.send(imageBuffer);
    } catch (error) {
      console.error("[OG-Image] Error generating image for slug:", slug, error);
      res.redirect(302, FALLBACK_IMAGE);
    }
  });
}
