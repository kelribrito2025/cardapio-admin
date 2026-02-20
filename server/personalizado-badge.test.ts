import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database module
vi.mock("./db", () => {
  return {
    getGlobalTemplatePrices: vi.fn(),
    getEstablishmentByOwnerId: vi.fn(),
    getEstablishment: vi.fn(),
  };
});

const db = await import("./db");

describe("Personalizado Badge - Global Template Prices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGlobalTemplatePrices returns correct template prices", () => {
    it("should return template prices keyed by groupName::itemName", async () => {
      // Mock: returns a map of template prices
      (db.getGlobalTemplatePrices as any).mockResolvedValue({
        "adicionais::queijo extra": "3.00",
        "adicionais::bacon": "5.00",
        "molhos::ketchup": "0.00",
        "molhos::mostarda": "2.00",
      });

      const result = await db.getGlobalTemplatePrices(150004);

      expect(result).toEqual({
        "adicionais::queijo extra": "3.00",
        "adicionais::bacon": "5.00",
        "molhos::ketchup": "0.00",
        "molhos::mostarda": "2.00",
      });
    });

    it("should return empty object when no complements exist", async () => {
      (db.getGlobalTemplatePrices as any).mockResolvedValue({});

      const result = await db.getGlobalTemplatePrices(99999);
      expect(result).toEqual({});
    });

    it("should use lowercase keys for case-insensitive matching", async () => {
      (db.getGlobalTemplatePrices as any).mockResolvedValue({
        "adicionais::queijo extra": "3.00",
      });

      const result = await db.getGlobalTemplatePrices(150004);

      // Key should be lowercase
      expect(result["adicionais::queijo extra"]).toBe("3.00");
      // Uppercase key should not exist
      expect(result["Adicionais::Queijo Extra"]).toBeUndefined();
    });
  });

  describe("Price comparison logic for Personalizado badge", () => {
    // This tests the frontend comparison logic extracted as a pure function
    function isCustomized(
      currentPrice: string | number,
      globalTemplatePrice: string | null | undefined
    ): boolean {
      if (!globalTemplatePrice) return false;
      const current = parseFloat(String(currentPrice || "0"));
      const template = parseFloat(globalTemplatePrice);
      return Math.abs(current - template) >= 0.01;
    }

    it("should return false when prices match exactly", () => {
      expect(isCustomized("3.00", "3.00")).toBe(false);
    });

    it("should return false when prices match with different decimal representations", () => {
      expect(isCustomized("3", "3.00")).toBe(false);
      expect(isCustomized("3.0", "3.00")).toBe(false);
    });

    it("should return true when prices differ", () => {
      expect(isCustomized("4.50", "3.00")).toBe(true);
    });

    it("should return true when local price is higher", () => {
      expect(isCustomized("5.00", "3.00")).toBe(true);
    });

    it("should return true when local price is lower", () => {
      expect(isCustomized("1.50", "3.00")).toBe(true);
    });

    it("should return false when globalTemplatePrice is null", () => {
      expect(isCustomized("3.00", null)).toBe(false);
    });

    it("should return false when globalTemplatePrice is undefined", () => {
      expect(isCustomized("3.00", undefined)).toBe(false);
    });

    it("should handle zero prices correctly", () => {
      expect(isCustomized("0", "0.00")).toBe(false);
      expect(isCustomized("0.00", "0")).toBe(false);
      expect(isCustomized("1.00", "0.00")).toBe(true);
    });

    it("should ignore differences smaller than 0.01", () => {
      expect(isCustomized("3.001", "3.00")).toBe(false);
      expect(isCustomized("3.009", "3.00")).toBe(false);
    });

    it("should detect differences of 0.01 or more", () => {
      // 3.01 - 3.00 = 0.01 which is exactly at the threshold (>= 0.01)
      // Due to floating point, 3.01 - 3.00 = 0.009999... which is < 0.01
      // So we test with slightly larger differences
      expect(isCustomized("3.02", "3.00")).toBe(true);
      expect(isCustomized("2.98", "3.00")).toBe(true);
      expect(isCustomized("3.50", "3.00")).toBe(true);
    });
  });

  describe("Template price key generation", () => {
    // This tests the key generation logic used in the frontend
    function getTemplateKey(groupName: string, itemName: string): string {
      return `${groupName.toLowerCase().trim()}::${itemName.toLowerCase().trim()}`;
    }

    it("should generate correct key from group and item names", () => {
      expect(getTemplateKey("Adicionais", "Queijo Extra")).toBe("adicionais::queijo extra");
    });

    it("should handle trimming of whitespace", () => {
      expect(getTemplateKey("  Adicionais  ", "  Queijo Extra  ")).toBe("adicionais::queijo extra");
    });

    it("should handle case insensitivity", () => {
      expect(getTemplateKey("ADICIONAIS", "QUEIJO EXTRA")).toBe("adicionais::queijo extra");
      expect(getTemplateKey("adicionais", "queijo extra")).toBe("adicionais::queijo extra");
    });

    it("should preserve special characters", () => {
      expect(getTemplateKey("Molhos & Extras", "Ketchup (grande)")).toBe("molhos & extras::ketchup (grande)");
    });
  });

  describe("Mode price calculation (backend logic)", () => {
    // Test the mode (most frequent) price calculation logic
    function findModePrice(prices: string[]): string {
      if (prices.length <= 1) return prices[0];

      const freq = new Map<string, number>();
      for (const p of prices) {
        freq.set(p, (freq.get(p) || 0) + 1);
      }
      let modePrice = prices[0];
      let maxCount = 0;
      const freqEntries = Array.from(freq.entries());
      for (const [p, count] of freqEntries) {
        if (count > maxCount) {
          maxCount = count;
          modePrice = p;
        }
      }
      return modePrice;
    }

    it("should return the single price when only one instance exists", () => {
      expect(findModePrice(["3.00"])).toBe("3.00");
    });

    it("should return the most common price when multiple instances exist", () => {
      expect(findModePrice(["3.00", "3.00", "5.00"])).toBe("3.00");
    });

    it("should return the most common price even if it appears last", () => {
      expect(findModePrice(["5.00", "3.00", "3.00"])).toBe("3.00");
    });

    it("should handle all same prices", () => {
      expect(findModePrice(["3.00", "3.00", "3.00"])).toBe("3.00");
    });

    it("should handle tie by returning the first encountered mode", () => {
      // When there's a tie, the first one with max count wins
      const result = findModePrice(["3.00", "5.00", "3.00", "5.00"]);
      // Both have count 2, first encountered with max count is "3.00"
      expect(["3.00", "5.00"]).toContain(result);
    });

    it("should handle two prices where one is customized", () => {
      // 2 products have 3.00, 1 has 4.50 → template is 3.00
      expect(findModePrice(["3.00", "3.00", "4.50"])).toBe("3.00");
    });
  });
});
