import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { orderSSE, statusMap } from "@/lib/orderSSE";
import { Search, Home, ClipboardList, User, MapPin, ChevronRight, ChevronDown, ChevronLeft, Store, Utensils, Menu, Star, StarHalf, ShoppingBag, Ticket, Clock, X, CreditCard, Banknote, QrCode, FileText, Info, Share2, Minus, Plus, Trash2, Phone, Truck, Package, CheckCircle, XCircle, Bike, Copy, Loader2, Eye, RefreshCw, UtensilsCrossed, Gift, RotateCcw, Check, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Tipo do item do carrinho
type CartItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string }>;
};

// Função para obter a chave do localStorage baseada no slug
const getCartStorageKey = (slug: string) => `cart_${slug}`;

// Função para carregar o carrinho do localStorage
const loadCartFromStorage = (slug: string): CartItem[] => {
  try {
    const stored = localStorage.getItem(getCartStorageKey(slug));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar carrinho do localStorage:', e);
  }
  return [];
};

// Função para salvar o carrinho no localStorage
const saveCartToStorage = (slug: string, cart: CartItem[]) => {
  try {
    localStorage.setItem(getCartStorageKey(slug), JSON.stringify(cart));
  } catch (e) {
    console.error('Erro ao salvar carrinho no localStorage:', e);
  }
};

// Função para limpar o carrinho do localStorage
const clearCartFromStorage = (slug: string) => {
  try {
    localStorage.removeItem(getCartStorageKey(slug));
  } catch (e) {
    console.error('Erro ao limpar carrinho do localStorage:', e);
  }
};

// Função para obter a chave do localStorage de pedidos baseada no establishmentId
const getOrdersStorageKey = (establishmentId: number) => `orders_${establishmentId}`;

// Tipo de pedido do usuário
type UserOrder = {
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
};

// Função para carregar pedidos do localStorage por establishmentId
const loadOrdersFromStorage = (establishmentId: number): UserOrder[] => {
  try {
    const stored = localStorage.getItem(getOrdersStorageKey(establishmentId));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar pedidos do localStorage:', e);
  }
  return [];
};

