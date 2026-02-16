import { useEffect, useRef, useState, useCallback } from "react";
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
  Plus,
  Utensils,
  Smartphone,
  Globe,
  QrCode,
  Palette,
  Check,
  Crown,
  ChevronUp,
  MessageCircle,
  Mail,
  MapPin,
  Instagram,
  Phone,
  Shield,
  Rocket,
  HelpCircle,
  Play
} from "lucide-react";

// CDN URLs dos mockups do dashboard
const DASHBOARD_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/DWjiyUgKrQTrHTOQ.png";
const PEDIDOS_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/RDuYUqKBFnalcxkk.png";
const CATALOG_MOCKUP = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663232987165/PaotwhovICNkDtqN.png";

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
              Mindi
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
const TYPEWRITER_WORDS = [
  "pedidos",
  "entregas",
  "estoque",
  "cardápio",
  "finanças",
];

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[currentWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Typing
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 100 + Math.random() * 50); // slight randomness for natural feel
      } else {
        // Pause before deleting
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length - 1));
        }, 60);
      } else {
        // Move to next word
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex]);

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
          
          {/* LEFT COLUMN - Content (54%) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
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

            {/* Headline with typewriter effect */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Controle{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-red-500">
                  {displayText}
                  <span
                    className={`inline-block w-[3px] h-[0.85em] bg-red-500 ml-0.5 align-middle rounded-sm transition-opacity duration-100 ${
                      showCursor ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </span>
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
              <br className="hidden sm:block" />
              em um só lugar.
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

          {/* RIGHT COLUMN - Mockups (46%) */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
            <div
              className={`relative w-full max-w-lg lg:max-w-none transition-all duration-1000 delay-300 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
              }`}
              style={{ transform: isVisible ? "scale(1.10) translateX(0)" : "scale(1.10) translateX(3rem)", transformOrigin: "center center" }}
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
                      app.mindi.com.br
                    </div>
                  </div>
                </div>
                <img
                  src={DASHBOARD_MOCKUP}
                  alt="Dashboard do Mindi"
                  className="w-full h-auto"
                  loading="eager"
                />
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
          O <span className="text-red-400 font-semibold">Mindi</span> resolve tudo isso — e muito mais.
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
                  <p className="text-xs text-green-300 font-medium mb-2 uppercase tracking-wider">Com Mindi</p>
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
              Com o <span className="text-red-500">Mindi</span> você assume o controle.
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

              {/* Mindi card (good) */}
              <div className="bg-white rounded-2xl p-6 border border-green-100 shadow-md relative overflow-hidden ring-1 ring-green-200/50">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                <div className="flex items-start gap-4 ml-2">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Com Mindi</h4>
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
           loading="eager"
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
            Restaurantes de todo o Brasil já usam o Mindi para vender mais, com menos custo e total controle.
          </p>
        </div>
      </div>

      {/* Marquee Carousel - infinite auto-scroll */}
      <div
        className={`transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />
          
          {/* Marquee track */}
          <div className="animate-marquee flex gap-6 pb-4 w-max">
            {/* First set */}
            {CLIENTS_DATA.map((client, idx) => (
              <ClientCard key={`a-${client.name}-${idx}`} client={client} />
            ))}
            {/* Duplicate set for seamless loop */}
            {CLIENTS_DATA.map((client, idx) => (
              <ClientCard key={`b-${client.name}-${idx}`} client={client} />
            ))}
          </div>
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

// ============ SEÇÃO 4: CARDÁPIO DIGITAL (TABLET MOCKUP) ============
function CatalogShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      icon: <Utensils className="w-5 h-5" />,
      title: "Categorias organizadas",
      desc: "Entradas, pratos principais, sobremesas, bebidas — tudo separado e fácil de navegar."
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Funciona em qualquer dispositivo",
      desc: "Seu cardápio se adapta perfeitamente a celulares, tablets e computadores."
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Link exclusivo do seu restaurante",
      desc: "Compartilhe nas redes sociais, WhatsApp ou imprima o QR Code na mesa."
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Visual profissional",
      desc: "Fotos dos pratos, descrições, preços e complementos — tudo com aparência premium."
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Coluna esquerda — Tablet Mockup */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            {/* Moldura do Tablet */}
            <div className="relative mx-auto max-w-[540px]">
              {/* Sombra externa */}
              <div className="absolute -inset-4 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent rounded-[2.5rem] blur-2xl" />
              
              {/* Corpo do tablet */}
              <div className="relative bg-gray-900 rounded-[2rem] p-3 shadow-2xl shadow-gray-900/20">
                {/* Barra superior do tablet */}
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-700" />
                </div>
                
                {/* Tela do tablet */}
                <div className="relative rounded-xl overflow-hidden bg-white">
                  <img
                    src={CATALOG_MOCKUP}
                    alt="Cardápio digital do Mindi"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  {/* Overlay sutil no topo */}
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
                
                {/* Barra inferior do tablet (home button) */}
                <div className="flex items-center justify-center mt-2">
                  <div className="w-10 h-1 rounded-full bg-gray-700" />
                </div>
              </div>

              {/* Badge flutuante */}
              <div
                className={`absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-3 border border-gray-100 transition-all duration-700 delay-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ animation: isVisible ? "hero-float 4s ease-in-out infinite" : "none" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">QR Code</p>
                    <p className="text-[10px] text-gray-500">Pronto para imprimir</p>
                  </div>
                </div>
              </div>

              {/* Badge flutuante esquerda */}
              <div
                className={`absolute top-1/4 -left-6 bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-3 border border-gray-100 transition-all duration-700 delay-700 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ animation: isVisible ? "hero-float-delayed 5s ease-in-out infinite" : "none" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">73 itens</p>
                    <p className="text-[10px] text-gray-500">no cardápio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — Conteúdo */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
              <Utensils className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">CARDÁPIO DIGITAL</span>
            </div>

            {/* Título */}
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Seu cardápio completo,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                na palma da mão do cliente.
              </span>
            </h2>

            {/* Descrição */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Monte seu menu digital profissional em minutos. Categorias, fotos, descrições, 
              preços e complementos — tudo organizado e pronto para receber pedidos.
            </p>

            {/* Lista de benefícios */}
            <div className="space-y-5 mb-10">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${400 + i * 150}ms` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center text-red-500">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-0.5">{benefit.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/criar-conta"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] transition-all duration-300"
            >
              Criar meu cardápio grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ SEÇÃO MOCKUP VISUAL: GESTÃO DE PEDIDOS ============
// Implementado como componente visual estático da landing, não como página do sistema.
function OrdersMockupSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    "Veja todos os pedidos em tempo real",
    "Status automático: novo, preparando, saiu para entrega",
    "Histórico completo de cada cliente",
    "Notificações sonoras para novos pedidos",
    "Filtros por data, status e entregador",
    "Impressão automática na cozinha",
  ];

  return (
    <section
      ref={sectionRef}
      id="gestao-pedidos"
      className="py-20 lg:py-28 bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN — Mockup estático (55%) */}
          <div
            className={`lg:col-span-7 relative transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            {/* Frame do mockup */}
            <div className="relative">
              {/* Container do mockup — a screenshot já possui frame próprio */}
              <div className="relative">
                <img
                  src={PEDIDOS_MOCKUP}
                  alt="Tela de gestão de pedidos do Mindi — mockup ilustrativo"
                  className="w-full h-auto"
                  loading="lazy"
                  draggable={false}
                />
              </div>

              {/* Floating badge — Pedidos hoje */}
              <div
                className={`absolute -top-4 -right-3 sm:-right-6 z-20 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2.5 hidden sm:flex items-center gap-2.5 transition-all duration-700 delay-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
                style={{ animation: isVisible ? "hero-float-stat 4s ease-in-out infinite" : "none" }}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Pedidos hoje</p>
                  <p className="text-sm font-bold text-gray-900">24 pedidos</p>
                </div>
              </div>

              {/* Floating badge — Tempo médio */}
              <div
                className={`absolute bottom-12 -right-3 sm:-right-8 z-20 bg-white rounded-xl shadow-lg shadow-gray-900/10 border border-gray-100 px-3 py-2.5 hidden sm:flex items-center gap-2.5 transition-all duration-700 delay-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ animation: isVisible ? "hero-float-stat-2 5s ease-in-out infinite" : "none" }}
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Tempo médio</p>
                  <p className="text-sm font-bold text-gray-900">12 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Texto + benefícios + CTA (45%) */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
              <Package className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600 uppercase tracking-wide">Gestão de Pedidos</span>
            </div>

            {/* Título */}
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-5">
              Todos os pedidos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                em um só painel.
              </span>
            </h2>

            {/* Descrição */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Acompanhe cada pedido do momento em que entra até a entrega. Sem confusão, sem papel, sem perder nada.
            </p>

            {/* Lista de benefícios com check verde */}
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${400 + i * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/criar-conta"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] transition-all duration-300"
            >
              Experimentar grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ SEÇÃO DE PLANOS ============

interface LandingPlan {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  priceLabel?: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  badge?: string;
}

const LANDING_PLANS: LandingPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: { monthly: 0, annual: 0 },
    features: [
      "Teste grátis por 15 dias",
      "1 estabelecimento",
      "Link personalizado para o seu restaurante",
      "Gerenciador de pedidos",
    ],
    buttonText: "Começar grátis",
  },
  {
    id: "basic",
    name: "Essencial",
    price: { monthly: 79.90, annual: 799 },
    features: [
      "Tudo do plano gratuito",
      "1 estabelecimento",
      "Suporte pelo WhatsApp",
      "Dashboard completa",
      "Relatórios financeiros",
      "Campanhas SMS",
      "Cupons de desconto",
    ],
    buttonText: "Começar agora",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: -1, annual: -1 },
    priceLabel: "R$ --,--",
    highlighted: true,
    badge: "Mais Popular",
    features: [
      "Tudo do plano Essencial",
      "Estabelecimentos ilimitados",
      "Análises avançadas",
      "Assistente de IA",
      "Relatórios personalizados",
      "Programa de fidelidade",
    ],
    buttonText: "Em breve",
  },
];

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <section
      ref={sectionRef}
      id="precos"
      className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50/80"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />
            PLANOS E PREÇOS
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal{" "}
            <span className="text-red-500">para você</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Comece grátis e escale conforme seu negócio cresce. Sem surpresas, sem taxas escondidas.
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div
          className={`flex justify-center mb-12 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Anual
              <span className="ml-1.5 text-xs text-green-600 font-semibold">-17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {LANDING_PLANS.map((plan, index) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const period = isAnnual ? "/ano" : "/mês";
            const delay = 200 + index * 150;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 transition-all duration-700 overflow-hidden ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                } ${
                  plan.highlighted
                    ? "border-red-400 border-2 shadow-xl shadow-red-100/50 scale-[1.02] md:scale-105 z-10 bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                {/* Glow effect for highlighted */}
                {plan.highlighted && (
                  <div
                    className="absolute -top-20 -right-20 w-64 h-64 bg-red-400/15 rounded-full blur-3xl pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-5">
                  {plan.id === "free"
                    ? "Para quem está começando"
                    : plan.id === "basic"
                    ? "Para negócios em crescimento"
                    : "Para operações avançadas"}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {price === 0
                      ? "Grátis"
                      : plan.priceLabel
                      ? plan.priceLabel
                      : formatPrice(price)}
                  </span>
                  {(price > 0 || plan.priceLabel) && !plan.priceLabel && (
                    <span className="text-gray-400 text-sm">{period}</span>
                  )}
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">
                      O que está incluso
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? "text-red-500" : "text-gray-400"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/register"
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50"
                      : plan.id === "pro"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                  onClick={(e) => {
                    if (plan.priceLabel) e.preventDefault();
                  }}
                >
                  {plan.buttonText}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div
          className={`text-center mt-10 transition-all duration-700 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm text-gray-400">
            Todos os planos incluem suporte técnico. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============ FAQ SECTION ============
const FAQ_DATA = [
  {
    question: "Como funciona o período grátis?",
    answer: "Ao criar sua conta, você tem acesso ao plano Gratuito com até 30 pedidos por mês, sem limite de tempo. Não pedimos cartão de crédito. Quando precisar de mais recursos, é só fazer o upgrade para o plano Essencial ou Pro."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não existe fidelidade nem multa. Você pode cancelar seu plano a qualquer momento diretamente pelo painel. Seu acesso continua ativo até o final do período já pago."
  },
  {
    question: "Existe taxa por pedido?",
    answer: "Não! Diferente dos marketplaces que cobram de 12% a 27% por pedido, o Mindi cobra apenas uma mensalidade fixa. Todos os pedidos que você receber são 100% seus, sem comissão."
  },
  {
    question: "Como meus clientes fazem pedidos?",
    answer: "Você recebe um link exclusivo do seu cardápio digital. Seus clientes acessam pelo celular, escolhem os produtos, e o pedido chega direto no seu painel em tempo real. Você também pode gerar um QR Code para colocar nas mesas ou no balcão."
  },
  {
    question: "Preciso de conhecimento técnico para usar?",
    answer: "Não! O Mindi foi feito para ser simples. Em poucos minutos você cadastra seus produtos, configura o horário de funcionamento e já pode começar a receber pedidos. Se precisar de ajuda, nosso suporte está disponível."
  },
  {
    question: "O sistema funciona para delivery e mesa?",
    answer: "Sim! O Mindi atende tanto delivery (com gestão de entregadores, taxas por bairro e rastreamento) quanto pedidos presenciais com mapa de mesas e comanda digital."
  },
  {
    question: "Como funciona a gestão de entregadores?",
    answer: "Você cadastra seus entregadores, define áreas de entrega e taxas por bairro. Quando um pedido sai para entrega, você atribui ao entregador e acompanha o status em tempo real. No final do dia, tem o relatório completo de entregas."
  },
  {
    question: "Posso integrar com impressora de pedidos?",
    answer: "Sim! O Mindi suporta impressão automática de pedidos em impressoras térmicas. Assim que o pedido entra, ele já sai impresso na cozinha, agilizando o preparo."
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <HelpCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Perguntas Frequentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Tire suas <span className="text-red-500">dúvidas</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Tudo o que você precisa saber antes de começar a usar o Mindi.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQ_DATA.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                } bg-white rounded-xl border ${
                  isOpen ? "border-red-200 shadow-md shadow-red-500/5" : "border-gray-200 shadow-sm"
                }`}
                style={{ transitionDelay: isVisible ? `${200 + index * 80}ms` : "0ms" }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left"
                >
                  <span className={`text-sm sm:text-base font-semibold pr-4 transition-colors ${
                    isOpen ? "text-red-600" : "text-gray-800"
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? "bg-red-50 rotate-0" : "bg-gray-100 rotate-180"
                  }`}>
                    <ChevronUp className={`w-4 h-4 transition-colors ${isOpen ? "text-red-500" : "text-gray-400"}`} />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 sm:px-6 pb-5 pt-0">
                    <div className="h-px bg-gray-100 mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-10 transition-all duration-700 delay-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-sm text-gray-400">
            Ainda tem dúvidas?{" "}
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="text-red-500 font-medium hover:underline">
              Fale com nosso suporte
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// ============ CTA FINAL SECTION ============
function CTAFinalSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(239,68,68,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(239,68,68,0.2) 0%, transparent 50%)"
      }} />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Rocket className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Comece agora</span>
          </div>
        </div>

        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight transition-all duration-700 delay-150 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Pare de perder dinheiro.<br />
          <span className="text-red-400">Comece a vender do seu jeito.</span>
        </h2>

        <p className={`text-base sm:text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Junte-se a centenas de restaurantes que já economizam milhares de reais por mês com o Mindi. Crie sua conta grátis em menos de 2 minutos.
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-base border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com especialista
          </a>
        </div>

        {/* Trust signals */}
        <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 transition-all duration-700 delay-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {[
            { icon: Shield, text: "Dados protegidos" },
            { icon: Zap, text: "Sem taxa por pedido" },
            { icon: Clock, text: "Cancele quando quiser" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FOOTER ============
function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    "LINKS ÚTEIS": [
      { label: "Início", href: "#" },
      { label: "Planos", href: "#precos" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#funcionalidades" },
      { label: "Blog", href: "#" },
      { label: "Entrar", href: "/login" },
    ],
    "SEGMENTOS": [
      { label: "Pizzarias", href: "#" },
      { label: "Hamburguerias", href: "#" },
      { label: "Restaurantes", href: "#" },
      { label: "Cafeterias", href: "#" },
    ],
    "LEGAL": [
      { label: "Termos de uso", href: "#" },
      { label: "Política de privacidade", href: "#" },
    ],
  };

  return (
    <footer className="bg-gray-100 text-gray-500 pt-16 pb-0">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Top section: Brand + Link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-2xl font-extrabold text-red-500">Mindi</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-6 max-w-xs">
              Plataforma completa de delivery para restaurantes. Crie seu próprio sistema de pedidos online gratuitamente.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all duration-300"
                aria-label="Facebook"
              >
                <Globe className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all duration-300"
                aria-label="YouTube"
              >
                <Play className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-gray-700 transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact section */}
        <div className="mb-12">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">
            CONTATO
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-400">contato@mindi.com.br</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p>São Paulo - SP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-300" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-semibold text-gray-500">Mindi Tecnologia LTDA</span>
            <span className="hidden sm:inline">·</span>
            <span>CNPJ: 00.000.000/0001-00</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {currentYear} Mindi. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
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
      <CatalogShowcaseSection />
      <OrdersMockupSection />
      <PricingSection />
      <FAQSection />
      <CTAFinalSection />
      <LandingFooter />
    </div>
  );
}
