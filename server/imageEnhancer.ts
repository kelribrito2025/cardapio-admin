/**
 * Image Enhancer - Melhoramento de fotos de produtos com IA (Nano Banana / Gemini)
 * 
 * Usa a API generateImage do Manus (que internamente usa Gemini) para:
 * 1. Identificar o tipo de comida na foto
 * 2. Criar um cenário temático baseado no nicho (ex: hambúrguer → tábua de madeira, fundo churrasqueira)
 * 3. Melhorar iluminação, cores e nitidez
 * 4. Manter o prato/produto exatamente igual
 * 
 * Limite: imagens até 4MB
 */

import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Prompt principal para melhoramento de fotos de comida.
 * Instrui a IA a:
 * - Identificar o tipo de comida
 * - Criar cenário temático baseado no nicho
 * - Melhorar qualidade da foto
 * - NÃO alterar o prato em si
 */
const FOOD_ENHANCE_PROMPT = `You are a professional food photographer and photo editor. Analyze this food photo and follow these instructions precisely:

1. IDENTIFY the type of food/dish in the photo (burger, pizza, sushi, açaí, salad, dessert, coffee, etc.)

2. CREATE A THEMATIC SCENE that matches the food's culinary niche:
   - Burger/BBQ: rustic wooden cutting board, craft paper, grill/barbecue atmosphere with subtle smoke, warm lighting
   - Pizza: flour-dusted wooden surface, Italian kitchen feel, fresh basil leaves, warm oven glow
   - Sushi/Japanese: bamboo mat, chopsticks, soy sauce dish, minimalist Japanese aesthetic, clean lines
   - Açaí/Smoothie bowls: bright clean surface, tropical fruits around, fresh natural feel, vibrant colors
   - Desserts/Cakes: elegant porcelain plate, pastel background, decorative fruits, soft lighting
   - Coffee/Drinks: coffee shop table, coffee beans scattered, cozy warm atmosphere
   - Salads/Healthy: clean white/marble surface, fresh ingredients around, bright natural lighting
   - Pasta/Italian: rustic table, parmesan cheese, herbs, warm Mediterranean feel
   - Fried foods: craft paper liner, casual street food vibe, warm golden lighting
   - General: professional food photography studio setup with appropriate props

3. ENHANCE the photo quality:
   - Improve lighting and white balance
   - Boost color vibrancy naturally (make food look more appetizing)
   - Sharpen focus and improve clarity
   - Fix noise from phone cameras
   - Add professional depth of field (slight background blur)

4. CRITICAL RULES:
   - Keep the EXACT SAME food/dish - do NOT change, add, or remove any food items
   - Keep the same portions and presentation of the food
   - Only change the surrounding scene, background, surface, and lighting
   - The result should look like a professional food photography shot
   - Output a single high-quality image

Create a professional, appetizing food photography composition with the thematic scene.`;

export interface EnhanceImageResult {
  enhancedUrl: string;
  originalUrl: string;
}

/**
 * Melhora uma foto de produto usando IA
 * @param imageUrl URL da imagem original no S3
 * @param establishmentId ID do estabelecimento (para organizar no S3)
 * @returns URLs da imagem original e melhorada
 */
export async function enhanceProductImage(
  imageUrl: string,
  establishmentId: number
): Promise<EnhanceImageResult> {
  // Validar que a URL existe
  if (!imageUrl) {
    throw new Error("URL da imagem é obrigatória");
  }

  // Verificar tamanho da imagem (fetch HEAD para verificar Content-Length)
  try {
    const headResponse = await fetch(imageUrl, { method: "HEAD" });
    const contentLength = headResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("A imagem excede o limite de 4MB. Por favor, use uma imagem menor.");
    }
  } catch (error: any) {
    if (error.message?.includes("4MB")) throw error;
    // Se não conseguir verificar o tamanho, continuar mesmo assim
    console.warn("[ImageEnhancer] Não foi possível verificar tamanho da imagem:", error.message);
  }

  // Detectar o mime type pela extensão
  const mimeType = getMimeType(imageUrl);

  // Chamar a API de geração de imagem com a imagem original como referência
  const result = await generateImage({
    prompt: FOOD_ENHANCE_PROMPT,
    originalImages: [{
      url: imageUrl,
      mimeType: mimeType,
    }],
  });

  if (!result.url) {
    throw new Error("Falha ao gerar imagem melhorada. Tente novamente.");
  }

  return {
    enhancedUrl: result.url,
    originalUrl: imageUrl,
  };
}

/**
 * Detecta o MIME type baseado na extensão da URL
 */
function getMimeType(url: string): string {
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".png")) return "image/png";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".gif")) return "image/gif";
  return "image/jpeg"; // Default para jpg/jpeg
}
