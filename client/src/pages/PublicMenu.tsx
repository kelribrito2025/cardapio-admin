import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Home, ClipboardList, User, MapPin, ChevronRight, Store, Utensils, Menu, Star, ShoppingBag, Ticket, Clock, X, CreditCard, Banknote, QrCode, FileText, Info, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const categoriesNavRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const categoryButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const { data, isLoading, error } = trpc.publicMenu.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Set first category as active when data loads
  useEffect(() => {
    if (data?.categories && data.categories.length > 0 && activeCategory === null) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data?.categories, activeCategory]);

  // Scroll the category nav to show the active category button
  const scrollCategoryNavToActive = useCallback((categoryId: number) => {
    const button = categoryButtonRefs.current[categoryId];
    const nav = categoriesNavRef.current;
    if (button && nav) {
      const buttonRect = button.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      
      // Check if button is outside visible area
      if (buttonRect.left < navRect.left || buttonRect.right > navRect.right) {
        button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, []);

  // Handle scroll to detect which category is in view
  useEffect(() => {
    if (!data?.categories || data.categories.length === 0) return;

    const handleScroll = () => {
      if (isScrolling) return; // Don't update during programmatic scroll

      const headerOffset = 140; // Height of sticky header + category nav
      
      let currentCategory: number | null = null;
      
      for (const category of data.categories) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if the top of the category section is above the middle of the viewport
          if (rect.top <= headerOffset + 100) {
            currentCategory = category.id;
          }
        }
      }

      if (currentCategory && currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
        scrollCategoryNavToActive(currentCategory);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data?.categories, activeCategory, isScrolling, scrollCategoryNavToActive]);

  const scrollToCategory = (categoryId: number) => {
    setIsScrolling(true);
    setActiveCategory(categoryId);
    scrollCategoryNavToActive(categoryId);
    
    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 130; // Height of sticky header + category nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }

    // Reset scrolling flag after animation completes
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return numPrice.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Filter products by search query
  const filterProducts = (products: NonNullable<typeof data>['products']) => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  };

  if (isLoading) {
    return <MenuSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cardápio não encontrado</h1>
          <p className="text-gray-500">O restaurante que você procura não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const { establishment, categories, products } = data;
  const filteredProducts = filterProducts(products);

  const getProductsByCategory = (categoryId: number) => {
    return filteredProducts.filter((p) => p.categoryId === categoryId);
  };

  // Get opening hours text
  const getOpeningText = () => {
    if (establishment.isOpen) return null;
    // For now, show a generic message. In the future, this can be dynamic based on schedule
    return "Loja fechada no momento";
  };

  // Get service types
  const getServiceTypes = () => {
    const types = [];
    if (establishment.allowsDelivery) types.push("Entrega");
    if (establishment.allowsPickup) types.push("Retirada");
    return types.join(" e ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 pr-0">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                <Utensils className="h-5 w-5 text-white" />
              </div>
            )}

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Spacer to push navigation to the right edge */}
            <div className="flex-1" />

            {/* Navigation Menu - aligned to right edge of cover image */}
            <nav className="hidden md:flex items-center gap-6 pr-4">
              <button className="flex items-center gap-1.5 text-red-500 font-medium text-sm hover:text-red-600 transition-colors">
                <Home className="h-4 w-4" />
                <span>Início</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors">
                <ClipboardList className="h-4 w-4" />
                <span>Pedidos</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 mr-4">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="relative h-48 md:h-64 lg:h-72">
          {/* Banner com recorte curvo suave no mobile */}
          <div 
            className="relative w-full h-full md:rounded-2xl overflow-hidden bg-gray-200"
            style={{
              // Recorte curvo suave no canto inferior direito apenas no mobile
              clipPath: (establishment.whatsapp || establishment.instagram) 
                ? 'url(#bannerClipMobile)' 
                : undefined,
              borderRadius: '1rem'
            }}
          >
            {/* SVG clip path definition - recorte mais baixo e curvas suaves */}
            <svg className="absolute" width="0" height="0">
              <defs>
                <clipPath id="bannerClipMobile" clipPathUnits="objectBoundingBox">
                  {/* Recorte mais baixo (começa em 0.82) com curva suave */}
                  <path d="M0,0 L1,0 L1,0.82 Q0.92,0.82 0.88,0.91 Q0.86,1 0.82,1 L0,1 Z" />
                </clipPath>
              </defs>
            </svg>
            
            {establishment.coverImage ? (
              <img
                src={establishment.coverImage}
                alt="Capa do restaurante"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center">
                <Utensils className="h-16 w-16 text-red-500/30" />
              </div>
            )}
          </div>
          
          {/* Ícones sociais no recorte - apenas mobile, sem fundo */}
          {(establishment.whatsapp || establishment.instagram) && (
            <div className="md:hidden absolute bottom-2 right-3 flex items-center justify-center gap-2">
              {establishment.whatsapp && (
                <a 
                  href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="WhatsApp"
                >
                  <svg className="h-6 w-6 text-green-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
              {establishment.instagram && (
                <a 
                  href={`https://instagram.com/${establishment.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Instagram"
                >
                  <svg className="h-6 w-6 text-pink-500 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Info Block */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          {/* Profile Image */}
          <div className="relative z-10 ml-4 md:ml-6">
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-4 border-white shadow-lg bg-white"
              />
            ) : (
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center border-4 border-white shadow-lg">
                <Utensils className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                {/* Restaurant Name and Rating */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {establishment.name}
                  </h1>
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-gray-800">
                      {establishment.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({establishment.reviewCount || 0} avaliações)
                    </span>
                  </div>
                </div>

                {/* Address and More Info */}
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  {establishment.street && (
                    <>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-500" />
                        {establishment.street}
                        {establishment.number && `, ${establishment.number}`}
                      </span>
                      <span className="text-gray-400">•</span>
                    </>
                  )}
                  <button 
                    onClick={() => setShowInfoModal(true)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors"
                  >
                    <Info className="h-4 w-4" style={{width: '14px', height: '14px'}} />
                    Informações
                  </button>
                </div>

                {/* Status and Service Types */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Open/Closed Status */}
                  {establishment.isOpen ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      Aberto agora
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-500 font-medium text-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      {getOpeningText()}
                    </span>
                  )}

                  {/* Service Types Badge */}
                  {getServiceTypes() && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                      {getServiceTypes()}
                    </span>
                  )}
                </div>
              </div>

              {/* Social Media Icons - canto superior direito (esconder WhatsApp/Instagram no mobile, já estão no bloco flutuante) */}
              <div className="flex items-center gap-1">
                {/* Botão Compartilhar */}
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: establishment.name,
                        text: `Confira o cardápio de ${establishment.name}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copiado!');
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Compartilhar"
                >
                  <Share2 className="h-5 w-5 text-gray-500" />
                </button>
                {/* WhatsApp - escondido no mobile, visível no desktop */}
                {establishment.whatsapp && (
                  <a 
                    href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="WhatsApp"
                  >
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
                {/* Instagram - escondido no mobile, visível no desktop */}
                {establishment.instagram && (
                  <a 
                    href={`https://instagram.com/${establishment.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Instagram"
                  >
                    <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-y sticky top-[60px] z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2">
              {/* Menu Icon */}
              <button className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0">
                <Menu className="h-5 w-5" />
              </button>

              {/* Categories */}
              <div
                ref={categoriesNavRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide py-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    ref={(el) => { categoryButtonRefs.current[category.id] = el; }}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-lg ${
                      activeCategory === category.id
                        ? "text-red-500 bg-red-50 border-b-2 border-red-500"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-6">
          {/* Products List */}
          <div className="flex-1">
            {searchQuery && filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto encontrado para "{searchQuery}"</p>
              </div>
            ) : (
              categories.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);
                if (categoryProducts.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    ref={(el) => { categoryRefs.current[category.id] = el; }}
                    className="mb-5 scroll-mt-32"
                  >
                    <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      {category.name}
                    </h2>

                    <div className="grid gap-2">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {filteredProducts.length === 0 && !searchQuery && (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto disponível no momento.</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[120px]">
              {/* Calcular taxa de entrega */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
                <button className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-800">Calcular taxa de entrega</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Sua sacola */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 mb-4">Sua sacola</h3>
                
                {/* Empty cart state */}
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 font-medium">Sacola vazia</p>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-600">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Taxa de entrega</span>
                    <span className="text-gray-400">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">R$ 0,00</span>
                  </div>
                </div>

                {/* Cupom */}
                <button className="w-full flex items-center justify-between mt-4 py-3 border-t border-gray-100 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm">Tem um cupom?</p>
                      <p className="text-xs text-gray-400">Clique e insira o código</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Button */}
                <button 
                  disabled
                  className="w-full mt-4 py-3.5 bg-red-400/80 text-white font-semibold rounded-xl cursor-not-allowed"
                >
                  Sacola vazia
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Cardápio digital por{" "}
            <span className="font-semibold text-red-500">Mindi</span>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-0.5 px-4 py-2 text-red-500">
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Início</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500">
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium">Pedidos</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500">
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />

      {/* Modal Mais Informações */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '46px'}}>
              <h2 className="text-lg font-bold text-gray-900">Informações</h2>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Horários de Funcionamento */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Horários de Funcionamento</h3>
                </div>
                <div className="space-y-2">
                  <ScheduleRow day="Segunda-feira" hours="18:00 às 23:00" dayIndex={1} />
                  <ScheduleRow day="Terça-feira" hours="18:00 às 23:00" dayIndex={2} />
                  <ScheduleRow day="Quarta-feira" hours="18:00 às 23:00" dayIndex={3} />
                  <ScheduleRow day="Quinta-feira" hours="18:00 às 23:00" dayIndex={4} />
                  <ScheduleRow day="Sexta-feira" hours="18:00 às 23:00" dayIndex={5} />
                  <ScheduleRow day="Sábado" hours="12:00 às 23:00" dayIndex={6} />
                  <ScheduleRow day="Domingo" hours="12:00 às 22:00" dayIndex={0} />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Formas de Pagamento */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Formas de Pagamento</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {establishment.acceptsCash && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-700">Dinheiro</span>
                    </div>
                  )}
                  {establishment.acceptsCard && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Cartão</span>
                    </div>
                  )}
                  {establishment.acceptsPix && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <QrCode className="h-5 w-5 text-teal-600" />
                      <span className="text-sm text-gray-700">Pix</span>
                    </div>
                  )}
                  {establishment.acceptsBoleto && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <span className="text-sm text-gray-700">Boleto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para linha de horário com destaque para o dia atual
function ScheduleRow({ day, hours, dayIndex }: { day: string; hours: string; dayIndex: number }) {
  const today = new Date().getDay();
  const isToday = today === dayIndex;

  return (
    <div 
      className={`flex justify-between items-center py-2.5 px-3 rounded-lg transition-colors ${
        isToday 
          ? "bg-red-50 border border-red-200" 
          : "hover:bg-gray-50"
      }`}
    >
      <span className={`font-medium ${isToday ? "text-red-600" : "text-gray-700"}`}>
        {day}
        {isToday && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Hoje</span>}
      </span>
      <span className={`text-sm ${isToday ? "text-red-600 font-semibold" : "text-gray-500"}`}>
        {hours}
      </span>
    </div>
  );
}

function ProductCard({
  product,
  formatPrice,
}: {
  product: {
    id: number;
    name: string;
    description: string | null;
    price: string;
    images: string[] | null;
    hasStock: boolean;
  };
  formatPrice: (price: string | number) => string;
}) {
  const mainImage = product.images?.[0];

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
      <div className="flex">
        <div className="flex-1 p-3">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-red-500 font-semibold text-sm">{formatPrice(product.price)}</span>
            {!product.hasStock && (
              <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                Indisponível
              </span>
            )}
          </div>
        </div>
        {mainImage && (
          <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
            <img
              src={mainImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover rounded-r-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 flex-1 max-w-xl rounded-lg" />
            <div className="hidden md:flex gap-6">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      </header>

      {/* Cover Skeleton */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <Skeleton className="h-48 md:h-64 lg:h-72 rounded-2xl" />
      </div>

      {/* Info Skeleton */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          <Skeleton className="h-28 w-28 md:h-36 md:w-36 rounded-full ml-4 md:ml-6" />
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white border-y">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-6">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-4 flex gap-4">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="w-28 h-28 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block w-80">
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
