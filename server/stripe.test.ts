import { describe, it, expect } from "vitest";
import { SMS_PACKAGES } from "./stripe";

describe("SMS Packages", () => {
  it("should have valid packages defined", () => {
    expect(SMS_PACKAGES).toBeDefined();
    expect(SMS_PACKAGES.length).toBeGreaterThan(0);
  });

  it("each package should have required fields", () => {
    for (const pkg of SMS_PACKAGES) {
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(pkg.smsCount).toBeGreaterThan(0);
      expect(pkg.priceInCents).toBeGreaterThan(0);
      expect(pkg.priceFormatted).toBeTruthy();
      expect(pkg.description).toBeTruthy();
    }
  });

  it("should have correct pricing based on R$ 0.097 per SMS", () => {
    for (const pkg of SMS_PACKAGES) {
      const expectedPrice = Math.round(pkg.smsCount * 0.097 * 100);
      expect(pkg.priceInCents).toBe(expectedPrice);
    }
  });

  it("should have packages in ascending order of SMS count", () => {
    for (let i = 1; i < SMS_PACKAGES.length; i++) {
      expect(SMS_PACKAGES[i].smsCount).toBeGreaterThan(SMS_PACKAGES[i - 1].smsCount);
    }
  });

  it("should have unique IDs", () => {
    const ids = SMS_PACKAGES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have the 500 SMS package marked as popular", () => {
    const popular = SMS_PACKAGES.find((p) => (p as any).popular);
    expect(popular).toBeDefined();
    expect(popular!.smsCount).toBe(500);
  });

  it("priceFormatted should match priceInCents", () => {
    for (const pkg of SMS_PACKAGES) {
      const priceInReais = (pkg.priceInCents / 100).toFixed(2).replace(".", ",");
      expect(pkg.priceFormatted).toBe(`R$ ${priceInReais}`);
    }
  });
});