// Função para salvar pedidos no localStorage por establishmentId
const saveOrdersToStorage = (establishmentId: number, orders: UserOrder[]) => {
  try {
    localStorage.setItem(getOrdersStorageKey(establishmentId), JSON.stringify(orders));
  } catch (e) {
    console.error('Erro ao salvar pedidos no localStorage:', e);
  }
};

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Inicializar do localStorage se houver dados salvos
    if (slug) {
      return loadCartFromStorage(slug);
    }
    return [];
  });
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
    loyaltyCardId?: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Estados para o fluxo de finalização de pedido
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = fechado, 1-5 = modais
  const [orderObservation, setOrderObservation] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("pix");
  const [changeAmount, setChangeAmount] = useState("");
  const [changeAmountError, setChangeAmountError] = useState<string | null>(null);
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
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showMobileBag, setShowMobileBag] = useState(false);
  const [bagAutoOpenEnabled, setBagAutoOpenEnabled] = useState(true); // Controla se a sacola deve abrir automaticamente
  const [orderStatus, setOrderStatus] = useState<"sent" | "accepted" | "delivering" | "delivered" | "cancelled">("sent");
  const [cancellationReasonDisplay, setCancellationReasonDisplay] = useState<string | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  

  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [canReviewChecked, setCanReviewChecked] = useState(false);
  const [canReview, setCanReview] = useState(true);
  
  // Estados para taxa por bairro
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{ name: string; fee: string } | null>(null);
  const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [isNeighborhoodButtonHovered, setIsNeighborhoodButtonHovered] = useState(false);
  const [reopenBagAfterNeighborhood, setReopenBagAfterNeighborhood] = useState(false);
  
  // Estados do sistema de fidelidade
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltyStep, setLoyaltyStep] = useState<'login' | 'register' | 'card'>('login');
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyPassword, setLoyaltyPassword] = useState('');
  const [loyaltyName, setLoyaltyName] = useState('');
  const [loyaltyError, setLoyaltyError] = useState('');
  const [isLoyaltyLoggedIn, setIsLoyaltyLoggedIn] = useState(false);
  const [showCouponAppliedModal, setShowCouponAppliedModal] = useState(false);
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{ code: string; type: string; value: number } | null>(null);
  
  const userOrdersRef = useRef<typeof userOrders>([]);
  const socialDropdownRef = useRef<HTMLDivElement>(null);
  const ratingTooltipRef = useRef<HTMLDivElement>(null);
  const categoriesNavRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const categoryButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const neighborhoodDropdownRef = useRef<HTMLDivElement>(null);

  // Utils do TRPC para chamadas imperativas
  const trpcUtils = trpc.useUtils();

  const { data, isLoading, error } = trpc.publicMenu.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  
  // Query para buscar horários de funcionamento
  const { data: businessHoursData } = trpc.publicMenu.getBusinessHours.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id }
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
  
  // Query para verificar se fidelidade está ativa
  const { data: loyaltyEnabled } = trpc.loyalty.isEnabled.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id }
  );
  
  // Query para buscar taxas por bairro
  const { data: neighborhoodFeesData } = trpc.publicMenu.getNeighborhoodFees.useQuery(
    { establishmentId: data?.establishment?.id || 0 },
    { enabled: !!data?.establishment?.id && data?.establishment?.deliveryFeeType === 'byNeighborhood' }
  );
  
  // Query para buscar cartão de fidelidade do cliente
  const loyaltyCardQuery = trpc.loyalty.getCustomerCard.useQuery(
    { establishmentId: data?.establishment?.id || 0, phone: loyaltyPhone },
    { enabled: !!data?.establishment?.id && isLoyaltyLoggedIn && !!loyaltyPhone }
  );
  
  // Mutation para login no cartão fidelidade
  const loyaltyLoginMutation = trpc.loyalty.customerLogin.useMutation({
    onSuccess: () => {
      setIsLoyaltyLoggedIn(true);
      setLoyaltyStep('card');
      setLoyaltyError('');
      // Salvar telefone no localStorage
      localStorage.setItem('loyaltyPhone_' + data?.establishment?.id, loyaltyPhone);
    },
    onError: (error) => {
      setLoyaltyError(error.message);
    },
  });
  
  // Mutation para cadastro no cartão fidelidade
  const loyaltyRegisterMutation = trpc.loyalty.customerRegister.useMutation({
    onSuccess: () => {
      setIsLoyaltyLoggedIn(true);
      setLoyaltyStep('card');
      setLoyaltyError('');
      // Salvar telefone no localStorage
      localStorage.setItem('loyaltyPhone_' + data?.establishment?.id, loyaltyPhone);
    },
    onError: (error) => {
      setLoyaltyError(error.message);
    },
  });

  // Manter ref de userOrders sincronizada
  useEffect(() => {
    userOrdersRef.current = userOrders;
  }, [userOrders]);
  
  // Sincronizar carrinho com localStorage sempre que mudar
  useEffect(() => {
    if (slug && cart.length > 0) {
      saveCartToStorage(slug, cart);
    } else if (slug && cart.length === 0) {
      // Se o carrinho está vazio, remover do localStorage
      clearCartFromStorage(slug);
    }
  }, [cart, slug]);
  
  // Carregar dados de fidelidade do localStorage
  useEffect(() => {
    if (data?.establishment?.id) {
      const savedPhone = localStorage.getItem('loyaltyPhone_' + data.establishment.id);
      if (savedPhone) {
        setLoyaltyPhone(savedPhone);
        setIsLoyaltyLoggedIn(true);
        setLoyaltyStep('card');
      }
    }
  }, [data?.establishment?.id]);

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
      
      // Salvar no localStorage (por establishmentId)
      const establishmentId = data?.establishment?.id;
      if (establishmentId) {
        const existingOrders = loadOrdersFromStorage(establishmentId);
        const updatedOrders = [newOrder, ...existingOrders];
        saveOrdersToStorage(establishmentId, updatedOrders);
        setUserOrders(updatedOrders);
      }
      setSelectedOrderId(newOrder.id);
      setCurrentOrderNumber(result.orderNumber);
      
      // Iniciar tracking SSE APENAS após o pedido ser criado com sucesso
      orderSSE.trackOrder(result.orderNumber, (update) => {
        console.log('[PublicMenu] Atualização SSE recebida (novo pedido):', update);
        const newStatus = statusMap[update.status] || 'sent';
        
        // Atualizar o pedido no estado local
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            if (order.id === update.orderNumber) {
              return { ...order, status: newStatus };
            }
            return order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });
        
        // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
        if (update.status === 'completed' && isLoyaltyLoggedIn) {
          console.log('[PublicMenu] Pedido entregue - atualizando cartão fidelidade');
          loyaltyCardQuery.refetch();
        }
        
        // Se o modal de tracking está aberto para este pedido, atualizar diretamente
        // Usa refs para evitar problemas de closure
        console.log('[PublicMenu] Modal aberto:', showTrackingModalRef.current, 'Pedido atual:', currentOrderNumberRef.current, 'Pedido atualizado:', update.orderNumber);
        if (showTrackingModalRef.current && currentOrderNumberRef.current === update.orderNumber) {
          console.log('[PublicMenu] Atualizando orderStatus no modal para:', newStatus);
          setOrderStatus(newStatus);
          if (update.cancellationReason) {
            setCancellationReasonDisplay(update.cancellationReason);
          }
        }
      });
      
      setIsSendingOrder(false);
      setOrderSent(true);
      setOrderStatus("sent");
      
      // Limpar sacola e resetar estados após pedido enviado com sucesso
      // Nota: NÃO resetar checkoutStep aqui para manter o modal de sucesso visível
      // O checkoutStep será resetado quando o usuário clicar em "Acompanhar pedido"
      setCart([]);
      // Limpar também o localStorage para garantir que a sacola não reapareça
      if (slug) {
        clearCartFromStorage(slug);
      }
      setOrderObservation("");
      setAppliedCoupon(null);
      setChangeAmount("");
      setChangeAmountError(null);
    },
    onError: (error: any) => {
      console.error('Erro ao enviar pedido:', error);
      setIsSendingOrder(false);
      
      // Extrair mensagem de erro detalhada
      let errorMessage = 'Erro ao enviar pedido. Por favor, tente novamente.';
      
      if (error?.message) {
        if (error.message.includes('fechado')) {
          errorMessage = 'O estabelecimento está fechado no momento. Não é possível realizar pedidos.';
          // Recarregar dados do estabelecimento para atualizar o status
          trpcUtils.publicMenu.getBySlug.invalidate({ slug: slug || "" });
        } else if (error.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'O servidor demorou muito para responder. Tente novamente.';
        } else if (error.message.includes('validation') || error.message.includes('required')) {
          errorMessage = 'Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      // Log detalhado para debug
      console.error('Detalhes do erro:', {
        message: error?.message,
        code: error?.data?.code,
        httpStatus: error?.data?.httpStatus,
        path: error?.data?.path,
      });
      
      // Exibir erro no modal em vez de alert
      setOrderError(errorMessage);
    }
  });

  // Query para buscar pedidos pelo telefone
  const { data: phoneOrders, refetch: refetchPhoneOrders } = trpc.publicMenu.getOrdersByPhone.useQuery(
    { phone: customerInfo.phone, establishmentId: data?.establishment?.id || 0 },
    { enabled: false } // Só busca quando chamado manualmente
  );

  // Query para buscar status do pedido atual
  // Não usa polling - atualizações vem via SSE ou sincronização manual
  const { data: currentOrderData, refetch: refetchOrderStatus } = trpc.publicMenu.getOrderByNumber.useQuery(
    { orderNumber: currentOrderNumber || "", establishmentId: data?.establishment?.id || 0 },
    { 
      enabled: !!currentOrderNumber && !!data?.establishment?.id && showTrackingModal,
      refetchOnMount: true, // Buscar ao montar
      staleTime: 30000, // Considerar dados válidos por 30 segundos
    }
  );

  // Forçar refetch quando o modal abrir e inicializar orderStatus com o status do pedido selecionado
  useEffect(() => {
    if (showTrackingModal && currentOrderNumber) {
      // Inicializar orderStatus com o status do pedido selecionado do userOrders
      const selectedOrder = userOrders.find(o => o.id === currentOrderNumber);
      if (selectedOrder) {
        setOrderStatus(selectedOrder.status);
        // Limpar motivo de cancelamento se não for cancelado
        if (selectedOrder.status !== 'cancelled') {
          setCancellationReasonDisplay(null);
        }
      }
      // Buscar status atualizado do servidor
      refetchOrderStatus();
    }
  }, [showTrackingModal, currentOrderNumber]);

  // *** LISTENER SSE DEDICADO PARA O MODAL DE TRACKING ***
  // Este useEffect registra um callback específico quando o modal está aberto
  // O callback atualiza diretamente o orderStatus sem depender de refs ou closures
  // O cleanup remove o callback quando o modal fecha
  useEffect(() => {
    // Só registrar listener se o modal estiver aberto e tiver um pedido selecionado
    if (!showTrackingModal || !currentOrderNumber) {
      return;
    }
    
    console.log('[PublicMenu] Modal aberto - registrando listener SSE dedicado para:', currentOrderNumber);
    
    // Callback dedicado para o modal de tracking
    // Este callback é criado DENTRO do useEffect, então sempre terá acesso aos valores atuais
    const modalStatusCallback = (update: { orderNumber: string; status: string; cancellationReason?: string }) => {
      console.log('[PublicMenu] [Modal Listener] Atualização SSE recebida:', update);
      
      // Verificar se a atualização é para o pedido que está sendo visualizado
      if (update.orderNumber === currentOrderNumber) {
        const newStatus = statusMap[update.status] || 'sent';
        console.log('[PublicMenu] [Modal Listener] Atualizando orderStatus para:', newStatus);
        
        // Atualizar o status do modal diretamente
        setOrderStatus(newStatus);
        
        // Atualizar motivo de cancelamento se houver
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };
    
    // Registrar o callback usando o novo método addCallback
    // Isso adiciona o callback SEM substituir os existentes
    const removeCallback = orderSSE.addCallback(currentOrderNumber, modalStatusCallback);
    
    // Cleanup: remover o callback quando o modal fechar ou o pedido mudar
    return () => {
      console.log('[PublicMenu] Modal fechado - removendo listener SSE dedicado para:', currentOrderNumber);
      removeCallback();
    };
  }, [showTrackingModal, currentOrderNumber]); // Dependências mínimas para evitar re-registros desnecessários

  // Sincronizar orderStatus quando userOrders muda e o modal está aberto
  // Isso garante que atualizações SSE reflitam no modal imediatamente
  // Usa setOrderStatus com callback para evitar problemas de closure com orderStatus
  useEffect(() => {
    if (showTrackingModal && currentOrderNumber) {
      const selectedOrder = userOrders.find(o => o.id === currentOrderNumber);
      if (selectedOrder) {
        // Usar callback para comparar com o valor atual e evitar problemas de stale closure
        setOrderStatus(prevStatus => {
          if (prevStatus !== selectedOrder.status) {
            console.log('[PublicMenu] Sincronizando orderStatus com userOrders:', selectedOrder.status, '(anterior:', prevStatus, ')');
            if (selectedOrder.status === 'cancelled') {
              // Buscar motivo de cancelamento do servidor se necessário
              refetchOrderStatus();
            }
            return selectedOrder.status;
          }
          return prevStatus;
        });
      }
    }
  }, [userOrders, showTrackingModal, currentOrderNumber, refetchOrderStatus]);

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
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, updatedOrders);
        }
        return updatedOrders;
      });
      
      // Não precisa mais resetar canReviewCheckingRef aqui
      // O useEffect de canReview agora usa orderStatus como dependência
    }
  }, [currentOrderData?.status, selectedOrderId]);

  // Ref para controlar se já verificamos canReview para este pedido
  const canReviewCheckingRef = useRef<string | null>(null);
  
  // Verificar canReview quando:
  // 1. O pedido selecionado mudar
  // 2. O status do pedido mudar para 'delivered'
  // Usa uma chave única (orderId + establishmentId + status) para evitar chamadas duplicadas
  useEffect(() => {
    // Se não tem pedido selecionado, resetar
    if (!selectedOrderId) {
      setCanReviewChecked(false);
      setCanReview(true);
      canReviewCheckingRef.current = null;
      return;
    }
    
    // Se não tem establishmentId ainda, aguardar
    if (!data?.establishment?.id) {
      return;
    }
    
    // Se o status atual não é 'delivered', não precisa verificar
    // Usa orderStatus do estado (mais confiável que a ref)
    if (orderStatus !== 'delivered') {
      setCanReviewChecked(false);
      setCanReview(true);
      return;
    }
    
    // Criar chave única para este pedido + estabelecimento + status delivered
    const checkKey = `${selectedOrderId}_${data.establishment.id}_delivered`;
    
    // Se já verificou este pedido com status delivered, não fazer nada
    if (canReviewCheckingRef.current === checkKey) {
      return;
    }
    
    // Buscar o pedido selecionado usando a ref
    const selectedOrder = userOrdersRef.current.find(o => o.id === selectedOrderId);
    
    // Se não tem telefone do cliente, não pode verificar
    if (!selectedOrder?.customerPhone) {
      setCanReviewChecked(true);
      setCanReview(true); // Permitir avaliar se não conseguir verificar
      return;
    }
    
    // Marcar que estamos verificando este pedido
    canReviewCheckingRef.current = checkKey;
    setCanReviewChecked(false);
    setCanReview(true); // Mostrar botão enquanto verifica (otimista)
    
    // Enviar telefone original para a API - a normalização é feita no backend
    // Verificar no backend se pode avaliar
    // tRPC espera o input no formato { json: { ... } }
    const url = `/api/trpc/publicMenu.canReview?input=${encodeURIComponent(JSON.stringify({
      json: {
        establishmentId: data.establishment.id,
        customerPhone: selectedOrder.customerPhone
      }
    }))}`;
    
    console.log('[canReview] Verificando se pode avaliar:', { establishmentId: data.establishment.id, customerPhone: selectedOrder.customerPhone });
    
    fetch(url)
      .then(res => res.json())
      .then(result => {
        console.log('[canReview] Resposta da API:', result);
        
        // Verificar se ainda é o mesmo pedido
        if (canReviewCheckingRef.current !== checkKey) {
          console.log('[canReview] Pedido mudou, ignorando resposta');
          return;
        }
        
        // Tentar extrair canReview de diferentes estruturas de resposta
        let canReviewValue = true; // Default: permitir avaliar
        
        // tRPC com superjson retorna: result.result.data.json.canReview
        if (result?.result?.data?.json?.canReview !== undefined) {
          canReviewValue = result.result.data.json.canReview;
          console.log('[canReview] Encontrado em result.result.data.json.canReview');
        } else if (result?.result?.data?.canReview !== undefined) {
          canReviewValue = result.result.data.canReview;
          console.log('[canReview] Encontrado em result.result.data.canReview');
        } else if (result?.data?.json?.canReview !== undefined) {
          canReviewValue = result.data.json.canReview;
          console.log('[canReview] Encontrado em result.data.json.canReview');
        } else if (result?.data?.canReview !== undefined) {
          canReviewValue = result.data.canReview;
          console.log('[canReview] Encontrado em result.data.canReview');
        } else if (result?.canReview !== undefined) {
          canReviewValue = result.canReview;
          console.log('[canReview] Encontrado em result.canReview');
        } else {
          console.log('[canReview] Estrutura de resposta não reconhecida, permitindo avaliar');
        }
        
        console.log('[canReview] Valor final canReview:', canReviewValue);
        setCanReview(canReviewValue);
        setCanReviewChecked(true);
      })
      .catch(err => {
        console.error('[canReview] Erro ao verificar se pode avaliar:', err);
        if (canReviewCheckingRef.current === checkKey) {
          setCanReviewChecked(true);
          setCanReview(true); // Em caso de erro, permitir avaliar
        }
      });
  }, [selectedOrderId, data?.establishment?.id, orderStatus]); // Adicionado orderStatus para verificar quando mudar para delivered

  // Set first category as active when data loads
  useEffect(() => {
    if (data?.categories && data.categories.length > 0 && activeCategory === null) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data?.categories, activeCategory]);

  // Carregar pedidos salvos do localStorage (por establishmentId)
  useEffect(() => {
    if (data?.establishment?.id) {
      const savedOrders = loadOrdersFromStorage(data.establishment.id);
      setUserOrders(savedOrders);
    }
  }, [data?.establishment?.id]);

  // Sincronizar status dos pedidos quando o modal Meus Pedidos é aberto
  // E também periodicamente enquanto o modal estiver aberto
  useEffect(() => {
    const syncOrderStatuses = async () => {
      if (!showOrdersModal || !data?.establishment?.id || userOrders.length === 0) return;
      
      const localStatusMap: Record<string, "sent" | "accepted" | "delivering" | "delivered" | "cancelled"> = {
        'new': 'sent',
        'preparing': 'accepted',
        'ready': 'delivering',
        'completed': 'delivered',
        'cancelled': 'cancelled',
      };
      
      // Buscar status atualizado de cada pedido em andamento
      const ordersToUpdate = userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
      
      if (ordersToUpdate.length === 0) return;
      
      try {
        const updatedOrders = await Promise.all(
          ordersToUpdate.map(async (order) => {
            try {
              // Usar trpcUtils.client para chamada imperativa
              const response = await trpcUtils.client.publicMenu.getOrderByNumber.query({
                orderNumber: order.id,
                establishmentId: data.establishment.id
              });
              
              if (response?.status) {
                const newStatus = localStatusMap[response.status] || order.status;
                return { ...order, status: newStatus };
              }
              return order;
            } catch {
              return order;
            }
          })
        );
        
        // Atualizar o estado com os novos status
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            const updated = updatedOrders.find(u => u.id === order.id);
            return updated || order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });
      } catch (e) {
        console.error('Erro ao sincronizar status dos pedidos:', e);
      }
    };
    
    // Sincronizar imediatamente ao abrir o modal
    syncOrderStatuses();
    
    // Sincronizar a cada 30 segundos enquanto o modal estiver aberto
    // Intervalo maior para evitar rate limiting
    let intervalId: NodeJS.Timeout | null = null;
    if (showOrdersModal) {
      intervalId = setInterval(syncOrderStatuses, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showOrdersModal, data?.establishment?.id]);

  // Refs para o currentOrderNumber e showTrackingModal (usados pelo callback SSE)
  const currentOrderNumberRef = useRef<string | null>(null);
  const showTrackingModalRef = useRef<boolean>(false);
  
  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    currentOrderNumberRef.current = currentOrderNumber;
  }, [currentOrderNumber]);
  
  useEffect(() => {
    showTrackingModalRef.current = showTrackingModal;
  }, [showTrackingModal]);

  // Atualizar callbacks SSE quando showTrackingModal ou currentOrderNumber mudar
  // Isso garante que os callbacks sempre usem os valores mais recentes das refs
  useEffect(() => {
    if (currentOrderNumber && userOrders.length > 0) {
      const handleStatusUpdate = (update: { orderNumber: string; status: string; cancellationReason?: string }) => {
        console.log('[PublicMenu] Atualização SSE recebida (callback atualizado):', update);
        const newStatus = statusMap[update.status] || 'sent';
        
        // Atualizar o pedido no estado local
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order => {
            if (order.id === update.orderNumber) {
              return { ...order, status: newStatus };
            }
            return order;
          });
          // Salvar no localStorage por establishmentId
          if (data?.establishment?.id) {
            saveOrdersToStorage(data.establishment.id, newOrders);
          }
          return newOrders;
        });
        
        // Se o modal de tracking está aberto para este pedido, atualizar diretamente
        console.log('[PublicMenu] Modal aberto:', showTrackingModalRef.current, 'Pedido atual:', currentOrderNumberRef.current, 'Pedido atualizado:', update.orderNumber);
        if (showTrackingModalRef.current && currentOrderNumberRef.current === update.orderNumber) {
          console.log('[PublicMenu] Atualizando orderStatus no modal para:', newStatus);
          setOrderStatus(newStatus);
          if (update.cancellationReason) {
            setCancellationReasonDisplay(update.cancellationReason);
          }
        }
      };
      
      // Atualizar o callback para o pedido atual
      orderSSE.updateCallback(currentOrderNumber, handleStatusUpdate);
    }
  }, [showTrackingModal, currentOrderNumber]);
  
  // Inicializar SSE singleton para pedidos ativos existentes (ao carregar a página)
  // Isso garante que pedidos feitos anteriormente continuem sendo monitorados
  // Usa um estado separado para controlar se já inicializou o SSE
  const [sseInitialized, setSseInitialized] = useState(false);
  
  useEffect(() => {
    // Só inicializar SSE após os pedidos serem carregados do localStorage
    // e apenas uma vez
    if (sseInitialized || userOrders.length === 0) {
      return;
    }
    
    // Pegar os orderNumbers dos pedidos em andamento
    const activeOrders = userOrders.filter(o => 
      o.status !== 'delivered' && o.status !== 'cancelled'
    );
    
    // Se não tem pedidos em andamento, marcar como inicializado mas não conectar
    if (activeOrders.length === 0) {
      setSseInitialized(true);
      return;
    }
    
    console.log(`[PublicMenu] Inicializando SSE para ${activeOrders.length} pedidos ativos`);
    setSseInitialized(true);
    
    // Callback para atualizações de status
    const handleStatusUpdate = (update: { orderNumber: string; status: string; cancellationReason?: string }) => {
      console.log('[PublicMenu] Atualização SSE recebida:', update);
      const newStatus = statusMap[update.status] || 'sent';
      
      // Atualizar o pedido no estado local
      setUserOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          if (order.id === update.orderNumber) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, newOrders);
        }
        return newOrders;
      });
      
      // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
      if (update.status === 'completed' && isLoyaltyLoggedIn) {
        console.log('[PublicMenu] Pedido entregue - atualizando cartão fidelidade');
        loyaltyCardQuery.refetch();
      }
      
      // Se o modal de tracking está aberto para este pedido, atualizar diretamente
      // Usa refs para evitar problemas de closure
      console.log('[PublicMenu] Modal aberto:', showTrackingModalRef.current, 'Pedido atual:', currentOrderNumberRef.current, 'Pedido atualizado:', update.orderNumber);
      if (showTrackingModalRef.current && currentOrderNumberRef.current === update.orderNumber) {
        console.log('[PublicMenu] Atualizando orderStatus no modal para:', newStatus);
        setOrderStatus(newStatus);
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };
    
    // Registrar cada pedido ativo no SSE singleton
    // O singleton garante que apenas UMA conexão seja aberta
    activeOrders.forEach(order => {
      orderSSE.trackOrder(order.id, handleStatusUpdate);
    });
    
    // Cleanup: remover pedidos do tracking quando o componente desmontar
    return () => {
      activeOrders.forEach(order => {
        orderSSE.untrackOrder(order.id);
      });
    };
  }, [userOrders.length, sseInitialized]); // Executar quando pedidos forem carregados do localStorage

  // Efeito separado para adicionar novos pedidos ao SSE quando userOrders muda
  useEffect(() => {
    if (!sseInitialized) return;
    
    const activeOrders = userOrders.filter(o => 
      o.status !== 'delivered' && o.status !== 'cancelled'
    );
    
    // Callback para atualizações de status
    const handleStatusUpdate = (update: { orderNumber: string; status: string; cancellationReason?: string }) => {
      console.log('[PublicMenu] Atualização SSE recebida:', update);
      const newStatus = statusMap[update.status] || 'sent';
      
      // Atualizar o pedido no estado local
      setUserOrders(prevOrders => {
        const newOrders = prevOrders.map(order => {
          if (order.id === update.orderNumber) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        // Salvar no localStorage por establishmentId
        if (data?.establishment?.id) {
          saveOrdersToStorage(data.establishment.id, newOrders);
        }
        return newOrders;
      });
      
      // Se o pedido foi entregue (completed), atualizar o cartão fidelidade
      if (update.status === 'completed' && isLoyaltyLoggedIn) {
        console.log('[PublicMenu] Pedido entregue - atualizando cartão fidelidade');
        loyaltyCardQuery.refetch();
      }
      
      // Se o modal de tracking está aberto para este pedido, atualizar diretamente
      if (showTrackingModalRef.current && currentOrderNumberRef.current === update.orderNumber) {
        console.log('[PublicMenu] Atualizando orderStatus no modal para:', newStatus);
        setOrderStatus(newStatus);
        if (update.cancellationReason) {
          setCancellationReasonDisplay(update.cancellationReason);
        }
      }
    };
    
    // Registrar cada pedido ativo no SSE singleton (o singleton evita duplicatas)
    activeOrders.forEach(order => {
      // Atualizar callback para garantir que use os valores mais recentes
      orderSSE.updateCallback(order.id, handleStatusUpdate);
    });
    
    // NÃO fazer cleanup aqui - o cleanup só deve acontecer quando o componente desmontar
  }, [userOrders, sseInitialized]);

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
      // Removido - modal fecha pelo backdrop
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloquear scroll do body quando modais estão abertos
  useEffect(() => {
    const isAnyModalOpen = showOrdersModal || showTrackingModal || showMobileBag || checkoutStep > 0 || showInfoModal || showCouponModal || showReviewsModal || showRatingModal || selectedProduct !== null || showFullscreenImage || showNavigationModal || showLoyaltyModal || showNeighborhoodModal;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOrdersModal, showTrackingModal, showMobileBag, checkoutStep, showInfoModal, showCouponModal, showReviewsModal, showRatingModal, selectedProduct, showFullscreenImage, showNavigationModal, showLoyaltyModal, showNeighborhoodModal]);

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

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filter products by search query (ignoring accents) with priority sorting
  const filterProducts = (products: NonNullable<typeof data>['products']) => {
    if (!searchQuery.trim()) return products;
    const normalizedQuery = normalizeText(searchQuery);
    
    // Filter products that match the query
    const filtered = products.filter(
      (p) =>
        normalizeText(p.name).includes(normalizedQuery) ||
        (p.description && normalizeText(p.description).includes(normalizedQuery))
    );
    
    // Sort by relevance: 1º name starts with query, 2º name contains query, 3º description contains query
    return filtered.sort((a, b) => {
      const aNameNorm = normalizeText(a.name);
      const bNameNorm = normalizeText(b.name);
      
      const aStartsWith = aNameNorm.startsWith(normalizedQuery);
      const bStartsWith = bNameNorm.startsWith(normalizedQuery);
      const aNameContains = aNameNorm.includes(normalizedQuery);
      const bNameContains = bNameNorm.includes(normalizedQuery);
      
      // Priority 1: Name starts with query
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Priority 2: Name contains query (but doesn't start with)
      if (aNameContains && !bNameContains) return -1;
      if (!aNameContains && bNameContains) return 1;
      
      // Priority 3: Only description contains query (keep original order)
      return 0;
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
  const filteredProducts = filterProducts(products);

  const getProductsByCategory = (categoryId: number) => {
    return filteredProducts.filter((p) => p.categoryId === categoryId);
  };

  // Calcular se o restaurante está aberto baseado nos horários configurados
  const isWithinBusinessHours = () => {
    // Se não temos dados de horários, usar o valor do banco (isOpen)
    if (!businessHoursData || businessHoursData.length === 0) {
      return establishment.isOpen;
    }
    
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes(); // Minutos desde meia-noite
    
    // Buscar horário do dia atual
    const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDay);
    const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1;
    const yesterdayHours = businessHoursData.find(h => h.dayOfWeek === yesterdayDay);
    
    // Função auxiliar para verificar se o horário atravessa meia-noite
    const crossesMidnight = (openTime: string, closeTime: string) => {
      const [openH] = openTime.split(':').map(Number);
      const [closeH] = closeTime.split(':').map(Number);
      return closeH < openH || (closeH === openH && closeTime < openTime);
    };
    
    // Verificar horário de hoje
    if (todayHours?.isActive && todayHours.openTime && todayHours.closeTime) {
      const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
      const openTimeMinutes = openHour * 60 + openMin;
      const closeTimeMinutes = closeHour * 60 + closeMin;
      
      if (crossesMidnight(todayHours.openTime, todayHours.closeTime)) {
        // Horário atravessa meia-noite (ex: 08:00 - 02:00)
        // Está aberto se: hora atual >= abertura (ex: 08:00 até 23:59)
        if (currentTime >= openTimeMinutes) {
          return true;
        }
      } else {
        // Horário normal no mesmo dia (ex: 08:00 - 22:00)
        if (currentTime >= openTimeMinutes && currentTime < closeTimeMinutes) {
          return true;
        }
      }
    }
    
    // Verificar horário de ontem que atravessa meia-noite
    // Ex: Se ontem abriu 08:00-02:00, e agora são 01:00, ainda está aberto
    if (yesterdayHours?.isActive && yesterdayHours.openTime && yesterdayHours.closeTime) {
      if (crossesMidnight(yesterdayHours.openTime, yesterdayHours.closeTime)) {
        const [closeHour, closeMin] = yesterdayHours.closeTime.split(':').map(Number);
        const closeTimeMinutes = closeHour * 60 + closeMin;
        // Está aberto se: hora atual < fechamento (ex: 00:00 até 02:00)
        if (currentTime < closeTimeMinutes) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Verifica se deve reabrir automaticamente (fechamento manual expirou)
  const shouldAutoReopen = (): boolean => {
    if (!establishment.manuallyClosed || !establishment.manuallyClosedAt) return false;
    if (!businessHoursData || businessHoursData.length === 0) return false;
    
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay();
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes();
    const closedAt = new Date(establishment.manuallyClosedAt);
    
    // Encontrar o horário de hoje
    const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDay);
    
    if (!todayHours?.isActive || !todayHours.openTime) return false;
    
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    
    // Se o fechamento foi em um dia anterior e hoje tem horário de abertura que já passou
    const closedDate = new Date(closedAt);
    closedDate.setHours(0, 0, 0, 0);
    const today = new Date(brasiliaDate);
    today.setHours(0, 0, 0, 0);
    
    if (closedDate.getTime() < today.getTime() && currentTime >= openTimeMinutes) {
      return true;
    }
    
    // Se o fechamento foi antes do horário de abertura de hoje e agora já passou o horário
    const closedTimeMinutes = closedAt.getHours() * 60 + closedAt.getMinutes();
    if (closedAt.toDateString() === brasiliaDate.toDateString() && closedTimeMinutes < openTimeMinutes && currentTime >= openTimeMinutes) {
      return true;
    }
    
    return false;
  };
  
  // Valor calculado de se está aberto:
  // Lógica completa:
  // 1. Se manuallyClosed E não deve reabrir automaticamente → Fechado
  // 2. Se manuallyClosed E deve reabrir automaticamente → Aberto (se dentro do horário)
  // 3. Se não manuallyClosed E isOpen (toggle ligado) → Segue horário normal
  // 4. Se não manuallyClosed E !isOpen (toggle desligado) → Fechado manualmente
  const withinHours = isWithinBusinessHours();
  const autoReopen = shouldAutoReopen();
  
  let isOpen = false;
  let isForcedClosed = false;
  
  if (establishment.manuallyClosed && !autoReopen) {
    // Fechado manualmente e não deve reabrir ainda
    isOpen = false;
    isForcedClosed = true;
  } else if (establishment.manuallyClosed && autoReopen) {
    // Deve reabrir automaticamente
    isOpen = withinHours;
    isForcedClosed = false;
  } else if (!establishment.isOpen) {
    // Toggle desligado (fechado manualmente)
    isOpen = false;
    isForcedClosed = withinHours; // Só mostra "fechado manualmente" se estiver dentro do horário
  } else {
    // Toggle ligado - segue horário normal
    isOpen = withinHours;
    isForcedClosed = false;
  }

  // Get opening hours text based on business hours
  const getOpeningText = () => {
    if (isOpen) return null;
    
    // Se não temos dados de horários, mostrar mensagem genérica
    if (!businessHoursData || businessHoursData.length === 0) {
      return "Fechado no momento";
    }
    
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes(); // Minutos desde meia-noite
    
    // Buscar horário do dia atual
    const todayHours = businessHoursData.find(h => h.dayOfWeek === currentDay);
    
    // Se hoje está ativo, verificar se ainda vai abrir hoje
    if (todayHours?.isActive && todayHours.openTime) {
      const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
      const openTimeMinutes = openHour * 60 + openMin;
      
      // Se ainda não chegou o horário de abertura, mostrar "Abriremos hoje às X"
      if (currentTime < openTimeMinutes) {
        return `Fechado – Abriremos hoje às ${todayHours.openTime}`;
      }
    }
    
    // Buscar o próximo dia ativo
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDayHours = businessHoursData.find(h => h.dayOfWeek === nextDay);
      
      if (nextDayHours?.isActive && nextDayHours.openTime) {
        // Se é amanhã (i === 1)
        if (i === 1) {
          return `Fechado hoje – Abriremos amanhã às ${nextDayHours.openTime}`;
        }
        
        // Se é outro dia, mostrar o nome do dia
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return `Fechado – Abriremos ${dayNames[nextDay]} às ${nextDayHours.openTime}`;
      }
    }
    
    // Se não encontrou nenhum dia ativo
    return "Fechado no momento";
  };

  // Get service types
  const getServiceTypes = () => {
    const hasDelivery = establishment.allowsDelivery;
    const hasPickup = establishment.allowsPickup;
    
    if (hasDelivery && hasPickup) {
      return "Delivery e Retirada";
    } else if (hasDelivery) {
      return "Somente Delivery";
    } else if (hasPickup) {
      return "Somente Retirada";
    }
    return "";
  };

  // Determina se deve mostrar ícone de moto ou caixa
  const isDeliveryOnly = () => establishment.allowsDelivery;
  const isPickupOnly = () => !establishment.allowsDelivery && establishment.allowsPickup;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 pr-0">
          <div className="flex items-center gap-4">
            {/* Logo do Restaurante - usa placeholder até ter logo configurado */}
            <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0" style={{width: '37px', height: '37px'}}>
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>

            {/* Search Bar */}
            <div className="flex-1 min-w-[180px] max-w-xl relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full pl-10 pr-8 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-colors placeholder:text-gray-400"
                  style={{height: '37px'}}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown de pré-visualização da busca */}
              {isSearchFocused && searchQuery.trim() && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-[60] p-2 space-y-1">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct({
                          id: product.id,
                          name: product.name,
                          description: product.description,
                          price: product.price,
                          images: product.images,
                          hasStock: product.hasStock
                        });
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left bg-white rounded-lg border border-gray-100 border-l-[3px] border-l-red-500"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
                        )}
                      </div>
                      {Number(product.price) > 0 && (
                        <div className="flex-shrink-0 text-sm font-semibold text-red-600">
                          R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredProducts.length > 10 && (
                    <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 rounded-lg">
                      +{filteredProducts.length - 10} outros resultados
                    </div>
                  )}
                </div>
              )}
              
              {/* Mensagem de nenhum resultado */}
              {isSearchFocused && searchQuery.trim() && filteredProducts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[60]">
                  <p className="text-sm text-gray-500 text-center">Nenhum produto encontrado</p>
                </div>
              )}
            </div>

            {/* Spacer to push navigation to the right edge - hidden on mobile */}
            <div className="hidden md:flex flex-1" />

            {/* Navigation Menu - aligned to right edge of cover image */}
            <nav className="hidden md:flex items-center gap-6 pr-4">
              {loyaltyEnabled?.enabled && (
                <button 
                  className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
                  onClick={() => {
                    setShowLoyaltyModal(true);
                    if (!isLoyaltyLoggedIn) {
                      setLoyaltyStep('login');
                    } else {
                      setLoyaltyStep('card');
                      // Recarregar dados do cartão ao abrir o modal
                      loyaltyCardQuery.refetch();
                    }
                  }}
                >
                  <Gift className="h-4 w-4" />
                  <span>Fidelidade</span>
                </button>
              )}
              <button 
                className="flex items-center gap-1.5 text-gray-600 font-medium text-sm hover:text-gray-900 transition-colors relative pr-3"
                onClick={() => setShowOrdersModal(true)}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Pedidos</span>
                {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                  <span className="absolute -top-1.5 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
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
              <UtensilsCrossed className="h-16 w-16 text-red-500/30" />
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Info Block */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-4 pb-4">
          {/* Badge de Entrega/Retirada - Aba de pasta atrás do card (mobile) */}
          {getServiceTypes() && (
            <div className="md:hidden absolute top-[116px] right-4 z-0" style={{marginTop: '-29px', marginRight: '-2px', paddingRight: '0px'}}>
              {/* Aba principal - fica atrás do card com efeito pulsante */}
              <div className="animate-delivery-pulse bg-red-500 text-white font-bold rounded-t-xl shadow-md flex items-center gap-1.5" style={{fontSize: '11px', paddingTop: '0px', paddingRight: '14px', paddingBottom: '10px', paddingLeft: '10px', marginTop: '21px', height: '33px', borderRadius: '12px'}}>
                {isPickupOnly() ? (
                  <Package className="h-3.5 w-3.5" />
                ) : (
                  <Bike className="h-3.5 w-3.5 animate-bike-ride" />
                )}
                {getServiceTypes()}
                {/* Separador e Tempo de Entrega */}
                {establishment.deliveryTimeEnabled && establishment.deliveryTimeMin && establishment.deliveryTimeMax && (
                  <>
                    <span className="mx-1 opacity-60">|</span>
                    <Clock className="h-3 w-3" />
                    <span>{establishment.deliveryTimeMin}-{establishment.deliveryTimeMax}min</span>
                  </>
                )}
                {/* Separador e Pedido Mínimo */}
                {establishment.minimumOrderEnabled && establishment.minimumOrderValue && Number(establishment.minimumOrderValue) > 0 && (
                  <>
                    <span className="mx-1 opacity-60">|</span>
                    <ShoppingBag className="h-3 w-3" />
                    <span>R${Number(establishment.minimumOrderValue).toFixed(0)}</span>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Profile Image with Note Balloon */}
          <div className="relative z-10 ml-4 md:ml-6">
            {/* Balão de Nota - exibe apenas se existir nota e não estiver expirada */}
            {establishment.publicNote && (
              // Verifica se a nota não expirou (usa noteExpiresAt se disponível, senão fallback para 24h)
              establishment.noteExpiresAt 
                ? new Date().getTime() < new Date(establishment.noteExpiresAt).getTime()
                : establishment.publicNoteCreatedAt && new Date().getTime() - new Date(establishment.publicNoteCreatedAt).getTime() < 24 * 60 * 60 * 1000
            ) && (
              <div className="absolute -top-14 md:-top-16 left-0 z-20 animate-float-balloon">
                <div className="relative">
                  {/* Balão estilo bolha com estilo personalizado */}
                  <div className={cn(
                    "rounded-[20px] px-3 py-1.5 shadow-md max-w-[140px] md:max-w-[160px]",
                    (!establishment.noteStyle || establishment.noteStyle === "default") && "bg-white border border-gray-200",
                    establishment.noteStyle === "sunset" && "bg-gradient-to-r from-orange-400 to-pink-500",
                    establishment.noteStyle === "ocean" && "bg-gradient-to-r from-cyan-400 to-blue-500",
                    establishment.noteStyle === "forest" && "bg-gradient-to-r from-green-400 to-emerald-500",
                    establishment.noteStyle === "purple" && "bg-gradient-to-r from-purple-400 to-pink-500",
                    establishment.noteStyle === "fire" && "bg-gradient-to-r from-red-500 to-orange-500",
                    establishment.noteStyle === "gold" && "bg-gradient-to-r from-yellow-400 to-amber-500",
                    establishment.noteStyle === "night" && "bg-gradient-to-r from-gray-700 to-gray-900",
                    establishment.noteStyle === "candy" && "bg-gradient-to-r from-pink-400 to-rose-400",
                    establishment.noteStyle === "mint" && "bg-gradient-to-r from-teal-400 to-cyan-400",
                    establishment.noteStyle === "peach" && "bg-gradient-to-r from-orange-300 to-rose-300",
                    establishment.noteStyle === "royal" && "bg-gradient-to-r from-indigo-500 to-purple-600"
                  )}>
                    <p className={cn(
                      "text-xs text-center leading-tight break-words",
                      (!establishment.noteStyle || establishment.noteStyle === "default") ? "text-gray-700" : 
                      establishment.noteStyle === "peach" ? "text-gray-800" : "text-white"
                    )}>{establishment.publicNote}</p>
                  </div>
                  {/* Bico do balão em formato de balão de pensamento - círculo maior à esquerda, menor à direita */}
                  <div className={cn(
                    "absolute -bottom-2.5 left-4 w-3.5 h-3.5 rounded-full shadow-sm",
                    (!establishment.noteStyle || establishment.noteStyle === "default") && "bg-white border border-gray-200",
                    establishment.noteStyle === "sunset" && "bg-pink-500",
                    establishment.noteStyle === "ocean" && "bg-blue-500",
                    establishment.noteStyle === "forest" && "bg-emerald-500",
                    establishment.noteStyle === "purple" && "bg-pink-500",
                    establishment.noteStyle === "fire" && "bg-orange-500",
                    establishment.noteStyle === "gold" && "bg-amber-500",
                    establishment.noteStyle === "night" && "bg-gray-900",
                    establishment.noteStyle === "candy" && "bg-rose-400",
                    establishment.noteStyle === "mint" && "bg-cyan-400",
                    establishment.noteStyle === "peach" && "bg-rose-300",
                    establishment.noteStyle === "royal" && "bg-purple-600"
                  )}></div>
                  <div className={cn(
                    "absolute -bottom-5 left-7 w-2 h-2 rounded-full shadow-sm",
                    (!establishment.noteStyle || establishment.noteStyle === "default") && "bg-white border border-gray-200",
                    establishment.noteStyle === "sunset" && "bg-pink-500",
                    establishment.noteStyle === "ocean" && "bg-blue-500",
                    establishment.noteStyle === "forest" && "bg-emerald-500",
                    establishment.noteStyle === "purple" && "bg-pink-500",
                    establishment.noteStyle === "fire" && "bg-orange-500",
                    establishment.noteStyle === "gold" && "bg-amber-500",
                    establishment.noteStyle === "night" && "bg-gray-900",
                    establishment.noteStyle === "candy" && "bg-rose-400",
                    establishment.noteStyle === "mint" && "bg-cyan-400",
                    establishment.noteStyle === "peach" && "bg-rose-300",
                    establishment.noteStyle === "royal" && "bg-purple-600"
                  )}></div>
                </div>
              </div>
            )}
            
            {establishment.logo ? (
              <img
                src={establishment.logo}
                alt={establishment.name}
                className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover border-4 border-white shadow-lg bg-white"
              />
            ) : (
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center border-4 border-white shadow-lg">
                <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 bg-white rounded-xl p-4 md:p-5 shadow-sm md:ml-4 relative z-[45]" style={{paddingBottom: '4px'}}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                {/* Restaurant Name, Rating and Share */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[180px] md:max-w-none">
                      {establishment.name}
                    </h1>
                    {/* Rating - clicável para abrir modal de avaliações */}
                    <div className="relative flex-shrink-0" ref={ratingTooltipRef}>
                      <button
                        onClick={() => setShowReviewsModal(true)}
                        className="flex items-center gap-0.5 hover:bg-gray-100 rounded-lg px-1.5 py-0.5 transition-colors cursor-pointer" style={{width: '49px', height: '22px'}}
                      >
                        {/* Ícone de estrela único */}
                        <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs md:text-sm font-semibold text-gray-800">
                          {establishment.rating ? Number(establishment.rating).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500 hidden sm:inline">
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
                      <button 
                        onClick={() => setShowNavigationModal(true)}
                        className="flex items-center gap-1 min-w-0 flex-shrink hover:text-red-500 transition-colors cursor-pointer group"
                        title="Ver opções de navegação"
                      >
                        <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 group-hover:text-red-500" />
                        <span className="truncate max-w-[180px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-none underline-offset-2 group-hover:underline">
                          {establishment.street}
                          {establishment.number && `, ${establishment.number}`}
                          {establishment.neighborhood && ` - ${establishment.neighborhood}`}
                          {establishment.city && ` - ${establishment.city}`}
                        </span>
                      </button>
                      <span className="text-gray-400 flex-shrink-0">•</span>
                    </>
                  )}
                  <button 
                    onClick={() => setShowInfoModal(true)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors flex-shrink-0"
                  >
                    <Info className="h-4 w-4" style={{width: '14px', height: '14px'}} />
                    Informações
                  </button>
                </div>

                {/* Status and Service Types */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Open/Closed Status */}
                  {isOpen ? (
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

                  {/* Tempo de Entrega - apenas desktop */}
                  {establishment.deliveryTimeEnabled && establishment.deliveryTimeMin && establishment.deliveryTimeMax && (
                    <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200" style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}>
                      <Clock className="h-3 w-3" />
                      {establishment.deliveryTimeMin} - {establishment.deliveryTimeMax} min
                    </span>
                  )}

                  {/* Pedido Mínimo - apenas desktop */}
                  {establishment.minimumOrderEnabled && establishment.minimumOrderValue && Number(establishment.minimumOrderValue) > 0 && (
                    <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200" style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}>
                      <ShoppingBag className="h-3 w-3" />
                      R$ {Number(establishment.minimumOrderValue).toFixed(2).replace('.', ',')}
                    </span>
                  )}

                  {/* Service Types Badge - apenas desktop (mobile usa badge flutuante) */}
                  {getServiceTypes() && (
                    <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200" style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}>
                      {isPickupOnly() ? (
                        <Package className="h-3 w-3" />
                      ) : (
                        <Bike className="h-3 w-3 animate-bike-ride" />
                      )}
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
                    <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[60] min-w-[160px]">
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
                    <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wide">
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
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto disponível no momento.</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[140px]">
              {/* Taxa de entrega - reflete configuração do restaurante */}
              <div className={cn(
                "bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 border-l-[3px]",
                establishment.deliveryFeeType === "free" ? "border-l-red-400" : 
                establishment.deliveryFeeType === "fixed" ? "border-l-red-400" : "border-l-red-400"
              )} style={{height: '78px', borderRadius: '12px'}}>
                <div className="flex h-full">
                  {/* Conteúdo */}
                  <div className="flex-1 px-4 py-3 flex items-center justify-between">
                    {/* Ícone e texto */}
                    <div className="flex items-center gap-3">
                      {/* Ícone de caminhão com badge */}
                      <div className="relative">
                        <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-red-500" />
                        </div>
                        {establishment.deliveryFeeType === "free" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">0</span>
                          </div>
                        )}
                      </div>
                      {/* Texto */}
                      <div>
                        <span className="text-sm text-gray-500 block">
                          {establishment.deliveryFeeType === "free" 
                            ? "Taxa de entrega" 
                            : establishment.deliveryFeeType === "fixed"
                              ? "Taxa de entrega"
                              : "Taxa por bairro"
                          }
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {establishment.deliveryFeeType === "free" 
                            ? "R$ 0,00" 
                            : establishment.deliveryFeeType === "fixed" && establishment.deliveryFeeFixed
                              ? `R$ ${Number(establishment.deliveryFeeFixed).toFixed(2).replace('.', ',')}`
                              : selectedNeighborhood
                                ? `R$ ${Number(selectedNeighborhood.fee).toFixed(2).replace('.', ',')}`
                                : "A calcular"
                          }
                        </span>
                      </div>
                    </div>
                    {/* Badge Grátis */}
                    {establishment.deliveryFeeType === "free" && (
                      <button className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all">
                        Grátis
                      </button>
                    )}
                    {establishment.deliveryFeeType === "fixed" && establishment.deliveryFeeFixed && (
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl">
                        Fixo
                      </span>
                    )}
                    {establishment.deliveryFeeType === "byNeighborhood" && (
                      <div ref={neighborhoodDropdownRef} className="relative">
                        <button 
                          onClick={() => setShowNeighborhoodModal(!showNeighborhoodModal)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                        >
                          {selectedNeighborhood ? (
                            <>Alterar <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNeighborhoodModal ? 'rotate-180' : ''}`} /></>
                          ) : (
                            <>Selecionar <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNeighborhoodModal ? 'rotate-180' : ''}`} /></>
                          )}
                        </button>
                        
                      </div>
                    )}
                  </div>
                </div>
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
                              <p className="font-medium text-gray-900 text-sm truncate flex-1">{item.quantity}x {item.name}</p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {itemTotal > 0 && (
                                  <span className="text-sm font-semibold text-red-500">
                                    {formatPrice(itemTotal)}
                                  </span>
                                )}
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
                            {item.complements.length > 0 && (
                              <div className="mt-1">
                                {item.complements.map((c) => (
                                  <div key={c.id} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">+ {c.name}</span>
                                    <span className="text-red-500 font-medium mr-7">{formatPrice(c.price)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
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
                  const deliveryFee = establishment.deliveryFeeType === "free" 
                    ? 0 
                    : establishment.deliveryFeeType === "fixed" 
                      ? Number(establishment.deliveryFeeFixed || 0)
                      : selectedNeighborhood 
                        ? Number(selectedNeighborhood.fee) 
                        : 0;
                  const total = Math.max(0, subtotal - discount + deliveryFee);
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
                        <span className={establishment.deliveryFeeType === "free" ? "text-green-600 font-medium" : "text-gray-400"}>
                          {establishment.deliveryFeeType === "free" 
                            ? "Grátis" 
                            : establishment.deliveryFeeType === "fixed" && establishment.deliveryFeeFixed
                              ? `R$ ${Number(establishment.deliveryFeeFixed).toFixed(2).replace('.', ',')}`
                              : selectedNeighborhood
                                ? `R$ ${Number(selectedNeighborhood.fee).toFixed(2).replace('.', ',')}`
                                : "A calcular"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">{formatPrice(total)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Alerta de Pedido Mínimo - Desktop */}
                {(() => {
                  const subtotalDesktop = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                    return sum + (Number(item.price) + complementsTotal) * item.quantity;
                  }, 0);
                  const minOrderValue = Number(establishment?.minimumOrderValue || 0);
                  const minOrderEnabled = establishment?.minimumOrderEnabled || false;
                  const isBelowMinimum = minOrderEnabled && subtotalDesktop < minOrderValue;
                  const amountNeeded = minOrderValue - subtotalDesktop;
                  
                  return isBelowMinimum && cart.length > 0 ? (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <ShoppingBag className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-600 text-sm">Pedido mínimo: {formatPrice(minOrderValue)}</p>
                          <p className="text-xs text-red-500 mt-0.5">Faltam {formatPrice(amountNeeded)} para atingir o mínimo</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
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

                {/* Button - Desktop */}
                {(() => {
                  const subtotalBtn = cart.reduce((sum, item) => {
                    const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                    return sum + (Number(item.price) + complementsTotal) * item.quantity;
                  }, 0);
                  const minOrderValueBtn = Number(establishment?.minimumOrderValue || 0);
                  const minOrderEnabledBtn = establishment?.minimumOrderEnabled || false;
                  const isBelowMinBtn = minOrderEnabledBtn && subtotalBtn < minOrderValueBtn;
                  
                  // Verificar se precisa selecionar bairro
                  const needsNeighborhoodSelection = establishment?.deliveryFeeType === 'byNeighborhood' && !selectedNeighborhood;
                  
                  return (
                    <button 
                      disabled={cart.length === 0 || !isOpen || isBelowMinBtn}
                      onClick={() => {
                        if (cart.length > 0 && isOpen && !isBelowMinBtn) {
                          // Validar seleção de bairro se necessário
                          if (needsNeighborhoodSelection) {
                            setReopenBagAfterNeighborhood(true);
                            setShowNeighborhoodModal(true);
                            return;
                          }
                          setOrderSent(false);
                          setOrderError(null); // Limpar erro anterior
                          setCheckoutStep(1);
                        }
                      }}
                      className={`w-full mt-4 py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                        !isOpen
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : cart.length === 0 
                            ? 'bg-red-400/80 text-white cursor-not-allowed'
                            : isBelowMinBtn
                              ? 'border-2 border-red-500 text-red-500 bg-white hover:bg-red-50'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {!isOpen ? (
                        <>
                          <Clock className="h-5 w-5" />
                          Restaurante Fechado
                        </>
                      ) : cart.length === 0 ? (
                        'Sacola vazia'
                      ) : isBelowMinBtn ? (
                        <>
                          <Plus className="h-5 w-5" />
                          Adicionar mais itens
                        </>
                      ) : (
                        'Finalizar pedido'
                      )}
                    </button>
                  );
                })()}
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
          {loyaltyEnabled?.enabled && (
            <button 
              className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500"
              onClick={() => {
                setShowLoyaltyModal(true);
                if (!isLoyaltyLoggedIn) {
                  setLoyaltyStep('login');
                } else {
                  setLoyaltyStep('card');
                  // Recarregar dados do cartão ao abrir o modal
                  loyaltyCardQuery.refetch();
                }
              }}
            >
              <Gift className="h-5 w-5" />
              <span className="text-xs font-medium">Fidelidade</span>
            </button>
          )}
          <button 
            className="flex flex-col items-center gap-0.5 px-4 py-2 text-gray-500 relative"
            onClick={() => setShowOrdersModal(true)}
          >
            <ClipboardList className="h-5 w-5" />
            {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
              <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Informações</h2>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6" style={{backgroundColor: '#ffffff'}}>
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
              const isComplementImage = !!selectedComplementImage;
              
              if (displayImage) {
                return (
                  <div className="relative w-full h-[215px] sm:h-60 md:h-72 flex-shrink-0">
                    <img
                      src={displayImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover cursor-pointer transition-all duration-300"
                      onClick={() => { 
                        if (!isComplementImage) {
                          setFullscreenImageIndex(0); 
                          setShowFullscreenImage(true); 
                        }
                      }}
                    />
                    {/* Ícone de olho para indicar que pode clicar (apenas para imagem do produto) */}
                    {!isComplementImage && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => { setFullscreenImageIndex(0); setShowFullscreenImage(true); }}
                      >
                        <div className="bg-white/80 rounded-full p-3 shadow-lg">
                          <Eye className="h-6 w-6 text-gray-700" />
                        </div>
                      </div>
                    )}

                    {/* Indicador de quantidade de fotos (apenas para imagem do produto) */}
                    {!isComplementImage && selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span>1/{selectedProduct.images.length}</span>
                      </div>
                    )}
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
                  <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-white/80 animate-placeholder-pulse" />
                  <button 
                    onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              );
            })()}

            {/* Header sem imagem - removido, agora usa placeholder */}
            {false && (
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
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                {Number(selectedProduct.price) > 0 && (
                  <p className="text-lg font-semibold text-red-500 mt-1">
                    {formatPrice(selectedProduct.price)}
                  </p>
                )}
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
                            const hasImage = !!(item as any).imageUrl;
                            
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
                                      const itemImageUrl = (item as any).imageUrl;
                                      
                                      setSelectedComplements((prev) => {
                                        const newMap = new Map(prev);
                                        const currentSet = new Set(prev.get(group.id) || []);
                                        
                                        if (isRadio) {
                                          // Radio: substitui a seleção
                                          newMap.set(group.id, new Set([item.id]));
                                          // Atualizar imagem do complemento se tiver
                                          if (itemImageUrl) {
                                            setSelectedComplementImage(itemImageUrl);
                                          } else {
                                            setSelectedComplementImage(null);
                                          }
                                        } else {
                                          // Checkbox: toggle
                                          if (currentSet.has(item.id)) {
                                            currentSet.delete(item.id);
                                            // Se desmarcar, voltar para imagem do produto
                                            if (itemImageUrl && selectedComplementImage === itemImageUrl) {
                                              setSelectedComplementImage(null);
                                            }
                                          } else if (currentSet.size < group.maxQuantity) {
                                            currentSet.add(item.id);
                                            // Atualizar imagem do complemento se tiver
                                            if (itemImageUrl) {
                                              setSelectedComplementImage(itemImageUrl);
                                            }
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
                const isStoreOpen = isOpen;
                
                // Verificar se item tem preço zero e nenhum complemento selecionado
                const hasZeroPrice = Number(selectedProduct.price) === 0;
                const hasSelectedComplements = selectedComplementsList.length > 0;
                const canAddZeroPriceItem = !hasZeroPrice || hasSelectedComplements;
                
                const canAddToCart = requiredGroupsMet && isStoreOpen && canAddZeroPriceItem;
                
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
                      
                      // Verificar se é o primeiro item (sacola vazia) para abrir automaticamente
                      const wasCartEmpty = cart.length === 0;
                      
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
                      
                      // Abrir sacola automaticamente apenas no primeiro item quando auto-open está habilitado
                      if (wasCartEmpty && bagAutoOpenEnabled) {
                        setShowMobileBag(true);
                      }
                      
                      // Limpar seleções
                      setSelectedComplements(new Map());
                      setProductObservation("");
                      setProductQuantity(1);
                      setSelectedComplementImage(null);
                      setSelectedProduct(null);
                    }}
                    disabled={!canAddToCart}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      canAddToCart 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!isStoreOpen ? (
                      <>
                        <Clock className="h-5 w-5" />
                        <span>Restaurante Fechado</span>
                      </>
                    ) : hasZeroPrice && !hasSelectedComplements ? (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>Escolha uma opção</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span className="hidden xs:inline">Adicionar</span>
                        <span>{formatPrice(totalPrice)}</span>
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
          />
          
          {/* Modal de Checkout Unificado - Bottom Sheet no mobile */}
          <div className="relative w-full md:w-[480px] md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header com Título */}
            <div className="flex-shrink-0 bg-white border-b border-gray-300 px-6 py-4 rounded-t-2xl" style={{height: '68px'}}>
              {/* Título e Botão Fechar */}
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                  {checkoutStep > 1 && (
                    <button
                      onClick={() => setCheckoutStep(checkoutStep - 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                  )}
                  <div className="p-2 bg-red-100 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {checkoutStep === 1 && 'Resumo do Pedido'}
                    {checkoutStep === 2 && 'Tipo de Entrega'}
                    {checkoutStep === 3 && 'Confirmar Endereço'}
                    {checkoutStep === 4 && 'Seus Dados'}
                    {checkoutStep === 5 && 'Confirmação'}
                  </h2>
                </div>
                <button 
                  onClick={() => setCheckoutStep(0)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Indicador de Progresso */}
            <div className="flex-shrink-0 bg-white px-6 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => step < checkoutStep && setCheckoutStep(step)}
                      disabled={step >= checkoutStep}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        checkoutStep >= step 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      } ${step < checkoutStep ? 'cursor-pointer hover:ring-2 hover:ring-red-300' : ''}`}
                    >
                      {checkoutStep > step ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step
                      )}
                    </button>
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
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                {/* Lista de Itens */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 text-sm">Itens do pedido</h3>
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900 text-sm">{item.quantity}x {item.name}</p>
                          {Number(item.price) * item.quantity > 0 && (
                            <p className="font-semibold text-red-500 text-sm">{formatPrice(Number(item.price) * item.quantity)}</p>
                          )}
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-1">
                            {item.complements.map((c) => (
                              <div key={c.id} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">+ {c.name}</span>
                                <span className="text-red-500 font-medium">{formatPrice(c.price)}</span>
                              </div>
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
                    const deliveryFee = establishment.deliveryFeeType === "free" 
                      ? 0 
                      : establishment.deliveryFeeType === "fixed" 
                        ? Number(establishment.deliveryFeeFixed || 0)
                        : selectedNeighborhood 
                          ? Number(selectedNeighborhood.fee) 
                          : 0;
                    const total = Math.max(0, subtotal - discount + deliveryFee);
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
                          <span className={establishment.deliveryFeeType === "free" ? "text-green-600 font-medium" : "text-gray-400"}>
                            {establishment.deliveryFeeType === "free" 
                              ? "Grátis" 
                              : establishment.deliveryFeeType === "fixed" && establishment.deliveryFeeFixed
                                ? `R$ ${Number(establishment.deliveryFeeFixed).toFixed(2).replace('.', ',')}`
                                : selectedNeighborhood
                                  ? `R$ ${Number(selectedNeighborhood.fee).toFixed(2).replace('.', ',')}`
                                  : "A calcular"
                            }
                          </span>
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                    rows={2}
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
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
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
                          <label className="block text-xs font-medium text-gray-600 mb-1">Rua <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                            placeholder="Nome da rua"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Número <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={deliveryAddress.number}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setDeliveryAddress({...deliveryAddress, number: value});
                            }}
                            placeholder="Nº"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bairro <span className="text-red-500">*</span></label>
                        {selectedNeighborhood && establishment.deliveryFeeType === 'byNeighborhood' ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                              {selectedNeighborhood.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReopenBagAfterNeighborhood(true);
                                setCheckoutStep(0);
                                setShowNeighborhoodModal(true);
                              }}
                              className="px-3 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Alterar bairro
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={deliveryAddress.neighborhood}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                            placeholder="Nome do bairro"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                        )}
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
                          <div className="relative">
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
                                  
                                  // Validar se o valor do troco é maior que o total
                                  const numericValue = Number(value) / 100;
                                  // Calcular total do carrinho para validação
                                  const cartTotal = cart.reduce((sum, item) => {
                                    const itemTotal = parseFloat(item.price) * item.quantity;
                                    const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                                    return sum + itemTotal + complementsTotal;
                                  }, 0) - (appliedCoupon?.discount || 0);
                                  
                                  if (numericValue > 0 && numericValue <= cartTotal) {
                                    setChangeAmountError("O valor do troco deve ser maior que o total do pedido (R$ " + cartTotal.toFixed(2).replace('.', ',') + ")");
                                  } else {
                                    setChangeAmountError(null);
                                  }
                                } else {
                                  setChangeAmount("");
                                  setChangeAmountError(null);
                                }
                              }}
                              placeholder="0,00"
                              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                                changeAmountError 
                                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50' 
                                  : 'border-gray-200 focus:ring-red-500/20 focus:border-red-500'
                              }`}
                            />
                            {changeAmountError && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {changeAmountError && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {changeAmountError}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">Deixe em branco se não precisar de troco</p>
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
                {(() => {
                  const isAddressValid = deliveryType === 'pickup' || (
                    deliveryAddress.street.trim() !== '' &&
                    deliveryAddress.number.trim() !== '' &&
                    deliveryAddress.neighborhood.trim() !== ''
                  );
                  return (
                    <button
                      onClick={() => {
                        if (!isAddressValid) {
                          alert('Por favor, preencha todos os campos obrigatórios do endereço (Rua, Número e Bairro).');
                          return;
                        }
                        setCheckoutStep(3);
                      }}
                      className={`w-full py-3.5 font-semibold rounded-xl transition-colors ${
                        isAddressValid
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Próximo
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

            {/* Modal 3 - Resumo Final */}
            {checkoutStep === 3 && (
              <div className="flex flex-col flex-1 overflow-hidden">

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                {/* Itens */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="font-bold text-gray-900">Itens</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-800 font-medium">{item.quantity}x {item.name}</span>
                          {Number(item.price) * item.quantity > 0 && (
                            <span className="text-red-500 font-semibold ml-2">{formatPrice(Number(item.price) * item.quantity)}</span>
                          )}
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-1">
                            {item.complements.map((c, cIdx) => (
                              <div key={cIdx} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">+ {c.name}</span>
                                <span className="text-red-500 font-medium">{formatPrice(c.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-xs text-gray-400 mt-0.5">Obs: {item.observation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Entrega */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-gray-900">Entrega</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-800 font-medium">
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
                </div>

                {/* Pagamento */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="font-bold text-gray-900">Pagamento</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-800 font-medium">
                      {paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "card" ? "Cartão" : "Pix"}
                    </p>
                    {paymentMethod === "cash" && changeAmount && (
                      <p className="text-sm text-gray-500 mt-1">Troco para: R$ {changeAmount}</p>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {orderObservation && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <h3 className="font-bold text-gray-900">Observações</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">{orderObservation}</p>
                    </div>
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
                    const deliveryFee = establishment.deliveryFeeType === "free" 
                      ? 0 
                      : establishment.deliveryFeeType === "fixed" 
                        ? Number(establishment.deliveryFeeFixed || 0)
                        : selectedNeighborhood 
                          ? Number(selectedNeighborhood.fee) 
                          : 0;
                    const total = Math.max(0, subtotal - discount + deliveryFee);
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
                        {deliveryType === 'delivery' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Taxa de entrega</span>
                            <span className={establishment.deliveryFeeType === "free" ? "text-green-600 font-medium" : "text-gray-600"}>
                              {establishment.deliveryFeeType === "free" 
                                ? "Grátis" 
                                : formatPrice(deliveryFee)}
                            </span>
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
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Digite seu nome"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${15 - customerInfo.name.length <= 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {15 - customerInfo.name.length} restantes
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={16}
                    value={(() => {
                      // Formatar para exibição: (DDD) 9 9999-9999
                      const digits = customerInfo.phone.replace(/\D/g, "");
                      if (digits.length === 0) return "";
                      if (digits.length <= 2) return `(${digits}`;
                      if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
                      if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
                      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                    })()}
                    onChange={(e) => {
                      // Extrair apenas números e limitar a 11 dígitos (DDD + 9 dígitos)
                      const digits = e.target.value.replace(/\D/g, "");
                      if (digits.length <= 11) {
                        setCustomerInfo({...customerInfo, phone: digits});
                      }
                    }}
                    placeholder="(34) 9 9999-9999"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => {
                    setOrderError(null); // Limpar erro anterior ao avançar
                    setCheckoutStep(5);
                  }}
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
              <div className={`overflow-y-auto overscroll-contain p-6 ${!orderSent ? 'flex-1' : ''}`}>
                {orderError ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 mb-4">
                      Não foi possível enviar o pedido
                    </h3>
                    <p className="text-gray-600">
                      {orderError}
                    </p>
                  </div>
                ) : !orderSent ? (
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
                    <h3 className="text-2xl font-bold text-green-600 mb-2">
                      Pedido enviado com sucesso!
                    </h3>
                    {currentOrderNumber && (
                      <p className="text-xl font-semibold text-gray-800 mb-4">
                        Número do pedido: <span className="text-primary">{currentOrderNumber}</span>
                      </p>
                    )}
                    <p className="text-gray-600">
                      Seu pedido foi recebido e está sendo processado.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {orderSent ? (
              <div className="flex-shrink-0 border-t px-6 py-4">
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
              ) : (
              <div className="flex-shrink-0 border-t px-6 py-4">
                <button
                  onClick={() => {
                    if (isSendingOrder || !establishment || !isOpen) return;
                    
                    // Validar valor do troco antes de enviar
                    if (paymentMethod === 'cash' && changeAmount) {
                      const changeValue = parseFloat(changeAmount.replace(/\./g, '').replace(',', '.'));
                      const orderTotal = cart.reduce((sum, item) => {
                        const itemTotal = parseFloat(item.price) * item.quantity;
                        const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                        return sum + itemTotal + complementsTotal;
                      }, 0) - (appliedCoupon?.discount || 0);
                      
                      if (changeValue <= orderTotal) {
                        setChangeAmountError("O valor do troco deve ser maior que o total do pedido (R$ " + orderTotal.toFixed(2).replace('.', ',') + ")");
                        return;
                      }
                    }
                    
                    setIsSendingOrder(true);
                    
                    // Delay de 3 segundos para mostrar loading
                    setTimeout(() => {
                    // Calcular totais
                    const subtotal = cart.reduce((sum, item) => {
                      const itemTotal = parseFloat(item.price) * item.quantity;
                      const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                      return sum + itemTotal + complementsTotal;
                    }, 0);
                    
                    // Calcular desconto do cupom
                    const discount = appliedCoupon?.discount || 0;
                    
                    // Calcular taxa de entrega
                    const deliveryFeeValue = establishment.deliveryFeeType === "free" 
                      ? 0 
                      : establishment.deliveryFeeType === "fixed" 
                        ? Number(establishment.deliveryFeeFixed || 0)
                        : selectedNeighborhood 
                          ? Number(selectedNeighborhood.fee) 
                          : 0;
                    const total = Math.max(0, subtotal - discount + deliveryFeeValue);
                    
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
                      deliveryFee: deliveryFeeValue.toFixed(2),
                      discount: discount.toFixed(2),
                      total: total.toFixed(2),
                      notes: orderObservation || undefined,
                      changeAmount: paymentMethod === 'cash' && changeAmount ? changeAmount.replace(/\./g, '').replace(',', '.') : undefined,
                      couponCode: appliedCoupon?.code || undefined,
                      couponId: appliedCoupon?.id || undefined,
                      loyaltyCardId: appliedCoupon?.loyaltyCardId || undefined,
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
                    }, 3000); // Delay de 3 segundos
                  }}
                  disabled={isSendingOrder || !isOpen || !!changeAmountError}
                  className={`w-full py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    !isOpen
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : changeAmountError
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isSendingOrder 
                          ? 'bg-green-400 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600'
                  } ${isOpen && !changeAmountError ? 'text-white' : ''}`}
                >
                  {!isOpen ? (
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
        <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCouponModal(false)}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Ticket className="h-5 w-5 text-red-500" />
                </div>
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
            <div className="p-4 sm:p-6" style={{backgroundColor: '#ffffff'}}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Digite o código do cupom"
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase"
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
                  className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="relative w-full md:w-[480px] md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-300 px-6 h-[68px] flex items-center justify-between rounded-t-2xl md:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Sua Sacola</h2>
              </div>
              <button 
                onClick={() => setShowMobileBag(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{backgroundColor: '#ffffff'}}>
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
                          {parseFloat(item.price) * item.quantity > 0 && (
                            <span className="text-red-500 font-semibold ml-2">
                              R$ {(parseFloat(item.price) * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                        {item.complements.length > 0 && (
                          <div className="mt-1">
                            {item.complements.map((c, cIdx) => (
                              <div key={cIdx} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">+ {c.name}</span>
                                <span className="text-red-500 font-medium">{formatPrice(c.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.observation && (
                          <p className="text-xs text-gray-400 mt-1">Obs: {item.observation}</p>
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
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const deliveryFee = establishment.deliveryFeeType === "free" 
                    ? 0 
                    : establishment.deliveryFeeType === "fixed" 
                      ? Number(establishment.deliveryFeeFixed || 0)
                      : selectedNeighborhood 
                        ? Number(selectedNeighborhood.fee) 
                        : 0;
                  const total = Math.max(0, subtotal - discount + deliveryFee);
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            Cupom {appliedCoupon.code}
                          </span>
                          <span className="text-green-600">-R$ {discount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Taxa de entrega</span>
                          {selectedNeighborhood && establishment.deliveryFeeType === "byNeighborhood" && (
                            <button
                              onClick={() => {
                                setShowMobileBag(false);
                                setReopenBagAfterNeighborhood(true);
                                setShowNeighborhoodModal(true);
                              }}
                              className="text-red-500 text-xs font-medium hover:text-red-600 transition-colors"
                            >
                              Alterar bairro
                            </button>
                          )}
                        </div>
                        <span className={establishment.deliveryFeeType === "free" ? "text-green-600 font-medium" : "text-gray-500"}>
                          {establishment.deliveryFeeType === "free" 
                            ? "Grátis" 
                            : establishment.deliveryFeeType === "fixed" && establishment.deliveryFeeFixed
                              ? `R$ ${Number(establishment.deliveryFeeFixed).toFixed(2).replace('.', ',')}`
                              : selectedNeighborhood
                                ? `R$ ${Number(selectedNeighborhood.fee).toFixed(2).replace('.', ',')}`
                                : "A calcular"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-red-500">R$ {total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </>
                  );
                })()}
                
                {/* Alerta de Pedido Mínimo */}
                {(() => {
                  const subtotal = cart.reduce((sum, item) => {
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    const complementsTotal = item.complements.reduce((s, c) => s + parseFloat(c.price), 0) * item.quantity;
                    return sum + itemTotal + complementsTotal;
                  }, 0);
                  const discount = appliedCoupon?.discount || 0;
                  const deliveryFee = establishment.deliveryFeeType === "free" 
                    ? 0 
                    : establishment.deliveryFeeType === "fixed" 
                      ? Number(establishment.deliveryFeeFixed || 0)
                      : selectedNeighborhood 
                        ? Number(selectedNeighborhood.fee) 
                        : 0;
                  const total = Math.max(0, subtotal - discount + deliveryFee);
                  const minOrderValue = establishment?.minimumOrderEnabled && establishment?.minimumOrderValue ? Number(establishment.minimumOrderValue) : 0;
                  const isBelowMinOrder = minOrderValue > 0 && total < minOrderValue;
                  const amountMissing = minOrderValue - total;
                  
                  return (
                    <>
                      {/* Alerta de Pedido Mínimo - cor vermelha */}
                      {isBelowMinOrder && (
                        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2 text-red-600">
                            <ShoppingBag className="h-4 w-4" />
                            <span className="font-semibold text-sm">Pedido mínimo: R$ {minOrderValue.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <p className="text-xs text-red-500 mt-1 ml-6">
                            Faltam R$ {amountMissing.toFixed(2).replace('.', ',')} para atingir o mínimo
                          </p>
                        </div>
                      )}
                      
                      {/* Cupom */}
                      {appliedCoupon ? (
                        <div className="w-full flex items-center justify-between py-3 border-t border-gray-100">
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
                          className="w-full flex items-center justify-between py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors">
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
                      
                      {/* Botão Adicionar mais itens - só mostra quando NÃO está abaixo do mínimo */}
                      {!isBelowMinOrder && (
                        <button
                          onClick={() => {
                            setShowMobileBag(false);
                            setBagAutoOpenEnabled(false);
                          }}
                          className="w-full py-3 font-semibold rounded-xl transition-colors border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Adicionar mais itens
                        </button>
                      )}
                      
                      {/* Botão Finalizar pedido / Adicionar mais itens (quando abaixo do mínimo) */}
                      {isBelowMinOrder ? (
                        <button
                          onClick={() => {
                            setShowMobileBag(false);
                            setBagAutoOpenEnabled(false);
                          }}
                          className="w-full py-3.5 font-semibold rounded-xl transition-colors border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Adicionar mais itens
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!isOpen) return;
                            // Validar seleção de bairro se necessário
                            if (establishment?.deliveryFeeType === 'byNeighborhood' && !selectedNeighborhood) {
                              setShowMobileBag(false);
                              setReopenBagAfterNeighborhood(true);
                              setShowNeighborhoodModal(true);
                              return;
                            }
                            setShowMobileBag(false);
                            setOrderSent(false);
                            setOrderError(null); // Limpar erro anterior
                            setCheckoutStep(1);
                          }}
                          disabled={!isOpen}
                          className={`w-full py-3.5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                            !isOpen
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {!isOpen ? (
                            <>
                              <Clock className="h-5 w-5" />
                              Restaurante Fechado
                            </>
                          ) : (
                            'Finalizar pedido'
                          )}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pedidos */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop - clique para fechar */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowOrdersModal(false)}
          />
          
          {/* Modal - Bottom Sheet no mobile com altura máxima de 80% */}
          <div className="relative bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <ClipboardList className="h-5 w-5 text-purple-500" />
                </div>
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
            <div className="p-4 space-y-4" style={{backgroundColor: '#ffffff'}}>
              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum pedido ainda</h3>
                  <p className="text-gray-500 text-sm">Seus pedidos aparecerão aqui após você fazer o primeiro pedido.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pedidos em andamento */}
                  {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                        Em andamento
                      </h3>
                      <div className="space-y-3">
                        {userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
                          <div 
                            key={order.id}
                            className="bg-white border-l-4 border-l-green-500 border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Header compacto */}
                            <div 
                              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setExpandedOrderIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(order.id)) {
                                    newSet.delete(order.id);
                                  } else {
                                    newSet.add(order.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              <div className="flex items-center gap-6 flex-1">
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Pedido</span>
                                  <p className="font-bold text-gray-900">{order.id}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Status</span>
                                  <p className={`font-medium ${
                                    order.status === 'sent' ? 'text-yellow-600' :
                                    order.status === 'accepted' ? 'text-blue-600' :
                                    order.status === 'delivering' ? 'text-purple-600' :
                                    'text-green-600'
                                  }`}>
                                    {order.status === 'sent' ? 'Enviado' :
                                     order.status === 'accepted' ? 'Aceito' :
                                     order.status === 'delivering' ? (order.deliveryType === 'pickup' ? 'Finalizado' : 'Em entrega') :
                                     'Entregue'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Data/Hora</span>
                                  <p className="text-gray-700">
                                    {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
                                  <p className="font-bold text-green-600">R$ {order.total.replace('.', ',')}</p>
                                </div>
                              </div>
                              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderIds.has(order.id) ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {/* Dropdown de itens */}
                            {expandedOrderIds.has(order.id) && (
                              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Itens do pedido</h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                        {parseFloat(item.price) * item.quantity > 0 && (
                                          <span className="text-gray-600">R$ {(parseFloat(item.price) * item.quantity).toFixed(2).replace('.', ',')}</span>
                                        )}
                                      </div>
                                      {item.complements && item.complements.length > 0 && (
                                        <div className="mt-0.5 ml-4">
                                          {item.complements.map((c: any, cIdx: number) => (
                                            <div key={cIdx} className="flex justify-between text-xs text-gray-500">
                                              <span>+ {c.name}</span>
                                              {parseFloat(c.price) > 0 && (
                                                <span>+ R$ {parseFloat(c.price).toFixed(2).replace('.', ',')}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setCurrentOrderNumber(order.id);
                                    setShowOrdersModal(false);
                                    setShowTrackingModal(true);
                                  }}
                                  className="mt-3 w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Clock className="h-4 w-4" />
                                  Acompanhar pedido
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de pedidos (entregues e cancelados) */}
                  {userOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h3>
                      <div className="space-y-3">
                        {userOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled').map(order => (
                          <div 
                            key={order.id}
                            className={`bg-white border-l-4 ${order.status === 'cancelled' ? 'border-l-red-500' : 'border-l-green-500'} border border-gray-200 rounded-lg overflow-hidden`}
                          >
                            {/* Header compacto */}
                            <div 
                              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setExpandedOrderIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(order.id)) {
                                    newSet.delete(order.id);
                                  } else {
                                    newSet.add(order.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              <div className="flex items-center gap-6 flex-1">
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Pedido</span>
                                  <p className="font-bold text-gray-900">{order.id}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Status</span>
                                  <p className={`font-medium ${order.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                                    {order.status === 'cancelled' ? 'Cancelado' : 'Entregue'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Data/Hora</span>
                                  <p className="text-gray-700">
                                    {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
                                  <p className="font-bold text-green-600">R$ {order.total.replace('.', ',')}</p>
                                </div>
                              </div>
                              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderIds.has(order.id) ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {/* Dropdown de itens */}
                            {expandedOrderIds.has(order.id) && (
                              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Itens do pedido</h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                        {parseFloat(item.price) * item.quantity > 0 && (
                                          <span className="text-gray-600">R$ {(parseFloat(item.price) * item.quantity).toFixed(2).replace('.', ',')}</span>
                                        )}
                                      </div>
                                      {item.complements && item.complements.length > 0 && (
                                        <div className="mt-0.5 ml-4">
                                          {item.complements.map((c: any, cIdx: number) => (
                                            <div key={cIdx} className="flex justify-between text-xs text-gray-500">
                                              <span>+ {c.name}</span>
                                              {parseFloat(c.price) > 0 && (
                                                <span>+ R$ {parseFloat(c.price).toFixed(2).replace('.', ',')}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {/* Botão Pedir novamente - para todos os pedidos do histórico */}
                                <button
                                    onClick={() => {
                                      // Adicionar itens do pedido à sacola
                                      const newCartItems = order.items.map(item => ({
                                        productId: 0,
                                        name: item.name,
                                        price: item.price,
                                        quantity: item.quantity,
                                        observation: "",
                                        image: null,
                                        complements: item.complements.map((c, idx) => ({
                                          id: idx,
                                          name: c.name,
                                          price: c.price
                                        }))
                                      }));
                                      setCart(newCartItems);
                                      
                                      // Preencher dados do pedido anterior
                                      setDeliveryType(order.deliveryType);
                                      setPaymentMethod(order.paymentMethod);
                                      setCustomerInfo({
                                        name: order.customerName,
                                        phone: order.customerPhone
                                      });
                                      setOrderObservation(order.observation || "");
                                      
                                      // Preencher endereço se for delivery
                                      if (order.deliveryType === 'delivery' && order.address) {
                                        setDeliveryAddress({
                                          street: order.address.street || "",
                                          number: order.address.number || "",
                                          neighborhood: order.address.neighborhood || "",
                                          complement: order.address.complement || "",
                                          reference: order.address.reference || ""
                                        });
                                      }
                                      
                                      setShowOrdersModal(false);
                                      // Abrir modal de resumo (checkout step 1)
                                      setOrderError(null); // Limpar erro anterior
                                      setCheckoutStep(1);
                                    }}
                                    className="mt-3 w-full py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Pedir novamente
                                </button>
                              </div>
                            )}
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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative w-full md:w-[480px] md:max-w-md bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Acompanhar Pedido</h2>
              </div>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body - Timeline ou Cancelado */}
            <div className="p-6" style={{backgroundColor: '#ffffff'}}>
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
                  // Para retirada: quando status é 'delivering' (ready no backend), mostrar como finalizado em verde
                  const isPickupReady = isPickup && (orderStatus === 'delivering' || orderStatus === 'delivered');
                  return (
                    <div className="relative flex items-start gap-4 pb-8">
                      {/* Ícone com animação especial para status 'delivering' (Saiu para entrega) - apenas para delivery */}
                      {orderStatus === 'delivering' && !isPickup ? (
                        <div className="relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <Bike className="w-8 h-8 text-violet-600 animate-bounce" />
                          <div className="absolute inset-0 animate-ping flex items-center justify-center">
                            <Bike className="w-8 h-8 text-violet-400 opacity-75" />
                          </div>
                        </div>
                      ) : (
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isPickupReady || orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          {isPickup ? <CheckCircle className="h-5 w-5" /> : <Bike className="h-5 w-5" />}
                        </div>
                      )}
                      <div className="pt-2">
                        <h4 className={`font-semibold ${
                          isPickupReady ? 'text-green-600' :
                          orderStatus === 'delivering' ? 'text-violet-600' :
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
            <div className="border-t px-6 py-4 space-y-3" style={{backgroundColor: '#ffffff'}}>
              {/* Botão Avaliar restaurante - só aparece quando status for entregue E pode avaliar (30 dias) E verificação já terminou */}
              {orderStatus === 'delivered' && canReview && canReviewChecked && (
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
              {/* Loading enquanto verifica se pode avaliar */}
              {orderStatus === 'delivered' && !canReviewChecked && (
                <div className="text-center py-2 px-4 bg-gray-100 rounded-xl">
                  <p className="text-sm text-gray-500">Verificando...</p>
                </div>
              )}
              {/* Mensagem quando já avaliou nos últimos 30 dias */}
              {orderStatus === 'delivered' && !canReview && canReviewChecked && (
                <div className="text-center py-2 px-4 bg-gray-100 rounded-xl">
                  <p className="text-sm text-gray-600">
                    Você já avaliou este restaurante nos últimos 30 dias.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setOrderSent(false);
                  setCart([]);
                  // Limpar também o localStorage
                  if (slug) {
                    clearCartFromStorage(slug);
                  }
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
                <div className="p-6" style={{backgroundColor: '#ffffff'}}>
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
                      // Usar o telefone do pedido selecionado
                      const selectedOrder = userOrders.find(o => o.id === selectedOrderId);
                      const phoneToUse = selectedOrder?.customerPhone || customerInfo.phone || '';
                      const nameToUse = selectedOrder?.customerName || customerInfo.name || 'Cliente';
                      
                      if (!phoneToUse) {
                        alert('Telefone não encontrado. Não é possível enviar avaliação.');
                        return;
                      }
                      
                      try {
                        await createReviewMutation.mutateAsync({
                          establishmentId: establishment.id,
                          customerName: nameToUse,
                          customerPhone: phoneToUse,
                          rating: ratingValue,
                          comment: ratingComment || undefined,
                        });
                        setRatingSuccess(true);
                        // Após sucesso, atualizar canReview para false
                        setCanReview(false);
                      } catch (error: any) {
                        console.error('Erro ao enviar avaliação:', error);
                        // Verificar se é erro de já ter avaliado
                        const errorMessage = error?.message || '';
                        if (errorMessage.includes('30 dias') || errorMessage.includes('já avaliou')) {
                          alert('Você já avaliou este restaurante nos últimos 30 dias.');
                          setCanReview(false);
                          setShowRatingModal(false);
                        } else {
                          alert('Erro ao enviar avaliação. Tente novamente.');
                        }
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
      {/* Modal de Imagem em Tela Cheia */}
      {showFullscreenImage && selectedProduct?.images && selectedProduct.images.length > 0 && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
          onClick={() => setShowFullscreenImage(false)}
        >
          {/* Botão Fechar */}
          <button 
            onClick={() => setShowFullscreenImage(false)}
            className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {/* Setas de Navegação - Esquerda */}
          {selectedProduct.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImageIndex((prev) => 
                  prev === 0 ? selectedProduct.images!.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
          )}
          
          {/* Setas de Navegação - Direita */}
          {selectedProduct.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImageIndex((prev) => 
                  prev === selectedProduct.images!.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          )}
          
          {/* Imagem Principal com suporte a swipe */}
          <div 
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.touchStartX = touch.clientX.toString();
            }}
            onTouchEnd={(e) => {
              const touchStartX = parseFloat((e.currentTarget as HTMLElement).dataset.touchStartX || '0');
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              
              if (Math.abs(diff) > 50 && selectedProduct.images && selectedProduct.images.length > 1) {
                if (diff > 0) {
                  // Swipe para esquerda - próxima imagem
                  setFullscreenImageIndex((prev) => 
                    prev === selectedProduct.images!.length - 1 ? 0 : prev + 1
                  );
                } else {
                  // Swipe para direita - imagem anterior
                  setFullscreenImageIndex((prev) => 
                    prev === 0 ? selectedProduct.images!.length - 1 : prev - 1
                  );
                }
              }
            }}
          >
            <img
              src={selectedProduct.images[fullscreenImageIndex]}
              alt={`${selectedProduct.name} - Foto ${fullscreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain p-4 select-none"
              draggable={false}
            />
          </div>
          
          {/* Contador de Fotos no canto inferior direito */}
          {selectedProduct.images.length > 1 && (
            <div className="absolute bottom-6 right-6 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {fullscreenImageIndex + 1} / {selectedProduct.images.length}
            </div>
          )}
          
          {/* Indicadores de Paginação (pontos) */}
          {selectedProduct.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {selectedProduct.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenImageIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === fullscreenImageIndex 
                      ? "bg-white w-6" 
                      : "bg-white/50 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          )}
          
          {/* Dica de arrastar (apenas no mobile quando há múltiplas fotos) */}
          {selectedProduct.images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-xs md:hidden">
              Arraste para ver mais fotos
            </div>
          )}
        </div>
      )}

      {showReviewsModal && establishment && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowReviewsModal(false)}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-lg md:mx-4 max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
                  <p className="text-sm text-gray-500">
                    {establishment.rating ? Number(establishment.rating).toFixed(1) : '0.0'} • {establishment.reviewCount || 0} avaliações
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
            <div className="p-4 space-y-4" style={{backgroundColor: '#ffffff'}}>
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

      {/* Modal de Navegação - Bottom Sheet */}
      {showNavigationModal && establishment && (
        <div 
          className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center"
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNavigationModal(false)}
          />
          
          {/* Modal Content - Bottom Sheet Style */}
          <div className="relative bg-gray-200 w-full md:max-w-md md:mx-4 md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-300 rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <MapPin className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Como chegar</h2>
                  <p className="text-sm text-gray-500 truncate max-w-[250px]">
                    {establishment.street}
                    {establishment.number && `, ${establishment.number}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNavigationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Endereço Completo */}
            <div className="p-4 border-b" style={{backgroundColor: '#ffffff'}}>
              <p className="text-sm text-gray-700">
                {establishment.street}
                {establishment.number && `, ${establishment.number}`}
                {establishment.neighborhood && ` - ${establishment.neighborhood}`}
                {establishment.city && `, ${establishment.city}`}
                {establishment.state && ` - ${establishment.state}`}
              </p>
            </div>

            {/* Opções de Navegação */}
            <div className="p-4 space-y-3" style={{backgroundColor: '#ffffff'}}>
              <p className="text-sm font-medium text-gray-500 mb-3">Abrir com:</p>
              
              {/* Google Maps */}
              <a
                href={establishment.latitude && establishment.longitude
                  ? `https://www.google.com/maps/dir/?api=1&destination=${establishment.latitude},${establishment.longitude}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      [establishment.street, establishment.number, establishment.neighborhood, establishment.city, establishment.state].filter(Boolean).join(", ")
                    )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img src="/google-maps-icon.png" alt="Google Maps" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Google Maps</p>
                  <p className="text-sm text-gray-500">Navegar com rotas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              {/* Waze */}
              <a
                href={establishment.latitude && establishment.longitude
                  ? `https://waze.com/ul?ll=${establishment.latitude},${establishment.longitude}&navigate=yes`
                  : `https://waze.com/ul?q=${encodeURIComponent(
                      [establishment.street, establishment.number, establishment.neighborhood, establishment.city, establishment.state].filter(Boolean).join(", ")
                    )}&navigate=yes`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img src="/waze-icon.png" alt="Waze" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Waze</p>
                  <p className="text-sm text-gray-500">Navegar com trânsito em tempo real</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              {/* Apple Maps (apenas iOS) */}
              <a
                href={establishment.latitude && establishment.longitude
                  ? `maps://maps.apple.com/?daddr=${establishment.latitude},${establishment.longitude}`
                  : `maps://maps.apple.com/?daddr=${encodeURIComponent(
                      [establishment.street, establishment.number, establishment.neighborhood, establishment.city, establishment.state].filter(Boolean).join(", ")
                    )}`
                }
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                onClick={() => setShowNavigationModal(false)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img src="/apple-maps-icon.png" alt="Apple Maps" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Apple Maps</p>
                  <p className="text-sm text-gray-500">Disponível em dispositivos Apple</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>
            </div>

            {/* Botão Copiar Endereço */}
            <div className="p-4 border-t" style={{backgroundColor: '#ffffff'}}>
              <button
                onClick={() => {
                  const fullAddress = [establishment.street, establishment.number, establishment.neighborhood, establishment.city, establishment.state].filter(Boolean).join(", ");
                  navigator.clipboard.writeText(fullAddress);
                  // Feedback visual
                  const btn = document.getElementById('copy-address-btn');
                  if (btn) {
                    btn.textContent = 'Endereço copiado!';
                    setTimeout(() => {
                      btn.textContent = 'Copiar endereço';
                    }, 2000);
                  }
                }}
                id="copy-address-btn"
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar endereço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fidelidade */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoyaltyModal(false)}
          />
          
          {/* Modal Content - Bottom Sheet no mobile */}
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[75vh] md:max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300" style={{ touchAction: 'pan-y' }}>
            {/* Header */}
            <div className="sticky top-0 z-[50] bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl shadow-sm" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Gift className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Cartão Fidelidade</h2>
              </div>
              <button 
                onClick={() => setShowLoyaltyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4" style={{backgroundColor: '#ffffff'}}>
              {loyaltyStep === 'login' && (
                <LoyaltyLoginForm
                  phone={loyaltyPhone}
                  setPhone={setLoyaltyPhone}
                  password={loyaltyPassword}
                  setPassword={setLoyaltyPassword}
                  error={loyaltyError}
                  isLoading={loyaltyLoginMutation.isPending}
                  onLogin={() => {
                    if (loyaltyPhone.length >= 10 && loyaltyPassword.length === 4) {
                      loyaltyLoginMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: loyaltyPhone,
                        password4: loyaltyPassword,
                      });
                    }
                  }}
                  onRegister={() => {
                    setLoyaltyStep('register');
                    setLoyaltyError('');
                  }}
                />
              )}
              
              {loyaltyStep === 'register' && (
                <LoyaltyRegisterForm
                  phone={loyaltyPhone}
                  setPhone={setLoyaltyPhone}
                  password={loyaltyPassword}
                  setPassword={setLoyaltyPassword}
                  name={loyaltyName}
                  setName={setLoyaltyName}
                  error={loyaltyError}
                  isLoading={loyaltyRegisterMutation.isPending}
                  onRegister={() => {
                    if (loyaltyPhone.length >= 10 && loyaltyPassword.length === 4) {
                      loyaltyRegisterMutation.mutate({
                        establishmentId: data?.establishment?.id || 0,
                        phone: loyaltyPhone,
                        password4: loyaltyPassword,
                        name: loyaltyName || undefined,
                      });
                    }
                  }}
                  onBack={() => {
                    setLoyaltyStep('login');
                    setLoyaltyError('');
                  }}
                />
              )}
              
              {loyaltyStep === 'card' && isLoyaltyLoggedIn && (
                <LoyaltyCardView
                  establishmentName={data?.establishment?.name || ''}
                  establishmentId={data?.establishment?.id || 0}
                  customerPhone={loyaltyPhone}
                  customerPassword={loyaltyPassword}
                  cardData={loyaltyCardQuery.data}
                  stampsRequired={loyaltyEnabled?.stampsRequired || 6}
                  isLoading={loyaltyCardQuery.isLoading}
                  isModalOpen={showLoyaltyModal}
                  onCouponViewed={() => {
                    // Recarregar dados do cartão após resetar carimbos
                    loyaltyCardQuery.refetch();
                  }}
                  onLogout={() => {
                    setIsLoyaltyLoggedIn(false);
                    setLoyaltyPhone('');
                    setLoyaltyPassword('');
                    setLoyaltyStep('login');
                    localStorage.removeItem('loyaltyPhone_' + data?.establishment?.id);
                  }}
                  onApplyCoupon={(couponCode, couponType, couponValue, loyaltyCardId) => {
                    // Calcular o desconto baseado no tipo de cupom
                    const subtotal = cart.reduce((sum, item) => {
                      const complementsTotal = item.complements.reduce((cSum, c) => cSum + Number(c.price), 0);
                      return sum + (Number(item.price) + complementsTotal) * item.quantity;
                    }, 0);
                    
                    let discount = 0;
                    const value = Number(couponValue);
                    
                    if (couponType === 'percentage') {
                      discount = (subtotal * value) / 100;
                    } else if (couponType === 'fixed') {
                      discount = value;
                    } else if (couponType === 'free_delivery') {
                      // Frete grátis - desconto será aplicado na taxa de entrega
                      discount = 0; // Por enquanto, taxa de entrega é 0
                    }
                    
                    // Aplicar o cupom com o loyaltyCardId para consumir após o pedido
                    setAppliedCoupon({
                      id: 0, // ID será validado no backend ao finalizar pedido
                      code: couponCode,
                      discount: discount,
                      type: couponType as 'percentage' | 'fixed',
                      value: value,
                      loyaltyCardId: loyaltyCardId,
                    });
                    
                    // Salvar info do cupom para o modal de confirmação
                    setAppliedCouponInfo({
                      code: couponCode,
                      type: couponType,
                      value: value,
                    });
                    
                    // Fechar modal de fidelidade e mostrar confirmação
                    setShowLoyaltyModal(false);
                    setShowCouponAppliedModal(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Bottom Sheet de Confirmação de Cupom Aplicado */}
      {showCouponAppliedModal && appliedCouponInfo && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowCouponAppliedModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-400 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="px-6 pb-8 pt-2">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Cupom aplicado!
              </h3>
              
              {/* Coupon Info */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-emerald-600" />
                  <span className="font-mono font-bold text-lg text-emerald-700">
                    {appliedCouponInfo.code}
                  </span>
                </div>
                <p className="text-center text-emerald-600 font-medium">
                  {appliedCouponInfo.type === 'percentage' 
                    ? `${appliedCouponInfo.value}% de desconto`
                    : appliedCouponInfo.type === 'fixed'
                    ? `R$ ${appliedCouponInfo.value.toFixed(2)} de desconto`
                    : 'Frete grátis'
                  }
                </p>
              </div>
              
              {/* Description */}
              <p className="text-gray-500 text-center text-sm mb-6">
                Seu desconto foi adicionado à sacola. Adicione itens e finalize seu pedido para aproveitar!
              </p>
              
              {/* Button */}
              <button
                onClick={() => setShowCouponAppliedModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Continuar comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Bairro */}
      {showNeighborhoodModal && neighborhoodFeesData && neighborhoodFeesData.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
          onTouchMove={(e) => {
            // Permitir scroll apenas dentro da lista de bairros
            const target = e.target as HTMLElement;
            const scrollableParent = target.closest('[data-neighborhood-scrollable="true"]');
            if (!scrollableParent) {
              e.preventDefault();
            }
          }}
        >
          {/* Backdrop - clique para fechar */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNeighborhoodModal(false)}
          />
          
          {/* Modal - Bottom Sheet no mobile, aumentado 20% no desktop */}
          <div className="relative bg-gray-200 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-[520px] md:mx-4 max-h-[85vh] overflow-hidden overscroll-contain animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 flex flex-col" style={{ touchAction: 'pan-y' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{height: '68px'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <MapPin className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Selecione seu bairro</h2>
              </div>
              <button 
                onClick={() => setShowNeighborhoodModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="px-5 py-4 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar bairro..."
                  value={neighborhoodSearch || ''}
                  onChange={(e) => setNeighborhoodSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400"
                />
                {neighborhoodSearch && (
                  <button
                    onClick={() => setNeighborhoodSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Body - Lista de Bairros */}
            <div 
              className="p-5 space-y-2.5 overflow-y-auto flex-1 overscroll-contain" 
              style={{
                backgroundColor: '#ffffff', 
                // No mobile: altura para ~4 itens (cada item tem ~60px + 10px gap = ~280px)
                // No desktop: altura maior
                maxHeight: window.innerWidth < 768 ? '280px' : '400px', 
                WebkitOverflowScrolling: 'touch'
              }}
              data-neighborhood-scrollable="true"
            >
              {(() => {
                const filteredNeighborhoods = neighborhoodFeesData
                  .filter(item =>
                    item.neighborhood.toLowerCase().includes((neighborhoodSearch || '').toLowerCase())
                  )
                  .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, 'pt-BR'));
                
                if (filteredNeighborhoods.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">Nenhum bairro encontrado</p>
                      <p className="text-gray-400 text-sm mt-1">Tente buscar por outro nome</p>
                    </div>
                  );
                }
                
                return filteredNeighborhoods.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedNeighborhood({ name: item.neighborhood, fee: item.fee });
                      setShowNeighborhoodModal(false);
                      setNeighborhoodSearch('');
                      // Preencher o bairro no endereço de entrega
                      setDeliveryAddress(prev => ({ ...prev, neighborhood: item.neighborhood }));
                      // Selecionar automaticamente a opção de entrega já que o usuário escolheu um bairro
                      setDeliveryType('delivery');
                      // Reabrir a sacola ou checkout se veio do botão Alterar bairro
                      if (reopenBagAfterNeighborhood) {
                        setReopenBagAfterNeighborhood(false);
                        setTimeout(() => {
                          // Se estava no checkout (step 2), voltar para lá
                          if (checkoutStep === 0) {
                            setCheckoutStep(2);
                          } else {
                            setShowMobileBag(true);
                          }
                        }, 100);
                      }
                    }}
                    className={cn(
                      "w-full px-5 py-4 text-left rounded-xl flex items-center justify-between transition-all border",
                      selectedNeighborhood?.name === item.neighborhood 
                        ? "bg-red-50 border-red-300 shadow-sm" 
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedNeighborhood?.name === item.neighborhood 
                          ? "border-red-500 bg-red-500" 
                          : "border-gray-300"
                      )}>
                        {selectedNeighborhood?.name === item.neighborhood && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800 text-base">{item.neighborhood}</span>
                    </div>
                    <span className="text-red-500 font-semibold text-base">R$ {Number(item.fee).toFixed(2).replace('.', ',')}</span>
                  </button>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-5" style={{backgroundColor: '#ffffff'}}>
              <button
                onClick={() => {
                  setShowNeighborhoodModal(false);
                  setNeighborhoodSearch('');
                }}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-base"
              >
                Fechar
              </button>
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
            {Number(product.price) > 0 && (
              <span className="text-red-500 font-semibold text-sm">{formatPrice(product.price)}</span>
            )}
            {!product.hasStock && (
              <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                Indisponível
              </span>
            )}
          </div>
        </div>
        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover rounded-r-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center rounded-r-lg">
              <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-white animate-placeholder-pulse" />
            </div>
          )}
        </div>
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


// Componentes do Sistema de Fidelidade

function LoyaltyLoginForm({
  phone,
  setPhone,
  password,
  setPassword,
  error,
  isLoading,
  onLogin,
  onRegister,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  isLoading: boolean;
  onLogin: () => void;
  onRegister: () => void;
}) {
  // Formatar telefone
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            maxLength={15}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
            maxLength={4}
            autoComplete="new-password"
            name="loyalty-password-login"
          />
        </div>
        
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        
        <button
          onClick={onLogin}
          disabled={isLoading || phone.length < 10 || password.length !== 4}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Ainda não tem cartão?</p>
        <button
          onClick={onRegister}
          className="text-emerald-600 font-semibold hover:underline"
        >
          Cadastre-se agora
        </button>
      </div>
    </div>
  );
}

function LoyaltyRegisterForm({
  phone,
  setPhone,
  password,
  setPassword,
  name,
  setName,
  error,
  isLoading,
  onRegister,
  onBack,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  error: string;
  isLoading: boolean;
  onRegister: () => void;
  onBack: () => void;
}) {
  // Formatar telefone
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome (opcional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            maxLength={15}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crie uma senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
            maxLength={4}
            autoComplete="new-password"
            name="loyalty-password-register"
          />
          <p className="text-xs text-gray-500 mt-1">Use apenas números</p>
        </div>
        
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        
        <button
          onClick={onRegister}
          disabled={isLoading || phone.length < 10 || password.length !== 4}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Cadastrando...
            </>
          ) : (
            'Criar Cartão'
          )}
        </button>
      </div>
      
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Voltar para login
        </button>
      </div>
    </div>
  );
}

function LoyaltyCardView({ establishmentName, cardData, stampsRequired, isLoading, isModalOpen, onLogout, onApplyCoupon, establishmentId, customerPhone, customerPassword, onCouponViewed }: {
  establishmentName: string;
  establishmentId: number;
  customerPhone: string;
  customerPassword: string;
  onCouponViewed?: () => void;
  cardData: {
    card: {
      id: number;
      stamps: number;
      customerName: string | null;
      totalStampsEarned: number;
      couponsEarned: number;
    };
    stamps: Array<{
      id: number;
      orderNumber: string;
      orderTotal: string;
      createdAt: Date;
    }>;
    settings: {
      stampsRequired: number;
      couponType: "percentage" | "fixed" | "free_delivery" | null;
      couponValue: string | null;
    };
    activeCoupon: {
      id?: number;
      code: string;
      type: string;
      value: string;
      expiresAt?: string | null;
    } | null;
    activeCoupons?: Array<{
      id: number;
      code: string;
      type: string;
      value: string;
      expiresAt?: string | null;
    }>;
  } | null | undefined;
  stampsRequired: number;
  isLoading: boolean;
  isModalOpen?: boolean;
  onLogout: () => void;
  onApplyCoupon?: (couponCode: string, couponType: string, couponValue: string, loyaltyCardId: number) => void;
}) {
  const [animatingStamp, setAnimatingStamp] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isResettingStamps, setIsResettingStamps] = useState(false);
  
  // Mutation para resetar carimbos quando usuário visualiza o cupom
  // Função para virar o card e mostrar o cupom (sem resetar carimbos - reset é automático no próximo pedido)
  const handleViewCoupon = () => {
    setIsFlipped(true);
  };
  
  const stamps = cardData?.card?.stamps || 0;
  const required = cardData?.settings?.stampsRequired || stampsRequired;
  const remaining = Math.max(0, required - stamps);
  
  // Usar o array de cupons se disponível, senão fallback para o cupom único
  const activeCoupons = cardData?.activeCoupons && cardData.activeCoupons.length > 0 
    ? cardData.activeCoupons 
    : cardData?.activeCoupon 
      ? [cardData.activeCoupon] 
      : [];
  const hasCouponAvailable = activeCoupons.length > 0;
  const currentCoupon = activeCoupons[currentCouponIndex] || null;
  const hasMultipleCoupons = activeCoupons.length > 1;
  
  // Cores para variação dos cupons - primeiro é amarelo/dourado (padrão), demais são cores distintas
  const couponColors = [
    { bg: 'from-amber-400 via-amber-500 to-amber-600', icon: 'text-amber-800', label: 'text-amber-700/60', value: 'text-amber-800/70', accent: 'text-amber-400', btnBg: 'bg-amber-500 hover:bg-amber-600', btnNextBg: 'bg-amber-500 hover:bg-amber-600' },
    { bg: 'from-emerald-400 via-emerald-500 to-emerald-600', icon: 'text-emerald-800', label: 'text-emerald-700/60', value: 'text-emerald-800/70', accent: 'text-emerald-400', btnBg: 'bg-emerald-500 hover:bg-emerald-600', btnNextBg: 'bg-emerald-500 hover:bg-emerald-600' },
    { bg: 'from-sky-400 via-sky-500 to-sky-600', icon: 'text-sky-800', label: 'text-sky-700/60', value: 'text-sky-800/70', accent: 'text-sky-400', btnBg: 'bg-sky-500 hover:bg-sky-600', btnNextBg: 'bg-sky-500 hover:bg-sky-600' },
    { bg: 'from-violet-400 via-violet-500 to-violet-600', icon: 'text-violet-800', label: 'text-violet-700/60', value: 'text-violet-800/70', accent: 'text-violet-400', btnBg: 'bg-violet-500 hover:bg-violet-600', btnNextBg: 'bg-violet-500 hover:bg-violet-600' },
    { bg: 'from-rose-400 via-rose-500 to-rose-600', icon: 'text-rose-800', label: 'text-rose-700/60', value: 'text-rose-800/70', accent: 'text-rose-400', btnBg: 'bg-rose-500 hover:bg-rose-600', btnNextBg: 'bg-rose-500 hover:bg-rose-600' },
    { bg: 'from-orange-400 via-orange-500 to-orange-600', icon: 'text-orange-800', label: 'text-orange-700/60', value: 'text-orange-800/70', accent: 'text-orange-400', btnBg: 'bg-orange-500 hover:bg-orange-600', btnNextBg: 'bg-orange-500 hover:bg-orange-600' },
    { bg: 'from-teal-400 via-teal-500 to-teal-600', icon: 'text-teal-800', label: 'text-teal-700/60', value: 'text-teal-800/70', accent: 'text-teal-400', btnBg: 'bg-teal-500 hover:bg-teal-600', btnNextBg: 'bg-teal-500 hover:bg-teal-600' },
    { bg: 'from-pink-400 via-pink-500 to-pink-600', icon: 'text-pink-800', label: 'text-pink-700/60', value: 'text-pink-800/70', accent: 'text-pink-400', btnBg: 'bg-pink-500 hover:bg-pink-600', btnNextBg: 'bg-pink-500 hover:bg-pink-600' },
  ];
  const currentCouponColor = couponColors[currentCouponIndex % couponColors.length];
  
  const progress = Math.min(100, (stamps / required) * 100);
  const isCardComplete = stamps >= required || hasCouponAvailable;
  
  // Navegar para o próximo cupom com animação de stack
  const nextCoupon = () => {
    if (isAnimating || activeCoupons.length <= 1) return;
    setIsAnimating(true);
    setAnimationDirection('next');
    setTimeout(() => {
      setCurrentCouponIndex((prev) => (prev + 1) % activeCoupons.length);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 220);
  };
  
  // Navegar para o cupom anterior com animação de stack
  const prevCoupon = () => {
    if (isAnimating || activeCoupons.length <= 1) return;
    setIsAnimating(true);
    setAnimationDirection('prev');
    setTimeout(() => {
      setCurrentCouponIndex((prev) => (prev - 1 + activeCoupons.length) % activeCoupons.length);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 220);
  };
  
  // Handlers para swipe/touch navigation
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && hasMultipleCoupons) {
      nextCoupon();
    }
    if (isRightSwipe && hasMultipleCoupons) {
      prevCoupon();
    }
  };
  
  // Disparar animação sempre que o modal for aberto e houver carimbos
  useEffect(() => {
    if (isModalOpen && stamps > 0 && !hasAnimated && !isLoading) {
      // Animar o último carimbo ganho
      const lastStampIndex = stamps - 1;
      
      // Pequeno delay para a animação ser perceptível
      setTimeout(() => {
        setAnimatingStamp(lastStampIndex);
        setShowConfetti(true);
        
        // Vibração no mobile (se suportado)
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]); // Padrão de vibração: vibra, pausa, vibra
        }
        
        // Remover animação após 1.5 segundos
        setTimeout(() => {
          setAnimatingStamp(null);
          setShowConfetti(false);
        }, 1500);
      }, 300);
      
      setHasAnimated(true);
    }
    
    // Resetar quando o modal for fechado
    if (!isModalOpen) {
      setHasAnimated(false);
      setAnimatingStamp(null);
      setShowConfetti(false);
      setIsFlipped(false);
      setCurrentCouponIndex(0);
    }
  }, [isModalOpen, stamps, hasAnimated, isLoading]);
  
  // Resetar flip quando o cupom expira ou é usado
  useEffect(() => {
    if (!hasCouponAvailable && isFlipped) {
      setIsFlipped(false);
    }
  }, [hasCouponAvailable, isFlipped]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Card Principal com Flip */}
      <div 
        className={cn(
          "relative transition-all duration-[400ms] ease-in-out",
          isFlipped ? "h-[204px] md:h-[235px]" : "h-[237px] md:h-[273px]"
        )}
        style={{ perspective: '1000px' }}
      >
        <div 
          className={cn(
            "relative w-full h-full transition-transform duration-[400ms] ease-in-out",
            "[transform-style:preserve-3d]"
          )}
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Face Frontal - Carimbos */}
          <div 
            className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-lg [backface-visibility:hidden] flex flex-col"
            style={{ zIndex: 1 }}
          >
            {/* Parte verde do card */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-3 md:p-5 text-white flex-1 relative overflow-hidden" style={{height: '215px'}}>
              {/* Coração grande no canto inferior esquerdo */}
              <div className="absolute -left-16 -bottom-16 opacity-[0.12] pointer-events-none">
                <svg
                  width="320"
                  height="320"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              
              {/* Coração pequeno no lado direito */}
              <div className="absolute right-8 top-1/4 opacity-[0.12] pointer-events-none">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              
              {/* Header com ícone e informações */}
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
                <div className="p-1.5 md:p-2 bg-white/20 rounded-xl">
                  <Gift className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">{establishmentName}</h3>
                  {cardData?.card?.customerName && (
                    <p className="text-white/80 text-sm">{cardData.card.customerName} <span className="text-white/60">• Fidelidade ativa</span></p>
                  )}
                </div>
              </div>
              
              {/* Container com barra de progresso e carimbos */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 relative z-10">
                <div className="flex items-center justify-between text-sm mb-2 md:mb-3">
                  <span className="text-white/90">Progresso</span>
                  <span className="font-bold">{stamps} / {required} carimbos</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3 md:mb-4">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${progress}%`,
                      boxShadow: showConfetti ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
                    }}
                  />
                </div>
                
                {/* Carimbos visuais com animação */}
                <div className="flex justify-center gap-1.5 relative">
                  {/* Confetti/Sparkles quando ganha carimbo */}
                  {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full animate-ping"
                          style={{
                            backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][i % 5],
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {Array.from({ length: required }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                        i < stamps
                          ? "bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/50"
                          : "border-white/40 bg-white/10",
                        animatingStamp === i && "animate-bounce scale-125"
                      )}
                      style={{
                        transitionDelay: `${i * 50}ms`,
                        ...(i < stamps ? { boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' } : {})
                      }}
                    >
                      {i < stamps ? (
                        <svg 
                          className={cn(
                            "h-3.5 w-3.5 md:h-4 md:w-4 text-white transition-all duration-300",
                            animatingStamp === i && "animate-pulse scale-110"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Mensagem de progresso ou Botão Ver Cupom - Parte inferior do card (cinza) */}
            <div className={cn(
              "bg-gray-100 px-3 py-3 md:px-5 md:py-4 text-center transition-all duration-300",
              showConfetti && "bg-emerald-50"
            )}>
              {isCardComplete && hasCouponAvailable && !isFlipped ? (
                <button
                  onClick={handleViewCoupon}
                  disabled={isResettingStamps}
                  className="w-full py-1.5 md:py-2 px-3 md:px-4 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm md:text-base rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingStamps ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                  Ver cupom ganho
                </button>
              ) : (
                <p className={cn(
                  "text-gray-700 text-sm md:text-base transition-all duration-300",
                  showConfetti && "text-emerald-700 font-semibold scale-105"
                )}>
                  {showConfetti ? (
                    <>
                      <span className="inline-block animate-bounce">🎉</span>
                      {' '}Faltam{' '}
                      <span className="text-emerald-600 font-bold">{remaining}</span>
                      {' '}pedidos para ganhar seu cupom!
                    </>
                  ) : (
                    <>
                      Faltam <span className="text-emerald-600 font-bold">{remaining}</span> pedidos para ganhar seu cupom!
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          
          {/* Face Traseira - Cupom (Estilo Voucher) com Stack Visual */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-visible [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)', zIndex: 2 }}
          >
            {/* Container do Stack de Cupons */}
            <div className="relative h-full w-full">
              {/* Cupom Principal */}
              <div 
                className="absolute inset-0 transition-all duration-[220ms] ease-in-out cursor-grab active:cursor-grabbing"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  transform: isAnimating 
                    ? 'scale(0.98)'
                    : 'scale(1)',
                  opacity: isAnimating ? 0.8 : 1,
                  zIndex: 2,
                  filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
                }}
              >
            {currentCoupon && (
              <div 
                className="h-full flex relative"
                style={{
                  maskImage: `
                    radial-gradient(circle 8px at 0% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 92%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 92%, transparent 0, transparent 8px, black 8.5px)
                  `,
                  maskComposite: 'intersect',
                  WebkitMaskImage: `
                    radial-gradient(circle 8px at 0% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 0% 92%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 8%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 20%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 32%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 44%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 56%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 68%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 80%, transparent 0, transparent 8px, black 8.5px),
                    radial-gradient(circle 8px at 100% 92%, transparent 0, transparent 8px, black 8.5px)
                  `,
                  WebkitMaskComposite: 'source-in',
                }}
              >
                {/* Lado Esquerdo - Cor dinâmica baseada no índice do cupom */}
                <div className={`w-[55%] bg-gradient-to-br ${currentCouponColor.bg} p-3 md:p-4 flex flex-col justify-between relative overflow-hidden transition-colors duration-300`}>
                  {/* Ícone decorativo de talheres */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.15]">
                    <UtensilsCrossed className={`h-32 w-32 md:h-40 md:w-40 ${currentCouponColor.icon} transition-colors duration-300`} strokeWidth={1} />
                  </div>

                  {/* Informações do Voucher */}
                  <div className="relative z-10">
                    {(() => {
                      const words = establishmentName.split(' ');
                      const isLongName = establishmentName.length > 15;
                      const isVeryLongName = establishmentName.length > 25;
                      
                      if (words.length >= 2 && isLongName) {
                        const midPoint = Math.ceil(words.length / 2);
                        const firstLine = words.slice(0, midPoint).join(' ');
                        const secondLine = words.slice(midPoint).join(' ');
                        const fontSize = isVeryLongName ? 'text-sm md:text-base' : 'text-base md:text-lg';
                        
                        return (
                          <>
                            <h3 className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide leading-tight`}>
                              {firstLine}
                            </h3>
                            <h3 className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide leading-tight -mt-0.5`}>
                              {secondLine}
                            </h3>
                          </>
                        );
                      } else {
                        const fontSize = isLongName ? 'text-sm md:text-base' : 'text-lg md:text-xl';
                        return (
                          <h3 className={`font-black ${fontSize} text-gray-900 uppercase tracking-wide`}>
                            {establishmentName}
                          </h3>
                        );
                      }
                    })()}
                    <p className="text-gray-700 font-semibold text-xs md:text-sm mt-1">
                      VOUCHER {hasMultipleCoupons ? currentCouponIndex + 1 : ''}
                    </p>
                  </div>

                  {/* Validade */}
                  <div className="relative z-10">
                    <p className={`${currentCouponColor.label} text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300`} style={{
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '0.15em'
                    }}>VALIDADE</p>
                    <p className={`${currentCouponColor.value} font-black text-xs md:text-sm transition-colors duration-300`} style={{
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '0.05em'
                    }}>
                      {currentCoupon.expiresAt
                        ? new Date(currentCoupon.expiresAt).toLocaleDateString('pt-BR')
                        : 'Sem validade'}
                    </p>
                  </div>
                  
                  {/* Botão voltar */}
                  <button
                    onClick={() => setIsFlipped(false)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-900/20 hover:bg-gray-900/40 rounded-full transition-colors z-20"
                    title="Voltar para carimbos" style={{marginLeft: '7px'}}
                  >
                    <RotateCcw className="h-4 w-4 text-gray-900" />
                  </button>
                </div>

                {/* Lado Direito - Azul Escuro */}
                <div className="w-[45%] bg-slate-900 p-3 md:p-4 flex flex-col justify-between relative">
                  {/* Botão Próximo Cupom */}
                  {hasMultipleCoupons && (
                    <button
                      onClick={nextCoupon}
                      className={`absolute top-1/2 -translate-y-1/2 -right-3 p-2 rounded-full ${currentCouponColor.btnNextBg} transition-colors shadow-lg z-20`}
                      title="Próximo cupom"
                      style={{marginRight: '26px', width: '22px', height: '22px'}}
                    >
                      <ChevronRight className="text-white" style={{marginTop: '-3px', marginLeft: '-3px', width: '12px', height: '12px'}} />
                    </button>
                  )}

                  {/* Valor do Desconto */}
                  <div className="text-center flex-1 flex flex-col justify-center">
                    <p className={`${currentCouponColor.accent} font-black text-3xl md:text-4xl leading-none`}>
                      {currentCoupon.type === 'percentage'
                        ? `${currentCoupon.value}%`
                        : currentCoupon.type === 'free_delivery'
                        ? 'FRETE'
                        : `R$${Number(currentCoupon.value).toFixed(0)}`}
                    </p>
                    <p className={`${currentCouponColor.accent} font-black text-2xl md:text-3xl`}>
                      {currentCoupon.type === 'free_delivery' ? 'GRÁTIS' : 'OFF'}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentCoupon?.code || '');
                        const btn = document.getElementById('voucher-copy-btn');
                        if (btn) {
                          btn.textContent = '✓ Copiado!';
                          setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
                        }
                      }}
                      id="voucher-copy-btn"
                      className={`w-full py-2 md:py-2.5 px-3 bg-slate-800 hover:bg-slate-700 ${currentCouponColor.accent} rounded-lg font-semibold text-[10px] md:text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700`} style={{width: '149px', height: '32px'}}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </button>
                    <button
                      onClick={() => {
                        if (currentCoupon && onApplyCoupon && cardData?.card?.id) {
                          onApplyCoupon(
                            currentCoupon.code,
                            currentCoupon.type,
                            currentCoupon.value,
                            cardData.card.id
                          );
                        }
                      }}
                      className={`w-full py-2 md:py-2.5 px-3 ${currentCouponColor.btnBg} text-slate-900 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1.5 transition-colors`} style={{width: '149px', height: '31px'}}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Usar agora
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>
            
            {/* Indicador de múltiplos cupons */}
            {hasMultipleCoupons && currentCoupon && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {activeCoupons.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCouponIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentCouponIndex
                        ? 'bg-emerald-500 w-6'
                        : 'bg-gray-300 hover:bg-gray-400 w-2'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Link Ver regulamento */}
      <button
        onClick={() => setShowRules(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
      >
        Ver regulamento
      </button>
      
      {/* Histórico */}
      <div className="bg-white rounded-xl p-3 md:p-4">
        <h4 className="font-bold text-gray-900 text-sm md:text-base mb-2 md:mb-3">Histórico</h4>
        {cardData?.stamps && cardData.stamps.length > 0 ? (
          <div className="space-y-2 md:space-y-3 max-h-32 md:max-h-48 overflow-y-auto">
            {cardData.stamps.slice(0, 10).map((stamp) => (
              <div key={stamp.id} className="flex items-center gap-3 bg-gray-100 rounded-xl p-3">
                {/* Ícone de check verde */}
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                {/* Informações do pedido */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Pedido {stamp.orderNumber?.startsWith('#') ? stamp.orderNumber : `#${stamp.orderNumber}`}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(stamp.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}
                  </p>
                </div>
                {/* Carimbo +1 */}
                <span className="text-lg font-bold text-emerald-600">+1</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum carimbo ainda
          </p>
        )}
      </div>
      
      {/* Botão Sair - Oculto conforme solicitação */}
      {/* <button
        onClick={onLogout}
        className="w-full py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm md:text-base rounded-xl transition-colors"
      >
        Sair do cartão
      </button> */}
      
      {/* Modal Regulamento */}
      {showRules && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowRules(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" />
          
          {/* Bottom Sheet */}
          <div 
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-400 ease-out max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Regulamento</h3>
                </div>
                <button 
                  onClick={() => setShowRules(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-emerald-600" />
                  Como funciona
                </h4>
                <p className="text-sm text-gray-600">
                  A cada pedido concluído, você ganha um carimbo no seu cartão fidelidade.
                  Ao completar <span className="font-semibold text-emerald-600">{required} carimbos</span>, 
                  você recebe um cupom de desconto exclusivo!
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  O que gera carimbo
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Pedidos com status "Concluído" ou "Entregue"
                  </li>
                  {cardData?.settings?.couponValue && Number(cardData.settings.couponValue) > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      Pedidos acima do valor mínimo (se configurado)
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  O que não conta
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Pedidos cancelados
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    Pedidos recusados pelo estabelecimento
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-emerald-600" />
                  Sobre o cupom
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    O cupom é gerado automaticamente ao completar o cartão
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Válido por 30 dias após a geração
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Uso único - após utilizar, um novo cartão é iniciado
                  </li>
                </ul>
              </div>
              

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
