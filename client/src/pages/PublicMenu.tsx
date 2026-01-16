import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, Phone, ChevronLeft, ChevronRight, Store, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
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

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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

  const getProductsByCategory = (categoryId: number) => {
    return products.filter((p) => p.categoryId === categoryId);
  };

  const uncategorizedProducts = products.filter((p) => !p.categoryId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{establishment.name}</h1>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    establishment.isOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      establishment.isOpen ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {establishment.isOpen ? "Aberto" : "Fechado"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {establishment.coverImage && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={establishment.coverImage}
            alt="Capa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Restaurant Info */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {establishment.street && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  {establishment.street}
                  {establishment.number && `, ${establishment.number}`}
                  {establishment.neighborhood && ` - ${establishment.neighborhood}`}
                </span>
              </div>
            )}
            {establishment.whatsapp && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-primary" />
                <span>{establishment.whatsapp}</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mt-3 flex flex-wrap gap-2">
            {establishment.acceptsPix && (
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium">
                PIX
              </span>
            )}
            {establishment.acceptsCard && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                Cartão
              </span>
            )}
            {establishment.acceptsCash && (
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md font-medium">
                Dinheiro
              </span>
            )}
            {establishment.allowsDelivery && (
              <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                Delivery
              </span>
            )}
            {establishment.allowsPickup && (
              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md font-medium">
                Retirada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-b sticky top-[68px] z-40">
          <div className="max-w-5xl mx-auto px-4">
            <div className="relative flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 z-10 h-8 w-8 bg-white/80 shadow-sm"
                onClick={() => scrollCategories("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div
                ref={categoriesRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 z-10 h-8 w-8 bg-white/80 shadow-sm"
                onClick={() => scrollCategories("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {categories.map((category) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="mb-8 scroll-mt-32"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h2>
              {category.description && (
                <p className="text-sm text-gray-500 mb-4">{category.description}</p>
              )}

              <div className="grid gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Uncategorized Products */}
        {uncategorizedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Outros</h2>
            <div className="grid gap-4">
              {uncategorizedProducts.map((product) => (
                <ProductCard key={product.id} product={product} formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Cardápio digital por{" "}
            <span className="font-semibold text-primary">Mindi</span>
          </p>
        </div>
      </footer>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {!product.hasStock && (
              <span className="text-xs text-red-500 font-medium">Indisponível</span>
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
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </header>

      {/* Cover Skeleton */}
      <Skeleton className="h-48 md:h-64 w-full" />

      {/* Info Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Skeleton className="h-4 w-64 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex">
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="w-28 h-28 rounded-lg ml-4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
