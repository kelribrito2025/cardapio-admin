import { describe, expect, it } from "vitest";

/**
 * Testes unitários para os templates de SMS sugeridos.
 * Validam que todos os templates respeitam o limite de caracteres
 * e possuem os campos obrigatórios.
 */

const SMS_CHAR_LIMIT = 152;

const SMS_TEMPLATES = [
  {
    emoji: "⭐",
    title: "Cliente VIP",
    text: "Você é cliente VIP! ⭐\nPreparamos um desconto especial só pra você.\nUse o cupom VIP15 no seu próximo pedido.",
  },
  {
    emoji: "👀",
    title: "Oferta Ativa",
    text: "Só passando pra avisar 👀\nTem uma oferta ativa por tempo limitado no nosso cardápio.\nCorre aproveitar!",
  },
  {
    emoji: "🍔",
    title: "Sentimos sua falta",
    text: "Sentimos sua falta! 🍔\nVolte a pedir hoje e ganhe R$10 OFF no seu próximo pedido.\nCupom: VOLTA10\nVálido por 48h. Aproveite!",
  },
  {
    emoji: "😊",
    title: "Reativação",
    text: "Oi! Já faz um tempo que você não pede com a gente 😊\nQue tal matar a saudade hoje?\nTem novidade no cardápio esperando por você",
  },
  {
    emoji: "😌",
    title: "Delivery",
    text: "Dia perfeito pra pedir em casa 😌\nDelivery rápido e quentinho esperando por você.\nFaça seu pedido agora!",
  },
  {
    emoji: "🍕",
    title: "Novidade no Cardápio",
    text: "Novidade no cardápio! 🍕\nAcabamos de lançar um item novo.\nVem experimentar hoje e conta pra gente o que achou!",
  },
  {
    emoji: "🍻",
    title: "Happy Hour",
    text: "Happy Hour liberado! 🍻\nPedidos com desconto até às 19h.\nAproveite enquanto é tempo!",
  },
];

describe("SMS Templates", () => {
  it("deve ter exatamente 7 templates", () => {
    expect(SMS_TEMPLATES).toHaveLength(7);
  });

  it("cada template deve ter emoji, título e texto", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.emoji).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.text).toBeTruthy();
    });
  });

  it("cada template deve respeitar o limite de caracteres do SMS", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.text.length).toBeLessThanOrEqual(SMS_CHAR_LIMIT);
    });
  });

  it("nenhum template deve ter texto vazio", () => {
    SMS_TEMPLATES.forEach((template) => {
      expect(template.text.trim().length).toBeGreaterThan(0);
    });
  });

  it("cada template deve ter um título único", () => {
    const titles = SMS_TEMPLATES.map((t) => t.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it("templates devem conter emojis no texto", () => {
    SMS_TEMPLATES.forEach((template) => {
      // Verifica que o texto contém pelo menos um emoji
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}]/u;
      expect(emojiRegex.test(template.text)).toBe(true);
    });
  });

  it("template 'Cliente VIP' deve conter cupom VIP15", () => {
    const vipTemplate = SMS_TEMPLATES.find((t) => t.title === "Cliente VIP");
    expect(vipTemplate).toBeDefined();
    expect(vipTemplate!.text).toContain("VIP15");
  });

  it("template 'Sentimos sua falta' deve conter cupom VOLTA10", () => {
    const faltaTemplate = SMS_TEMPLATES.find((t) => t.title === "Sentimos sua falta");
    expect(faltaTemplate).toBeDefined();
    expect(faltaTemplate!.text).toContain("VOLTA10");
  });

  it("template 'Happy Hour' deve mencionar horário", () => {
    const hhTemplate = SMS_TEMPLATES.find((t) => t.title === "Happy Hour");
    expect(hhTemplate).toBeDefined();
    expect(hhTemplate!.text).toContain("19h");
  });
});
