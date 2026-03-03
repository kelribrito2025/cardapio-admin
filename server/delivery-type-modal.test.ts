import { describe, expect, it } from "vitest";

/**
 * Testes para a lógica do modal de seleção obrigatória de tipo de entrega
 * e a função getComplementPrice que calcula preços baseados no contexto.
 */

// Reproduzir a função getComplementPrice do PublicMenu.tsx
function getComplementPrice(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean },
  deliveryType: 'delivery' | 'pickup' | 'dine_in'
): number {
  if (item.priceMode === 'free') {
    if (deliveryType === 'delivery' && item.freeOnDelivery) return 0;
    if (deliveryType === 'pickup' && item.freeOnPickup) return 0;
    if (deliveryType === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

// Lógica de determinar se o modal deve ser mostrado
function shouldShowDeliveryTypeModal(
  deliveryTypeChosen: boolean,
  establishment: { allowsDelivery: boolean; allowsPickup: boolean; allowsDineIn: boolean } | null
): boolean {
  if (deliveryTypeChosen) return false;
  if (!establishment) return false;
  const options = [establishment.allowsDelivery, establishment.allowsPickup, establishment.allowsDineIn].filter(Boolean).length;
  return options > 1;
}

// Lógica de auto-seleção quando só há 1 opção
function getAutoSelectedDeliveryType(
  establishment: { allowsDelivery: boolean; allowsPickup: boolean; allowsDineIn: boolean }
): { type: 'delivery' | 'pickup' | 'dine_in'; autoChosen: boolean } {
  const options = [establishment.allowsDelivery, establishment.allowsPickup, establishment.allowsDineIn].filter(Boolean).length;
  
  let type: 'delivery' | 'pickup' | 'dine_in' = 'pickup';
  if (establishment.allowsDelivery) type = 'delivery';
  else if (establishment.allowsPickup) type = 'pickup';
  else if (establishment.allowsDineIn) type = 'dine_in';
  
  return { type, autoChosen: options <= 1 };
}

describe("getComplementPrice", () => {
  it("retorna preço normal quando priceMode não é 'free'", () => {
    const item = { price: "5.00", priceMode: "normal" };
    expect(getComplementPrice(item, "delivery")).toBe(5);
    expect(getComplementPrice(item, "pickup")).toBe(5);
    expect(getComplementPrice(item, "dine_in")).toBe(5);
  });

  it("retorna 0 quando priceMode é 'free' e nenhum contexto específico", () => {
    const item = { price: "5.00", priceMode: "free" };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("retorna 0 apenas no contexto delivery quando freeOnDelivery=true", () => {
    const item = { price: "5.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: false, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(5);
    expect(getComplementPrice(item, "dine_in")).toBe(5);
  });

  it("retorna 0 apenas no contexto pickup quando freeOnPickup=true", () => {
    const item = { price: "3.50", priceMode: "free", freeOnDelivery: false, freeOnPickup: true, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(3.5);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(3.5);
  });

  it("retorna 0 apenas no contexto dine_in quando freeOnDineIn=true", () => {
    const item = { price: "2.00", priceMode: "free", freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: true };
    expect(getComplementPrice(item, "delivery")).toBe(2);
    expect(getComplementPrice(item, "pickup")).toBe(2);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("retorna 0 em delivery e pickup quando ambos são grátis", () => {
    const item = { price: "4.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: false };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(4);
  });

  it("retorna 0 em todos os contextos quando todos são grátis", () => {
    const item = { price: "6.00", priceMode: "free", freeOnDelivery: true, freeOnPickup: true, freeOnDineIn: true };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(0);
    expect(getComplementPrice(item, "dine_in")).toBe(0);
  });

  it("lida com preço como número em vez de string", () => {
    const item = { price: 7.5, priceMode: "free", freeOnDelivery: true };
    expect(getComplementPrice(item, "delivery")).toBe(0);
    expect(getComplementPrice(item, "pickup")).toBe(7.5);
  });
});

describe("shouldShowDeliveryTypeModal", () => {
  it("não mostra modal quando deliveryTypeChosen é true", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    expect(shouldShowDeliveryTypeModal(true, est)).toBe(false);
  });

  it("não mostra modal quando establishment é null", () => {
    expect(shouldShowDeliveryTypeModal(false, null)).toBe(false);
  });

  it("não mostra modal quando só há 1 opção de entrega (delivery)", () => {
    const est = { allowsDelivery: true, allowsPickup: false, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });

  it("não mostra modal quando só há 1 opção de entrega (pickup)", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });

  it("mostra modal quando há 2 opções de entrega", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(true);
  });

  it("mostra modal quando há 3 opções de entrega", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(true);
  });

  it("não mostra modal quando nenhuma opção está habilitada", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: false };
    expect(shouldShowDeliveryTypeModal(false, est)).toBe(false);
  });
});

describe("getAutoSelectedDeliveryType", () => {
  it("auto-seleciona delivery quando é a única opção", () => {
    const est = { allowsDelivery: true, allowsPickup: false, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("delivery");
    expect(result.autoChosen).toBe(true);
  });

  it("auto-seleciona pickup quando é a única opção", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("pickup");
    expect(result.autoChosen).toBe(true);
  });

  it("auto-seleciona dine_in quando é a única opção", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("dine_in");
    expect(result.autoChosen).toBe(true);
  });

  it("prioriza delivery quando há múltiplas opções e não auto-seleciona", () => {
    const est = { allowsDelivery: true, allowsPickup: true, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("delivery");
    expect(result.autoChosen).toBe(false);
  });

  it("seleciona pickup quando delivery não disponível e há múltiplas opções", () => {
    const est = { allowsDelivery: false, allowsPickup: true, allowsDineIn: true };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.type).toBe("pickup");
    expect(result.autoChosen).toBe(false);
  });

  it("auto-seleciona quando nenhuma opção disponível (edge case)", () => {
    const est = { allowsDelivery: false, allowsPickup: false, allowsDineIn: false };
    const result = getAutoSelectedDeliveryType(est);
    expect(result.autoChosen).toBe(true);
  });
});
