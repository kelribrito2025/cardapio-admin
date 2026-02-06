import { describe, expect, it } from "vitest";
import { generateOgImage } from "./ogImage";

describe("generateOgImage", () => {
  it("gera imagem PNG com gradiente quando não há coverImage", async () => {
    const buffer = await generateOgImage({
      name: "Restaurante Teste",
      logo: null,
      coverImage: null,
      city: "São Paulo",
      neighborhood: "Centro",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Verificar assinatura PNG (primeiros 8 bytes)
    expect(buffer[0]).toBe(0x89); // PNG signature
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  }, 15000);

  it("gera imagem PNG com coverImage remota", async () => {
    // Usar uma imagem de teste pública pequena
    const buffer = await generateOgImage({
      name: "Sushi Haruno",
      logo: null,
      coverImage: "https://via.placeholder.com/1200x630/333333/ffffff?text=Cover",
      city: "Carnaubal",
      neighborhood: "Centro",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Verificar assinatura PNG
    expect(buffer[0]).toBe(0x89);
  }, 15000);

  it("gera imagem com nome longo sem erro", async () => {
    const buffer = await generateOgImage({
      name: "Restaurante com Nome Muito Longo que Precisa de Fonte Menor para Caber na Imagem",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 15000);

  it("gera imagem sem cidade/bairro (sem subtítulo)", async () => {
    const buffer = await generateOgImage({
      name: "Pizzaria Legal",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 15000);

  it("lida graciosamente com URL de imagem inválida", async () => {
    const buffer = await generateOgImage({
      name: "Restaurante Fallback",
      logo: "https://invalid-url-that-does-not-exist.com/logo.png",
      coverImage: "https://invalid-url-that-does-not-exist.com/cover.jpg",
      city: "São Paulo",
      neighborhood: null,
    });

    // Deve gerar imagem com gradiente como fallback
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 15000);
});
