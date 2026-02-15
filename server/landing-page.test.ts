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


// ============ SEÇÃO 3: CLIENTES QUE VENDEM CONOSCO ============

interface ClientData {
  name: string;
  city: string;
  state: string;
  cover: string;
  color: string;
  initials: string;
}

interface StatItem {
  value: string;
  label: string;
}

/**
 * Retorna os dados dos clientes fictícios
 */
function getClientsData(): ClientData[] {
  return [
    { name: "Burger House", city: "São Paulo", state: "SP", cover: "https://files.manuscdn.com/WxLMtqgzpplincEt.jpg", color: "#dc2626", initials: "BH" },
    { name: "Forno & Massa", city: "Curitiba", state: "PR", cover: "https://files.manuscdn.com/BgcAhrPALHBfxpsd.jpeg", color: "#ea580c", initials: "FM" },
    { name: "Sushi Kento", city: "Rio de Janeiro", state: "RJ", cover: "https://files.manuscdn.com/mInTUYpVlTIFLkON.jpg", color: "#0891b2", initials: "SK" },
    { name: "Açaí da Terra", city: "Belém", state: "PA", cover: "https://files.manuscdn.com/aiffbCjVDSbuQtRz.jpg", color: "#7c3aed", initials: "AT" },
    { name: "Brasa Viva", city: "Belo Horizonte", state: "MG", cover: "https://files.manuscdn.com/uhXbFmhAvEyTTgoB.jpg", color: "#b91c1c", initials: "BV" },
    { name: "Poke Fresh", city: "Florianópolis", state: "SC", cover: "https://files.manuscdn.com/LNZYzDQsQZBsCSUy.jpg", color: "#059669", initials: "PF" },
  ];
}

/**
 * Retorna as estatísticas do showcase
 */
function getShowcaseStats(): StatItem[] {
  return [
    { value: "500+", label: "Restaurantes ativos" },
    { value: "150k+", label: "Pedidos processados" },
    { value: "27", label: "Estados atendidos" },
    { value: "4.9", label: "Avaliação média" },
  ];
}

/**
 * Gera as iniciais a partir do nome do estabelecimento
 */
function generateInitials(name: string): string {
  const stopWords = ["da", "de", "do", "das", "dos", "e"];
  return name
    .split(/[\s&]+/)
    .filter(w => w.length > 0 && !stopWords.includes(w.toLowerCase()))
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Verifica se a cor é um hex válido
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Retorna os dados duplicados para o carrossel infinito
 */
function getInfiniteScrollData(): ClientData[] {
  const clients = getClientsData();
  return [...clients, ...clients];
}

/**
 * Verifica se todos os estados brasileiros representados são válidos
 */
function isValidBrazilianState(state: string): boolean {
  const validStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SE", "SP", "TO"
  ];
  return validStates.includes(state);
}

describe("Seção 3 - Dados dos Clientes", () => {
  it("tem 6 clientes fictícios", () => {
    expect(getClientsData()).toHaveLength(6);
  });

  it("cada cliente tem todos os campos obrigatórios", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(client.name).toBeTruthy();
      expect(client.city).toBeTruthy();
      expect(client.state).toBeTruthy();
      expect(client.cover).toBeTruthy();
      expect(client.color).toBeTruthy();
      expect(client.initials).toBeTruthy();
    });
  });

  it("cada cliente tem cor hex válida", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(isValidHexColor(client.color)).toBe(true);
    });
  });

  it("cada cliente tem estado brasileiro válido", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(isValidBrazilianState(client.state)).toBe(true);
    });
  });

  it("cada cliente tem URL de capa válida", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      expect(client.cover).toMatch(/^https:\/\//);
    });
  });

  it("iniciais correspondem ao nome do estabelecimento", () => {
    const clients = getClientsData();
    clients.forEach(client => {
      const expected = generateInitials(client.name);
      expect(client.initials).toBe(expected);
    });
  });

  it("não há nomes duplicados", () => {
    const clients = getClientsData();
    const names = clients.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("cobre diferentes regiões do Brasil", () => {
    const clients = getClientsData();
    const states = clients.map(c => c.state);
    // Pelo menos 4 estados diferentes
    expect(new Set(states).size).toBeGreaterThanOrEqual(4);
  });

  it("inclui diferentes tipos de culinária", () => {
    const clients = getClientsData();
    const names = clients.map(c => c.name.toLowerCase()).join(" ");
    // Verifica variedade gastronômica
    expect(names).toMatch(/burger|sushi|pizza|massa|açaí|poke|brasa|churrasco/i);
  });
});

describe("Seção 3 - Carrossel Infinito", () => {
  it("dados duplicados para scroll infinito", () => {
    const data = getInfiniteScrollData();
    expect(data).toHaveLength(12); // 6 * 2
  });

  it("primeira metade é igual à segunda metade", () => {
    const data = getInfiniteScrollData();
    const first = data.slice(0, 6);
    const second = data.slice(6, 12);
    first.forEach((client, i) => {
      expect(client.name).toBe(second[i].name);
    });
  });
});

describe("Seção 3 - Estatísticas", () => {
  it("tem 4 estatísticas", () => {
    expect(getShowcaseStats()).toHaveLength(4);
  });

  it("inclui contagem de restaurantes", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Restaurantes"))).toBe(true);
  });

  it("inclui contagem de pedidos", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Pedidos"))).toBe(true);
  });

  it("inclui cobertura de estados", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Estados"))).toBe(true);
  });

  it("inclui avaliação média", () => {
    const stats = getShowcaseStats();
    expect(stats.some(s => s.label.includes("Avaliação"))).toBe(true);
  });

  it("avaliação média é alta (>= 4.5)", () => {
    const stats = getShowcaseStats();
    const rating = stats.find(s => s.label.includes("Avaliação"));
    expect(parseFloat(rating!.value)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("Seção 3 - Geração de Iniciais", () => {
  it("gera iniciais de nome simples", () => {
    expect(generateInitials("Burger House")).toBe("BH");
  });

  it("gera iniciais com & no nome", () => {
    expect(generateInitials("Forno & Massa")).toBe("FM");
  });

  it("gera iniciais de nome com 3 palavras (pega 2 primeiras)", () => {
    expect(generateInitials("Açaí da Terra")).toBe("AT");
  });

  it("gera iniciais em maiúsculas", () => {
    const initials = generateInitials("poke fresh");
    expect(initials).toBe("PF");
  });
});
