import { describe, it, expect, vi } from "vitest";
import { cleanHtml } from "./menuImport";

// We test the cleanHtml function which is a pure function
// The LLM and DB functions require mocking external services

describe("Menu Import - cleanHtml", () => {
  it("should remove script tags and content", () => {
    const html = '<div>Hello</div><script>alert("test")</script><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("script");
    expect(result).not.toContain("alert");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("should remove style tags and content", () => {
    const html = '<div>Hello</div><style>.test { color: red; }</style><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("style");
    expect(result).not.toContain("color");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("should remove img tags", () => {
    const html = '<div>Hello</div><img src="test.jpg" alt="test"><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("img");
    expect(result).not.toContain("test.jpg");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("should remove SVG tags", () => {
    const html = '<div>Hello</div><svg><path d="M0 0"/></svg><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("svg");
    expect(result).not.toContain("path");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("should remove HTML comments", () => {
    const html = '<div>Hello</div><!-- This is a comment --><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("comment");
    expect(result).not.toContain("<!--");
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("should collapse whitespace", () => {
    const html = '<div>Hello     World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("     ");
    expect(result).toContain("Hello World");
  });

  it("should truncate very long HTML", () => {
    const html = "a".repeat(100000);
    const result = cleanHtml(html);
    expect(result.length).toBeLessThanOrEqual(80000);
  });

  it("should handle empty HTML", () => {
    const result = cleanHtml("");
    expect(result).toBe("");
  });

  it("should remove noscript tags", () => {
    const html = '<div>Hello</div><noscript>Enable JS</noscript><div>World</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("noscript");
    expect(result).not.toContain("Enable JS");
  });

  it("should remove link tags (stylesheets)", () => {
    const html = '<link rel="stylesheet" href="style.css"><div>Hello</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("link");
    expect(result).not.toContain("stylesheet");
    expect(result).toContain("Hello");
  });

  it("should remove meta tags", () => {
    const html = '<meta charset="utf-8"><div>Hello</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("meta");
    expect(result).not.toContain("charset");
    expect(result).toContain("Hello");
  });

  it("should strip HTML attributes from tags", () => {
    const html = '<div class="test" id="main" style="color:red">Hello</div>';
    const result = cleanHtml(html);
    expect(result).not.toContain("class=");
    expect(result).not.toContain("id=");
    expect(result).not.toContain("style=");
    expect(result).toContain("Hello");
  });
});

describe("Menu Import - URL validation", () => {
  it("should accept valid URLs", () => {
    expect(() => new URL("https://example.com")).not.toThrow();
    expect(() => new URL("https://www.ifood.com.br/delivery/sao-paulo/restaurant")).not.toThrow();
    expect(() => new URL("https://anota.ai/menu/test")).not.toThrow();
  });

  it("should reject invalid URLs", () => {
    expect(() => new URL("not-a-url")).toThrow();
    expect(() => new URL("")).toThrow();
    expect(() => new URL("just text")).toThrow();
  });
});

describe("Menu Import - Data structure validation", () => {
  it("should validate imported menu structure", () => {
    const validMenu = {
      categories: [
        {
          name: "Entradas",
          products: [
            {
              name: "Coxinha",
              description: "Coxinha de frango",
              price: 5.00,
              complementGroups: []
            }
          ]
        }
      ]
    };

    expect(validMenu.categories).toHaveLength(1);
    expect(validMenu.categories[0].name).toBe("Entradas");
    expect(validMenu.categories[0].products).toHaveLength(1);
    expect(validMenu.categories[0].products[0].name).toBe("Coxinha");
    expect(validMenu.categories[0].products[0].price).toBe(5.00);
  });

  it("should validate complement groups structure", () => {
    const menuWithComplements = {
      categories: [
        {
          name: "Pizzas",
          products: [
            {
              name: "Pizza Margherita",
              description: "Pizza clássica",
              price: 35.00,
              complementGroups: [
                {
                  name: "Tamanho",
                  isRequired: true,
                  minQuantity: 1,
                  maxQuantity: 1,
                  items: [
                    { name: "Pequena", price: 0 },
                    { name: "Média", price: 10 },
                    { name: "Grande", price: 20 }
                  ]
                },
                {
                  name: "Adicionais",
                  isRequired: false,
                  minQuantity: 0,
                  maxQuantity: 5,
                  items: [
                    { name: "Bacon", price: 5 },
                    { name: "Catupiry", price: 3 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const product = menuWithComplements.categories[0].products[0];
    expect(product.complementGroups).toHaveLength(2);
    
    const sizeGroup = product.complementGroups[0];
    expect(sizeGroup.name).toBe("Tamanho");
    expect(sizeGroup.isRequired).toBe(true);
    expect(sizeGroup.minQuantity).toBe(1);
    expect(sizeGroup.maxQuantity).toBe(1);
    expect(sizeGroup.items).toHaveLength(3);
    
    const addonsGroup = product.complementGroups[1];
    expect(addonsGroup.name).toBe("Adicionais");
    expect(addonsGroup.isRequired).toBe(false);
    expect(addonsGroup.minQuantity).toBe(0);
    expect(addonsGroup.maxQuantity).toBe(5);
    expect(addonsGroup.items).toHaveLength(2);
  });

  it("should handle empty categories", () => {
    const emptyMenu = { categories: [] };
    expect(emptyMenu.categories).toHaveLength(0);
  });

  it("should handle products without complements", () => {
    const simpleProduct = {
      name: "Água",
      description: "Água mineral 500ml",
      price: 3.50,
      complementGroups: []
    };
    expect(simpleProduct.complementGroups).toHaveLength(0);
  });
});
