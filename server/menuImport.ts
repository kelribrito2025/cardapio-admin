/**
 * Menu Import Module
 * 
 * Handles scraping external menu URLs and parsing them with LLM
 * to extract categories, products, prices, and complements.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ============ TYPES ============

export interface ImportedComplement {
  name: string;
  price: number;
}

export interface ImportedComplementGroup {
  name: string;
  isRequired: boolean;
  minQuantity: number;
  maxQuantity: number;
  items: ImportedComplement[];
}

export interface ImportedProduct {
  name: string;
  description: string;
  price: number;
  complementGroups: ImportedComplementGroup[];
}

export interface ImportedCategory {
  name: string;
  products: ImportedProduct[];
}

export interface ImportedMenu {
  categories: ImportedCategory[];
}

export type ProgressCallback = (progress: number, message: string) => void;

// ============ SCRAPING ============

/**
 * Fetch the HTML content of a URL
 */
export async function fetchMenuHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Não foi possível acessar o site: HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml') && !contentType.includes('text/plain')) {
      // Still try to read it, some sites don't set content-type properly
    }
    
    const html = await response.text();
    
    if (html.length < 100) {
      throw new Error('O conteúdo do site parece estar vazio ou inacessível.');
    }
    
    return html;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('O site demorou muito para responder. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Clean HTML to reduce token count - remove scripts, styles, images, etc.
 * Keep only text content relevant to menu items.
 */
export function cleanHtml(html: string): string {
  let cleaned = html;
  
  // Remove script tags and content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove style tags and content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove SVG tags
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  // Remove img tags (we don't need images)
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  // Remove link tags (stylesheets)
  cleaned = cleaned.replace(/<link[^>]*>/gi, '');
  // Remove meta tags
  cleaned = cleaned.replace(/<meta[^>]*>/gi, '');
  // Remove noscript
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  // Remove iframe
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  // Remove all HTML attributes except class and data attributes that might contain menu info
  cleaned = cleaned.replace(/<(\w+)\s+[^>]*>/g, (match, tag) => {
    // Keep just the tag
    return `<${tag}>`;
  });
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  // Remove empty tags
  cleaned = cleaned.replace(/<(\w+)>\s*<\/\1>/g, '');
  
  // Truncate if too long (LLM context limit)
  const MAX_CHARS = 80000;
  if (cleaned.length > MAX_CHARS) {
    cleaned = cleaned.substring(0, MAX_CHARS);
  }
  
  return cleaned.trim();
}

// ============ LLM PARSING ============

/**
 * Use LLM to extract structured menu data from HTML content
 */
export async function parseMenuWithLLM(htmlContent: string): Promise<ImportedMenu> {
  const cleanedHtml = cleanHtml(htmlContent);
  
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é um especialista em extrair dados de cardápios digitais de restaurantes.
Sua tarefa é analisar o HTML de um cardápio online e extrair TODOS os dados estruturados.

REGRAS IMPORTANTES:
1. Extraia TODAS as categorias encontradas no cardápio
2. Para cada categoria, extraia TODOS os produtos/itens
3. Para cada produto, extraia: nome, descrição (se houver), preço
4. Para cada produto, extraia complementos/adicionais se existirem
5. Para complementos, identifique: nome do grupo, se é obrigatório, quantidade mín/máx, e cada item com nome e preço
6. Preços devem ser números decimais (ex: 29.90, não "R$ 29,90")
7. Se um preço não for encontrado, use 0
8. Se uma descrição não for encontrada, use string vazia ""
9. Mantenha a ordem original das categorias e produtos
10. NÃO invente dados que não existem no HTML
11. Ignore itens de navegação, rodapé, e outros elementos não relacionados ao cardápio
12. Se encontrar variações de tamanho (P, M, G), trate como complementos obrigatórios com minQuantity=1 e maxQuantity=1`
      },
      {
        role: "user",
        content: `Analise o seguinte HTML de cardápio e extraia todos os dados estruturados:\n\n${cleanedHtml}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "menu_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nome da categoria" },
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do produto" },
                        description: { type: "string", description: "Descrição do produto" },
                        price: { type: "number", description: "Preço do produto em decimal (ex: 29.90)" },
                        complementGroups: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", description: "Nome do grupo de complementos" },
                              isRequired: { type: "boolean", description: "Se o grupo é obrigatório" },
                              minQuantity: { type: "integer", description: "Quantidade mínima de seleção" },
                              maxQuantity: { type: "integer", description: "Quantidade máxima de seleção" },
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string", description: "Nome do complemento" },
                                    price: { type: "number", description: "Preço adicional do complemento" }
                                  },
                                  required: ["name", "price"],
                                  additionalProperties: false
                                }
                              }
                            },
                            required: ["name", "isRequired", "minQuantity", "maxQuantity", "items"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["name", "description", "price", "complementGroups"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["name", "products"],
                additionalProperties: false
              }
            }
          },
          required: ["categories"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('A IA não conseguiu extrair dados do cardápio. Tente com outro link.');
  }
  
  try {
    const parsed = JSON.parse(content) as ImportedMenu;
    
    // Validate basic structure
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error('Formato de resposta inválido');
    }
    
    if (parsed.categories.length === 0) {
      throw new Error('Nenhuma categoria encontrada no cardápio. Verifique se o link está correto.');
    }
    
    // Count total products
    const totalProducts = parsed.categories.reduce((sum, cat) => sum + cat.products.length, 0);
    if (totalProducts === 0) {
      throw new Error('Nenhum produto encontrado no cardápio. Verifique se o link está correto.');
    }
    
    return parsed;
  } catch (error: any) {
    if (error.message.includes('Nenhuma categoria') || error.message.includes('Nenhum produto')) {
      throw error;
    }
    throw new Error('Erro ao processar os dados do cardápio. Tente novamente.');
  }
}

