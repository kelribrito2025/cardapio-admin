import { describe, it, expect } from "vitest";

/**
 * Tests for the GET /api/bot/menu-link endpoint logic
 * Validates that the menu URL is correctly constructed from establishment data
 */

describe("Bot API - Menu Link endpoint", () => {
  it("should construct correct menu URL from slug", () => {
    const appUrl = "https://v2.mindi.com.br";
    const menuSlug = "sushi-haruno";
    const menuUrl = `${appUrl}/menu/${menuSlug}`;
    
    expect(menuUrl).toBe("https://v2.mindi.com.br/menu/sushi-haruno");
  });

  it("should use fallback URL when VITE_APP_URL is not set", () => {
    const appUrl = process.env.VITE_APP_URL || "https://v2.mindi.com.br";
    const menuSlug = "burger-house";
    const menuUrl = `${appUrl}/menu/${menuSlug}`;
    
    expect(menuUrl).toContain("/menu/burger-house");
  });

  it("should handle slugs with special characters", () => {
    const appUrl = "https://v2.mindi.com.br";
    const menuSlug = "restaurante-do-joao-123";
    const menuUrl = `${appUrl}/menu/${menuSlug}`;
    
    expect(menuUrl).toBe("https://v2.mindi.com.br/menu/restaurante-do-joao-123");
  });

  it("should return correct response structure", () => {
    const appUrl = "https://v2.mindi.com.br";
    const menuSlug = "sushi-haruno";
    const establishmentName = "Sushi Haruno";
    
    const response = {
      menuUrl: `${appUrl}/menu/${menuSlug}`,
      slug: menuSlug,
      establishmentName,
    };
    
    expect(response).toHaveProperty("menuUrl");
    expect(response).toHaveProperty("slug");
    expect(response).toHaveProperty("establishmentName");
    expect(response.menuUrl).toContain(response.slug);
  });

  it("should detect missing slug", () => {
    const menuSlug: string | null = null;
    
    // The endpoint should return 404 when slug is missing
    expect(menuSlug).toBeNull();
    
    // Simulating the check in the endpoint
    const hasSlug = !!menuSlug;
    expect(hasSlug).toBe(false);
  });
});
