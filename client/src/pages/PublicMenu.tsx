import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Home, ClipboardList, User, MapPin, ChevronRight, ChevronDown, ChevronLeft, Store, Utensils, Menu, Star, StarHalf, ShoppingBag, Ticket, Clock, X, CreditCard, Banknote, QrCode, FileText, Info, Share2, Minus, Plus, Trash2, Phone, Truck, Package, CheckCircle, Bike, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    description: string | null;
    price: string;
    images: string[] | null;
    hasStock: boolean;
  } | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [cart, setCart] = useState<Array<{
    productId: number;
    name: string;
    price: string;
    quantity: number;
    observation: string;
    image: string | null;
    complements: Array<{ id: number; name: string; price: string }>;
  }>>([]);
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Set<number>>>(new Map());
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number;
    code: string;
    discount: number;
    type: "percentage" | "fixed";
    value: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Estados para o fluxo de finalização de pedido
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = fechado, 1-5 = modais
  const [orderObservation, setOrderObservation] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    reference: "",
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showMobileBag, setShowMobileBag] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"sent" | "accepted" | "delivering" | "delivered" | "cancelled">("sent");
  const [cancellationReasonDisplay, setCancellationReasonDisplay] = useState<string | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [userOrders, setUserOrders] = useState<Array<{
    id: string;
    date: string;
    items: Array<{ name: string; quantity: number; price: string; complements: Array<{ name: string; price: string }> }>;
    total: string;
    status: "sent" | "accepted" | "delivering" | "delivered" | "cancelled";
    deliveryType: "pickup" | "delivery";
    paymentMethod: "cash" | "card" | "pix";
    address?: { street: string; number: string; neighborhood: string; complement: string; reference: string };
    customerName: string;
    customerPhone: string;
    observation: string;
  }>>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const socialDropdownRef = useRef<HTMLDivElement>(null);
  const ratingTooltipRef = useRef<HTMLDivElement>(null);
  const categoriesNavRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const categoryButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const { data, isLoading, error } = trpc.publicMenu.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Query para buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Mutation para criar avaliação
  const createReviewMutation = trpc.publicMenu.createReview.useMutation({
    onSuccess: () => {
      // Invalidar query de reviews para atualizar a lista
      if (data?.establishment) {
        reviewsQuery.refetch();
      }
    },
  });

  // Query para buscar avaliações do estabelecimento
  const reviewsQuery = trpc.publicMenu.getReviews.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id }
  );

  // Mutation para criar pedido
  const createOrderMutation = trpc.publicMenu.createOrder.useMutation({
    onSuccess: (result) => {
      // Salvar endereço e dados do cliente no localStorage
      if (deliveryType === 'delivery') {
        localStorage.setItem('savedDeliveryAddress', JSON.stringify(deliveryAddress));
      }
      localStorage.setItem('savedCustomerInfo', JSON.stringify(customerInfo));
      
      // Criar novo pedido para o histórico local
      const newOrder = {
        id: result.orderNumber,
        date: new Date().toISOString(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          complements: item.complements.map(c => ({ name: c.name, price: c.price }))
        })),
        total: cart.reduce((sum, item) => {
          const itemTotal = parseFloat(item.price) * item.quantity;
          const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
          return sum + itemTotal + complementsTotal;
        }, 0).toFixed(2),
        status: "sent" as const,
        deliveryType,
        paymentMethod,
        address: deliveryType === 'delivery' ? deliveryAddress : undefined,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        observation: orderObservation
      };
      
      // Salvar no localStorage
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      const updatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      setUserOrders(updatedOrders);
      setSelectedOrderId(newOrder.id);
      setCurrentOrderNumber(result.orderNumber);
      
      setIsSendingOrder(false);
      setOrderSent(true);
      setOrderStatus("sent");
    },
    onError: (error) => {
      console.error('Erro ao enviar pedido:', error);
      setIsSendingOrder(false);
      alert('Erro ao enviar pedido. Por favor, tente novamente.');
    }
  });

  // Query para buscar pedidos pelo telefone
  const { data: phoneOrders, refetch: refetchPhoneOrders } = trpc.publicMenu.getOrdersByPhone.useQuery(
    { phone: customerInfo.phone, establishmentId: data?.establishment?.id || 0 },
    { enabled: false } // Só busca quando chamado manualmente
  );

  // Query para buscar status do pedido atual em tempo real
  const { data: currentOrderData, refetch: refetchOrderStatus } = trpc.publicMenu.getOrderByNumber.useQuery(
    { orderNumber: currentOrderNumber || "", establishmentId: data?.establishment?.id || 0 },
    { 
      enabled: !!currentOrderNumber && !!data?.establishment?.id && showTrackingModal,
      refetchInterval: 5000, // Atualiza a cada 5 segundos
      refetchOnMount: 'always', // Sempre buscar ao montar
      staleTime: 0, // Considerar dados sempre desatualizados
    }
  );

  // Forçar refetch quando o modal abrir
  useEffect(() => {
    if (showTrackingModal && currentOrderNumber) {
      refetchOrderStatus();
    }
  }, [showTrackingModal, currentOrderNumber]);

  // Atualizar o status do pedido quando os dados mudarem
  useEffect(() => {
    if (currentOrderData?.status && selectedOrderId) {
      const statusMap: Record<string, "sent" | "accepted" | "delivering" | "delivered" | "cancelled"> = {
        'new': 'sent',
        'preparing': 'accepted',
        'ready': 'delivering',
        'completed': 'delivered',
        'cancelled': 'cancelled',
      };
      const mappedStatus = statusMap[currentOrderData.status] || 'sent';
      if (mappedStatus !== orderStatus) {
        setOrderStatus(mappedStatus);
      }
      
      // Salvar o motivo de cancelamento se houver
      if (currentOrderData.status === 'cancelled' && currentOrderData.cancellationReason) {
        setCancellationReasonDisplay(currentOrderData.cancellationReason);
      } else {
        setCancellationReasonDisplay(null);
      }
      
      // Atualizar o status do pedido no localStorage e no estado
      setUserOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === selectedOrderId ? { ...order, status: mappedStatus } : order
        );
        localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
        return updatedOrders;
      });
    }
  }, [currentOrderData?.status, selectedOrderId]);

  // Set first category as active when data loads
  useEffect(() => {
    if (data?.categories && data.categories.length > 0 && activeCategory === null) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data?.categories, activeCategory]);

  // Carregar pedidos salvos do localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('userOrders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        setUserOrders(parsed);
      } catch (e) {
        console.error('Erro ao carregar pedidos salvos:', e);
      }
    }
  }, []);

  // Carregar endereço salvo do localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('savedDeliveryAddress');
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setDeliveryAddress(parsed);
      } catch (e) {
        console.error('Erro ao carregar endereço salvo:', e);
      }
    }
    const savedCustomer = localStorage.getItem('savedCustomerInfo');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCustomerInfo(parsed);
      } catch (e) {
        console.error('Erro ao carregar dados do cliente:', e);
      }
    }
  }, []);

  // Close social dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (socialDropdownRef.current && !socialDropdownRef.current.contains(event.target as Node)) {
        setShowSocialDropdown(false);
      }
      if (ratingTooltipRef.current && !ratingTooltipRef.current.contains(event.target as Node)) {
        setShowRatingTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 py-3 pr-0">
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
              <button 
                className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors relative pr-3"
                onClick={() => setShowOrdersModal(true)}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Pedidos</span>
                {userOrders.filter(o => o.status !== 'delivered').length > 0 && (
                  <span className="absolute -top-1.5 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {userOrders.filter(o => o.status !== 'delivered').length}
                  </span>
                )}
              </button>
              <button 
                className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors relative pr-3"
                onClick={() => setShowMobileBag(true)}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Sacola</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
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
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="relative h-36 md:h-48 lg:h-56 rounded-2xl overflow-hidden bg-gray-200">
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
      </div>

      {/* Restaurant Info Block */}
      <div className="max-w-7xl mx-auto px-4">
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
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4" style={{paddingBottom: '4px'}}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                {/* Restaurant Name, Rating and Share */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">
                      {establishment.name}
                    </h1>
                    {/* Rating - clicável para abrir modal de avaliações */}
                    <div className="relative flex-shrink-0" ref={ratingTooltipRef}>
                      <button
                        onClick={() => setShowReviewsModal(true)}
                        className="flex items-center gap-1 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                      >
                        {/* Estrelas com suporte a meia estrela */}
                        {(() => {
                          const rating = Number(establishment.rating) || 0;
                          const fullStars = Math.floor(rating);
                          const hasHalfStar = rating - fullStars >= 0.3 && rating - fullStars < 0.8;
                          const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                          return (
                            <div className="flex items-center">
                              {[...Array(fullStars)].map((_, i) => (
                                <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              ))}
                              {hasHalfStar && (
                                <div className="relative h-4 w-4">
                                  <Star className="absolute h-4 w-4 text-gray-300" />
                                  <div className="absolute overflow-hidden w-1/2">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                  </div>
                                </div>
                              )}
                              {[...Array(Math.max(0, emptyStars))].map((_, i) => (
                                <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                              ))}
                            </div>
                          );
                        })()}
                        <span className="text-sm font-semibold text-gray-800 ml-1">
                          {establishment.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'}
                        </span>
                        <span className="text-sm text-gray-500 hidden sm:inline">
                          ({establishment.reviewCount || 0} avaliações)
                        </span>
                        <span className="text-sm text-gray-500 sm:hidden">
                          ({establishment.reviewCount || 0})
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* Botão Compartilhar - sempre na mesma linha */}
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
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    title="Compartilhar"
                  >
                    <Share2 className="h-5 w-5 text-gray-500" />
                  </button>
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
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200" style={{paddingRight: '9px', paddingLeft: '9px', paddingTop: '3px', paddingBottom: '3px', height: '24px'}}>
                      {getServiceTypes()}
                    </span>
                  )}
                </div>

                {/* Dropdown de Redes Sociais */}
                {(establishment.whatsapp || establishment.instagram) && (
                <div className="relative mt-3 pt-3 border-t border-gray-100" ref={socialDropdownRef} style={{paddingTop: '0px'}}>
                  <button
                    onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span>Redes Sociais</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showSocialDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showSocialDropdown && (
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                      {establishment.whatsapp && (
                        <a 
                          href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowSocialDropdown(false)}
                        >
                          <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="text-sm text-gray-700">WhatsApp</span>
                        </a>
                      )}
                      {establishment.instagram && (
                        <a 
                          href={`https://instagram.com/${establishment.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowSocialDropdown(false)}
                        >
                          <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span className="text-sm text-gray-700">Instagram</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-y sticky top-[60px] z-40">
          <div className="max-w-7xl mx-auto px-4">
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
      <main className="max-w-7xl mx-auto px-4 py-4">
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
                        <div
                          key={product.id}
                          onClick={() => {
                            if (product.hasStock) {
                              setSelectedProduct(product);
                              setProductQuantity(1);
                              setProductObservation("");
                            }
                          }}
                        >
                          <ProductCard product={product} formatPrice={formatPrice} />
                        </div>
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
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 font-medium">Sacola vazia</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item, index) => {
                      const complementsTotal = item.complements.reduce((sum, c) => sum + Number(c.price), 0);
                      const itemTotal = (Number(item.price) + complementsTotal) * item.quantity;
                      return (
                        <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{item.quantity}x {item.name}</p>
                                {item.complements.length > 0 && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {item.complements.map(c => c.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatPrice(itemTotal)}
                                </span>
                                <button
                                  onClick={() => {
                                    setCart(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Remover item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {item.observation && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">Obs: {item.observation}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4" />

                {/* Totals */}
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                    return sum + (Number(item.price) + complementsTotal) * item.quantity;
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const total = Math.max(0, subtotal - discount);
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-600">{formatPrice(subtotal)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            Cupom {appliedCoupon.code}
                          </span>
                          <span className="text-green-600">-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taxa de entrega</span>
                        <span className="text-gray-400">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">{formatPrice(total)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Cupom */}
                {appliedCoupon ? (
                  <div className="w-full flex items-center justify-between mt-4 py-3 border-t border-gray-100 -mx-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Ticket className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-green-700 text-sm">Cupom aplicado!</p>
                        <p className="text-xs text-green-600">{appliedCoupon.code} - {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% de desconto` : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')} de desconto`}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setShowCouponModal(true);
                      setCouponError("");
                    }}
                    className="w-full flex items-center justify-between mt-4 py-3 border-t border-gray-100 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-gray-500" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800 text-sm">Tem um cupom?</p>
                        <p className="text-xs text-gray-400">Clique e insira o código</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                )}

                {/* Button */}
                <button 
                  disabled={cart.length === 0 || !establishment.isOpen}
                  onClick={() => cart.length > 0 && establishment.isOpen && setCheckoutStep(1)}
                  className={`w-full mt-4 py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    !establishment.isOpen
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : cart.length === 0 
                        ? 'bg-red-400/80 text-white cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {!establishment.isOpen ? (
                    <>
                      <Clock className="h-5 w-5" />
                      Restaurante Fechado
                    </>
                  ) : cart.length === 0 ? (
                    'Sacola vazia'
                  ) : (
                    'Finalizar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
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
          <button 
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500 relative"
            onClick={() => setShowOrdersModal(true)}
          >
            <ClipboardList className="h-5 w-5" />
            {userOrders.filter(o => o.status !== 'delivered').length > 0 && (
              <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {userOrders.filter(o => o.status !== 'delivered').length}
              </span>
            )}
            <span className="text-xs font-medium">Pedidos</span>
          </button>
          <button 
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500 relative"
            onClick={() => setShowMobileBag(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
            <span className="text-xs font-medium">Sacola</span>
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

      {/* Modal Adicionar Item ao Carrinho */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          
{/* Modal Content */}
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[72vh] sm:max-h-[70vh] md:max-h-[72vh] overflow-hidden flex flex-col">
            {/* Imagem do Produto */}
            {selectedProduct.images?.[0] && (
              <div className="relative w-full h-32 sm:h-40 md:h-48 flex-shrink-0">
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            )}

            {/* Header sem imagem */}
            {!selectedProduct.images?.[0] && (
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between" style={{height: '49px'}}>
                <h2 className="text-lg font-bold text-gray-900">Adicionar Item</h2>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-lg font-semibold text-red-500 mt-1">
                  {formatPrice(selectedProduct.price)}
                </p>
              </div>

              {/* Descrição */}
              {selectedProduct.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {/* Grupos de Complementos */}
              {productComplements && productComplements.length > 0 && (
                <div className="space-y-4">
                  {productComplements.map((group) => {
                    const selectedInGroup = selectedComplements.get(group.id) || new Set<number>();
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
                            const isSelected = selectedInGroup.has(item.id);
                            
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                  isSelected ? 'bg-red-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type={isRadio ? 'radio' : 'checkbox'}
                                    name={`group-${group.id}`}
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedComplements((prev) => {
                                        const newMap = new Map(prev);
                                        const currentSet = new Set(prev.get(group.id) || []);
                                        
                                        if (isRadio) {
                                          // Radio: substitui a seleção
                                          newMap.set(group.id, new Set([item.id]));
                                        } else {
                                          // Checkbox: toggle
                                          if (currentSet.has(item.id)) {
                                            currentSet.delete(item.id);
                                          } else if (currentSet.size < group.maxQuantity) {
                                            currentSet.add(item.id);
                                          }
                                          newMap.set(group.id, currentSet);
                                        }
                                        
                                        return newMap;
                                      });
                                    }}
                                    className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                                  />
                                  <span className="text-sm text-gray-900">{item.name}</span>
                                </div>
                                {Number(item.price) > 0 && (
                                  <span className="text-sm text-gray-600">+ {formatPrice(item.price)}</span>
                                )}
                              </label>
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
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
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
                // Calcular preço total com complementos
                let complementsTotal = 0;
                const selectedComplementsList: Array<{ id: number; name: string; price: string }> = [];
                
                if (productComplements) {
                  productComplements.forEach((group) => {
                    const selectedInGroup = selectedComplements.get(group.id);
                    if (selectedInGroup) {
                      group.items.forEach((item) => {
                        if (selectedInGroup.has(item.id)) {
                          complementsTotal += Number(item.price);
                          selectedComplementsList.push({
                            id: item.id,
                            name: item.name,
                            price: item.price,
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
                      const selectedCount = selectedInGroup?.size || 0;
                      if (selectedCount < (group.minQuantity || 1)) {
                        requiredGroupsMet = false;
                      }
                    }
                  });
                }
                
                // Verificar se a loja está aberta
                const isStoreOpen = establishment.isOpen;
                const canAddToCart = requiredGroupsMet && isStoreOpen;
                
                return (
                  <button
                    onClick={() => {
                      if (!isStoreOpen) return;
                      
                      const newItem = {
                        productId: selectedProduct.id,
                        name: selectedProduct.name,
                        price: selectedProduct.price,
                        quantity: productQuantity,
                        observation: productObservation,
                        image: selectedProduct.images?.[0] || null,
                        complements: selectedComplementsList,
                      };
                      
                      setCart((prev) => {
                        // Para itens com complementos, sempre adiciona como novo item
                        if (selectedComplementsList.length > 0) {
                          return [...prev, newItem];
                        }
                        
                        const existingIndex = prev.findIndex(
                          (item) => item.productId === newItem.productId && 
                                   item.observation === newItem.observation &&
                                   item.complements.length === 0
                        );
                        
                        if (existingIndex >= 0) {
                          const updated = [...prev];
                          updated[existingIndex].quantity += newItem.quantity;
                          return updated;
                        }
                        
                        return [...prev, newItem];
                      });
                      
                      // Limpar seleções
                      setSelectedComplements(new Map());
                      setProductObservation("");
                      setProductQuantity(1);
                      setSelectedProduct(null);
                    }}
                    disabled={!canAddToCart}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      canAddToCart 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isStoreOpen ? (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>Adicionar {formatPrice(totalPrice)}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5" />
                        <span>Restaurante Fechado</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modais de Finalização de Pedido */}
      {checkoutStep > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCheckoutStep(0)}
          />
          
          {/* Modal de Checkout Unificado */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header com Título */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
              {/* Título e Botão Fechar */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {checkoutStep === 1 && 'Resumo do Pedido'}
                  {checkoutStep === 2 && 'Tipo de Entrega'}
                  {checkoutStep === 3 && 'Confirmar Endereço'}
                  {checkoutStep === 4 && 'Seus Dados'}
                  {checkoutStep === 5 && 'Enviar Pedido'}
                </h2>
                <button 
                  onClick={() => setCheckoutStep(0)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Indicador de Progresso */}
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      checkoutStep >= step 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {checkoutStep > step ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < 5 && (
                      <div className={`w-8 sm:w-12 h-1 mx-1 rounded transition-all ${
                        checkoutStep > step ? 'bg-red-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
                <span className={checkoutStep >= 1 ? 'text-red-500 font-medium' : ''}>Resumo</span>
                <span className={checkoutStep >= 2 ? 'text-red-500 font-medium' : ''}>Entrega</span>
                <span className={checkoutStep >= 3 ? 'text-red-500 font-medium' : ''}>Confirmar</span>
                <span className={checkoutStep >= 4 ? 'text-red-500 font-medium' : ''}>Dados</span>
                <span className={checkoutStep >= 5 ? 'text-red-500 font-medium' : ''}>Enviar</span>
              </div>
            </div>

            {/* Modal 1 - Resumo dos Itens */}
            {checkoutStep === 1 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Lista de Itens */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 text-sm">Itens do pedido</h3>
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900 text-sm">{item.quantity}x {item.name}</p>
                          <p className="font-semibold text-red-500 text-sm">{formatPrice(Number(item.price) * item.quantity)}</p>
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-1">
                            {item.complements.map((c) => (
                              <p key={c.id} className="text-xs text-gray-500">+ {c.name} ({formatPrice(c.price)})</p>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-xs text-gray-400 mt-1">Obs: {item.observation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo */}
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                  {(() => {
                    const subtotal = cart.reduce((sum, item) => {
                      const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                      return sum + (Number(item.price) + complementsTotal) * item.quantity;
                    }, 0);
                    const discount = appliedCoupon?.discount || 0;
                    const total = Math.max(0, subtotal - discount);
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-600">{formatPrice(subtotal)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1">
                              <Ticket className="h-3.5 w-3.5" />
                              Cupom {appliedCoupon.code}
                            </span>
                            <span className="text-green-600">-{formatPrice(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Taxa de entrega</span>
                          <span className="text-gray-400">A calcular</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                          <span className="text-gray-900">Total</span>
                          <span className="text-gray-900">{formatPrice(total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Observação do Pedido */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Observação do pedido</label>
                  <textarea
                    value={orderObservation}
                    onChange={(e) => setOrderObservation(e.target.value)}
                    placeholder="Ex: Sem cebola, bem passado..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => setCheckoutStep(2)}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

            {/* Modal 2 - Entrega e Pagamento */}
            {checkoutStep === 2 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Forma de Entrega */}
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-red-500" />
                    Forma de entrega
                  </h3>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      deliveryType === "pickup" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === "pickup"}
                        onChange={() => setDeliveryType("pickup")}
                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                      />
                      <Package className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Retirar no local</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      deliveryType === "delivery" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === "delivery"}
                        onChange={() => setDeliveryType("delivery")}
                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                      />
                      <Truck className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Entrega</span>
                    </label>
                  </div>

                  {/* Campos de Endereço (condicional) */}
                  {deliveryType === "delivery" && (
                    <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Rua</label>
                          <input
                            type="text"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                            placeholder="Nome da rua"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                          <input
                            type="text"
                            value={deliveryAddress.number}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, number: e.target.value})}
                            placeholder="Nº"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                        <input
                          type="text"
                          value={deliveryAddress.neighborhood}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                          placeholder="Nome do bairro"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                        <input
                          type="text"
                          value={deliveryAddress.complement}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                          placeholder="Apto, bloco, etc."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ponto de referência</label>
                        <input
                          type="text"
                          value={deliveryAddress.reference}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, reference: e.target.value})}
                          placeholder="Próximo a..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-500" />
                    Forma de pagamento
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                        paymentMethod === "cash" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={() => setPaymentMethod("cash")}
                          className="w-4 h-4 text-red-500 focus:ring-red-500"
                        />
                        <Banknote className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-800">Dinheiro</span>
                      </label>
                      {/* Campo de Troco (logo abaixo de Dinheiro) */}
                      {paymentMethod === "cash" && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-xl ml-7">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Precisa de troco para quanto?</label>
                          <input
                            type="text"
                            value={changeAmount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value) {
                                const formatted = (Number(value) / 100).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });
                                setChangeAmount(formatted);
                              } else {
                                setChangeAmount("");
                              }
                            }}
                            placeholder="0,00"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        </div>
                      )}
                    </div>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === "card" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                      />
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Cartão</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === "pix" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="pix"
                        checked={paymentMethod === "pix"}
                        onChange={() => setPaymentMethod("pix")}
                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                      />
                      <QrCode className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">Pix</span>
                    </label>
                  </div>

                  {/* Chave Pix */}
                  {paymentMethod === "pix" && establishment.pixKey && (
                    <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                      <p className="text-sm text-teal-700 font-medium mb-2">Chave Pix do restaurante:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-800 border border-teal-200 break-all">
                          {establishment.pixKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(establishment.pixKey || "");
                            alert("Chave Pix copiada!");
                          }}
                          className="flex-shrink-0 p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                          title="Copiar chave Pix"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-teal-600 mt-2">Copie a chave para realizar o pagamento via Pix.</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => setCheckoutStep(3)}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

            {/* Modal 3 - Resumo Final */}
            {checkoutStep === 3 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Itens */}
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-red-500" />
                    Itens
                  </h3>
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-800">{item.quantity}x {item.name}</span>
                          {item.complements.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {item.complements.map(c => c.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="text-gray-600">{formatPrice(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Entrega */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-red-500" />
                    Entrega
                  </h3>
                  <p className="text-sm text-gray-600">
                    {deliveryType === "pickup" ? "Retirar no local" : "Entrega"}
                  </p>
                  {deliveryType === "delivery" && deliveryAddress.street && (
                    <p className="text-sm text-gray-500 mt-1">
                      {deliveryAddress.street}, {deliveryAddress.number}
                      {deliveryAddress.complement && ` - ${deliveryAddress.complement}`}
                      <br />
                      {deliveryAddress.neighborhood}
                      {deliveryAddress.reference && <><br />Ref: {deliveryAddress.reference}</>}
                    </p>
                  )}
                </div>

                {/* Pagamento */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-500" />
                    Pagamento
                  </h3>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "card" ? "Cartão" : "Pix"}
                  </p>
                  {paymentMethod === "cash" && changeAmount && (
                    <p className="text-sm text-gray-500 mt-1">Troco para: R$ {changeAmount}</p>
                  )}
                </div>

                {/* Observações */}
                {orderObservation && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      Observações
                    </h3>
                    <p className="text-sm text-gray-600">{orderObservation}</p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                  {(() => {
                    const subtotal = cart.reduce((sum, item) => {
                      const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                      return sum + (Number(item.price) + complementsTotal) * item.quantity;
                    }, 0);
                    const discount = appliedCoupon?.discount || 0;
                    const total = Math.max(0, subtotal - discount);
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-600">{formatPrice(subtotal)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1">
                              <Ticket className="h-3.5 w-3.5" />
                              Cupom {appliedCoupon.code}
                            </span>
                            <span className="text-green-600">-{formatPrice(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2">
                          <span className="text-gray-900">Total</span>
                          <span className="text-red-500">{formatPrice(total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => setCheckoutStep(4)}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}

            {/* Modal 4 - Identificação do Cliente */}
            {checkoutStep === 4 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 11) {
                        if (value.length > 2) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                        }
                        if (value.length > 10) {
                          value = `${value.slice(0, 10)}-${value.slice(10)}`;
                        }
                        setCustomerInfo({...customerInfo, phone: value});
                      }
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => setCheckoutStep(5)}
                  disabled={!customerInfo.name || !customerInfo.phone}
                  className={`w-full py-3.5 font-semibold rounded-xl transition-colors ${
                    customerInfo.name && customerInfo.phone
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

            {/* Modal 5 - Confirmação Final */}
            {checkoutStep === 5 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {!orderSent ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Quase lá, {customerInfo.name.split(" ")[0]}!
                    </h3>
                    <p className="text-gray-600 mb-2">
                      O prazo de entrega está entre <strong>30 a 45 minutos</strong>.
                    </p>
                    <p className="text-gray-500 text-sm">
                      Após enviar o seu pedido, favor aguardar a confirmação do nosso atendente.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-4">
                      Pedido enviado com sucesso!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Seu pedido foi recebido e está sendo processado.
                    </p>
                    <button
                      onClick={() => {
                        setCheckoutStep(0);
                        setShowTrackingModal(true);
                      }}
                      className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      <Package className="h-5 w-5" />
                      Acompanhar pedido
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!orderSent && (
              <div className="flex-shrink-0 border-t px-6 py-4 flex gap-3">
                <button
                  onClick={() => setCheckoutStep(4)}
                  className="flex-1 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    if (isSendingOrder || !establishment || !establishment.isOpen) return;
                    setIsSendingOrder(true);
                    
                    // Calcular totais
                    const subtotal = cart.reduce((sum, item) => {
                      const itemTotal = parseFloat(item.price) * item.quantity;
                      const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                      return sum + itemTotal + complementsTotal;
                    }, 0);
                    
                    // Calcular desconto do cupom
                    const discount = appliedCoupon?.discount || 0;
                    const total = Math.max(0, subtotal - discount);
                    
                    // Montar endereço completo
                    const fullAddress = deliveryType === 'delivery' 
                      ? `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ''}, ${deliveryAddress.neighborhood}${deliveryAddress.reference ? ` (Ref: ${deliveryAddress.reference})` : ''}`
                      : null;
                    
                    // Enviar pedido via API
                    createOrderMutation.mutate({
                      establishmentId: establishment.id,
                      customerName: customerInfo.name,
                      customerPhone: customerInfo.phone,
                      customerAddress: fullAddress || undefined,
                      deliveryType,
                      paymentMethod,
                      subtotal: subtotal.toFixed(2),
                      deliveryFee: "0",
                      discount: discount.toFixed(2),
                      total: total.toFixed(2),
                      notes: orderObservation || undefined,
                      changeAmount: paymentMethod === 'cash' && changeAmount ? changeAmount : undefined,
                      couponCode: appliedCoupon?.code || undefined,
                      couponId: appliedCoupon?.id || undefined,
                      items: cart.map(item => ({
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: ((parseFloat(item.price) + item.complements.reduce((s, c) => s + parseFloat(c.price), 0)) * item.quantity).toFixed(2),
                        complements: item.complements.map(c => ({ name: c.name, price: parseFloat(c.price) })),
                        notes: item.observation || undefined,
                      })),
                    });
                  }}
                  disabled={isSendingOrder || !establishment.isOpen}
                  className={`flex-1 py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    !establishment.isOpen
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isSendingOrder 
                        ? 'bg-green-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                  } ${establishment.isOpen ? 'text-white' : ''}`}
                >
                  {!establishment.isOpen ? (
                    <>
                      <Clock className="h-5 w-5" />
                      Restaurante Fechado
                    </>
                  ) : isSendingOrder ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar pedido'
                  )}
                </button>
              </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Modal de Cupom */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCouponModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Aplicar cupom</h2>
              </div>
              <button 
                onClick={() => setShowCouponModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Digite o código do cupom"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase"
                  disabled={isValidatingCoupon}
                />
                <button
                  onClick={async () => {
                    if (cart.length === 0) {
                      setCouponError("Adicione os itens na sacola para aplicar o cupom.");
                      return;
                    }
                    if (!couponCode.trim()) {
                      setCouponError("Digite o código do cupom.");
                      return;
                    }
                    if (!data?.establishment?.id) {
                      setCouponError("Erro ao identificar o estabelecimento.");
                      return;
                    }
                    
                    setIsValidatingCoupon(true);
                    setCouponError("");
                    
                    try {
                      // Calcular subtotal
                      const subtotal = cart.reduce((sum, item) => {
                        const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                        return sum + (Number(item.price) + complementsTotal) * item.quantity;
                      }, 0);
                      
                      // Validar cupom via API (tRPC espera input com chave "json")
                      const response = await fetch(`/api/trpc/publicMenu.validateCoupon?input=${encodeURIComponent(JSON.stringify({
                        json: {
                          establishmentId: data.establishment.id,
                          code: couponCode.toUpperCase(),
                          orderValue: subtotal,
                          deliveryType: deliveryType === 'pickup' ? 'pickup' : 'delivery',
                        }
                      }))}`).then(res => res.json());
                      
                      const result = response.result?.data?.json;
                      
                      if (result?.valid && result?.coupon) {
                        setAppliedCoupon({
                          id: result.coupon.id,
                          code: result.coupon.code,
                          discount: result.discount,
                          type: result.coupon.type,
                          value: Number(result.coupon.value),
                        });
                        setShowCouponModal(false);
                      } else {
                        setCouponError(result?.error || "Cupom inválido.");
                      }
                    } catch (error) {
                      setCouponError("Erro ao validar cupom. Tente novamente.");
                    } finally {
                      setIsValidatingCoupon(false);
                    }
                  }}
                  disabled={isValidatingCoupon}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingCoupon ? "Validando..." : "Aplicar cupom"}
                </button>
              </div>
              
              {/* Mensagem de erro */}
              {couponError && (
                <p className="mt-3 text-sm text-red-500 font-medium">
                  {couponError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Acompanhamento do Pedido */}
      {/* Modal da Sacola */}
      {showMobileBag && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileBag(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full md:w-[480px] md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Sua sacola</h2>
              </div>
              <button 
                onClick={() => setShowMobileBag(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Sua sacola está vazia</p>
                  <p className="text-sm text-gray-400 mt-1">Adicione itens do cardápio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{item.quantity}x {item.name}</span>
                          <span className="text-red-500 font-semibold ml-2">
                            R$ {(parseFloat(item.price) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {item.complements.map(c => `+ ${c.name}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newCart = [...cart];
                          newCart.splice(index, 1);
                          setCart(newCart);
                        }}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 border-t p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">R$ {cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="text-gray-500">R$ 0,00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-red-500">R$ {cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <button
                  onClick={() => {
                    if (!establishment.isOpen) return;
                    setShowMobileBag(false);
                    setCheckoutStep(1);
                  }}
                  disabled={!establishment.isOpen}
                  className={`w-full py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    !establishment.isOpen
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {!establishment.isOpen ? (
                    <>
                      <Clock className="h-5 w-5" />
                      Restaurante Fechado
                    </>
                  ) : (
                    'Finalizar pedido'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pedidos */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:items-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowOrdersModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Meus Pedidos</h2>
              </div>
              <button 
                onClick={() => setShowOrdersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum pedido ainda</h3>
                  <p className="text-gray-500 text-sm">Seus pedidos aparecerão aqui após você fazer o primeiro pedido.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pedidos em andamento */}
                  {userOrders.filter(o => o.status !== 'delivered').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Em andamento</h3>
                      <div className="space-y-3">
                        {userOrders.filter(o => o.status !== 'delivered').map(order => (
                          <div 
                            key={order.id}
                            className="bg-white border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:border-red-400 transition-colors"
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              // O order.id já é o número do pedido (result.orderNumber)
                              setCurrentOrderNumber(order.id);
                              // Não definir orderStatus aqui - deixar a query buscar do banco
                              setShowOrdersModal(false);
                              setShowTrackingModal(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900">#{order.id.replace('PED-', '').slice(-6)}</span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                order.status === 'sent' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'delivering' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {order.status === 'sent' ? 'Enviado' :
                                 order.status === 'accepted' ? 'Pedido aceito' :
                                 order.status === 'delivering' ? (order.deliveryType === 'pickup' ? 'Pedido Finalizado' : 'Saiu para entrega') :
                                 'Entregue'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">
                                {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="font-bold text-red-500">R$ {order.total.replace('.', ',')}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
                              <Clock className="h-3 w-3" />
                              <span>Toque para acompanhar</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de pedidos */}
                  {userOrders.filter(o => o.status === 'delivered').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h3>
                      <div className="space-y-3">
                        {userOrders.filter(o => o.status === 'delivered').map(order => (
                          <div 
                            key={order.id}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900">#{order.id.replace('PED-', '').slice(-6)}</span>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Entregue
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">
                                {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                              <span className="font-bold text-gray-700">R$ {order.total.replace('.', ',')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTrackingModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Acompanhar Pedido</h2>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body - Timeline ou Cancelado */}
            <div className="p-6">
              {orderStatus === 'cancelled' ? (
                /* Exibição de Pedido Cancelado */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-600 mb-4">
                    Pedido Cancelado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Infelizmente seu pedido foi cancelado pelo restaurante.
                  </p>
                  {cancellationReasonDisplay && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                      <p className="text-sm font-semibold text-red-700 mb-1">Motivo do cancelamento:</p>
                      <p className="text-sm text-red-600">{cancellationReasonDisplay}</p>
                    </div>
                  )}
                </div>
              ) : (
              <div className="relative">
                {/* Linha vertical conectando os status */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
                
                {/* Status: Enviado */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    orderStatus === 'sent' ? 'bg-primary text-white' :
                    ['accepted', 'delivering', 'delivered'].includes(orderStatus) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-semibold ${
                      orderStatus === 'sent' ? 'text-primary' :
                      ['accepted', 'delivering', 'delivered'].includes(orderStatus) ? 'text-green-600' :
                      'text-gray-400'
                    }`}>Enviado</h4>
                    <p className="text-sm text-gray-500">Seu pedido foi recebido</p>
                  </div>
                </div>

                {/* Status: Aceito */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    orderStatus === 'accepted' ? 'bg-primary text-white' :
                    ['delivering', 'delivered'].includes(orderStatus) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-semibold ${
                      orderStatus === 'accepted' ? 'text-primary' :
                      ['delivering', 'delivered'].includes(orderStatus) ? 'text-green-600' :
                      'text-gray-400'
                    }`}>Pedido aceito</h4>
                    <p className="text-sm text-gray-500">Iniciamos o preparo do seu pedido.</p>
                  </div>
                </div>

                {/* Status: Saiu para entrega / Pedido Finalizado (retirada) */}
                {(() => {
                  const selectedOrder = userOrders.find(o => o.id === selectedOrderId);
                  const isPickup = selectedOrder?.deliveryType === 'pickup';
                  return (
                    <div className="relative flex items-start gap-4 pb-8">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        orderStatus === 'delivering' ? 'bg-primary text-white' :
                        orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {isPickup ? <CheckCircle className="h-5 w-5" /> : <Bike className="h-5 w-5" />}
                      </div>
                      <div className="pt-2">
                        <h4 className={`font-semibold ${
                          orderStatus === 'delivering' ? 'text-primary' :
                          orderStatus === 'delivered' ? 'text-green-600' :
                          'text-gray-400'
                        }`}>{isPickup ? 'Pedido Finalizado' : 'Saiu para entrega'}</h4>
                        <p className="text-sm text-gray-500">
                          {isPickup ? 'Tudo certo! Seu pedido já está disponível para retirada.' : 'Seu pedido está a caminho'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Status: Entregue */}
                <div className="relative flex items-start gap-4">
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-semibold ${
                      orderStatus === 'delivered' ? 'text-green-600' : 'text-gray-400'
                    }`}>Entregue</h4>
                    <p className="text-sm text-gray-500">Pedido entregue com sucesso</p>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 space-y-3">
              {/* Botão Avaliar restaurante - só aparece quando status for entregue */}
              {orderStatus === 'delivered' && (
                <button
                  onClick={() => {
                    setShowRatingModal(true);
                  }}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  Avaliar restaurante
                </button>
              )}
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setOrderSent(false);
                  setCart([]);
                  setOrderObservation("");
                  setDeliveryType("pickup");
                  setPaymentMethod("pix");
                  setChangeAmount("");
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação do Restaurante */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!ratingSuccess) {
                setShowRatingModal(false);
                setRatingValue(0);
                setRatingHover(0);
                setRatingComment("");
              }
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {ratingSuccess ? (
              /* Tela de Sucesso */
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Avaliação enviada!
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Obrigado por avaliar. Sua opinião é muito importante para nós!
                </p>
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRatingSuccess(false);
                    setRatingValue(0);
                    setRatingHover(0);
                    setRatingComment("");
                  }}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* Formulário de Avaliação */
              <>
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <h2 className="text-lg font-bold text-gray-900">Avaliar restaurante</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setShowRatingModal(false);
                      setRatingValue(0);
                      setRatingHover(0);
                      setRatingComment("");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Como foi sua experiência?
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Sua avaliação ajuda outros clientes e o restaurante a melhorar.
                    </p>
                    
                    {/* Sistema de estrelas */}
                    <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingValue(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star 
                            className={`h-10 w-10 transition-colors ${
                              star <= (ratingHover || ratingValue)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                    {/* Texto indicando a nota selecionada */}
                    {ratingValue > 0 && (
                      <p className="text-sm font-medium text-gray-700 mb-4">
                        {ratingValue === 1 && 'Muito ruim'}
                        {ratingValue === 2 && 'Ruim'}
                        {ratingValue === 3 && 'Regular'}
                        {ratingValue === 4 && 'Bom'}
                        {ratingValue === 5 && 'Excelente!'}
                      </p>
                    )}
                    
                    {/* Campo de comentário */}
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deixe um comentário (opcional)
                      </label>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Conte como foi sua experiência com o restaurante..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex gap-3">
                  <button
                    onClick={() => {
                      setShowRatingModal(false);
                      setRatingValue(0);
                      setRatingHover(0);
                      setRatingComment("");
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!establishment || ratingValue === 0) return;
                      try {
                        await createReviewMutation.mutateAsync({
                          establishmentId: establishment.id,
                          customerName: customerInfo.name || 'Cliente',
                          rating: ratingValue,
                          comment: ratingComment || undefined,
                        });
                        setRatingSuccess(true);
                      } catch (error) {
                        console.error('Erro ao enviar avaliação:', error);
                        alert('Erro ao enviar avaliação. Tente novamente.');
                      }
                    }}
                    disabled={ratingValue === 0 || createReviewMutation.isPending}
                    className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${
                      ratingValue === 0 || createReviewMutation.isPending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {createReviewMutation.isPending ? 'Enviando...' : 'Enviar avaliação'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Avaliações do Restaurante */}
      {showReviewsModal && establishment && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReviewsModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
                  <p className="text-sm text-gray-500">
                    {establishment.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'} • {establishment.reviewCount || 0} avaliações
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowReviewsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body - Lista de Avaliações */}
            <div className="flex-1 overflow-y-auto p-6">
              {reviewsQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {reviewsQuery.data.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 font-semibold text-sm">
                            {review.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Nome e Data */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                              {review.customerName}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {/* Estrelas */}
                          <div className="flex items-center gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Comentário */}
                          {review.comment && (
                            <p className="text-sm text-gray-600">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhuma avaliação ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Seja o primeiro a avaliar!</p>
                </div>
              )}
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
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors cursor-pointer border-l-[3px] border-l-red-500">
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
        <div className="max-w-7xl mx-auto px-4 py-3">
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
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Skeleton className="h-48 md:h-64 lg:h-72 rounded-2xl" />
      </div>

      {/* Info Skeleton */}
      <div className="max-w-7xl mx-auto px-4">
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-4">
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
