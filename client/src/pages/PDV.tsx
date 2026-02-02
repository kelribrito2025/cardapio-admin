import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
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
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

  // Funções do carrinho
  const addToCart = (product: Product, quantity: number, observation: string) => {
    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.observation === observation
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

    setSelectedProduct(null);
    setProductQuantity(1);
    setProductObservation("");
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
                      onClick={() => setSelectedProduct(product)}
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
                              if (product.hasStock) {
                                addToCart(product, 1, "");
                              }
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
                          {formatCurrency(parseFloat(item.price) * item.quantity)}
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

      {/* Modal de Detalhes do Produto */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {selectedProduct && (
            <>
              {/* Imagem */}
              <div className="aspect-video bg-muted relative">
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {selectedProduct.name}
                </h2>
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedProduct.description}
                  </p>
                )}
                <p className="text-2xl font-bold text-red-600 mb-4">
                  {formatCurrency(parseFloat(selectedProduct.price))}
                </p>

                {/* Observação */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Observações
                  </label>
                  <Textarea
                    placeholder="Ex: Sem cebola, bem passado..."
                    value={productObservation}
                    onChange={(e) => setProductObservation(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Quantidade e Adicionar */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
                    <button
                      onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold w-8 text-center">
                      {productQuantity}
                    </span>
                    <button
                      onClick={() => setProductQuantity(productQuantity + 1)}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12"
                    onClick={() => addToCart(selectedProduct, productQuantity, productObservation)}
                    disabled={!selectedProduct.hasStock}
                  >
                    Adicionar {formatCurrency(parseFloat(selectedProduct.price) * productQuantity)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
