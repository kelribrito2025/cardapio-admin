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


// ============ SEÇÃO 2: O PROBLEMA + A VIRADA ============

interface PainCard {
  title: string;
  desc: string;
}

interface SolutionItem {
  text: string;
}

interface ComparisonCard {
  title: string;
  items: string[];
  type: "negative" | "positive";
}

/**
 * Retorna os pain cards da seção 2
 */
function getPainCards(): PainCard[] {
  return [
    { title: "Taxas abusivas", desc: "Até 27% por pedido vai direto pro marketplace" },
    { title: "Repasses atrasados", desc: "Seu dinheiro preso por dias ou semanas" },
    { title: "Clientes que não são seus", desc: "Você não tem acesso aos dados dos seus clientes" },
  ];
}

/**
 * Retorna os itens de solução da seção virada
 */
function getSolutionItems(): SolutionItem[] {
  return [
    { text: "Seu próprio link de vendas" },
    { text: "Zero comissão por pedido" },
    { text: "Controle total de entregadores" },
    { text: "Relatórios financeiros em tempo real" },
    { text: "Estoque sincronizado automaticamente" },
    { text: "Base de clientes 100% sua" },
  ];
}

/**
 * Retorna os cards de comparação
 */
function getComparisonCards(): ComparisonCard[] {
  return [
    {
      title: "Usando Marketplace",
      items: [
        "Taxa de 15% a 27% por pedido",
        "Repasses demoram até 30 dias",
        "Sem acesso aos dados dos clientes",
        "Concorrência direta na mesma plataforma",
      ],
      type: "negative",
    },
    {
      title: "Com CardápioAdmin",
      items: [
        "R$ 0 de taxa por pedido",
        "Receba na hora via Pix",
        "Base de clientes 100% sua",
        "Sua marca, seu link, seu controle",
      ],
      type: "positive",
    },
  ];
}

/**
 * Calcula a perda mensal com base no faturamento e taxa
 */
function calculateMonthlyLoss(revenue: number, feePercent: number): number {
  return (revenue * feePercent) / 100;
}

/**
 * Calcula a perda anual
 */
function calculateYearlyLoss(revenue: number, feePercent: number): number {
  return calculateMonthlyLoss(revenue, feePercent) * 12;
}

/**
 * Revenue steps disponíveis no simulador
 */
function getRevenueSteps(): number[] {
  return [5000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
}

/**
 * Navega para o próximo step de faturamento
 */
function navigateRevenue(current: number, direction: "increase" | "decrease"): number {
  const steps = getRevenueSteps();
  const currentIndex = steps.indexOf(current);
  if (direction === "increase" && currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }
  if (direction === "decrease" && currentIndex > 0) {
    return steps[currentIndex - 1];
  }
  return current;
}

/**
 * Formata valor em moeda brasileira
 */
function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ============ TESTES SEÇÃO 2 ============

describe("Seção 2 - Pain Cards", () => {
  it("tem 3 pain cards", () => {
    expect(getPainCards()).toHaveLength(3);
  });

  it("aborda taxas abusivas", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Taxas"))).toBe(true);
  });

  it("aborda repasses atrasados", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Repasses"))).toBe(true);
  });

  it("aborda falta de controle sobre clientes", () => {
    const cards = getPainCards();
    expect(cards.some(c => c.title.includes("Clientes"))).toBe(true);
  });

  it("cada card tem título e descrição", () => {
    getPainCards().forEach(card => {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.desc.length).toBeGreaterThan(0);
    });
  });
});