// ============ DATABASE INSERTION ============

/**
 * Insert the parsed menu data into the database
 */
export async function insertMenuData(
  establishmentId: number,
  menuData: ImportedMenu,
  onProgress: ProgressCallback
): Promise<{ categoriesCreated: number; productsCreated: number; complementsCreated: number }> {
  let categoriesCreated = 0;
  let productsCreated = 0;
  let complementsCreated = 0;
  
  const totalCategories = menuData.categories.length;
  const totalProducts = menuData.categories.reduce((sum, cat) => sum + cat.products.length, 0);
  let processedProducts = 0;
  
  // Get existing categories to determine sort order
  const existingCategories = await db.getCategoriesByEstablishment(establishmentId);
  let nextCategorySortOrder = existingCategories.length > 0 
    ? Math.max(...existingCategories.map(c => c.sortOrder)) + 1 
    : 0;
  
  for (let catIdx = 0; catIdx < menuData.categories.length; catIdx++) {
    const category = menuData.categories[catIdx];
    
    // Create category
    const categoryId = await db.createCategory({
      establishmentId,
      name: category.name,
      sortOrder: nextCategorySortOrder++,
      isActive: true,
    });
    categoriesCreated++;
    
    // Create products in this category
    for (let prodIdx = 0; prodIdx < category.products.length; prodIdx++) {
      const product = category.products[prodIdx];
      processedProducts++;
      
      // Calculate progress: 60-95% range for insertion (0-60% was scraping+parsing)
      const insertionProgress = (processedProducts / totalProducts);
      const overallProgress = Math.round(60 + (insertionProgress * 35));
      onProgress(
        Math.min(overallProgress, 95),
        `Importando: ${category.name} → ${product.name}`
      );
      
      const productId = await db.createProduct({
        establishmentId,
        categoryId,
        name: product.name,
        description: product.description || null,
        price: product.price.toFixed(2),
        status: "active",
        hasStock: true,
        sortOrder: prodIdx,
        images: null,
      });
      productsCreated++;
      
      // Create complement groups and items
      if (product.complementGroups && product.complementGroups.length > 0) {
        for (let groupIdx = 0; groupIdx < product.complementGroups.length; groupIdx++) {
          const group = product.complementGroups[groupIdx];
          
          const groupId = await db.createComplementGroup({
            productId,
            name: group.name,
            isRequired: group.isRequired,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            sortOrder: groupIdx,
          });
          
          // Create complement items
          for (let itemIdx = 0; itemIdx < group.items.length; itemIdx++) {
            const item = group.items[itemIdx];
            
            await db.createComplementItem({
              groupId,
              name: item.name,
              price: item.price.toFixed(2),
              isActive: true,
              sortOrder: itemIdx,
            });
            complementsCreated++;
          }
        }
      }
    }
  }
  
  return { categoriesCreated, productsCreated, complementsCreated };
}

// ============ MAIN IMPORT FUNCTION ============

/**
 * Full import pipeline: fetch → clean → parse → insert
 */
export async function importMenu(
  establishmentId: number,
  url: string,
  onProgress: ProgressCallback
): Promise<{ categoriesCreated: number; productsCreated: number; complementsCreated: number }> {
  // Step 1: Validate URL
  onProgress(5, "Validando link...");
  
  try {
    new URL(url);
  } catch {
    throw new Error("O link fornecido não é válido. Verifique e tente novamente.");
  }
  
  // Step 2: Fetch HTML
  onProgress(10, "Acessando o cardápio...");
  const html = await fetchMenuHtml(url);
  
  // Step 3: Parse with LLM
  onProgress(25, "Analisando o cardápio com IA...");
  const menuData = await parseMenuWithLLM(html);
  
  const totalProducts = menuData.categories.reduce((sum, cat) => sum + cat.products.length, 0);
  onProgress(60, `Encontrados ${menuData.categories.length} categorias e ${totalProducts} produtos. Importando...`);
  
  // Step 4: Insert into database
  const result = await insertMenuData(establishmentId, menuData, onProgress);
  
  onProgress(100, "Importação concluída!");
  
  return result;
}
