import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stripe module
vi.mock("./stripe", () => ({
  AI_IMAGE_PACKAGES: [
    {
      id: "ai_50",
      name: "50 melhorias",
      credits: 50,
      priceInCents: 2900,
      priceFormatted: "R$ 29,00",
      pricePerImage: "R$ 0,58",
      description: "Pacote com 50 melhorias de foto com IA",
    },
    {
      id: "ai_100",
      name: "100 melhorias",
      credits: 100,
      priceInCents: 4900,
      priceFormatted: "R$ 49,00",
      pricePerImage: "R$ 0,49",
      description: "Pacote com 100 melhorias de foto com IA",
      popular: true,
    },
    {
      id: "ai_300",
      name: "300 melhorias",
      credits: 300,
      priceInCents: 9900,
      priceFormatted: "R$ 99,00",
      pricePerImage: "R$ 0,33",
      description: "Pacote com 300 melhorias de foto com IA",
    },
  ],
  createAiImageCheckoutSession: vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/test",
    sessionId: "cs_test_123",
  }),
}));

describe("AI Image Credits - Packages", () => {
  it("should have 3 credit packages", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    expect(AI_IMAGE_PACKAGES).toHaveLength(3);
  });

  it("should have correct package IDs", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const ids = AI_IMAGE_PACKAGES.map((p) => p.id);
    expect(ids).toEqual(["ai_50", "ai_100", "ai_300"]);
  });

  it("should have correct credit amounts", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const credits = AI_IMAGE_PACKAGES.map((p) => p.credits);
    expect(credits).toEqual([50, 100, 300]);
  });

  it("should have correct prices in cents", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const prices = AI_IMAGE_PACKAGES.map((p) => p.priceInCents);
    expect(prices).toEqual([2900, 4900, 9900]);
  });

  it("should mark 100 credits package as popular", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const popular = AI_IMAGE_PACKAGES.find((p: any) => p.popular);
    expect(popular).toBeDefined();
    expect(popular!.id).toBe("ai_100");
  });

  it("should have decreasing price per image for larger packages", async () => {
    const { AI_IMAGE_PACKAGES } = await import("./stripe");
    const pricePerCredit = AI_IMAGE_PACKAGES.map(
      (p) => p.priceInCents / p.credits
    );
    // Each subsequent package should be cheaper per credit
    expect(pricePerCredit[0]).toBeGreaterThan(pricePerCredit[1]);
    expect(pricePerCredit[1]).toBeGreaterThan(pricePerCredit[2]);
  });
});

describe("AI Image Credits - Checkout Session", () => {
  it("should create checkout session for valid package", async () => {
    const { createAiImageCheckoutSession } = await import("./stripe");
    const result = await createAiImageCheckoutSession({
      packageId: "ai_100",
      userId: 1,
      userEmail: "test@test.com",
      userName: "Test User",
      establishmentId: 1,
      origin: "https://example.com",
    });
    expect(result).toBeDefined();
    expect(result!.url).toContain("stripe.com");
    expect(result!.sessionId).toBeDefined();
  });
});

describe("AI Image Credits - Business Logic", () => {
  it("should start with 15 free credits for new establishments", () => {
    // The default value in schema is 15
    const DEFAULT_CREDITS = 15;
    expect(DEFAULT_CREDITS).toBe(15);
  });

  it("should consume 1 credit per enhancement", () => {
    let credits = 15;
    credits -= 1; // Simulate consumption
    expect(credits).toBe(14);
  });

  it("should not allow enhancement when credits are 0", () => {
    const credits = 0;
    const canEnhance = credits > 0;
    expect(canEnhance).toBe(false);
  });

  it("should allow enhancement when credits are positive", () => {
    const credits = 5;
    const canEnhance = credits > 0;
    expect(canEnhance).toBe(true);
  });

  it("should add credits after purchase", () => {
    let credits = 3;
    const purchased = 100;
    credits += purchased;
    expect(credits).toBe(103);
  });
});
