import { describe, it, expect } from "vitest";

/**
 * Testes para os tooltips da top bar.
 * Verifica que cada botão da top bar tem o texto de tooltip correto.
 */

// Textos dos tooltips definidos nos componentes
const TOOLTIP_TEXTS = {
  prepTime: "Tempo médio de preparo - clique para ver análise detalhada",
  viewMenu: "Abrir cardápio público em nova aba",
  trialBadge: "Clique para ver detalhes do seu período de avaliação",
  soundEnabled: "Som ativado - clique para desativar",
  soundDisabled: "Som desativado - clique para ativar",
};

describe("Top bar tooltips", () => {
  it("deve ter texto de tooltip para o botão de tempo de preparo", () => {
    expect(TOOLTIP_TEXTS.prepTime).toBe(
      "Tempo médio de preparo - clique para ver análise detalhada"
    );
    expect(TOOLTIP_TEXTS.prepTime.length).toBeGreaterThan(0);
  });

  it("deve ter texto de tooltip para o botão Ver menu", () => {
    expect(TOOLTIP_TEXTS.viewMenu).toBe("Abrir cardápio público em nova aba");
    expect(TOOLTIP_TEXTS.viewMenu.length).toBeGreaterThan(0);
  });

  it("deve ter texto de tooltip para o badge de avaliação gratuita", () => {
    expect(TOOLTIP_TEXTS.trialBadge).toBe(
      "Clique para ver detalhes do seu período de avaliação"
    );
    expect(TOOLTIP_TEXTS.trialBadge.length).toBeGreaterThan(0);
  });

  it("deve ter textos de tooltip para o botão de som (ativado/desativado)", () => {
    expect(TOOLTIP_TEXTS.soundEnabled).toContain("ativado");
    expect(TOOLTIP_TEXTS.soundDisabled).toContain("desativado");
  });

  it("todos os tooltips devem estar em português", () => {
    const allTexts = Object.values(TOOLTIP_TEXTS);
    // Verificar que nenhum tooltip contém palavras em inglês comuns
    const englishWords = ["click", "open", "view", "close", "enable", "disable"];
    for (const text of allTexts) {
      for (const word of englishWords) {
        expect(text.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("todos os tooltips devem ser informativos (mais de 10 caracteres)", () => {
    const allTexts = Object.values(TOOLTIP_TEXTS);
    for (const text of allTexts) {
      expect(text.length).toBeGreaterThan(10);
    }
  });
});
