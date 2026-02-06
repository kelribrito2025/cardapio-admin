import sharp from "sharp";

/**
 * Gera uma imagem OG (1200x630) personalizada para um restaurante.
 * 
 * Layout:
 * - Imagem de capa como fundo (com overlay escuro para legibilidade)
 * - Logo circular no centro-esquerda
 * - Nome do restaurante em texto grande e branco
 * - Cidade/bairro como subtítulo
 * - Badge "Cardápio Digital" no canto inferior
 * 
 * Se não houver imagem de capa, gera um fundo gradiente vermelho.
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Busca uma imagem remota e retorna como Buffer
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[OG Image] Erro ao buscar imagem:", url, error);
    return null;
  }
}

/**
 * Cria um SVG com o texto do nome do restaurante e informações adicionais
 */
function createTextOverlaySvg(
  name: string,
  subtitle?: string | null
): string {
  // Escapar caracteres especiais para SVG
  const escapeSvg = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const safeName = escapeSvg(name);
  const safeSubtitle = subtitle ? escapeSvg(subtitle) : "";

  // Calcular tamanho da fonte baseado no comprimento do nome
  let fontSize = 64;
  if (name.length > 30) fontSize = 48;
  if (name.length > 45) fontSize = 40;
  if (name.length > 60) fontSize = 32;

  const subtitleY = subtitle ? 420 : 0;

  return `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.7"/>
        </filter>
        <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.15"/>
          <stop offset="40%" stop-color="#000000" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
        </linearGradient>
        <linearGradient id="badge-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </linearGradient>
      </defs>

      <!-- Overlay gradiente escuro -->
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#overlay)"/>

      <!-- Nome do restaurante -->
      <text
        x="${OG_WIDTH / 2}"
        y="360"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        filter="url(#shadow)"
      >${safeName}</text>

      <!-- Subtítulo (cidade/bairro) -->
      ${safeSubtitle ? `
      <text
        x="${OG_WIDTH / 2}"
        y="${subtitleY}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="28"
        font-weight="normal"
        fill="rgba(255,255,255,0.9)"
        filter="url(#shadow)"
      >${safeSubtitle}</text>
      ` : ""}

      <!-- Badge "Cardápio Digital" -->
      <rect x="${OG_WIDTH / 2 - 110}" y="540" width="220" height="40" rx="20" fill="url(#badge-bg)" opacity="0.95"/>
      <text
        x="${OG_WIDTH / 2}"
        y="566"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="18"
        font-weight="bold"
        fill="white"
      >Cardápio Digital</text>

      <!-- Linha decorativa -->
      <rect x="${OG_WIDTH / 2 - 40}" y="390" width="80" height="3" rx="1.5" fill="#dc2626" opacity="0.9"/>
    </svg>
  `;
}

/**
 * Cria um fundo gradiente vermelho quando não há imagem de capa
 */
function createGradientBackground(): string {
  return `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#991b1b"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </linearGradient>
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.08)"/>
        </pattern>
      </defs>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg-gradient)"/>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#dots)"/>
    </svg>
  `;
}

/**
 * Gera a imagem OG completa para um restaurante
 */
export async function generateOgImage(establishment: {
  name: string;
  logo?: string | null;
  coverImage?: string | null;
  city?: string | null;
  neighborhood?: string | null;
}): Promise<Buffer> {
  const compositeImages: sharp.OverlayOptions[] = [];

  // 1. Preparar fundo (capa ou gradiente)
  let baseImage: sharp.Sharp;

  if (establishment.coverImage) {
    const coverBuffer = await fetchImageBuffer(establishment.coverImage);
    if (coverBuffer) {
      // Redimensionar a capa para preencher 1200x630
      const resizedCover = await sharp(coverBuffer)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
        .toBuffer();
      baseImage = sharp(resizedCover);
    } else {
      // Fallback: gradiente se a capa não puder ser carregada
      baseImage = sharp(Buffer.from(createGradientBackground()));
    }
  } else {
    // Sem capa: usar gradiente
    baseImage = sharp(Buffer.from(createGradientBackground()));
  }

  // Garantir que a base tem o tamanho correto
  baseImage = baseImage.resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" });

  // 2. Preparar logo circular (se disponível)
  if (establishment.logo) {
    const logoBuffer = await fetchImageBuffer(establishment.logo);
    if (logoBuffer) {
      const logoSize = 120;
      const logoBorderWidth = 4;
      const totalSize = logoSize + logoBorderWidth * 2;

      // Criar máscara circular para o logo
      const circleMask = Buffer.from(
        `<svg width="${logoSize}" height="${logoSize}">
          <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="white"/>
        </svg>`
      );

      // Redimensionar e aplicar máscara circular ao logo
      const circularLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: "cover" })
        .composite([{ input: circleMask, blend: "dest-in" }])
        .png()
        .toBuffer();

      // Criar borda branca circular
      const logoWithBorder = await sharp({
        create: {
          width: totalSize,
          height: totalSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 255 },
        },
      })
        .png()
        .composite([
          {
            input: Buffer.from(
              `<svg width="${totalSize}" height="${totalSize}">
                <circle cx="${totalSize / 2}" cy="${totalSize / 2}" r="${totalSize / 2}" fill="white"/>
              </svg>`
            ),
            blend: "dest-in",
          },
          {
            input: circularLogo,
            top: logoBorderWidth,
            left: logoBorderWidth,
          },
        ])
        .png()
        .toBuffer();

      compositeImages.push({
        input: logoWithBorder,
        top: 180,
        left: Math.round(OG_WIDTH / 2 - totalSize / 2),
      });
    }
  }

  // 3. Criar overlay de texto com nome e subtítulo
  const subtitle = [establishment.neighborhood, establishment.city]
    .filter(Boolean)
    .join(" - ");

  const textOverlay = createTextOverlaySvg(
    establishment.name,
    subtitle || null
  );

  compositeImages.push({
    input: Buffer.from(textOverlay),
    top: 0,
    left: 0,
  });

  // 4. Compor tudo e gerar PNG
  const result = await baseImage
    .composite(compositeImages)
    .png({ quality: 85, compressionLevel: 6 })
    .toBuffer();

  return result;
}
