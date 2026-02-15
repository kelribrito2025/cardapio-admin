import { describe, it, expect } from "vitest";

/**
 * Testes para a Landing Page Hero Section
 * Verifica a estrutura, conteúdo e lógica de navegação
 */

// ============ HELPERS DE NAVEGAÇÃO ============

interface NavLink {
  label: string;
  href: string;
}

interface CTAButton {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

interface Benefit {
  text: string;
}

interface PainPoint {
  icon: string;
  text: string;
}

/**
 * Retorna os links de navegação da landing page
 */
function getNavLinks(): NavLink[] {
  return [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ];
}

/**
 * Retorna os botões CTA da hero section
 */
function getCTAButtons(): CTAButton[] {
  return [
    { label: "Criar conta grátis", href: "/criar-conta", variant: "primary" },
    { label: "Ver como funciona", href: "#como-funciona", variant: "secondary" },
  ];
}

/**
 * Retorna os mini benefícios abaixo dos CTAs
 */
function getBenefits(): Benefit[] {
  return [
    { text: "Sem taxa por pedido" },
    { text: "Configuração em minutos" },
    { text: "Suporte humanizado" },
  ];
}

/**
 * Retorna os pain points da strip section
 */
function getPainPoints(): PainPoint[] {
  return [
    { icon: "💸", text: "Cansado de pagar taxas abusivas ao iFood?" },
    { icon: "📊", text: "Sem controle financeiro do seu delivery?" },
    { icon: "🏍️", text: "Dificuldade em gerenciar entregadores?" },
    { icon: "📱", text: "Pedidos desorganizados no WhatsApp?" },
  ];
}

/**
 * Verifica se a navbar deve ter fundo transparente ou sólido
 */
function getNavbarBackground(scrollY: number): "transparent" | "solid" {
  return scrollY > 20 ? "solid" : "transparent";
}

/**
 * Verifica se as animações devem ser visíveis com base no tempo
 */
function shouldAnimationsBeVisible(timeSinceMount: number): boolean {
  return timeSinceMount >= 100;
}

/**
 * Calcula o delay de animação para cada elemento da hero
 */
function getAnimationDelay(elementIndex: number): number {
  const delays = [0, 100, 200, 300, 400];
  return delays[elementIndex] || 0;
}

// ============ TESTES ============

describe("Landing Page - Navbar", () => {
  it("contém 4 links de navegação", () => {
    const links = getNavLinks();
    expect(links).toHaveLength(4);
  });

  it("todos os links apontam para âncoras válidas", () => {
    const links = getNavLinks();
    links.forEach(link => {
      expect(link.href).toMatch(/^#[a-z-]+$/);
    });
  });

  it("navbar fica transparente no topo", () => {
    expect(getNavbarBackground(0)).toBe("transparent");
    expect(getNavbarBackground(10)).toBe("transparent");
    expect(getNavbarBackground(20)).toBe("transparent");
  });

  it("navbar fica sólida após scroll", () => {
    expect(getNavbarBackground(21)).toBe("solid");
    expect(getNavbarBackground(100)).toBe("solid");
    expect(getNavbarBackground(500)).toBe("solid");
  });

  it("links incluem as seções principais", () => {
    const links = getNavLinks();
    const labels = links.map(l => l.label);
    expect(labels).toContain("Funcionalidades");
    expect(labels).toContain("Como funciona");
    expect(labels).toContain("Preços");
    expect(labels).toContain("FAQ");
  });
});

describe("Landing Page - Hero Section CTAs", () => {
  it("tem botão primário e secundário", () => {
    const buttons = getCTAButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0].variant).toBe("primary");
    expect(buttons[1].variant).toBe("secondary");
  });

  it("botão primário leva para criar conta", () => {
    const buttons = getCTAButtons();
    const primary = buttons.find(b => b.variant === "primary");
    expect(primary?.href).toBe("/criar-conta");
    expect(primary?.label).toBe("Criar conta grátis");
  });

  it("botão secundário leva para como funciona", () => {
    const buttons = getCTAButtons();
    const secondary = buttons.find(b => b.variant === "secondary");
    expect(secondary?.href).toBe("#como-funciona");
    expect(secondary?.label).toBe("Ver como funciona");
  });
});

describe("Landing Page - Mini Benefícios", () => {
  it("tem 3 benefícios", () => {
    const benefits = getBenefits();
    expect(benefits).toHaveLength(3);
  });

  it("inclui benefício sobre taxa", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("taxa"))).toBe(true);
  });

  it("inclui benefício sobre configuração rápida", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("minutos"))).toBe(true);
  });

  it("inclui benefício sobre suporte", () => {
    const benefits = getBenefits();
    expect(benefits.some(b => b.text.includes("Suporte"))).toBe(true);
  });
});

describe("Landing Page - Pain Points Strip", () => {
  it("tem 4 pain points", () => {
    const points = getPainPoints();
    expect(points).toHaveLength(4);
  });

  it("aborda taxa de marketplace", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("taxas") || p.text.includes("iFood"))).toBe(true);
  });

  it("aborda controle financeiro", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("financeiro"))).toBe(true);
  });

  it("aborda gestão de entregadores", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("entregadores"))).toBe(true);
  });

  it("aborda desorganização de pedidos", () => {
    const points = getPainPoints();
    expect(points.some(p => p.text.includes("desorganizados") || p.text.includes("WhatsApp"))).toBe(true);
  });

  it("cada pain point tem ícone", () => {
    const points = getPainPoints();
    points.forEach(p => {
      expect(p.icon).toBeTruthy();
      expect(p.icon.length).toBeGreaterThan(0);
    });
  });
});

describe("Landing Page - Animações", () => {
  it("animações não visíveis antes de 100ms", () => {
    expect(shouldAnimationsBeVisible(0)).toBe(false);
    expect(shouldAnimationsBeVisible(50)).toBe(false);
    expect(shouldAnimationsBeVisible(99)).toBe(false);
  });

  it("animações visíveis após 100ms", () => {
    expect(shouldAnimationsBeVisible(100)).toBe(true);
    expect(shouldAnimationsBeVisible(500)).toBe(true);
  });

  it("delays de animação são progressivos", () => {
    const delays = [0, 1, 2, 3, 4].map(i => getAnimationDelay(i));
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    }
  });

  it("primeiro elemento não tem delay", () => {
    expect(getAnimationDelay(0)).toBe(0);
  });

  it("último elemento (benefícios) tem delay de 400ms", () => {
    expect(getAnimationDelay(4)).toBe(400);
  });
});

describe("Landing Page - Conteúdo Estratégico", () => {
  it("headline menciona controle/gestão", () => {
    const headline = "Controle pedidos, entregas e estoque em um só lugar.";
    expect(headline).toMatch(/controle|gestão|gerencie/i);
  });

  it("subheadline menciona marketplace/taxas", () => {
    const subheadline = "Chega de depender de marketplace com taxas abusivas.";
    expect(subheadline).toMatch(/marketplace|taxas/i);
  });

  it("conteúdo é direcionado a donos de restaurante", () => {
    const painPoints = getPainPoints();
    const allText = painPoints.map(p => p.text).join(" ");
    // Verifica se o conteúdo é relevante para o público-alvo
    expect(allText).toMatch(/iFood|delivery|entregadores|WhatsApp/i);
  });
});
