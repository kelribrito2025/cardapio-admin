import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
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
  Eye,
  Menu,
  Check,
  ChevronsRight,
  ChevronRight,
  Pencil,
  ChevronDown,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  MapPin,
  ChevronUp,
  Ticket,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Tipos
type OrderType = "mesa" | "retirada" | "entrega";
type PaymentMethodType = "cash" | "card" | "pix" | null;

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
  const [, setLocation] = useLocation();
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

  // Query para buscar configurações de impressão (para saber o método favorito)
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );

  // Função para imprimir pedido (Impressão Normal) - usa iframe oculto para não abrir nova aba
  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      
      // Criar iframe oculto para impressão
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      
      document.body.appendChild(iframe);
      
      // Aguardar o iframe carregar e chamar print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remover iframe após impressão (com delay para garantir que o diálogo de impressão abriu)
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      console.error("Erro ao imprimir pedido:", error);
    }
  };

  // Função para imprimir em múltiplas impressoras (Android)
  const handlePrintMultiPrinter = async (orderId: number) => {
    try {
      const response = await fetch(`${window.location.origin}/api/print/multiprinter-sectors/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.deepLink) {
        window.location.href = data.deepLink;
      }
    } catch (error) {
      console.error("Erro ao imprimir em múltiplas impressoras:", error);
    }
  };

  // Função para imprimir usando o método favorito
  const handlePrintWithFavoriteMethod = async (orderId: number) => {
    const printMethod = printerSettings?.defaultPrintMethod || 'normal';
    
    if (printMethod === 'android') {
      await handlePrintMultiPrinter(orderId);
    } else {
      await handlePrintOrderDirect(orderId);
    }
  };

  // Mutation para criar pedido
  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: (data) => {
      toast.success("Pedido criado com sucesso!", {
        description: `Pedido ${data.orderNumber} criado e em preparação`,
      });
      
      // Imprimir pedido automaticamente usando o método favorito
      if (data.id) {
        handlePrintWithFavoriteMethod(data.id);
      }
      
      clearCart();
      // Redirecionar para a página de Pedidos
      setLocation("/pedidos");
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido", {
        description: error.message,
      });
    },
  });

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
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<{index: number; item: CartItem} | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Estados para entrega
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    reference: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(null);
  const [changeAmount, setChangeAmount] = useState("");
  const [showDeliverySidebar, setShowDeliverySidebar] = useState(false);
  const [showNeighborhoodSelector, setShowNeighborhoodSelector] = useState(false);
  const [selectedNeighborhoodFee, setSelectedNeighborhoodFee] = useState<{id: number; neighborhood: string; fee: string} | null>(null);

  // Estados para sidebar de pagamento (Retirada)
  const [showPaymentSidebar, setShowPaymentSidebar] = useState(false);

  // Estados para cupom
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number} | null>(null);

  // Query para buscar taxas por bairro
  const { data: neighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId && establishment?.deliveryFeeType === "byNeighborhood" }
  );

  // Debug: Monitorar mudanças no estado showDeliverySidebar
  useEffect(() => {
    console.log("[PDV] showDeliverySidebar changed to:", showDeliverySidebar);
  }, [showDeliverySidebar]);

  // Estados para drag horizontal na barra de categorias
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

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

  // Ordenar categorias (apenas ativas)
  const sortedCategories = categories?.filter(c => c.isActive).slice().sort((a, b) => a.sortOrder - b.sortOrder) || [];

  // Verificar se produto tem complementos
  const hasComplements = (productId: number) => {
    // Verificamos se o produto tem grupos de complementos
    // Como não temos essa info no produto, vamos sempre abrir o modal
    return true;
  };

  // Funções de drag horizontal na barra de categorias
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesContainerRef.current.offsetLeft);
    setScrollLeft(categoriesContainerRef.current.scrollLeft);
  };

  // Usar useEffect para adicionar listeners no document quando estiver arrastando
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !categoriesContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoriesContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Velocidade do scroll
      categoriesContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  // Detectar overflow nas categorias
  useEffect(() => {
    const checkOverflow = () => {
      if (categoriesContainerRef.current) {
        const { scrollWidth, clientWidth } = categoriesContainerRef.current;
        setHasOverflow(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [sortedCategories]);

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
    setPaymentMethod(null);
    setDeliveryAddress({
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      reference: ""
    });
    setSelectedNeighborhoodFee(null);
    setChangeAmount("");
    // Limpar cupom
    setShowCouponField(false);
    setCouponCode("");
    setAppliedCoupon(null);
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

  // Gerar número do pedido
  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `${timestamp}`;
  };

  // Handler para o botão principal (Pagamento ou Finalizar Pedido)
  const handleMainButtonClick = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    // Para Retirada: se não tem forma de pagamento, abre sidebar de pagamento
    if (orderType === "retirada" && !paymentMethod) {
      setShowPaymentSidebar(true);
      return;
    }

    // Para Mesa: verificar número da mesa
    if (orderType === "mesa" && !tableNumber) {
      toast.error("Informe o número da mesa");
      return;
    }

    // Para Entrega: verificar endereço
    if (orderType === "entrega" && (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood)) {
      toast.error("Preencha os dados de entrega");
      setShowDeliverySidebar(true);
      return;
    }

    // Criar pedido
    createOrder();
  };

  // Criar pedido no banco de dados
  const createOrder = () => {
    if (!establishmentId) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    const orderNumber = generateOrderNumber();
    const subtotal = calculateTotal();
    const deliveryFee = orderType === "entrega" && selectedNeighborhoodFee 
      ? parseFloat(selectedNeighborhoodFee.fee) 
      : 0;
    const total = subtotal + deliveryFee;

    // Mapear tipo de pedido para deliveryType
    const deliveryTypeMap: Record<OrderType, "delivery" | "pickup" | "dine_in"> = {
      mesa: "dine_in",
      retirada: "pickup",
      entrega: "delivery"
    };

    // Construir endereço completo para entrega
    let customerAddress = "";
    if (orderType === "entrega") {
      customerAddress = `${deliveryAddress.street}, ${deliveryAddress.number}`;
      if (deliveryAddress.complement) customerAddress += ` - ${deliveryAddress.complement}`;
      customerAddress += ` - ${deliveryAddress.neighborhood}`;
      if (deliveryAddress.reference) customerAddress += ` (Ref: ${deliveryAddress.reference})`;
    } else if (orderType === "mesa") {
      customerAddress = `Mesa ${tableNumber}`;
    }

    createOrderMutation.mutate({
      establishmentId,
      orderNumber,
      customerName: orderType === "mesa" ? `Mesa ${tableNumber}` : "Cliente PDV",
      customerPhone: "",
      customerAddress,
      deliveryType: deliveryTypeMap[orderType],
      paymentMethod: paymentMethod || "cash",
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      notes: orderType === "mesa" ? `Mesa: ${tableNumber}` : undefined,
      status: "preparing", // Pedidos do PDV já vão direto para preparação
      source: "pdv",
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: ((parseFloat(item.price) + item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)) * item.quantity).toFixed(2),
        complements: item.complements.map(c => ({
          name: c.name,
          price: parseFloat(c.price),
          quantity: c.quantity
        })),
        notes: item.observation || undefined
      }))
    });
  };

  // Determinar texto e estado do botão principal
  const getMainButtonConfig = () => {
    if (orderType === "retirada" && !paymentMethod) {
      return {
        text: "Pagamento",
        icon: <Wallet className="h-5 w-5 mr-2" />,
        disabled: cart.length === 0
      };
    }
    return {
      text: "Finalizar Pedido",
      icon: null,
      disabled: cart.length === 0 || createOrderMutation.isPending
    };
  };

  const mainButtonConfig = getMainButtonConfig();

  // Handler para selecionar forma de pagamento na sidebar
  const handleSelectPaymentMethod = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    setShowPaymentSidebar(false);
  };

  // Handler para abrir modal de produto
  const handleProductClick = (product: Product) => {
    if (!product.hasStock) return;
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setIsEditingMode(false);
    setEditingCartItem(null);
  };

  // Handler para editar item do carrinho (abre o mesmo modal de detalhes)
  const handleEditCartItem = (index: number, item: CartItem) => {
    // Encontrar o produto original
    const product = productsList.find(p => p.id === item.productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    // Primeiro, abrir o modal com o produto selecionado
    // Os complementos serão restaurados pelo useEffect quando productComplements carregar
    setSelectedProduct(product);
    setProductQuantity(item.quantity);
    setProductObservation(item.observation);
    setSelectedComplements(new Map()); // Será preenchido pelo useEffect
    setSelectedComplementImage(null);
    setIsEditingMode(true);
    setEditingCartItem({ index, item });
  };

  // useEffect para restaurar complementos quando editando um item do carrinho
  useEffect(() => {
    if (isEditingMode && editingCartItem && productComplements && productComplements.length > 0) {
      const complementsMap = new Map<number, Map<number, number>>();
      
      // Para cada complemento salvo no item do carrinho
      editingCartItem.item.complements.forEach(savedComp => {
        // Encontrar o grupo que contém esse complemento
        productComplements.forEach(group => {
          const foundItem = group.items.find(item => item.id === savedComp.id);
          if (foundItem) {
            // Adicionar ao mapa usando o groupId correto
            const currentGroupMap = complementsMap.get(group.id) || new Map<number, number>();
            currentGroupMap.set(savedComp.id, savedComp.quantity);
            complementsMap.set(group.id, currentGroupMap);
          }
        });
      });
      
      setSelectedComplements(complementsMap);
    }
  }, [isEditingMode, editingCartItem, productComplements]);

  // Obter formas de pagamento disponíveis do estabelecimento
  const getAvailablePaymentMethods = () => {
    const methods: Array<{ id: PaymentMethodType; name: string; description: string; icon: React.ReactNode }> = [];
    
    if (establishment?.acceptsCash) {
      methods.push({
        id: "cash",
        name: "Dinheiro",
        description: "Pagamento em espécie",
        icon: <Banknote className="h-5 w-5" />
      });
    }
    
    if (establishment?.acceptsCard) {
      methods.push({
        id: "card",
        name: "Cartão",
        description: "Débito ou Crédito",
        icon: <CreditCard className="h-5 w-5" />
      });
    }
    
    if (establishment?.acceptsPix) {
      methods.push({
        id: "pix",
        name: "Pix",
        description: "Pagamento instantâneo",
        icon: <QrCode className="h-5 w-5" />
      });
    }
    
    return methods;
  };

  const availablePaymentMethods = getAvailablePaymentMethods();

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 overflow-hidden">
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda - Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Categorias */}
            <div className="relative px-4 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                {/* Botão de Menu de Categorias - Fixo */}
                <button
                  onClick={() => setShowCategoriesModal(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-card text-muted-foreground hover:bg-muted border border-border/50 transition-all shrink-0 cursor-pointer"
                  title="Ver todas as categorias"
                >
                  <Menu className="h-5 w-5" />
                </button>
                {/* Área de categorias com drag */}
                <div 
                  ref={categoriesContainerRef}
                  className={cn(
                    "flex items-center gap-2 overflow-x-auto pr-24 scrollbar-hide select-none flex-1",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={handleMouseDown}
                >
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    selectedCategory === null
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                  )}
                >
                  Todos
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold",
                    selectedCategory === null ? "bg-white text-red-500" : "bg-red-500 text-white"
                  )} style={{marginTop: '6px'}}>
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
                    // Remover emojis do nome da categoria
                    const categoryNameWithoutEmoji = category.name.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g, '').trim();
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                          selectedCategory === category.id
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                        )}
                      >
                        {categoryNameWithoutEmoji}
                        <span className={cn(
                          "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-semibold",
                          selectedCategory === category.id ? "bg-white text-red-500" : "bg-red-500 text-white"
                        )} style={{marginTop: '6px'}}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
                </div>
              </div>
              {/* Indicador de mais categorias - Setinha fixa na direita (só aparece quando há overflow) */}
              {hasOverflow && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none pr-2">
                  <ChevronsRight className="h-6 w-6 text-red-400 animate-bounce-x" />
                </div>
              )}
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
                      className="bg-card rounded-xl border border-border/50 border-t-4 border-t-red-500 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      {/* Imagem */}
                      <div className="h-28 bg-gradient-to-br from-red-500 to-red-600 relative overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-12 w-12 text-white animate-placeholder-pulse" />
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
                      <div className="p-3 flex flex-col h-[120px]">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                          {product.description || ''}
                        </p>
                        <div className="flex items-center justify-between mt-auto gap-2">
                          <span className="text-red-600 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 xl:px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Adicionar diretamente ao carrinho sem abrir modal
                              addToCart(product, 1, '', []);
                              toast.success(`${product.name} adicionado ao carrinho`);
                            }}
                            disabled={!product.hasStock}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden xl:inline ml-1">Adicionar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Carrinho */}
          <div className="w-96 border-l border-border/50 bg-gray-50 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-4 border-b border-border/50 bg-white">
              <h2 className="text-lg font-bold text-foreground mb-3">Pedido Atual</h2>
              
              {/* Tipo de Pedido */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOrderType("mesa");
                    setPaymentMethod(null);
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-all",
                    orderType === "mesa"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Consumo
                </button>
                <button
                  onClick={() => {
                    setOrderType("retirada");
                    setPaymentMethod(null);
                  }}
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
                  onClick={() => {
                    console.log("[PDV] Clicou em Entrega");
                    setOrderType("entrega");
                    setPaymentMethod(null);
                    setShowDeliverySidebar(true);
                  }}
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

              {/* Indicador de forma de pagamento selecionada (Retirada) */}
              {orderType === "retirada" && paymentMethod && (
                <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500 text-white rounded-lg">
                      {paymentMethod === "cash" && <Banknote className="h-4 w-4" />}
                      {paymentMethod === "card" && <CreditCard className="h-4 w-4" />}
                      {paymentMethod === "pix" && <QrCode className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      {paymentMethod === "cash" && "Dinheiro"}
                      {paymentMethod === "card" && "Cartão"}
                      {paymentMethod === "pix" && "Pix"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPaymentSidebar(true)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Alterar
                  </button>
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
                cart.map((item, index) => {
                  const isExpanded = expandedCartItem === index;
                  const itemTotal = (parseFloat(item.price) + 
                    item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0)
                  ) * item.quantity;
                  
                  return (
                    <div
                      key={`${item.productId}-${index}`}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-200"
                      onMouseEnter={() => setExpandedCartItem(index)}
                      onMouseLeave={() => setExpandedCartItem(null)}
                    >
                      {/* Header - Título e Preço na mesma linha */}
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <h4 className="font-semibold text-sm text-gray-800 truncate">
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            {formatCurrency(itemTotal)}
                          </span>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </div>

                      {/* Dropdown com controles */}
                      <div className={cn(
                        "overflow-hidden transition-all duration-200 ease-in-out",
                        isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                          {/* Complementos */}
                          {item.complements.length > 0 && (
                            <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                              {item.complements.map((comp, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>{comp.quantity}x {comp.name}</span>
                                  <span>+ {formatCurrency(parseFloat(comp.price) * comp.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.observation && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pt-1">
                              Obs: {item.observation}
                            </p>
                          )}

                          {/* Controles de Quantidade e Ações */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(index, -1); }}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(index, 1); }}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCartItem(index, item);
                                }}
                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors ml-2"
                                title="Editar item"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCartItem(index); }}
                              className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
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
                {/* Tipo de Pedido */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {orderType === "mesa" ? "Consumo no local" : orderType === "retirada" ? "Retirar no local" : "Entrega"}
                  </span>
                  <span className="font-medium text-green-600">
                    {orderType === "entrega" && selectedNeighborhoodFee 
                      ? `R$ ${parseFloat(selectedNeighborhoodFee.fee).toFixed(2).replace(".", ",")}`
                      : "Grátis"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-dashed pt-2">
                  <span>Total</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      calculateTotal() + 
                      (orderType === "entrega" && selectedNeighborhoodFee 
                        ? parseFloat(selectedNeighborhoodFee.fee) 
                        : 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                {/* Botão de Cupom */}
                <Button
                  variant="outline"
                  className={cn("px-3", showCouponField && "border-red-500 bg-red-50")}
                  title="Adicionar cupom"
                  onClick={() => setShowCouponField(!showCouponField)}
                >
                  <Ticket className={cn("h-5 w-5", showCouponField ? "text-red-500" : "text-gray-500")} />
                </Button>
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
                  onClick={handleMainButtonClick}
                  disabled={mainButtonConfig.disabled}
                >
                  {mainButtonConfig.icon}
                  {createOrderMutation.isPending ? "Criando..." : mainButtonConfig.text}
                </Button>
              </div>

              {/* Campo de Cupom */}
              {showCouponField && (
                <div className="mt-3 flex gap-2">
                  {appliedCoupon ? (
                    <div className="flex-1 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm">(-{formatCurrency(appliedCoupon.discount)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                          toast.success("Cupom removido");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        variant="outline"
                        className="px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          if (!couponCode.trim()) {
                            toast.error("Digite o código do cupom");
                            return;
                          }
                          // TODO: Validar cupom no backend
                          // Por enquanto, simula aplicação do cupom
                          toast.success(`Cupom ${couponCode} aplicado!`);
                          setAppliedCoupon({ code: couponCode, discount: 5 });
                        }}
                        disabled={!couponCode.trim()}
                      >
                        Aplicar
                      </Button>
                    </>
                  )}
                </div>
              )}
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
            onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
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
                      onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                );
              }
              
              // Se não tem imagem, mostrar placeholder
              return (
                <div className="relative w-full h-[180px] sm:h-48 md:h-56 flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-white/80 animate-placeholder-pulse" />
                  <button 
                    onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              );
            })()}
            
            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                {/* Título e Preço */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  {Number(selectedProduct.price) > 0 && (
                    <p className="text-lg font-semibold text-red-500 mt-1">
                      {formatCurrency(parseFloat(selectedProduct.price))}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                {/* Grupos de Complementos - Estilo Menu Público */}
                {productComplements && productComplements.length > 0 && (
                  <div className="space-y-4">
                    {productComplements.map((group) => {
                      const selectedInGroup = selectedComplements.get(group.id) || new Map<number, number>();
                      const isRadio = group.maxQuantity === 1;
                      
                      return (
                        <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Header do Grupo */}
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200" style={{paddingTop: '8px', height: '58px'}}>
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
                              const itemImageUrl = item.imageUrl;
                              const displayPrice = Number(item.price);
                              
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
                                  if (group.maxQuantity === 0 || totalInGroup < group.maxQuantity) {
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
                                      if (group.maxQuantity === 0 || totalInGroup < group.maxQuantity) {
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
                                    {displayPrice > 0 && (
                                      <span className="text-sm text-gray-600 min-w-[70px] text-right">
                                        {isSelected && itemQuantity > 1 
                                          ? `+ ${formatCurrency(displayPrice * itemQuantity)}` 
                                          : `+ ${formatCurrency(displayPrice)}`
                                        }
                                      </span>
                                    )}
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
            </div>

            {/* Footer - Quantidade e Adicionar */}
            <div className="border-t p-4 bg-white flex items-center gap-4">
              {/* Controle de Quantidade */}
              <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                <button
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{productQuantity}</span>
                <button
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Botão Adicionar */}
              {(() => {
                // Calcular preço total
                let complementsTotal = 0;
                selectedComplements.forEach((groupMap) => {
                  groupMap.forEach((qty, itemId) => {
                    // Encontrar o item nos complementos
                    productComplements?.forEach(group => {
                      const item = group.items.find(i => i.id === itemId);
                      if (item) {
                        complementsTotal += parseFloat(item.price) * qty;
                      }
                    });
                  });
                });
                const totalPrice = (parseFloat(selectedProduct.price) + complementsTotal) * productQuantity;
                
                // Verificar se todos os grupos obrigatórios estão preenchidos
                const requiredGroupsFilled = productComplements?.every(group => {
                  if (!group.isRequired) return true;
                  const groupSelections = selectedComplements.get(group.id);
                  if (!groupSelections) return false;
                  const totalQty = Array.from(groupSelections.values()).reduce((sum, q) => sum + q, 0);
                  return totalQty >= group.minQuantity;
                }) ?? true;
                
                return (
                  <button
                    onClick={() => {
                      // Coletar complementos selecionados
                      const complements: Array<{ id: number; name: string; price: string; quantity: number }> = [];
                      selectedComplements.forEach((groupMap, groupId) => {
                        groupMap.forEach((qty, itemId) => {
                          productComplements?.forEach(group => {
                            if (group.id === groupId) {
                              const item = group.items.find(i => i.id === itemId);
                              if (item) {
                                complements.push({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  quantity: qty
                                });
                              }
                            }
                          });
                        });
                      });
                      
                      if (isEditingMode && editingCartItem) {
                        // Modo de edição: atualizar item existente
                        const newCart = [...cart];
                        newCart[editingCartItem.index] = {
                          ...newCart[editingCartItem.index],
                          quantity: productQuantity,
                          observation: productObservation,
                          complements
                        };
                        setCart(newCart);
                        toast.success("Item atualizado!");
                      } else {
                        // Modo de adição: adicionar novo item
                        addToCart(selectedProduct, productQuantity, productObservation, complements);
                      }
                      
                      setSelectedProduct(null);
                      setSelectedComplementImage(null);
                      setIsEditingMode(false);
                      setEditingCartItem(null);
                    }}
                    disabled={!requiredGroupsFilled}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      requiredGroupsFilled 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isEditingMode ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span className="hidden xs:inline">Atualizar</span>
                        <span>{formatCurrency(totalPrice)}</span>
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

      {/* Modal de Categorias */}
      {showCategoriesModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCategoriesModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Lista de Categorias */}
            <div className="overflow-y-auto max-h-[60vh]">
              {/* Opção Todos */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoriesModal(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30",
                  selectedCategory === null && "bg-red-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium text-foreground">Todos</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {productsList.filter((p) => p.status === 'active').length || 0}
                  </span>
                </div>
                {selectedCategory === null && (
                  <Check className="h-5 w-5 text-red-500" />
                )}
              </button>
              
              {/* Categorias */}
              {sortedCategories.map((category) => {
                const count = productsList.filter(
                  (p) => p.status === 'active' && p.categoryId === category.id
                ).length || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoriesModal(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30",
                      selectedCategory === category.id && "bg-red-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium text-foreground">{category.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    {selectedCategory === category.id && (
                      <Check className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar de Entrega usando Sheet do shadcn/ui */}
      <Sheet open={showDeliverySidebar} onOpenChange={setShowDeliverySidebar}>
        <SheetContent side="right" className="w-[437px] sm:max-w-[437px] p-0 flex flex-col" hideCloseButton>
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Dados da Entrega</h2>
                  <p className="text-sm text-white/80">Preencha os dados para entrega</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeliverySidebar(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo - Formulário de Entrega */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Se for entrega por bairro e ainda não selecionou bairro, mostra apenas seleção de bairro */}
            {establishment?.deliveryFeeType === "byNeighborhood" && !selectedNeighborhoodFee ? (
              // Tela de seleção de bairro ocupando toda a sidebar
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <MapPin className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Selecione o Bairro</h3>
                  <p className="text-sm text-gray-500 mt-1">Escolha o bairro para calcular a taxa de entrega</p>
                </div>
                
                <div className="space-y-2">
                  {neighborhoodFees && neighborhoodFees.length > 0 ? (
                    neighborhoodFees.map((fee) => (
                      <button
                        key={fee.id}
                        onClick={() => {
                          setSelectedNeighborhoodFee(fee);
                          setDeliveryAddress({...deliveryAddress, neighborhood: fee.neighborhood});
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          </div>
                          <span className="font-medium text-gray-700 text-base">{fee.neighborhood}</span>
                        </div>
                        <span className="font-bold text-red-500 text-base">
                          R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhum bairro cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Formulário completo de entrega (após selecionar bairro ou quando não é por bairro)
              <>
            {/* Seção de Endereço */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Endereço de Entrega</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Rua / Avenida *</label>
                  <Input
                    placeholder="Ex: Rua das Flores"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                    className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
                
                {/* Bairro - linha única com ícone, "Entrega", taxa e "Alterar" */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Bairro *</label>
                  {establishment?.deliveryFeeType === "byNeighborhood" ? (
                    // Botão para alterar bairro selecionado - layout em linha única
                    <button
                      onClick={() => setSelectedNeighborhoodFee(null)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-red-200 bg-red-50/50 hover:border-red-300 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-gray-800">Entrega</span>
                        <span className="font-semibold text-green-600">
                          R$ {selectedNeighborhoodFee ? parseFloat(selectedNeighborhoodFee.fee).toFixed(2).replace(".", ",") : "0,00"}
                        </span>
                      </div>
                      <span className="text-sm text-red-500 font-medium flex-shrink-0">Alterar</span>
                    </button>
                  ) : (
                    // Campo de texto normal quando não é entrega por bairro
                    <Input
                      placeholder="Centro"
                      value={deliveryAddress.neighborhood}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                      className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    />
                  )}
                </div>
                
                {/* Número (20%) e Complemento (80%) na mesma linha */}
                <div className="flex gap-3">
                  <div className="w-[20%]">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Número *</label>
                    <Input
                      placeholder="123"
                      value={deliveryAddress.number}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, number: e.target.value})}
                      className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                  <div className="w-[80%]">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Complemento</label>
                    <Input
                      placeholder="Apto, Bloco, Casa..."
                      value={deliveryAddress.complement}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                      className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ponto de Referência</label>
                  <Input
                    placeholder="Próximo ao mercado..."
                    value={deliveryAddress.reference}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, reference: e.target.value})}
                    className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200" />

            {/* Seção de Pagamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <CreditCard className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Forma de Pagamento</h3>
              </div>
              
              <div className="space-y-2">
                {/* Dinheiro */}
                {establishment?.acceptsCash && (
                  <>
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        paymentMethod === "cash"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "cash" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                      )}>
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "font-medium",
                          paymentMethod === "cash" ? "text-red-700" : "text-gray-700"
                        )}>Dinheiro</p>
                        <p className="text-xs text-gray-500">Pagamento na entrega</p>
                      </div>
                      {paymentMethod === "cash" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Campo de Troco - aparece quando dinheiro está selecionado */}
                    {paymentMethod === "cash" && (
                      <div className="ml-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Troco para quanto?</label>
                        <Input
                          type="text"
                          placeholder="Ex: R$ 50,00"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(e.target.value)}
                          className="border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deixe em branco se não precisar de troco</p>
                      </div>
                    )}
                  </>
                )}

                {/* Cartão */}
                {establishment?.acceptsCard && (
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                      paymentMethod === "card"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      paymentMethod === "card" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                    )}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={cn(
                        "font-medium",
                        paymentMethod === "card" ? "text-red-700" : "text-gray-700"
                      )}>Cartão</p>
                      <p className="text-xs text-gray-500">Débito ou Crédito na entrega</p>
                    </div>
                    {paymentMethod === "card" && (
                      <Check className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                )}

                {/* Pix */}
                {establishment?.acceptsPix && (
                  <>
                    <button
                      onClick={() => setPaymentMethod("pix")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        paymentMethod === "pix"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "pix" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                      )}>
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "font-medium",
                          paymentMethod === "pix" ? "text-red-700" : "text-gray-700"
                        )}>Pix</p>
                        <p className="text-xs text-gray-500">Pagamento instantâneo</p>
                      </div>
                      {paymentMethod === "pix" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Chave Pix - aparece quando pix está selecionado */}
                    {paymentMethod === "pix" && establishment?.pixKey && (
                      <div className="ml-4 p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700">Chave Pix</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(establishment.pixKey || "");
                              toast.success("Chave Pix copiada!");
                            }}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar
                          </button>
                        </div>
                        <p className="text-sm text-green-800 font-mono bg-white px-3 py-2 rounded-lg border border-green-200">
                          {establishment.pixKey}
                        </p>
                        <p className="text-xs text-green-600 mt-2">Envie o comprovante ao entregador</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-gray-50">
            <Button
              onClick={() => setShowDeliverySidebar(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
              disabled={!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirmar Dados
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Campos com * são obrigatórios
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar de Pagamento (para Retirada) */}
      <Sheet open={showPaymentSidebar} onOpenChange={setShowPaymentSidebar}>
        <SheetContent side="right" className="w-[437px] sm:max-w-[437px] p-0 flex flex-col" hideCloseButton>
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Forma de Pagamento</h2>
                  <p className="text-sm text-white/80">Selecione como o cliente vai pagar</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentSidebar(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo - Formas de Pagamento */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <CreditCard className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Selecione o Pagamento</h3>
              <p className="text-sm text-gray-500 mt-1">Escolha a forma de pagamento do cliente</p>
            </div>

            <div className="space-y-3">
              {availablePaymentMethods.length > 0 ? (
                availablePaymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectPaymentMethod(method.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50 transition-all"
                  >
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                      {method.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800 text-base">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma forma de pagamento configurada</p>
                  <p className="text-sm text-gray-400 mt-1">Configure as formas de pagamento nas configurações</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => setShowPaymentSidebar(false)}
              className="w-full py-3"
            >
              Cancelar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
    </AdminLayout>
  );
}
