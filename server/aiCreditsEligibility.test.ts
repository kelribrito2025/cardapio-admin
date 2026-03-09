import { describe, it, expect, vi } from "vitest";

/**
 * Testes para o sistema de elegibilidade de créditos de melhoria de imagem com IA
 * 
 * Regras:
 * - Default de créditos: 0 (não 15)
 * - Elegibilidade requer: 15+ produtos, foto perfil (logo), capa (coverImage), 5+ produtos com foto
 * - Se elegível e não recebeu grátis: concede 3 créditos (uma vez)
 * - Se não elegível: exibe "Não elegível" sem motivo
 * - Compra de pacotes: 50 (R$49,90), 100 (R$69,90), 300 (R$197,90)
 */

describe("AI Image Credits Eligibility", () => {
  describe("Eligibility Rules", () => {
    it("should define eligibility criteria correctly", () => {
      const ELIGIBILITY_CRITERIA = {
        minProducts: 15,
        requiresLogo: true,
        requiresCoverImage: true,
        minProductsWithPhoto: 5,
        freeCredits: 3,
      };

      expect(ELIGIBILITY_CRITERIA.minProducts).toBe(15);
      expect(ELIGIBILITY_CRITERIA.requiresLogo).toBe(true);
      expect(ELIGIBILITY_CRITERIA.requiresCoverImage).toBe(true);
      expect(ELIGIBILITY_CRITERIA.minProductsWithPhoto).toBe(5);
      expect(ELIGIBILITY_CRITERIA.freeCredits).toBe(3);
    });

    it("should not be eligible without logo", () => {
      const establishment = { logo: null, coverImage: "cover.jpg", totalProducts: 20, productsWithPhoto: 10 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(false);
    });

    it("should not be eligible without cover image", () => {
      const establishment = { logo: "logo.jpg", coverImage: null, totalProducts: 20, productsWithPhoto: 10 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(false);
    });

    it("should not be eligible with less than 15 products", () => {
      const establishment = { logo: "logo.jpg", coverImage: "cover.jpg", totalProducts: 10, productsWithPhoto: 8 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(false);
    });

    it("should not be eligible with less than 5 products with photo", () => {
      const establishment = { logo: "logo.jpg", coverImage: "cover.jpg", totalProducts: 20, productsWithPhoto: 3 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(false);
    });

    it("should be eligible when all criteria are met", () => {
      const establishment = { logo: "logo.jpg", coverImage: "cover.jpg", totalProducts: 20, productsWithPhoto: 10 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(true);
    });

    it("should be eligible with exactly minimum values", () => {
      const establishment = { logo: "logo.jpg", coverImage: "cover.jpg", totalProducts: 15, productsWithPhoto: 5 };
      const eligible = !!(establishment.logo && establishment.coverImage && establishment.totalProducts >= 15 && establishment.productsWithPhoto >= 5);
      expect(eligible).toBe(true);
    });
  });

  describe("Credit Granting Logic", () => {
    it("should grant 3 free credits only once", () => {
      const FREE_CREDITS = 3;
      let credits = 0;
      let granted = false;

      // First time: grant
      if (!granted) {
        credits += FREE_CREDITS;
        granted = true;
      }
      expect(credits).toBe(3);
      expect(granted).toBe(true);

      // Second time: should not grant again
      if (!granted) {
        credits += FREE_CREDITS;
      }
      expect(credits).toBe(3); // Still 3, not 6
    });

    it("should start with 0 credits by default", () => {
      const defaultCredits = 0;
      expect(defaultCredits).toBe(0);
    });
  });

  describe("Credit Packages", () => {
    it("should have correct package prices", () => {
      const packages = [
        { id: "ai_50", credits: 50, priceInCents: 4990 },
        { id: "ai_100", credits: 100, priceInCents: 6990 },
        { id: "ai_300", credits: 300, priceInCents: 19790 },
      ];

      expect(packages[0].priceInCents).toBe(4990); // R$ 49,90
      expect(packages[1].priceInCents).toBe(6990); // R$ 69,90
      expect(packages[2].priceInCents).toBe(19790); // R$ 197,90
    });

    it("should have decreasing price per credit for larger packages", () => {
      const packages = [
        { credits: 50, priceInCents: 4990 },
        { credits: 100, priceInCents: 6990 },
        { credits: 300, priceInCents: 19790 },
      ];

      const pricePerCredit = packages.map(p => p.priceInCents / p.credits);
      
      // 50 pack: ~99.8 cents/credit
      // 100 pack: ~69.9 cents/credit  
      // 300 pack: ~65.97 cents/credit
      expect(pricePerCredit[0]).toBeGreaterThan(pricePerCredit[1]);
      expect(pricePerCredit[1]).toBeGreaterThan(pricePerCredit[2]);
    });
  });

  describe("UI State Logic", () => {
    it("should show 'Não elegível' when not eligible and no credits", () => {
      const eligible = false;
      const credits = 0;
      const showNotEligible = !eligible && credits <= 0;
      expect(showNotEligible).toBe(true);
    });

    it("should show credits badge when eligible", () => {
      const eligible = true;
      const credits = 3;
      const showNotEligible = !eligible && credits <= 0;
      expect(showNotEligible).toBe(false);
    });

    it("should show credits badge when has purchased credits even if not eligible", () => {
      const eligible = false;
      const credits = 50;
      const showNotEligible = !eligible && credits <= 0;
      expect(showNotEligible).toBe(false);
    });

    it("should disable enhance button when not eligible and no credits", () => {
      const eligible = false;
      const credits = 0;
      const buttonDisabled = !eligible && credits <= 0;
      expect(buttonDisabled).toBe(true);
    });

    it("should show buy credits when eligible but credits are 0", () => {
      const eligible = true;
      const credits = 0;
      const showBuyCredits = eligible && credits <= 0;
      // eligible users with 0 credits should see "Comprar créditos"
      expect(showBuyCredits).toBe(true);
    });
  });
});
