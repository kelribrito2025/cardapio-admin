import { describe, it, expect } from "vitest";
import { PLAN_PACKAGES, SMS_PACKAGES } from "./stripe";

describe("Stripe Subscription Configuration", () => {
  describe("PLAN_PACKAGES", () => {
    it("should have plan packages defined", () => {
      expect(PLAN_PACKAGES).toBeDefined();
      expect(PLAN_PACKAGES.length).toBeGreaterThan(0);
    });

    it("should have Essencial plan with correct price", () => {
      const essencial = PLAN_PACKAGES.find((p) => p.id === "basic");
      expect(essencial).toBeDefined();
      expect(essencial!.name).toBe("Plano Essencial");
      expect(essencial!.priceInCents).toBe(7990); // R$ 79,90
    });

    it("should have Pro plan defined", () => {
      const pro = PLAN_PACKAGES.find((p) => p.id === "pro");
      expect(pro).toBeDefined();
      expect(pro!.name).toBe("Plano Pro");
    });

    it("should have Enterprise plan defined", () => {
      const enterprise = PLAN_PACKAGES.find((p) => p.id === "enterprise");
      expect(enterprise).toBeDefined();
      expect(enterprise!.name).toBe("Plano Enterprise");
    });

    it("all plans should have required fields", () => {
      for (const plan of PLAN_PACKAGES) {
        expect(plan.id).toBeTruthy();
        expect(plan.name).toBeTruthy();
        expect(plan.priceInCents).toBeGreaterThan(0);
        expect(plan.description).toBeTruthy();
      }
    });
  });

  describe("SMS_PACKAGES", () => {
    it("should have SMS packages defined", () => {
      expect(SMS_PACKAGES).toBeDefined();
      expect(SMS_PACKAGES.length).toBeGreaterThan(0);
    });
  });

  describe("Subscription mode validation", () => {
    it("createPlanCheckoutSession should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.createPlanCheckoutSession).toBe("function");
    });

    it("cancelSubscription should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.cancelSubscription).toBe("function");
    });

    it("getSubscriptionDetails should be exported as a function", async () => {
      const stripe = await import("./stripe");
      expect(typeof stripe.getSubscriptionDetails).toBe("function");
    });

    it("annual price should be 10x monthly (2 months discount)", () => {
      const essencial = PLAN_PACKAGES.find((p) => p.id === "basic")!;
      const monthlyPrice = essencial.priceInCents;
      const annualPrice = Math.round(monthlyPrice * 10);
      
      // Annual should be 10 months worth (saving 2 months)
      expect(annualPrice).toBe(79900); // R$ 799,00
      expect(annualPrice).toBeLessThan(monthlyPrice * 12); // Must be less than 12 months
    });
  });

  describe("Database helpers validation", () => {
    it("activatePlan should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.activatePlan).toBe("function");
    });

    it("deactivatePlan should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.deactivatePlan).toBe("function");
    });

    it("getEstablishmentByStripeCustomerId should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.getEstablishmentByStripeCustomerId).toBe("function");
    });

    it("updateSubscriptionId should be exported from db", async () => {
      const db = await import("./db");
      expect(typeof db.updateSubscriptionId).toBe("function");
    });
  });
});
