import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { getThumbUrl } from "../../../shared/imageUtils";
import { BlurImage } from "@/components/BlurImage";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike, 
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
  Wallet,
  DollarSign,
  Star,
  Undo2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Tipos
type OrderType = "mesa" | "retirada" | "entrega";
type PaymentMethodType = "cash" | "card" | "pix" | null;

// Função helper para calcular preço do complemento baseado no contexto (PDV)
function getComplementPricePDV(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean },
  orderType: OrderType
): number {
  const deliveryTypeMap: Record<OrderType, 'delivery' | 'pickup' | 'dine_in'> = {
    mesa: 'dine_in', retirada: 'pickup', entrega: 'delivery'
  };
  const ctx = deliveryTypeMap[orderType];
  if (item.priceMode === 'free') {
    if (ctx === 'delivery' && item.freeOnDelivery) return 0;
    if (ctx === 'pickup' && item.freeOnPickup) return 0;
    if (ctx === 'dine_in' && item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
}

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
  stockQuantity: number | null;
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
    
    if (printMethod === 'automatic') {
      // Impressão automática via Mindi Printer - não faz nada no frontend
      return;
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
      
      // Salvar/atualizar dados do cliente PDV
      if (establishmentId) {
        const phone = orderType === "retirada" 
          ? pickupClientPhone.replace(/\D/g, "") 
          : deliveryAddress.phone.replace(/\D/g, "");
        const name = orderType === "retirada" ? pickupClientName : deliveryAddress.name;
        
        if (phone && phone.length >= 8) {
          pdvCustomerUpsertMutation.mutate({
            establishmentId,
            phone,
            name: name || undefined,
            ...(orderType === "entrega" ? {
              street: deliveryAddress.street || undefined,
              number: deliveryAddress.number || undefined,
              complement: deliveryAddress.complement || undefined,
              neighborhood: deliveryAddress.neighborhood || undefined,
              reference: deliveryAddress.reference || undefined,
            } : {}),
          });
        }
      }
      
      // Imprimir pedido automaticamente usando o método favorito
      if (data.id) {
        handlePrintWithFavoriteMethod(data.id);
      }
      
      clearCart();
      // Manter na página do PDV para continuar atendendo
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido", {
        description: error.message,
      });
    },
  });

  // Estados
  const [orderType, setOrderType] = useState<OrderType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pdv_orderType');
      if (saved === 'mesa' || saved === 'retirada' || saved === 'entrega') return saved;
    }
    return "mesa";
  });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_cart');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  // Campo de mesa removido - agora usamos a página de Mesas
  // Map<groupId, Map<itemId, quantity>>
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<{index: number; item: CartItem} | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Estados para entrega
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_deliveryAddress');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return { name: "", phone: "", street: "", number: "", neighborhood: "", complement: "", reference: "" };
  });

  // PDV Customer - busca automática por telefone
  const [pdvCustomerFound, setPdvCustomerFound] = useState(false);
  const pdvCustomerUpsertMutation = trpc.pdvCustomer.upsert.useMutation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pdv_paymentMethod');
      if (saved === 'cash' || saved === 'card' || saved === 'pix') return saved;
    }
    return "cash";
  });
  const [changeAmount, setChangeAmount] = useState("");
  const [showDeliverySidebar, setShowDeliverySidebar] = useState(false);
  const [showNeighborhoodSelector, setShowNeighborhoodSelector] = useState(false);
  const [selectedNeighborhoodFee, setSelectedNeighborhoodFee] = useState<{id: number; neighborhood: string; fee: string} | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pdv_neighborhoodFee');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  // Estados para sidebar de pagamento (Retirada)
  const [showPaymentSidebar, setShowPaymentSidebar] = useState(false);
  const [selectedPaymentInSidebar, setSelectedPaymentInSidebar] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdv_favorite_payment_method');
      return (saved as PaymentMethodType) || "cash";
    }
    return "cash";
  });
  const [receivedAmount, setReceivedAmount] = useState("");
  const [pickupClientName, setPickupClientName] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('pdv_pickupName') || "";
    return "";
  });
  const [pickupClientPhone, setPickupClientPhone] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('pdv_pickupPhone') || "";
    return "";
  });
  
  // Estado para forma de pagamento favorita (salva no localStorage)
  const [favoritePaymentMethod, setFavoritePaymentMethod] = useState<PaymentMethodType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdv_favorite_payment_method');
      return (saved as PaymentMethodType) || null;
    }
    return null;
  });
  
  // Função para definir forma de pagamento favorita
  const handleSetFavoritePayment = (method: PaymentMethodType) => {
    if (favoritePaymentMethod === method) {
      // Se já é favorito, remove
      setFavoritePaymentMethod(null);
      localStorage.removeItem('pdv_favorite_payment_method');
      toast.success('Favorito removido');
    } else {
      // Define como favorito
      setFavoritePaymentMethod(method);
      if (method) {
        localStorage.setItem('pdv_favorite_payment_method', method);
        toast.success('Forma de pagamento favorita definida!');
      }
    }
  };

  // Estados para cupom
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number; couponId: number} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Persistir carrinho no sessionStorage para não perder ao navegar
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_cart', JSON.stringify(cart));
    } catch (e) { /* ignore */ }
  }, [cart]);

  // Persistir tipo de pedido no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_orderType', orderType);
  }, [orderType]);

  // Persistir dados de entrega no sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_deliveryAddress', JSON.stringify(deliveryAddress));
    } catch (e) { /* ignore */ }
  }, [deliveryAddress]);

  // Persistir dados de retirada no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_pickupName', pickupClientName);
  }, [pickupClientName]);
  useEffect(() => {
    sessionStorage.setItem('pdv_pickupPhone', pickupClientPhone);
  }, [pickupClientPhone]);

  // Persistir forma de pagamento no sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pdv_paymentMethod', paymentMethod || '');
  }, [paymentMethod]);

  // Persistir taxa de bairro selecionada no sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('pdv_neighborhoodFee', selectedNeighborhoodFee ? JSON.stringify(selectedNeighborhoodFee) : '');
    } catch (e) { /* ignore */ }
  }, [selectedNeighborhoodFee]);

  // Estados para limpar/desfazer
  const [clearedCart, setClearedCart] = useState<CartItem[] | null>(null);
  
  // Estado para modal de conferência do pedido
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isClosingOrder, setIsClosingOrder] = useState(false);

  // Query para buscar taxas por bairro
  const { data: neighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId && establishment?.deliveryFeeType === "byNeighborhood" }
  );

  // Debug: Monitorar mudanças no estado showDeliverySidebar
  useEffect(() => {
    console.log("[PDV] showDeliverySidebar changed to:", showDeliverySidebar);
  }, [showDeliverySidebar]);

  // Busca automática de cliente PDV por telefone (Entrega)
  const deliveryPhoneDigits = deliveryAddress.phone.replace(/\D/g, "");
  const { data: deliveryCustomer } = trpc.pdvCustomer.findByPhone.useQuery(
    { establishmentId: establishmentId!, phone: deliveryPhoneDigits },
    { enabled: !!establishmentId && deliveryPhoneDigits.length >= 10 && deliveryPhoneDigits.length <= 11 }
  );

  // Busca automática de cliente PDV por telefone (Retirada)
  const pickupPhoneDigits = pickupClientPhone.replace(/\D/g, "");
  const { data: pickupCustomer } = trpc.pdvCustomer.findByPhone.useQuery(
    { establishmentId: establishmentId!, phone: pickupPhoneDigits },
    { enabled: !!establishmentId && pickupPhoneDigits.length >= 10 && pickupPhoneDigits.length <= 11 }
  );

  // Preencher dados do cliente automaticamente (Entrega)
  useEffect(() => {
    if (deliveryCustomer && deliveryPhoneDigits.length >= 10) {
      setPdvCustomerFound(true);
      setDeliveryAddress((prev: { name: string; phone: string; street: string; number: string; neighborhood: string; complement: string; reference: string }) => ({
        ...prev,
        name: prev.name || deliveryCustomer.name || "",
        street: prev.street || deliveryCustomer.street || "",
        number: prev.number || deliveryCustomer.number || "",
        complement: prev.complement || deliveryCustomer.complement || "",
        neighborhood: prev.neighborhood || deliveryCustomer.neighborhood || "",
        reference: prev.reference || deliveryCustomer.reference || "",
      }));
      toast.success("Cliente encontrado!", { description: deliveryCustomer.name || "Dados preenchidos automaticamente", duration: 2000 });
    }
  }, [deliveryCustomer]);

  // Preencher dados do cliente automaticamente (Retirada)
  useEffect(() => {
    if (pickupCustomer && pickupPhoneDigits.length >= 10) {
      setPdvCustomerFound(true);
      if (!pickupClientName && pickupCustomer.name) {
        setPickupClientName(pickupCustomer.name);
      }
      toast.success("Cliente encontrado!", { description: pickupCustomer.name || "Dados preenchidos automaticamente", duration: 2000 });
    }
  }, [pickupCustomer]);

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
  // Normalizar texto removendo acentos para busca
  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredProducts = productsList.filter((product) => {
    if (product.status !== 'active') return false;
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const query = normalizeText(searchQuery);
      return (
        normalizeText(product.name).includes(query) ||
        (product.description ? normalizeText(product.description).includes(query) : false)
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
    // Salvar itens atuais para possível desfazer
    if (cart.length > 0) {
      setClearedCart([...cart]);
    }
    setCart([]);
    setPaymentMethod(null);
    setDeliveryAddress({
      name: "",
      phone: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      reference: ""
    });
    setSelectedNeighborhoodFee(null);
    setChangeAmount("");
    // Limpar dados de retirada
    setPickupClientName("");
    setPickupClientPhone("");
    // Limpar estado de cliente PDV encontrado
    setPdvCustomerFound(false);
    // Limpar cupom
    setShowCouponField(false);
    setCouponCode("");
    setAppliedCoupon(null);
  };

  // Função para desfazer a limpeza
  const undoClearCart = () => {
    if (clearedCart) {
      setCart(clearedCart);
      setClearedCart(null);
      toast.success("Itens restaurados!");
    }
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

    // Para Mesa (Consumo): se não tem forma de pagamento, abre sidebar de pagamento
    if (orderType === "mesa" && !paymentMethod) {
      setShowPaymentSidebar(true);
      return;
    }

    // Para Retirada: se não tem forma de pagamento, abre sidebar de pagamento
    if (orderType === "retirada" && !paymentMethod) {
      setShowPaymentSidebar(true);
      return;
    }

    // Para Entrega: verificar endereço
    if (orderType === "entrega" && (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood)) {
      toast.error("Preencha os dados de entrega");
      setShowDeliverySidebar(true);
      return;
    }

    // Abrir modal de conferência do pedido
    setShowConfirmationModal(true);
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
    const discount = appliedCoupon?.discount || 0;
    const total = subtotal + deliveryFee - discount;

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
    }

    // Calcular o valor do troco para exibir no recibo
    // changeAmount contém o valor que o cliente vai pagar (ex: "50,00")
    // receivedAmount contém o valor recebido no sidebar de entrega
    const changeValue = changeAmount || receivedAmount;
    
    createOrderMutation.mutate({
      establishmentId,
      orderNumber,
      customerName: orderType === "retirada" ? (pickupClientName || "Cliente PDV") : (deliveryAddress.name || "Cliente PDV"),
      customerPhone: orderType === "retirada" ? (pickupClientPhone.replace(/\D/g, "") || "") : (deliveryAddress.phone || ""),
      customerAddress,
      deliveryType: deliveryTypeMap[orderType],
      paymentMethod: paymentMethod || "cash",
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      discount: discount.toFixed(2),
      couponCode: appliedCoupon?.code || undefined,
      couponId: appliedCoupon?.couponId || undefined,
      total: Math.max(0, total).toFixed(2),
      // Enviar o valor do troco quando pagamento for em dinheiro
      changeAmount: paymentMethod === "cash" && changeValue ? changeValue.replace(",", ".") : undefined,
      notes: undefined,
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
    // Para Mesa (Consumo): se não tem forma de pagamento, mostrar botão Pagamento
    if (orderType === "mesa" && !paymentMethod) {
      return {
        text: "Pagamento",
        icon: <Wallet className="h-5 w-5 mr-2" />,
        disabled: cart.length === 0
      };
    }
    // Para Retirada: se não tem forma de pagamento, mostrar botão Pagamento
    if (orderType === "retirada" && !paymentMethod) {
      return {
        text: "Pagamento",
        icon: <Wallet className="h-5 w-5 mr-2" />,
        disabled: cart.length === 0
      };
    }
    // Para Entrega: mostrar botão Avançar
    if (orderType === "entrega") {
      return {
        text: "Avançar",
        icon: null,
        disabled: cart.length === 0 || createOrderMutation.isPending
      };
    }
    // Após selecionar pagamento: mostrar Finalizar Pedido
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

  // Adicionar item rapidamente (botão +): se não tem complementos, adiciona direto
  const trpcUtils = trpc.useUtils();
  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) return;
    
    try {
      const complements = await trpcUtils.publicMenu.getProductComplements.fetch({ productId: product.id });
      const hasComps = complements && complements.length > 0;
      
      if (hasComps) {
        handleProductClick(product);
      } else {
        addToCart(product, 1, '', []);
        toast.success(`${product.name} adicionado!`);
      }
    } catch {
      handleProductClick(product);
    }
  };

  // Handler para abrir modal de produto
  const handleProductClick = (product: Product) => {
    // Produto indisponível apenas quando tem controle de estoque ativo E quantidade = 0
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) return;
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
        description: "Em espécie",
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
        description: "Instantâneo",
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
                          <BlurImage
                            src={product.images[0]}
                            blurDataUrl={(product as any).blurPlaceholder}
                            alt={product.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            responsive
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-12 w-12 text-white animate-placeholder-pulse" />
                          </div>
                        )}
                        {product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0) && (
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
                            className="h-8 px-2 xl:px-3 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                            onClick={(e) => handleQuickAdd(product, e)}
                            disabled={product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)}
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
          <div className="w-96 border-l border-border/50 bg-muted/30 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-4 border-b border-border/50 bg-card">
              {/* Tipo de Pedido - Pill selector com sliding animation */}
              <div className="relative flex items-center bg-muted rounded-xl p-1">
                {/* Sliding pill indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-red-500 shadow-sm transition-all duration-300 ease-in-out"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    left: orderType === "mesa"
                      ? '4px'
                      : orderType === "retirada"
                        ? 'calc((100% - 8px) / 3 + 4px)'
                        : 'calc(2 * (100% - 8px) / 3 + 4px)',
                  }}
                />
                <button
                  onClick={() => {
                    setOrderType("mesa");
                    setPaymentMethod(null);
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300",
                    orderType === "mesa"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Consumo
                </button>
                <button
                  onClick={() => {
                    setOrderType("retirada");
                    setPaymentMethod(null);
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300",
                    orderType === "retirada"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
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
                    "relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300",
                    orderType === "entrega"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Entrega
                </button>
              </div>


              {/* Campo de Mesa removido - agora usamos a página de Mesas */}

              {/* Indicador de forma de pagamento selecionada (Mesa ou Retirada) */}
              {(orderType === "mesa" || orderType === "retirada") && paymentMethod && (
                 <div className="mt-3 flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
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
                      className="bg-card rounded-xl border border-border shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-200"
                      onMouseEnter={() => setExpandedCartItem(index)}
                      onMouseLeave={() => setExpandedCartItem(null)}
                    >
                      {/* Header - Título e Preço na mesma linha */}
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">
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
                        <div className="px-3 pb-3 space-y-2 border-t border-border/50">
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
                                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(index, 1); }}
                                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCartItem(index, item);
                                }}
                                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors ml-2"
                                title="Editar item"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCartItem(index); }}
                              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 flex items-center justify-center transition-colors"
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
            <div className="border-t border-border/50 bg-card p-4 space-y-4 shrink-0">
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
                {/* Desconto do Cupom */}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto ({appliedCoupon.code})</span>
                    <span className="font-medium text-green-600">-{formatCurrency(appliedCoupon.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-dashed pt-2">
                  <span>Total</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      Math.max(0, calculateTotal() + 
                      (orderType === "entrega" && selectedNeighborhoodFee 
                        ? parseFloat(selectedNeighborhoodFee.fee) 
                        : 0) -
                      (appliedCoupon?.discount || 0))
                    )}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                {/* Botão de Cupom */}
                <Button
                  variant="outline"
                  className={cn("px-3", showCouponField && "border-red-500 bg-red-50 dark:bg-red-950/30")}
                  title="Adicionar cupom"
                  onClick={() => setShowCouponField(!showCouponField)}
                >
                  <Ticket className={cn("h-5 w-5", showCouponField ? "text-red-500" : "text-gray-500")} />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearedCart ? undoClearCart : clearCart}
                  disabled={cart.length === 0 && !clearedCart}
                >
                  {clearedCart ? (
                    <>
                      <Undo2 className="h-4 w-4 mr-1" />
                      Desfazer
                    </>
                  ) : (
                    "Limpar"
                  )}
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
                     <div className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm">(-{formatCurrency(appliedCoupon.discount)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                        className="px-6 rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
                        onClick={async () => {
                          if (!couponCode.trim()) {
                            toast.error("Digite o código do cupom");
                            return;
                          }
                          if (!establishmentId) {
                            toast.error("Estabelecimento não encontrado");
                            return;
                          }
                          
                          setIsValidatingCoupon(true);
                          try {
                            // Determinar o tipo de entrega para validação
                            const deliveryTypeMap: Record<OrderType, "delivery" | "pickup" | "self_service"> = {
                              mesa: "self_service",
                              retirada: "pickup",
                              entrega: "delivery"
                            };
                            
                            const response = await fetch(`/api/trpc/coupon.validate?input=${encodeURIComponent(JSON.stringify({
                              json: {
                                establishmentId,
                                code: couponCode.toUpperCase(),
                                orderValue: calculateTotal(),
                                deliveryType: deliveryTypeMap[orderType]
                              }
                            }))}`).then(res => res.json());
                            
                            const result = response.result?.data?.json || response.result?.data;
                            
                            if (result?.valid && result?.coupon) {
                              toast.success(`Cupom ${couponCode} aplicado!`);
                              setAppliedCoupon({ 
                                code: couponCode.toUpperCase(), 
                                discount: result.discount,
                                couponId: result.coupon.id
                              });
                            } else {
                              toast.error(result?.error || "Cupom inválido");
                            }
                          } catch (error) {
                            console.error("Erro ao validar cupom:", error);
                            toast.error("Erro ao validar cupom");
                          } finally {
                            setIsValidatingCoupon(false);
                          }
                        }}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                      >
                        {isValidatingCoupon ? "Validando..." : "Aplicar"}
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
          <div className="relative bg-card rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300" style={{ touchAction: 'pan-y' }}>
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
                      className="absolute top-3 right-3 p-2 bg-card/90 hover:bg-card rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-5 w-5 text-foreground" />
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
                    className="absolute top-3 right-3 p-2 bg-card/90 hover:bg-card rounded-full shadow-lg transition-colors z-10"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>
              );
            })()}
            
            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                {/* Título e Preço */}
                <div>
                   <h3 className="text-xl font-bold text-foreground">{selectedProduct.name}</h3>
                  {Number(selectedProduct.price) > 0 && (
                    <p className="text-lg font-semibold text-red-500 mt-1">
                      {formatCurrency(parseFloat(selectedProduct.price))}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                {selectedProduct.description && (
                   <p className="text-sm text-muted-foreground leading-relaxed">
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
                        <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                          {/* Header do Grupo */}
                          <div className="bg-muted/50 px-4 py-3 border-b border-border" style={{paddingTop: '8px', height: '58px'}}>
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-foreground">{group.name}</h4>
                              {group.isRequired && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                  Obrigatório
                                </span>
                              )}
                            </div>
                             <p className="text-xs text-muted-foreground mt-0.5">
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
                              const displayPrice = getComplementPricePDV(item, orderType);
                              
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
                                     isSelected ? 'bg-red-50 dark:bg-red-950/30' : 'hover:bg-muted/50'
                                   }`}
                                >
                                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                                    <input
                                      type={isRadio ? 'radio' : 'checkbox'}
                                      name={`group-${group.id}`}
                                      checked={isSelected}
                                      onChange={handleToggle}
                                      className="w-4 h-4 text-red-500 border-border focus:ring-red-500"
                                    />
                                     <span className="text-sm text-foreground">{item.name}</span>
                                  </label>
                                  
                                  <div className="flex items-center gap-3">
                                    {/* Controles de quantidade - aparecem quando selecionado */}
                                    {isSelected && !isRadio && (
                                       <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-1">
                                        <button
                                          type="button"
                                          onClick={handleDecrement}
                                          className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                         <span className="w-6 text-center text-sm font-medium text-foreground">{itemQuantity}</span>
                                        <button
                                          type="button"
                                          onClick={handleIncrement}
                                          className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Preço */}
                                    {displayPrice > 0 && (
                                       <span className="text-sm text-muted-foreground min-w-[70px] text-right">
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
                   <label className="block text-sm font-medium text-foreground mb-2">
                    Observações
                  </label>
                  <textarea
                    value={productObservation}
                    onChange={(e) => setProductObservation(e.target.value)}
                    placeholder="Ex: Sem cebola, bem passado..."
                    rows={2}
                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer - Quantidade e Adicionar */}
            <div className="border-t border-border p-4 bg-card flex items-center gap-4">
              {/* Controle de Quantidade */}
              <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                <button
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{productQuantity}</span>
                <button
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
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
                        complementsTotal += getComplementPricePDV(item, orderType) * qty;
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
                                  price: String(getComplementPricePDV(item, orderType)),
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
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
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
            className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
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
                  selectedCategory === null && "bg-red-50 dark:bg-red-950/30"
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
                      selectedCategory === category.id && "bg-red-50 dark:bg-red-950/30"
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
        <SheetContent side="right" className="w-[371px] sm:max-w-[371px] p-0 flex flex-col" hideCloseButton>
          <SheetTitle className="sr-only">Dados da Entrega</SheetTitle>
          <SheetDescription className="sr-only">Preencha os dados para entrega</SheetDescription>
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bike className="h-5 w-5 text-white" />
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
            {/* Se for entrega por bairro e ainda não selecionou bairro, mostra apenas seleção de bairro */}
            {establishment?.deliveryFeeType === "byNeighborhood" && !selectedNeighborhoodFee ? (
              // Tela de seleção de bairro ocupando toda a sidebar
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <MapPin className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Selecione o Bairro</h3>
                  <p className="text-sm text-muted-foreground mt-1">Escolha o bairro para calcular a taxa de entrega</p>
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
                        className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center">
                          </div>
                          <span className="font-medium text-foreground text-base">{fee.neighborhood}</span>
                        </div>
                        <span className="font-bold text-red-500 text-base">
                          R$ {parseFloat(fee.fee).toFixed(2).replace(".", ",")}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum bairro cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Formulário completo de entrega (após selecionar bairro ou quando não é por bairro)
              <>
            {/* Seção de Dados do Cliente */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Dados do Cliente
              </h3>
              <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nome <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, name: e.target.value})}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={deliveryAddress.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      let value = "";
                      if (digits.length === 0) {
                        value = "";
                      } else if (digits.length <= 2) {
                        value = `(${digits}`;
                      } else if (digits.length <= 3) {
                        value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                      } else if (digits.length <= 7) {
                        value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                      } else {
                        value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                      }
                      setDeliveryAddress({...deliveryAddress, phone: value});
                    }}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção de Endereço */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Endereço de Entrega
              </h3>
              
              {/* Botão de Entrega com taxa - estilo igual ao menu público */}
              {establishment?.deliveryFeeType === "byNeighborhood" && selectedNeighborhoodFee && (
                <div className="mb-3">
                  <button
                    onClick={() => setSelectedNeighborhoodFee(null)}
                    className="w-full flex items-center justify-between p-4 border-2 border-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Bike className="h-5 w-5 text-red-500" />
                      <div>
                        <span className="font-medium text-foreground">Entrega</span>
                        <span className="ml-2 text-sm text-green-600 font-medium">
                          R$ {parseFloat(selectedNeighborhoodFee.fee).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                    <span className="text-red-500 text-sm font-medium">Alterar</span>
                  </button>
                </div>
              )}
              
              <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rua <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Nome da rua"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Número <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="Nº"
                      value={deliveryAddress.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setDeliveryAddress({...deliveryAddress, number: value});
                      }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bairro <span className="text-red-500">*</span></label>
                  {establishment?.deliveryFeeType === "byNeighborhood" && selectedNeighborhoodFee ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-muted/50 text-foreground">
                        {selectedNeighborhoodFee.neighborhood}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedNeighborhoodFee(null)}
                        className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nome do bairro"
                      value={deliveryAddress.neighborhood}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Complemento</label>
                  <input
                    type="text"
                    placeholder="Apto, bloco, etc."
                    value={deliveryAddress.complement}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Ponto de referência</label>
                  <input
                    type="text"
                    placeholder="Próximo a..."
                    value={deliveryAddress.reference}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, reference: e.target.value})}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-border" />

            {/* Seção de Pagamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground">
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
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "cash" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            paymentMethod === "cash" ? "text-red-700 dark:text-red-400" : "text-foreground"
                          )}>Dinheiro</p>
                          {favoritePaymentMethod === "cash" && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Pagamento na entrega</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment("cash");
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all hover:scale-110",
                          favoritePaymentMethod === "cash"
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === "cash" ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === "cash" && "fill-current")} />
                      </button>
                      {paymentMethod === "cash" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Campo de Troco - aparece quando dinheiro está selecionado */}
                    {paymentMethod === "cash" && (
                      <div className="ml-4 p-3 bg-muted/50 rounded-xl border border-border">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Troco para quanto?</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={changeAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Remove tudo que não é número
                              const numbers = value.replace(/\D/g, '');
                              // Converte para centavos e depois para reais
                              const cents = parseInt(numbers || '0', 10);
                              const reais = cents / 100;
                              // Formata com 2 casas decimais
                              const formatted = reais.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              setChangeAmount(formatted === '0,00' ? '' : formatted);
                            }}
                            className="pl-10 border-border focus:border-red-500 focus:ring-red-500/20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Deixe em branco se não precisar de troco</p>
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
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      paymentMethod === "card" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium",
                          paymentMethod === "card" ? "text-red-700 dark:text-red-400" : "text-foreground"
                        )}>Cartão</p>
                        {favoritePaymentMethod === "card" && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Débito ou Crédito na entrega</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetFavoritePayment("card");
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-all hover:scale-110",
                        favoritePaymentMethod === "card"
                          ? "text-amber-500"
                          : "text-gray-300 hover:text-amber-400"
                      )}
                      title={favoritePaymentMethod === "card" ? "Remover favorito" : "Marcar como favorito"}
                    >
                      <Star className={cn("h-5 w-5", favoritePaymentMethod === "card" && "fill-current")} />
                    </button>
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
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === "pix" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            paymentMethod === "pix" ? "text-red-700 dark:text-red-400" : "text-foreground"
                          )}>Pix</p>
                          {favoritePaymentMethod === "pix" && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Instantâneo</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment("pix");
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all hover:scale-110",
                          favoritePaymentMethod === "pix"
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === "pix" ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === "pix" && "fill-current")} />
                      </button>
                      {paymentMethod === "pix" && (
                        <Check className="h-5 w-5 text-red-500" />
                      )}
                    </button>

                    {/* Chave Pix - aparece quando pix está selecionado */}
                    {paymentMethod === "pix" && establishment?.pixKey && (
                      <div className="ml-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
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
                        <p className="text-sm text-green-800 dark:text-green-300 font-mono bg-card px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
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
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <Button
              onClick={() => setShowDeliverySidebar(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
              disabled={!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood || !paymentMethod}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirmar Dados
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Campos com * são obrigatórios
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar de Pagamento (para Retirada) */}
      <Sheet open={showPaymentSidebar} onOpenChange={(open) => {
        setShowPaymentSidebar(open);
        if (open) {
          // Ao abrir, pré-seleciona o favorito ou dinheiro como padrão
          setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
        } else {
          // Ao fechar, reseta para o favorito ou dinheiro
          setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
          setReceivedAmount("");
        }
      }}>
        <SheetContent side="right" className="w-[371px] sm:max-w-[371px] p-0 flex flex-col" hideCloseButton>
          <SheetTitle className="sr-only">Forma de Pagamento</SheetTitle>
          <SheetDescription className="sr-only">Selecione como o cliente vai pagar</SheetDescription>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
            {/* Dados do Cliente (Retirada) */}
            {orderType === "retirada" && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-red-500" />
                  Dados do Cliente
                </h3>
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Nome do cliente"
                      value={pickupClientName}
                      onChange={(e) => setPickupClientName(e.target.value)}
                      className="w-full bg-background border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Telefone</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="(00) 00000-0000"
                      value={pickupClientPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let value = "";
                        if (digits.length === 0) {
                          value = "";
                        } else if (digits.length <= 2) {
                          value = `(${digits}`;
                        } else if (digits.length <= 3) {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        } else if (digits.length <= 7) {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                        } else {
                          value = `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                        }
                        setPickupClientPhone(value);
                      }}
                      className="w-full bg-background border-border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Título da seção */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-500" />
                Formas de Pagamento
              </h3>
              <p className="text-xs text-muted-foreground">Selecione como o cliente vai pagar</p>
            </div>

            <div className="space-y-3">
              {availablePaymentMethods.length > 0 ? (
                availablePaymentMethods.map((method) => (
                  <div key={method.id}>
                    <button
                      onClick={() => {
                        if (method.id === "cash") {
                          setSelectedPaymentInSidebar(selectedPaymentInSidebar === "cash" ? null : "cash");
                          setReceivedAmount("");
                        } else {
                          handleSelectPaymentMethod(method.id);
                        }
                      }}
                      style={{ height: '67px', marginBottom: '8px' }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                        selectedPaymentInSidebar === method.id
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-border bg-card hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl",
                        selectedPaymentInSidebar === method.id
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {method.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-semibold text-base",
                            selectedPaymentInSidebar === method.id ? "text-red-700 dark:text-red-400" : "text-foreground"
                          )}>{method.name}</p>
                          {favoritePaymentMethod === method.id && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Favorito</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFavoritePayment(method.id);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all hover:scale-110",
                          favoritePaymentMethod === method.id
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-amber-400"
                        )}
                        title={favoritePaymentMethod === method.id ? "Remover favorito" : "Marcar como favorito"}
                      >
                        <Star className={cn("h-5 w-5", favoritePaymentMethod === method.id && "fill-current")} />
                      </button>
                      {selectedPaymentInSidebar === method.id ? (
                        <Check className="h-5 w-5 text-red-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Campos de Troco - apenas para Dinheiro */}
                    {method.id === "cash" && selectedPaymentInSidebar === "cash" && (
                      <div className="mt-4 ml-2 space-y-3">
                        {/* Pergunta sobre valor recebido */}
                        <p className="text-sm text-muted-foreground">Qual valor recebido?</p>
                        
                        {/* Campo Valor Recebido */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            value={receivedAmount}
                            onChange={(e) => {
                              // Remove tudo que não é número
                              const onlyNumbers = e.target.value.replace(/\D/g, "");
                              
                              // Se não tiver números, limpa o campo
                              if (!onlyNumbers) {
                                setReceivedAmount("");
                                return;
                              }
                              
                              // Converte para centavos e formata
                              const cents = parseInt(onlyNumbers, 10);
                              const formatted = (cents / 100).toFixed(2).replace(".", ",");
                              setReceivedAmount(formatted);
                            }}
                            className="w-full pl-10 text-lg bg-muted/50 border-border rounded-xl"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">Deixe em branco se não precisar de troco</p>
                        
                        {/* Troco a Devolver - mostra em destaque quando valor recebido for digitado */}
                        {receivedAmount && parseFloat(receivedAmount.replace(",", ".")) > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm" style={{borderRadius: '16px'}}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-green-700">Troco a devolver</p>
                                <p className="text-2xl font-bold text-green-600 mt-0.5">
                                  {(() => {
                                    const totalValue = Math.max(0, calculateTotal() + 
                                      (orderType === "entrega" && selectedNeighborhoodFee 
                                        ? parseFloat(selectedNeighborhoodFee.fee) 
                                        : 0) -
                                      (appliedCoupon?.discount || 0));
                                    const received = parseFloat(receivedAmount.replace(",", ".")) || 0;
                                    const change = received - totalValue;
                                    return formatCurrency(Math.max(0, change));
                                  })()}
                                </p>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                            {(() => {
                              const totalValue = Math.max(0, calculateTotal() + 
                                (orderType === "entrega" && selectedNeighborhoodFee 
                                  ? parseFloat(selectedNeighborhoodFee.fee) 
                                  : 0) -
                                (appliedCoupon?.discount || 0));
                              const received = parseFloat(receivedAmount.replace(",", ".")) || 0;
                              const change = received - totalValue;
                              if (change < 0) {
                                return (
                                  <p className="text-xs text-red-600 mt-2 font-medium">
                                    Valor insuficiente! Faltam {formatCurrency(Math.abs(change))}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento configurada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Configure as formas de pagamento nas configurações</p>
                </div>
              )}
                        </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-card">
            <Button
              onClick={() => {
                if (selectedPaymentInSidebar) {
                  setPaymentMethod(selectedPaymentInSidebar);
                  if (selectedPaymentInSidebar === "cash" && receivedAmount) {
                    setChangeAmount(receivedAmount);
                  }
                }
                setShowPaymentSidebar(false);
                setSelectedPaymentInSidebar(favoritePaymentMethod || "cash");
                setReceivedAmount("");
              }}
              disabled={(!selectedPaymentInSidebar && availablePaymentMethods.length > 0) || (orderType === "retirada" && !pickupClientName.trim())}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white"
            >
              {orderType === "retirada" && !pickupClientName.trim() ? "Preencha o nome do cliente" : "Continuar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Conferência do Pedido */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmationModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-card rounded-2xl shadow-2xl w-[90%] max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Conferência do Pedido</h2>
                    <p className="text-sm text-white/80">
                      {orderType === "mesa" ? "Consumo no local" : 
                       orderType === "retirada" ? "Retirada" : "Entrega"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Recibo */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Nome do Estabelecimento */}
              <div className="text-center pb-3 border-b border-dashed border-border">
                <h3 className="font-bold text-lg">{establishment?.name || 'Estabelecimento'}</h3>
                <p className="text-xs text-muted-foreground">SISTEMA DE PEDIDOS</p>
              </div>

              {/* Tipo do Pedido */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded">
                  {orderType === "mesa" ? "CONSUMO" : 
                   orderType === "retirada" ? "RETIRADA" : "ENTREGA"}
                </span>
              </div>

              {/* Dados de Entrega (se for entrega) */}
              {orderType === "entrega" && deliveryAddress.street && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-foreground">Endereço de Entrega:</p>
                  <p className="text-sm">
                    {deliveryAddress.street}, {deliveryAddress.number}
                    {deliveryAddress.complement && ` - ${deliveryAddress.complement}`}
                  </p>
                  <p className="text-sm">{deliveryAddress.neighborhood}</p>
                  {deliveryAddress.reference && (
                    <p className="text-xs text-muted-foreground">Ref: {deliveryAddress.reference}</p>
                  )}
                  {deliveryAddress.name && (
                    <p className="text-xs text-muted-foreground mt-2">Cliente: {deliveryAddress.name}</p>
                  )}
                  {deliveryAddress.phone && (
                    <p className="text-xs text-muted-foreground">Tel: {deliveryAddress.phone}</p>
                  )}
                </div>
              )}

              {/* Lista de Itens */}
              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}
              
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.quantity}x {item.name}
                        </p>
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.complements.map((comp, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground pl-2">
                                + {comp.quantity}x {comp.name}
                                {parseFloat(comp.price) > 0 && (
                                  <span className="ml-1 text-muted-foreground/70">
                                    ({formatCurrency(parseFloat(comp.price) * comp.quantity)})
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Obs: {item.observation}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">
                        {formatCurrency(
                          (parseFloat(item.price) + 
                            (item.complements?.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0) || 0)
                          ) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                
                {orderType === "entrega" && selectedNeighborhoodFee && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>{formatCurrency(parseFloat(selectedNeighborhoodFee.fee))}</span>
                  </div>
                )}
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon.code}):</span>
                    <span>-{formatCurrency(appliedCoupon.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>TOTAL:</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      Math.max(0, calculateTotal() + 
                        (orderType === "entrega" && selectedNeighborhoodFee 
                          ? parseFloat(selectedNeighborhoodFee.fee) 
                          : 0) -
                        (appliedCoupon?.discount || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              {paymentMethod && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pagamento:</span>
                    <span className="font-medium">
                      {paymentMethod === "cash" ? "Dinheiro" : 
                       paymentMethod === "card" ? "Cartão" : "PIX"}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (changeAmount || receivedAmount) && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span>Valor recebido:</span>
                        <span>R$ {changeAmount || receivedAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Troco:</span>
                        <span>
                          {formatCurrency(
                            Math.max(0, 
                              parseFloat((changeAmount || receivedAmount).replace(",", ".")) - 
                              (calculateTotal() + 
                                (orderType === "entrega" && selectedNeighborhoodFee 
                                  ? parseFloat(selectedNeighborhoodFee.fee) 
                                  : 0) -
                                (appliedCoupon?.discount || 0)
                              )
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                onClick={() => {
                  setIsClosingOrder(true);
                  createOrder();
                  setShowConfirmationModal(false);
                  setIsClosingOrder(false);
                }}
                disabled={isClosingOrder || createOrderMutation.isPending}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                {isClosingOrder || createOrderMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar e Finalizar Pedido
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirmationModal(false)}
                variant="outline"
                className="w-full py-3"
                disabled={isClosingOrder || createOrderMutation.isPending}
              >
                Voltar e Revisar
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </AdminLayout>
  );
}