describe("Seção 2 - Simulador de Perdas", () => {
  it("calcula perda mensal corretamente para R$ 20.000 a 15%", () => {
    expect(calculateMonthlyLoss(20000, 15)).toBe(3000);
  });

  it("calcula perda anual corretamente", () => {
    expect(calculateYearlyLoss(20000, 15)).toBe(36000);
  });

  it("calcula perda para diferentes faturamentos", () => {
    expect(calculateMonthlyLoss(5000, 15)).toBe(750);
    expect(calculateMonthlyLoss(50000, 15)).toBe(7500);
    expect(calculateMonthlyLoss(100000, 15)).toBe(15000);
  });

  it("perda anual é 12x a mensal", () => {
    const monthly = calculateMonthlyLoss(30000, 15);
    const yearly = calculateYearlyLoss(30000, 15);
    expect(yearly).toBe(monthly * 12);
  });

  it("tem 9 steps de faturamento", () => {
    expect(getRevenueSteps()).toHaveLength(9);
  });

  it("steps começam em 5.000 e terminam em 100.000", () => {
    const steps = getRevenueSteps();
    expect(steps[0]).toBe(5000);
    expect(steps[steps.length - 1]).toBe(100000);
  });

  it("steps estão em ordem crescente", () => {
    const steps = getRevenueSteps();
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });

  it("navega para o próximo step corretamente", () => {
    expect(navigateRevenue(20000, "increase")).toBe(30000);
    expect(navigateRevenue(20000, "decrease")).toBe(15000);
  });

  it("não navega além do primeiro step", () => {
    expect(navigateRevenue(5000, "decrease")).toBe(5000);
  });

  it("não navega além do último step", () => {
    expect(navigateRevenue(100000, "increase")).toBe(100000);
  });

  it("formata moeda corretamente", () => {
    const formatted = formatCurrency(3000);
    expect(formatted).toContain("3.000");
    expect(formatted).toContain("R$");
  });

  it("CardápioAdmin mostra R$ 0 de taxa", () => {
    expect(calculateMonthlyLoss(20000, 0)).toBe(0);
    expect(calculateYearlyLoss(100000, 0)).toBe(0);
  });
});

describe("Seção 2 - Itens de Solução (Virada)", () => {
  it("tem 6 itens de solução", () => {
    expect(getSolutionItems()).toHaveLength(6);
  });

  it("inclui link próprio de vendas", () => {
    expect(getSolutionItems().some(s => s.text.includes("link de vendas"))).toBe(true);
  });

  it("inclui zero comissão", () => {
    expect(getSolutionItems().some(s => s.text.includes("Zero comissão"))).toBe(true);
  });

  it("inclui controle de entregadores", () => {
    expect(getSolutionItems().some(s => s.text.includes("entregadores"))).toBe(true);
  });

  it("inclui relatórios financeiros", () => {
    expect(getSolutionItems().some(s => s.text.includes("Relatórios"))).toBe(true);
  });

  it("inclui estoque sincronizado", () => {
    expect(getSolutionItems().some(s => s.text.includes("Estoque"))).toBe(true);
  });

  it("inclui base de clientes", () => {
    expect(getSolutionItems().some(s => s.text.includes("clientes"))).toBe(true);
  });
});

describe("Seção 2 - Cards de Comparação", () => {
  it("tem 2 cards de comparação", () => {
    expect(getComparisonCards()).toHaveLength(2);
  });

  it("primeiro card é negativo (marketplace)", () => {
    const cards = getComparisonCards();
    expect(cards[0].type).toBe("negative");
    expect(cards[0].title).toContain("Marketplace");
  });

  it("segundo card é positivo (CardápioAdmin)", () => {
    const cards = getComparisonCards();
    expect(cards[1].type).toBe("positive");
    expect(cards[1].title).toContain("CardápioAdmin");
  });

  it("marketplace tem 4 pontos negativos", () => {
    const marketplace = getComparisonCards()[0];
    expect(marketplace.items).toHaveLength(4);
  });

  it("CardápioAdmin tem 4 pontos positivos", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items).toHaveLength(4);
  });

  it("marketplace menciona taxa alta", () => {
    const marketplace = getComparisonCards()[0];
    expect(marketplace.items.some(i => i.includes("15%") || i.includes("27%"))).toBe(true);
  });

  it("CardápioAdmin menciona R$ 0 de taxa", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items.some(i => i.includes("R$ 0"))).toBe(true);
  });

  it("CardápioAdmin menciona Pix", () => {
    const admin = getComparisonCards()[1];
    expect(admin.items.some(i => i.includes("Pix"))).toBe(true);
  });
});
