import { describe, expect, it } from "vitest";
import { extractMenuSlug, generateOgMetaTags, injectOgTags } from "./_core/vite";

describe("extractMenuSlug", () => {
  it("extrai slug de URL válida /menu/:slug", () => {
    expect(extractMenuSlug("/menu/sushi_haruno")).toBe("sushi_haruno");
  });

  it("extrai slug com caracteres especiais (URL encoded)", () => {
    expect(extractMenuSlug("/menu/caf%C3%A9_do_jo%C3%A3o")).toBe("café_do_joão");
  });

  it("extrai slug ignorando query params", () => {
    expect(extractMenuSlug("/menu/minha_loja?ref=whatsapp")).toBe("minha_loja");
  });

  it("extrai slug ignorando hash", () => {
    expect(extractMenuSlug("/menu/minha_loja#section")).toBe("minha_loja");
  });

  it("retorna null para URL raiz", () => {
    expect(extractMenuSlug("/")).toBeNull();
  });

  it("retorna null para URL de dashboard", () => {
    expect(extractMenuSlug("/dashboard")).toBeNull();
  });

  it("retorna null para URL de catálogo", () => {
    expect(extractMenuSlug("/catalogo")).toBeNull();
  });

  it("retorna null para /menu sem slug", () => {
    expect(extractMenuSlug("/menu")).toBeNull();
    expect(extractMenuSlug("/menu/")).toBeNull();
  });
});

describe("generateOgMetaTags", () => {
  it("gera tags OG com nome e cidade do restaurante", () => {
    const tags = generateOgMetaTags({
      name: "Sushi Haruno",
      logo: "https://example.com/logo.jpg",
      coverImage: "https://example.com/cover.jpg",
      city: "São Paulo",
      neighborhood: "Liberdade",
      menuSlug: "sushi_haruno",
    });

    expect(tags).toContain('og:title');
    expect(tags).toContain("Sushi Haruno - Cardápio Digital");
    expect(tags).toContain('og:description');
    expect(tags).toContain("São Paulo");
    expect(tags).toContain('og:type');
    expect(tags).toContain("website");
    expect(tags).toContain('og:image');
    // Deve usar coverImage como prioridade
    expect(tags).toContain("https://example.com/cover.jpg");
  });

  it("usa logo quando coverImage não existe", () => {
    const tags = generateOgMetaTags({
      name: "Burger King",
      logo: "https://example.com/logo.png",
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "burger_king",
    });

    expect(tags).toContain("https://example.com/logo.png");
  });

  it("gera descrição sem cidade quando não disponível", () => {
    const tags = generateOgMetaTags({
      name: "Pizza Place",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "pizza_place",
    });

    expect(tags).toContain("Confira o cardápio de Pizza Place. Faça seu pedido online!");
    expect(tags).not.toContain("og:image");
  });

  it("escapa caracteres HTML no nome do restaurante", () => {
    const tags = generateOgMetaTags({
      name: 'Restaurante "O Melhor" <teste>',
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "teste",
    });

    expect(tags).toContain("&quot;O Melhor&quot;");
    expect(tags).toContain("&lt;teste&gt;");
    expect(tags).not.toContain('<teste>');
  });

  it("inclui Twitter Card tags", () => {
    const tags = generateOgMetaTags({
      name: "Restaurante Teste",
      logo: null,
      coverImage: "https://example.com/cover.jpg",
      city: null,
      neighborhood: null,
      menuSlug: "teste",
    });

    expect(tags).toContain('twitter:card');
    expect(tags).toContain("summary_large_image");
    expect(tags).toContain('twitter:title');
    expect(tags).toContain('twitter:description');
    expect(tags).toContain('twitter:image');
  });

  it("usa summary card quando não há imagem", () => {
    const tags = generateOgMetaTags({
      name: "Sem Imagem",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "sem_imagem",
    });

    expect(tags).toContain('"summary"');
    expect(tags).not.toContain("summary_large_image");
  });
});

describe("injectOgTags", () => {
  const sampleHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Cardápio Admin</title>
    <meta name="description" content="Sistema de gerenciamento de pedidos e cardápio digital" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  it("substitui o título da página pelo nome do restaurante", () => {
    const result = injectOgTags(sampleHtml, {
      name: "Sushi Haruno",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "sushi_haruno",
    });

    expect(result).toContain("<title>Sushi Haruno - Cardápio Digital</title>");
    expect(result).not.toContain("<title>Cardápio Admin</title>");
  });

  it("substitui a meta description", () => {
    const result = injectOgTags(sampleHtml, {
      name: "Burger House",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "burger_house",
    });

    expect(result).toContain('content="Confira o cardápio de Burger House. Faça seu pedido online!"');
    expect(result).not.toContain("Sistema de gerenciamento");
  });

  it("injeta OG tags antes do </head>", () => {
    const result = injectOgTags(sampleHtml, {
      name: "Pizzaria Legal",
      logo: "https://example.com/logo.jpg",
      coverImage: "https://example.com/cover.jpg",
      city: "Rio de Janeiro",
      neighborhood: null,
      menuSlug: "pizzaria_legal",
    });

    expect(result).toContain("<!-- Open Graph Meta Tags -->");
    expect(result).toContain('property="og:title"');
    expect(result).toContain('property="og:description"');
    expect(result).toContain('property="og:image"');
    // As OG tags devem estar antes do </head>
    const ogIndex = result.indexOf("og:title");
    const headCloseIndex = result.indexOf("</head>");
    expect(ogIndex).toBeLessThan(headCloseIndex);
  });

  it("mantém o restante do HTML intacto", () => {
    const result = injectOgTags(sampleHtml, {
      name: "Teste",
      logo: null,
      coverImage: null,
      city: null,
      neighborhood: null,
      menuSlug: "teste",
    });

    expect(result).toContain('<div id="root"></div>');
    expect(result).toContain('lang="pt-BR"');
    expect(result).toContain('<meta charset="UTF-8" />');
  });
});
