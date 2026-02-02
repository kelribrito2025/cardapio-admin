import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  Search,
  Image as ImageIcon,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Tipos
type OrderType = "mesa" | "retirada" | "entrega";

type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[] | null;
  status: 'active' | 'paused' | 'archived';
  hasStock: boolean;
  categoryId: number | null;
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function PDV() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Buscar categorias e produtos
  const { data: categories, isLoading: categoriesLoading } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Estados
  const [orderType, setOrderType] = useState<OrderType>("mesa");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  // Map<groupId, Map<itemId, quantity>>
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);

  // Query para buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Filtrar produtos
  const productsList = products?.products || [];
  const filteredProducts = productsList.filter((product) => {
    if (product.status !== 'active') return false;
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  }) || [];

  // Ordenar categorias
  const sortedCategories = categories?.slice().sort((a, b) => a.sortOrder - b.sortOrder) || [];

  // Verificar se produto tem complementos
  const hasComplements = (productId: number) => {
    // Verificamos se o produto tem grupos de complementos
    // Como não temos essa info no produto, vamos sempre abrir o modal
    return true;
  };

  // Funções do carrinho
  const addToCart = (product: Product, quantity: number, observation: string, complements: Array<{ id: number; name: string; price: string; quantity: number }>) => {
    // Para itens com complementos, sempre adiciona como novo item
    if (complements.length > 0) {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          observation,
          image: product.images?.[0] || null,
          complements,
        },
      ]);
    } else {
      const existingIndex = cart.findIndex(
        (item) => item.productId === product.id && 
                 item.observation === observation &&
                 item.complements.length === 0
      );

      if (existingIndex >= 0) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += quantity;
        setCart(newCart);
      } else {
        setCart([
          ...cart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            observation,
            image: product.images?.[0] || null,
            complements: [],
          },
        ]);
      }
    }

    // Limpar seleções
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    toast.success(`${product.name} adicionado ao pedido`);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    setTableNumber("");
  };

  // Calcular total
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const complementsPrice = item.complements.reduce(
        (sum, comp) => sum + parseFloat(comp.price) * comp.quantity,
        0
      );
      return total + (itemPrice + complementsPrice) * item.quantity;
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Finalizar pedido (apenas visual por enquanto)
  const handleFinishOrder = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }
    if (orderType === "mesa" && !tableNumber) {
      toast.error("Informe o número da mesa");
      return;
    }
    toast.success("Pedido finalizado com sucesso!", {
      description: `Tipo: ${orderType === "mesa" ? "Mesa " + tableNumber : orderType === "retirada" ? "Retirada" : "Entrega"}`,
    });
    clearCart();
  };

  // Handler para abrir modal de produto
  const handleProductClick = (product: Product) => {
    if (!product.hasStock) return;
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda - Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Categorias */}
            <div className="px-4 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    selectedCategory === null
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                  )}
                >
                  Todos
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    selectedCategory === null ? "bg-white/20" : "bg-muted"
                  )}>
                    {productsList.filter((p) => p.status === 'active').length || 0}
                  </span>
                </button>
                {categoriesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32" />
                  ))
                ) : (
                  sortedCategories.map((category) => {
                    const count = productsList.filter(
                      (p) => p.status === 'active' && p.categoryId === category.id
                    ).length || 0;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                          selectedCategory === category.id
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                        )}
                      >
                        
                        {category.name}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          selectedCategory === category.id ? "bg-white/20" : "bg-muted"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="flex-1 overflow-y-auto p-4">
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                      <Skeleton className="aspect-square" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou busca</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-card rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:shadow-lg hover:border-red-200 transition-all group"
                    >
                      {/* Imagem */}
                      <div className="h-28 bg-muted relative overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {!product.hasStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium px-3 py-1 bg-red-500 rounded-full">
                              Indisponível
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-red-600 font-bold text-sm">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                            disabled={!product.hasStock}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Sacola/Pedido */}
          <div className="w-[380px] border-l border-border/50 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
            {/* Header da Sacola */}
            <div className="p-4 border-b border-border/50">
              <h2 className="text-lg font-bold text-gray-800">Pedido Atual</h2>
              <p className="text-sm text-muted-foreground">
                Selecione o tipo e adicione os itens
              </p>
            </div>

            {/* Seletor de Tipo de Pedido */}
            <div className="p-4 border-b border-border/50">
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType("mesa")}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-all",
                    orderType === "mesa"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Mesa
                </button>
                <button
                  onClick={() => setOrderType("retirada")}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-all",
                    orderType === "retirada"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Retirada
                </button>
                <button
                  onClick={() => setOrderType("entrega")}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-all",
                    orderType === "entrega"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <Truck className="h-5 w-5" />
                  Entrega
                </button>
              </div>

              {/* Campo de Mesa */}
              {orderType === "mesa" && (
                <div className="mt-3">
                  <Input
                    placeholder="Número da mesa"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="text-center font-medium"
                  />
                </div>
              )}
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm font-medium">Nenhum item no pedido</p>
                  <p className="text-xs">Clique nos produtos para adicionar</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Header com nome e botão remover */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 line-clamp-2">
                            {item.name}
                          </h4>
                          <p className="text-red-600 font-bold text-sm mt-0.5">
                            {formatCurrency(parseFloat(item.price))}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCartItem(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Complementos */}
                      {item.complements.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5 border-t border-gray-100 pt-2">
                          {item.complements.map((comp, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{comp.quantity}x {comp.name}</span>
                              <span>+ {formatCurrency(parseFloat(comp.price) * comp.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.observation && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Obs: {item.observation}
                        </p>
                      )}

                      {/* Controles de Quantidade */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartItemQuantity(index, -1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(index, 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {formatCurrency(
                            (parseFloat(item.price) + 
                             item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)
                            ) * item.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer - Totais e Ações */}
            <div className="border-t border-border/50 bg-white p-4 space-y-4 shrink-0">
              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-dashed pt-2">
                  <span>Total</span>
                  <span className="text-red-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Limpar
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleFinishOrder}
                  disabled={cart.length === 0}
                >
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto - Estilo Menu Público */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); }}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300" style={{ touchAction: 'pan-y' }}>
            {/* Imagem do Produto ou Complemento Selecionado */}
            {(() => {
              // Determinar qual imagem exibir: complemento selecionado ou produto
              const displayImage = selectedComplementImage || selectedProduct.images?.[0];
              
              if (displayImage) {
                return (
                  <div className="relative w-full h-[215px] sm:h-60 md:h-72 flex-shrink-0">
                    <img
                      src={displayImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); }}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                );
              }
              
              // Placeholder quando não há imagem
              return (
                <div className="relative w-full h-[180px] sm:h-48 md:h-56 flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-white/80" />
                  <button 
                    onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              );
            })()}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">
                    {selectedProduct.description}
                  </p>
                )}
                {Number(selectedProduct.price) > 0 && (
                  <p className="text-lg font-semibold text-red-500 mt-2">
                    {formatCurrency(parseFloat(selectedProduct.price))}
                  </p>
                )}
              </div>

              {/* Grupos de Complementos */}
              {productComplements && productComplements.length > 0 && (
                <div className="space-y-4">
                  {productComplements.map((group) => {
                    const selectedInGroup = selectedComplements.get(group.id) || new Map<number, number>();
                    const isRadio = group.maxQuantity === 1;
                    
                    return (
                      <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Header do Grupo */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
                            {group.isRequired && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {group.minQuantity > 0 ? `Mín: ${group.minQuantity}` : ''}
                            {group.minQuantity > 0 && group.maxQuantity > 1 ? ' | ' : ''}
                            {group.maxQuantity > 1 ? `Máx: ${group.maxQuantity}` : ''}
                            {group.maxQuantity === 1 && group.minQuantity === 0 ? 'Escolha até 1' : ''}
                          </p>
                        </div>
                        
                        {/* Itens do Grupo */}
                        <div className="divide-y divide-gray-100">
                          {group.items.map((item) => {
                            const itemQuantity = selectedInGroup.get(item.id) || 0;
                            const isSelected = itemQuantity > 0;
                            const itemImageUrl = (item as any).imageUrl;
                            const displayPrice = item.priceMode === 'free' ? 0 : Number(item.price);
                            
                            // Função para adicionar/incrementar complemento
                            const handleIncrement = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                const currentQty = currentGroupMap.get(item.id) || 0;
                                
                                // Verificar limite do grupo
                                const totalInGroup = Array.from(currentGroupMap.values()).reduce((a, b) => a + b, 0);
                                if (totalInGroup < group.maxQuantity) {
                                  currentGroupMap.set(item.id, currentQty + 1);
                                  newMap.set(group.id, currentGroupMap);
                                  if (itemImageUrl) setSelectedComplementImage(itemImageUrl);
                                }
                                return newMap;
                              });
                            };
                            
                            // Função para decrementar/remover complemento
                            const handleDecrement = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                const currentQty = currentGroupMap.get(item.id) || 0;
                                
                                if (currentQty > 1) {
                                  currentGroupMap.set(item.id, currentQty - 1);
                                } else {
                                  currentGroupMap.delete(item.id);
                                  if (itemImageUrl && selectedComplementImage === itemImageUrl) {
                                    setSelectedComplementImage(null);
                                  }
                                }
                                newMap.set(group.id, currentGroupMap);
                                return newMap;
                              });
                            };
                            
                            // Função para toggle (checkbox/radio)
                            const handleToggle = () => {
                              setSelectedComplements((prev) => {
                                const newMap = new Map(prev);
                                const currentGroupMap = new Map(prev.get(group.id) || []);
                                
                                if (isRadio) {
                                  // Radio: substitui a seleção com quantidade 1
                                  const newGroupMap = new Map<number, number>();
                                  newGroupMap.set(item.id, 1);
                                  newMap.set(group.id, newGroupMap);
                                  if (itemImageUrl) {
                                    setSelectedComplementImage(itemImageUrl);
                                  } else {
                                    setSelectedComplementImage(null);
                                  }
                                } else {
                                  // Checkbox: toggle
                                  if (isSelected) {
                                    currentGroupMap.delete(item.id);
                                    if (itemImageUrl && selectedComplementImage === itemImageUrl) {
                                      setSelectedComplementImage(null);
                                    }
                                  } else {
                                    const totalInGroup = Array.from(currentGroupMap.values()).reduce((a, b) => a + b, 0);
                                    if (totalInGroup < group.maxQuantity) {
                                      currentGroupMap.set(item.id, 1);
                                      if (itemImageUrl) {
                                        setSelectedComplementImage(itemImageUrl);
                                      }
                                    }
                                  }
                                  newMap.set(group.id, currentGroupMap);
                                }
                                return newMap;
                              });
                            };
                            
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                                  isSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                  <input
                                    type={isRadio ? 'radio' : 'checkbox'}
                                    name={`group-${group.id}`}
                                    checked={isSelected}
                                    onChange={handleToggle}
                                    className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                                  />
                                  <span className="text-sm text-gray-900">{item.name}</span>
                                </label>
                                
                                <div className="flex items-center gap-3">
                                  {/* Controles de quantidade - aparecem quando selecionado */}
                                  {isSelected && !isRadio && (
                                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-1">
                                      <button
                                        type="button"
                                        onClick={handleDecrement}
                                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium text-gray-900">{itemQuantity}</span>
                                      <button
                                        type="button"
                                        onClick={handleIncrement}
                                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Preço */}
                                  {(() => {
                                    if (displayPrice > 0) {
                                      const totalItemPrice = displayPrice * (itemQuantity || 1);
                                      return (
                                        <span className="text-sm text-gray-600 min-w-[70px] text-right">
                                          {isSelected && itemQuantity > 1 
                                            ? `+ ${formatCurrency(totalItemPrice)}` 
                                            : `+ ${formatCurrency(displayPrice)}`
                                          }
                                        </span>
                                      );
                                    } else if (item.priceMode === 'free' && Number(item.price) > 0) {
                                      return <span className="text-sm text-green-600 font-medium">GRÁTIS</span>;
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campo de Observação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={productObservation}
                  onChange={(e) => setProductObservation(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                />
              </div>
            </div>

            {/* Footer com Quantidade e Botão Adicionar */}
            <div className="border-t bg-white p-3 sm:p-4 flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Controle de Quantidade */}
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  disabled={productQuantity <= 1}
                >
                  <Minus className="h-4 w-4 text-gray-700" />
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[24px] text-center">
                  {productQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                </button>
              </div>

              {/* Botão Adicionar */}
              {(() => {
                // Calcular preço total com complementos (considerando quantidade)
                let complementsTotal = 0;
                const selectedComplementsList: Array<{ id: number; name: string; price: string; quantity: number }> = [];
                
                if (productComplements) {
                  productComplements.forEach((group) => {
                    const selectedInGroup = selectedComplements.get(group.id);
                    if (selectedInGroup) {
                      group.items.forEach((item) => {
                        const qty = selectedInGroup.get(item.id);
                        if (qty && qty > 0) {
                          // Considerar priceMode: se for 'free', o preço é 0
                          const itemPrice = item.priceMode === 'free' ? 0 : Number(item.price);
                          complementsTotal += itemPrice * qty;
                          selectedComplementsList.push({
                            id: item.id,
                            name: item.name,
                            price: String(itemPrice),
                            quantity: qty,
                          });
                        }
                      });
                    }
                  });
                }
                
                const unitPrice = Number(selectedProduct.price) + complementsTotal;
                const totalPrice = unitPrice * productQuantity;
                
                // Verificar se grupos obrigatórios estão preenchidos
                let requiredGroupsMet = true;
                if (productComplements) {
                  productComplements.forEach((group) => {
                    if (group.isRequired || group.minQuantity > 0) {
                      const selectedInGroup = selectedComplements.get(group.id);
                      // Contar total de itens selecionados no grupo
                      const selectedCount = selectedInGroup ? Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0) : 0;
                      if (selectedCount < (group.minQuantity || 1)) {
                        requiredGroupsMet = false;
                      }
                    }
                  });
                }
                
                // Verificar se item tem preço zero e nenhum complemento selecionado
                const hasZeroPrice = Number(selectedProduct.price) === 0;
                const hasSelectedComplements = selectedComplementsList.length > 0;
                const canAddZeroPriceItem = !hasZeroPrice || hasSelectedComplements;
                
                const canAddToCart = requiredGroupsMet && canAddZeroPriceItem && selectedProduct.hasStock;
                
                return (
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, productQuantity, productObservation, selectedComplementsList);
                    }}
                    disabled={!canAddToCart}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      canAddToCart 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!selectedProduct.hasStock ? (
                      <>
                        <X className="h-5 w-5" />
                        <span>Indisponível</span>
                      </>
                    ) : hasZeroPrice && !hasSelectedComplements ? (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>Escolha uma opção</span>
                      </>
                    ) : !requiredGroupsMet ? (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>Escolha uma opção</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span className="hidden xs:inline">Adicionar</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
