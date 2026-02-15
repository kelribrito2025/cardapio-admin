import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Clock, 
  HeadphonesIcon,
  ChevronDown,
  Menu as MenuIcon,
  X,
  BarChart3,
  ShoppingBag,
  Truck,
  Package,
  XCircle,
  TrendingDown,
  DollarSign,
  Link2,
  Users,
  PieChart,
  PackageCheck,
  Minus,
  Plus
} from "lucide-react";

// CDN URLs dos mockups do dashboard
const DASHBOARD_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/DWjiyUgKrQTrHTOQ.png";
const PEDIDOS_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/CCbkhjOUaWvUSZhB.png";

// ============ NAVBAR ============
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" 
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Cardápio<span className="text-red-500">Admin</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              Criar conta grátis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col gap-1 pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2 px-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 text-center py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/criar-conta"
                  className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 text-center py-2.5 rounded-xl transition-colors shadow-lg shadow-red-500/25"
                >
                  Criar conta grátis
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ============ HERO SECTION ============
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-0"
      style={{
        background: `
          linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(254,242,242,0.4) 50%, rgba(255,255,255,0.97) 100%),
          radial-gradient(circle at 20% 50%, rgba(239,68,68,0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(239,68,68,0.03) 0%, transparent 50%)
        `,
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative elements */}
      <div className="absolute top-32 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/3 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-0">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-5rem)]">
          
          {/* LEFT COLUMN - Content (60%) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 w-fit mb-6 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">
                Sistema completo de gestão
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Controle pedidos, entregas e estoque{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-red-500">em um só lugar.</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8.5C50 3 100 2 150 5C200 8 250 4 298 7"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={`text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl mb-8 transition-all duration-700 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Chega de depender de marketplace com taxas abusivas. Tenha seu próprio 
              cardápio digital, gestão de entregadores, relatórios financeiros e 
              automações — tudo em tempo real.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Link
                href="/criar-conta"
                className="group inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-red-500 hover:bg-red-600 px-7 py-3.5 rounded-xl transition-all duration-300 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#como-funciona"
                className="group inline-flex items-center justify-center gap-2 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 px-7 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
              >
                Ver como funciona
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </a>
            </div>

            {/* Mini Benefits */}
            <div
              className={`flex flex-col sm:flex-row gap-4 sm:gap-6 transition-all duration-700 delay-[400ms] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {[
                { icon: Zap, text: "Sem taxa por pedido" },
                { icon: Clock, text: "Configuração em minutos" },
                { icon: HeadphonesIcon, text: "Suporte humanizado" },
              ].map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Mockups (40%) */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div
              className={`relative w-full max-w-lg lg:max-w-none transition-all duration-1000 delay-300 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
              }`}
            >
              {/* Desktop Mockup */}
              <div
                className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-200/50"
                style={{
                  animation: "hero-float 6s ease-in-out infinite",
                }}
              >
                {/* Browser chrome */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-4 py-1 text-[11px] text-gray-400 font-medium border border-gray-200 w-64 text-center">
                      app.cardapioadmin.com.br
                    </div>
                  </div>
                </div>
                <img
                  src={DASHBOARD_MOCKUP}
                  alt="Dashboard do Cardápio Admin"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>

              {/* Mobile Mockup - Overlapping */}
              <div
                className="absolute -bottom-6 -left-6 sm:-left-10 z-20 w-36 sm:w-44"
                style={{
                  animation: "hero-float-delayed 6s ease-in-out infinite",
                }}
              >
                <div className="rounded-[1.5rem] overflow-hidden shadow-2xl shadow-gray-900/15 border-[3px] border-gray-800 bg-gray-800">
                  {/* Phone notch */}
                  <div className="bg-gray-800 px-4 py-1.5 flex items-center justify-between">
                    <span className="text-[8px] text-gray-400 font-medium">9:41</span>
                    <div className="w-16 h-4 bg-gray-900 rounded-full" />
                    <div className="flex gap-0.5">
                      <div className="w-2.5 h-1.5 bg-gray-400 rounded-sm" />
                      <div className="w-1 h-1.5 bg-gray-400 rounded-sm" />
                    </div>
                  </div>
                  <img
                    src={PEDIDOS_MOCKUP}
                    alt="Pedidos no mobile"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>
              </div>

              {/* Floating stat cards */}
              <div
                className="absolute -top-4 -right-2 sm:-right-6 z-30 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2.5 hidden sm:flex items-center gap-2.5"
                style={{
                  animation: "hero-float-stat 4s ease-in-out infinite",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Faturamento</p>
                  <p className="text-sm font-bold text-gray-900">R$ 756,71</p>
                </div>
              </div>

              {/* Floating order card */}
              <div
                className="absolute bottom-16 -right-2 sm:-right-8 z-30 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2.5 hidden sm:flex items-center gap-2.5"
                style={{
                  animation: "hero-float-stat-2 5s ease-in-out infinite",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Novo pedido</p>
                  <p className="text-sm font-bold text-gray-900">#P7 · R$ 38,00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Saiba mais</span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-300 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

// ============ PAIN POINTS SECTION (Transition from Hero) ============
function PainPointsStrip() {
  const painPoints = [
    { icon: "💸", text: "Cansado de pagar taxas abusivas ao iFood?" },
    { icon: "📊", text: "Sem controle financeiro do seu delivery?" },
    { icon: "🏍️", text: "Dificuldade em gerenciar entregadores?" },
    { icon: "📱", text: "Pedidos desorganizados no WhatsApp?" },
  ];

  return (
    <section className="relative py-12 bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {painPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{point.icon}</span>
              <p className="text-sm text-gray-300 font-medium leading-snug">{point.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-white/80 text-base font-medium">
          O <span className="text-red-400 font-semibold">Cardápio Admin</span> resolve tudo isso — e muito mais.
        </p>
      </div>
    </section>
  );
}

// ============ SEÇÃO 2: O PROBLEMA + A VIRADA ============
function ProblemSolutionSection() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(20000);
  const [marketplaceFee] = useState(15);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const monthlyLoss = (monthlyRevenue * marketplaceFee) / 100;
  const yearlyLoss = monthlyLoss * 12;

  const revenueSteps = [5000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];

  const handleDecrease = () => {
    const currentIndex = revenueSteps.indexOf(monthlyRevenue);
    if (currentIndex > 0) setMonthlyRevenue(revenueSteps[currentIndex - 1]);
  };

  const handleIncrease = () => {
    const currentIndex = revenueSteps.indexOf(monthlyRevenue);
    if (currentIndex < revenueSteps.length - 1) setMonthlyRevenue(revenueSteps[currentIndex + 1]);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const painCards = [
    { icon: DollarSign, title: "Taxas abusivas", desc: "Até 27% por pedido vai direto pro marketplace" },
    { icon: TrendingDown, title: "Repasses atrasados", desc: "Seu dinheiro preso por dias ou semanas" },
    { icon: Users, title: "Clientes que não são seus", desc: "Você não tem acesso aos dados dos seus clientes" },
  ];

  const solutionItems = [
    { icon: Link2, text: "Seu próprio link de vendas" },
    { icon: DollarSign, text: "Zero comissão por pedido" },
    { icon: Truck, text: "Controle total de entregadores" },
    { icon: PieChart, text: "Relatórios financeiros em tempo real" },
    { icon: PackageCheck, text: "Estoque sincronizado automaticamente" },
    { icon: Users, text: "Base de clientes 100% sua" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-28 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #fafafa 0%, #ffffff 40%, #fef2f2 100%)",
      }}
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ---- BLOCO 1: A DOR ---- */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 mb-6">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">A verdade que ninguém conta</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Você está <span className="text-red-500">pagando para vender</span>{" "}
            o que é seu?
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Marketplaces cobram taxas altas, atrasam repasses e não te dão controle real 
            sobre seus clientes. Cada pedido que entra, uma fatia do <strong className="text-gray-700">seu lucro</strong> vai embora.
          </p>
        </div>

        {/* Pain cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 transition-all duration-700 delay-100 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {painCards.map((card, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4">
                <XCircle className="w-5 h-5 text-red-300" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <card.icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ---- SIMULAÇÃO DE PERDAS ---- */}
        <div className={`relative max-w-4xl mx-auto mb-20 transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="bg-gray-900 rounded-3xl p-8 sm:p-10 lg:p-12 overflow-hidden relative">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-500/5 rounded-full blur-3xl" />

            <div className="relative">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Quanto você <span className="text-red-400">perde</span> por mês?
                </h3>
                <p className="text-gray-400 text-sm">Simule o impacto das taxas de marketplace no seu faturamento</p>
              </div>

              {/* Revenue selector */}
              <div className="flex flex-col items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDecrease}
                    disabled={monthlyRevenue === revenueSteps[0]}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <div className="text-center min-w-[200px]">
                    <p className="text-xs text-gray-400 font-medium mb-1">Faturamento mensal</p>
                    <p className="text-3xl sm:text-4xl font-bold text-white">{formatCurrency(monthlyRevenue)}</p>
                  </div>
                  <button
                    onClick={handleIncrease}
                    disabled={monthlyRevenue === revenueSteps[revenueSteps.length - 1]}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Revenue steps */}
                <div className="flex gap-2 flex-wrap justify-center">
                  {revenueSteps.map((step) => (
                    <button
                      key={step}
                      onClick={() => setMonthlyRevenue(step)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                        monthlyRevenue === step
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                          : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {step >= 1000 ? `${step / 1000}k` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Taxa marketplace ({marketplaceFee}%)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-400">
                    -{formatCurrency(monthlyLoss)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">por mês</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Prejuízo anual</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-400">
                    -{formatCurrency(yearlyLoss)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">jogados fora</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-2xl p-5 border border-green-500/20 text-center">
                  <p className="text-xs text-green-300 font-medium mb-2 uppercase tracking-wider">Com CardápioAdmin</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">
                    {formatCurrency(0)}
                  </p>
                  <p className="text-xs text-green-300/70 mt-1">zero taxa por pedido</p>
                </div>
              </div>

              <p className="text-center mt-6 text-sm text-gray-400">
                Isso significa <strong className="text-white">{formatCurrency(yearlyLoss)}</strong> de volta 
                no seu bolso por ano.
              </p>
            </div>
          </div>
        </div>

        {/* ---- BLOCO 2: A VIRADA ---- */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className={`transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 mb-6">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-semibold text-green-600 tracking-wide uppercase">A solução</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
              Com o <span className="text-red-500">CardápioAdmin</span> você assume o controle.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Tudo o que você precisa para vender direto, sem intermediários, 
              com tecnologia que simplifica sua operação.
            </p>

            <div className="space-y-4 mb-8">
              {solutionItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-base text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <Link
              href="/criar-conta"
              className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-red-500 hover:bg-red-600 px-7 py-3.5 rounded-xl transition-all duration-300 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              Começar agora — é grátis
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right - Visual comparison */}
          <div className={`transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          }`}>
            <div className="space-y-5">
              {/* Marketplace card (bad) */}
              <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400" />
                <div className="flex items-start gap-4 ml-2">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Usando Marketplace</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-500">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        Taxa de 15% a 27% por pedido
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-500">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        Repasses demoram até 30 dias
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-500">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        Sem acesso aos dados dos clientes
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-500">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        Concorrência direta na mesma plataforma
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Arrow transition */}
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                </div>
              </div>

              {/* CardápioAdmin card (good) */}
              <div className="bg-white rounded-2xl p-6 border border-green-100 shadow-md relative overflow-hidden ring-1 ring-green-200/50">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                <div className="flex items-start gap-4 ml-2">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Com CardápioAdmin</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <strong>R$ 0</strong> de taxa por pedido
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        Receba na hora via Pix
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        Base de clientes 100% sua
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        Sua marca, seu link, seu controle
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ SEÇÃO 3: CLIENTES QUE VENDEM CONOSCO ============

const CLIENTS_DATA = [
  {
    name: "Burger House",
    city: "São Paulo",
    state: "SP",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/WxLMtqgzpplincEt.jpg",
    color: "#dc2626",
    initials: "BH",
  },
  {
    name: "Forno & Massa",
    city: "Curitiba",
    state: "PR",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/BgcAhrPALHBfxpsd.jpeg",
    color: "#ea580c",
    initials: "FM",
  },
  {
    name: "Sushi Kento",
    city: "Rio de Janeiro",
    state: "RJ",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/mInTUYpVlTIFLkON.jpg",
    color: "#0891b2",
    initials: "SK",
  },
  {
    name: "Açaí da Terra",
    city: "Belém",
    state: "PA",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/aiffbCjVDSbuQtRz.jpg",
    color: "#7c3aed",
    initials: "AT",
  },
  {
    name: "Brasa Viva",
    city: "Belo Horizonte",
    state: "MG",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/uhXbFmhAvEyTTgoB.jpg",
    color: "#b91c1c",
    initials: "BV",
  },
  {
    name: "Poke Fresh",
    city: "Florianópolis",
    state: "SC",
    cover: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/LNZYzDQsQZBsCSUy.jpg",
    color: "#059669",
    initials: "PF",
  },
];

function ClientCard({ client }: { client: typeof CLIENTS_DATA[0] }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] group">
      {/* Cover Image */}
      <div className="relative h-44 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow duration-300">
        <img
          src={client.cover}
          alt={client.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 px-1">
        {/* Logo/Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 -mt-8 relative z-10 border-2 border-white"
          style={{ backgroundColor: client.color }}
        >
          {client.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h4>
          <div className="flex items-center gap-1 text-gray-500">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">{client.city} - {client.state}</span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="px-1 mt-3">
        <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl py-2.5 transition-all duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ver cardápio
        </button>
      </div>
    </div>
  );
}

function ClientsShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!scrollRef.current || isPaused) return;
    const container = scrollRef.current;
    let animationId: number;
    let scrollPos = 0;

    const step = () => {
      scrollPos += 0.5;
      if (scrollPos >= container.scrollWidth - container.clientWidth) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Sync scrollPos when user manually scrolls
  const handleManualScroll = () => {
    // Pause auto-scroll briefly when user interacts
    setIsPaused(true);
    const timer = setTimeout(() => setIsPaused(false), 5000);
    return () => clearTimeout(timer);
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50/50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-semibold text-red-600 tracking-wide uppercase mb-4">
            Explore cases reais
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Clientes que vendem{" "}
            <span className="text-red-500">conosco</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Restaurantes de todo o Brasil já usam o CardápioAdmin para vender mais, com menos custo e total controle.
          </p>
        </div>
      </div>

      {/* Carousel - full width */}
      <div
        className={`transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsPaused(false), 5000);
          }}
          onScroll={handleManualScroll}
          className="flex gap-6 overflow-x-auto scrollbar-hide px-4 sm:px-8 lg:px-[calc((100vw-80rem)/2+2rem)] pb-4"
          style={{
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Duplicate clients for infinite scroll effect */}
          {[...CLIENTS_DATA, ...CLIENTS_DATA].map((client, idx) => (
            <ClientCard key={`${client.name}-${idx}`} client={client} />
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: "500+", label: "Restaurantes ativos" },
            { value: "150k+", label: "Pedidos processados" },
            { value: "27", label: "Estados atendidos" },
            { value: "4.9", label: "Avaliação média" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ MAIN LANDING PAGE ============
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <ProblemSolutionSection />
      <ClientsShowcaseSection />
      {/* Novas seções serão adicionadas aqui */}
    </div>
  );
}
