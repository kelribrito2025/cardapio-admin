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
  Package
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

// ============ MAIN LANDING PAGE ============
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <PainPointsStrip />
      
      {/* Novas seções serão adicionadas aqui */}
    </div>
  );
}
