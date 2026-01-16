import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Search, Home, ClipboardList, User, MapPin, ChevronRight, Store, Utensils, Menu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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

  const scrollToCategory = (categoryId: number) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <button className="flex items-center gap-1.5 text-primary font-medium text-sm hover:text-primary/80 transition-colors">
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
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="relative h-48 md:h-64 lg:h-72 rounded-2xl overflow-hidden bg-gray-200">
          {establishment.coverImage ? (
            <img
              src={establishment.coverImage}
              alt="Capa do restaurante"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Utensils className="h-16 w-16 text-primary/30" />
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
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-4 border-white shadow-lg">
                <Utensils className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                {/* Restaurant Name */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {establishment.name}
                </h1>

                {/* Address and More Info */}
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  {establishment.street && (
                    <>
                      <span>
                        {establishment.street}
                        {establishment.number && `, ${establishment.number}`}
                      </span>
                      <span className="text-gray-400">•</span>
                    </>
                  )}
                  <button className="text-gray-600 hover:text-primary font-medium transition-colors">
                    Mais informações
                  </button>
                </div>

                {/* Status and Service Types */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Open/Closed Status */}
                  {establishment.isOpen ? (
                    <span className="text-green-600 font-medium text-sm">
                      Aberto agora
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium text-sm">
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

              {/* Delivery Fee Calculator (placeholder) */}
              <div className="hidden md:block">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Calcular taxa de entrega</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
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
                ref={categoriesRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide py-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-lg ${
                      activeCategory === category.id
                        ? "text-gray-900 bg-gray-100"
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
      <main className="max-w-6xl mx-auto px-4 py-6">
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
                    className="mb-8 scroll-mt-32"
                  >
                    <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
                      {category.name}
                    </h2>

                    <div className="grid gap-4">
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

          {/* Cart Sidebar (placeholder) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[120px] bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-bold text-gray-900 mb-4">Sua sacola</h3>
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sua sacola está vazia</p>
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
            <span className="font-semibold text-primary">Mindi</span>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-0.5 px-4 py-2 text-primary">
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex">
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">{formatPrice(product.price)}</span>
            {!product.hasStock && (
              <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">
                Indisponível
              </span>
            )}
          </div>
        </div>
        {mainImage && (
          <div className="w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
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
            <div className="hidden md:flex items-center gap-6">
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

      {/* Info Block Skeleton */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          <Skeleton className="h-28 w-28 md:h-36 md:w-36 rounded-full ml-4 md:ml-6" />
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-3" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white border-y">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-28 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block w-80">
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
