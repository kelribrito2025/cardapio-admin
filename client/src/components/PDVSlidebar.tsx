import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  Search,
  Menu,
  Check,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Lock,
  Printer,
  Settings,
  Ticket,
  Undo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Constantes para configuração da aba
const HANDLE_CONFIG_KEY = 'pdv-slidebar-handle-config';
const GLOBAL_HANDLE_KEY = 'pdv-slidebar-global-handle';
const DEFAULT_HANDLE_CONFIG = {
  positionY: 15, // percentual (0-100)
  height: 76, // pixels
  width: 32, // pixels
  showGlobally: false, // mostrar em todas as páginas
};

type HandleConfig = typeof DEFAULT_HANDLE_CONFIG;

// Função para obter configuração global
export function getGlobalHandleConfig(): HandleConfig {
  try {
    const saved = localStorage.getItem(HANDLE_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_HANDLE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao carregar configuração da aba:', e);
  }
  return DEFAULT_HANDLE_CONFIG;
}

// Função para verificar se a aba global está ativada
export function isGlobalHandleEnabled(): boolean {
  return getGlobalHandleConfig().showGlobally;
}

// Tipos
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

interface TableShortcut {
  id: number;
  number: number;
  status: string;
  tabId?: number;
}

interface PDVSlidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  tableNumber: number;
  tableId?: number;
  tabId?: number;
  onOrderCreated?: () => void;
  showHandle?: boolean;
  tables?: TableShortcut[];
  onTableChange?: (table: TableShortcut) => void;
}

export function PDVSlidebar({ isOpen, onClose, onToggle, tableNumber, tableId, tabId, onOrderCreated, showHandle = false, tables = [], onTableChange }: PDVSlidebarProps) {
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

  // Query para buscar configurações de impressão
  const { data: printerSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishmentId ?? 0 },
    { enabled: !!establishmentId && establishmentId > 0 }
  );

  // Função para imprimir pedido
  const handlePrintOrderDirect = async (orderId: number) => {
    try {
      const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = receiptUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    } catch (error) {
      console.error("Erro ao imprimir pedido:", error);
    }
  };

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
      if (data.id) {
        handlePrintWithFavoriteMethod(data.id);
      }
      clearCart();
      onOrderCreated?.();
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido", {
        description: error.message,
      });
    },
  });

  // Estados
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [selectedComplements, setSelectedComplements] = useState<Map<number, Map<number, number>>>(new Map());
  const [selectedComplementImage, setSelectedComplementImage] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [expandedCartItem, setExpandedCartItem] = useState<number | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<{index: number; item: CartItem} | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Estados para cupom
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number; couponId: number} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Estados para limpar/desfazer
  const [clearedCart, setClearedCart] = useState<CartItem[] | null>(null);

  // Estados para configuração da aba (handle)
  const [showHandleConfig, setShowHandleConfig] = useState(false);
  const [handleConfig, setHandleConfig] = useState<HandleConfig>(DEFAULT_HANDLE_CONFIG);
  const [tempHandleConfig, setTempHandleConfig] = useState<HandleConfig>(DEFAULT_HANDLE_CONFIG);
  const [dragOffset, setDragOffset] = useState(0); // Para feedback visual do drag

  // Carregar configuração da aba do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HANDLE_CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved) as HandleConfig;
        setHandleConfig(config);
        setTempHandleConfig(config);
      }
    } catch (e) {
      console.error('Erro ao carregar configuração da aba:', e);
    }
  }, []);

  // Salvar configuração da aba no localStorage
  const saveHandleConfig = () => {
    try {
      localStorage.setItem(HANDLE_CONFIG_KEY, JSON.stringify(tempHandleConfig));
      setHandleConfig(tempHandleConfig);
      setShowHandleConfig(false);
      toast.success('Configuração da aba salva!');
    } catch (e) {
      console.error('Erro ao salvar configuração da aba:', e);
      toast.error('Erro ao salvar configuração');
    }
  };

  // Resetar configuração da aba
  const resetHandleConfig = () => {
    setTempHandleConfig(DEFAULT_HANDLE_CONFIG);
    setHandleConfig(DEFAULT_HANDLE_CONFIG);
  };

  // Ref para drag de categorias
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Verificar overflow das categorias
  useEffect(() => {
    const checkOverflow = () => {
      const container = categoriesContainerRef.current;
      if (container) {
        setHasOverflow(container.scrollWidth > container.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [categories]);

  // Handlers para drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesContainerRef.current.offsetLeft);
    setScrollLeft(categoriesContainerRef.current.scrollLeft);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !categoriesContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoriesContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      categoriesContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, startX, scrollLeft]);

  // Buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Listas processadas
  const productsList = products?.products || [];
  const sortedCategories = categories?.filter(c => c.isActive).slice().sort((a, b) => a.sortOrder - b.sortOrder) || [];

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      if (product.status !== 'active') return false;
      const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [productsList, selectedCategory, searchQuery]);

  // Funções do carrinho
  const addToCart = (product: Product, quantity: number, observation: string, complements: CartItem['complements']) => {
    setCart(prev => [...prev, {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      observation,
      image: product.images?.[0] || null,
      complements
    }]);
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    // Salvar itens atuais para possível desfazer
    if (cart.length > 0) {
      setClearedCart([...cart]);
    }
    setCart([]);
    setExpandedCartItem(null);
    // Limpar cupom também
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

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const complementsPrice = item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
      return total + (itemPrice + complementsPrice) * item.quantity;
    }, 0);
  };

  // Handlers
  const handleProductClick = (product: Product) => {
    if (!product.hasStock) {
      toast.error("Produto indisponível");
      return;
    }
    setSelectedProduct(product);
    setProductQuantity(1);
    setProductObservation("");
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setIsEditingMode(false);
    setEditingCartItem(null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Verificar complementos obrigatórios
    if (productComplements) {
      for (const group of productComplements) {
        if (group.isRequired) {
          const selectedInGroup = selectedComplements.get(group.id);
          const totalSelected = selectedInGroup 
            ? Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0)
            : 0;
          if (totalSelected < group.minQuantity) {
            toast.error(`Selecione pelo menos ${group.minQuantity} item(ns) em "${group.name}"`);
            return;
          }
        }
      }
    }

    const complements: CartItem['complements'] = [];
    selectedComplements.forEach((itemMap, groupId) => {
      itemMap.forEach((qty, itemId) => {
        const group = productComplements?.find(g => g.id === groupId);
        const item = group?.items.find(i => i.id === itemId);
        if (item && qty > 0) {
          complements.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: qty
          });
        }
      });
    });

    if (isEditingMode && editingCartItem !== null) {
      updateCartItem(editingCartItem.index, {
        quantity: productQuantity,
        observation: productObservation,
        complements
      });
      toast.success("Item atualizado!");
    } else {
      addToCart(selectedProduct, productQuantity, productObservation, complements);
      toast.success("Item adicionado ao pedido!");
    }

    setSelectedProduct(null);
    setSelectedComplementImage(null);
    setIsEditingMode(false);
    setEditingCartItem(null);
  };

  const handleEditCartItem = (index: number, item: CartItem) => {
    const product = productsList.find(p => p.id === item.productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }
    setSelectedProduct(product);
    setProductQuantity(item.quantity);
    setProductObservation(item.observation);
    setSelectedComplements(new Map());
    setSelectedComplementImage(null);
    setIsEditingMode(true);
    setEditingCartItem({ index, item });
  };

  // Restaurar complementos ao editar
  useEffect(() => {
    if (isEditingMode && editingCartItem && productComplements && productComplements.length > 0) {
      const complementsMap = new Map<number, Map<number, number>>();
      editingCartItem.item.complements.forEach(savedComp => {
        productComplements.forEach(group => {
          const foundItem = group.items.find(item => item.id === savedComp.id);
          if (foundItem) {
            const currentGroupMap = complementsMap.get(group.id) || new Map<number, number>();
            currentGroupMap.set(savedComp.id, savedComp.quantity);
            complementsMap.set(group.id, currentGroupMap);
          }
        });
      });
      setSelectedComplements(complementsMap);
    }
  }, [isEditingMode, editingCartItem, productComplements]);

  // Gerar número do pedido
  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `${timestamp}`;
  };

  // Mutation para adicionar itens à comanda
  const addTabItemsMutation = trpc.tabs.addItems.useMutation({
    onSuccess: () => {
      toast.success("Itens adicionados à comanda!");
      clearCart();
      onOrderCreated?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar itens");
    }
  });

  // Finalizar pedido
  const handleFinishOrder = () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    // Se tem tabId, adiciona diretamente à comanda
    if (tabId) {
      addTabItemsMutation.mutate({
        tabId,
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
      return;
    }

    // Caso contrário, cria um pedido normal
    const orderNumber = generateOrderNumber();
    const subtotal = calculateTotal();

    createOrderMutation.mutate({
      establishmentId: establishmentId!,
      orderNumber,
      customerName: `Mesa ${tableNumber}`,
      customerPhone: "",
      customerAddress: `Mesa ${tableNumber}`,
      deliveryType: "dine_in",
      paymentMethod: "cash",
      subtotal: subtotal.toFixed(2),
      deliveryFee: "0.00",
      discount: "0.00",
      total: subtotal.toFixed(2),
      notes: `Mesa: ${tableNumber}`,
      status: "preparing",
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

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategory(null);
      setSearchQuery("");
      setSelectedProduct(null);
      setShowCategoriesModal(false);
    }
  }, [isOpen]);

  // Estado para drag da aba
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const handleRef = useRef<HTMLButtonElement>(null);

  // Handlers para drag da aba
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingHandle(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingHandle) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    const threshold = 100;
    const maxDrag = 300; // Máximo de pixels para arrastar
    
    // Atualizar offset para feedback visual (limitado)
    const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
    setDragOffset(clampedDiff);
    
    if (isOpen && diff > threshold) {
      // Arrastar para direita = fechar
      onClose();
      setIsDraggingHandle(false);
      setDragOffset(0);
    } else if (!isOpen && diff < -threshold && onToggle) {
      // Arrastar para esquerda = abrir
      onToggle();
      setIsDraggingHandle(false);
      setDragOffset(0);
    }
  };

  const handleDragEnd = () => {
    setIsDraggingHandle(false);
    setDragOffset(0);
  };

  // Event listeners para drag
  useEffect(() => {
    if (isDraggingHandle) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingHandle, dragStartX, isOpen, onToggle, onClose]);

  // Se showHandle é true, sempre renderiza a aba (mesmo quando fechado)
  if (!showHandle && !isOpen) return null;

  return (
    <>
      {/* Aba fixa (Handle) - sempre visível quando showHandle é true */}
      {showHandle && (
        <div
          ref={handleRef as any}
          className={cn(
            "fixed flex flex-col items-center justify-center cursor-pointer select-none touch-none",
            "bg-gradient-to-r from-red-500 to-red-600 rounded-l-lg shadow-lg",
            "hover:from-red-600 hover:to-red-700 transition-all duration-200",
            !isOpen && "animate-handle-pulse",
            showHandleConfig ? "z-[100]" : "z-50"
          )}
          style={{
            width: `${handleConfig.width}px`,
            height: `${handleConfig.height}px`,
            top: `${handleConfig.positionY}%`,
            transform: `translateY(-50%) translateX(${isDraggingHandle ? dragOffset : 0}px)`,
            right: isOpen ? '78%' : '0',
            marginRight: '-4px',
            transition: isDraggingHandle ? 'none' : 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease-out'
          }}
        >
          {/* Botão principal para abrir/fechar */}
          <button
            onClick={() => isOpen ? onClose() : onToggle?.()}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="flex-1 w-full flex items-center justify-center"
          >
            <div className="flex items-center">
              {isOpen ? (
                <ChevronRight className="h-5 w-5 text-white" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-white" />
              )}
            </div>
          </button>
          {/* Botão de configuração */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTempHandleConfig(handleConfig);
              setShowHandleConfig(true);
            }}
            className="w-full py-1 flex items-center justify-center border-t border-white/20 hover:bg-white/10 transition-colors"
          >
            <Settings className="h-3 w-3 text-white/80" />
          </button>
        </div>
      )}

      {/* Overlay - só aparece quando aberto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          onClick={onClose}
        />
      )}

      {/* Slidebar */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full bg-white z-50 shadow-2xl flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ 
          width: '78%',
          transform: isDraggingHandle && isOpen ? `translateX(${Math.max(0, dragOffset)}px)` : undefined,
          transition: isDraggingHandle ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div className="border-b border-border/50">
          {/* Barra vermelha com título */}
          <div className="bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Título e descrição à esquerda */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Mesa {tableNumber}</h2>
                  <p className="text-sm text-white/80">Adicionar itens à comanda</p>
                </div>
              </div>
              
              {/* Botão fechar à direita */}
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors shrink-0"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Abas de Mesas */}
          {tables.length > 0 && (
            <div className="bg-gray-100 px-4 py-2.5 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => onTableChange?.(table)}
                    disabled={table.number === tableNumber}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                      table.number === tableNumber
                        ? "bg-emerald-500 text-white shadow-sm cursor-default"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    )}
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    {table.number}
                    {table.status === "occupied" && (
                      <span className={cn(
                        "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                        table.number === tableNumber ? "bg-white" : "bg-red-500"
                      )}></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda - Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
            {/* Barra de Categorias */}
            <div className="relative px-3 py-2 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCategoriesModal(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-card text-muted-foreground hover:bg-muted border border-border/50 transition-all shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div 
                  ref={categoriesContainerRef}
                  className={cn(
                    "flex items-center gap-2 overflow-x-auto pr-20 scrollbar-hide select-none flex-1",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={handleMouseDown}
                >
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "relative px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 mt-2",
                      selectedCategory === null
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                    )}
                  >
                    Todos
                    <span className={cn(
                      "absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-semibold",
                      selectedCategory === null ? "bg-white text-red-500" : "bg-red-500 text-white"
                    )}>
                      {productsList.filter((p) => p.status === 'active').length || 0}
                    </span>
                  </button>
                  {categoriesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24" />
                    ))
                  ) : (
                    sortedCategories.map((category) => {
                      const count = productsList.filter(
                        (p) => p.status === 'active' && p.categoryId === category.id
                      ).length || 0;
                      const categoryNameWithoutEmoji = category.name.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g, '').trim();
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            "relative px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 mt-2",
                            selectedCategory === category.id
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                          )}
                        >
                          {categoryNameWithoutEmoji}
                          <span className={cn(
                            "absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-semibold",
                            selectedCategory === category.id ? "bg-white text-red-500" : "bg-red-500 text-white"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {hasOverflow && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none pr-2">
                  <ChevronsRight className="h-5 w-5 text-red-400 animate-bounce-x" />
                </div>
              )}
            </div>

            {/* Barra de Busca */}
            <div className="px-3 py-2 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>

            {/* Grid de Produtos - 4 colunas */}
            <div className="flex-1 overflow-y-auto p-3">
              {productsLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border/50 overflow-hidden">
                      <Skeleton className="aspect-square" />
                      <div className="p-2 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <UtensilsCrossed className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhum produto encontrado</p>
                  <p className="text-xs">Tente ajustar os filtros ou busca</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-card rounded-lg border border-border/50 border-t-4 border-t-red-500 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      {/* Imagem - aumentada 10% */}
                      <div className="h-[100px] bg-gradient-to-br from-red-500 to-red-600 relative overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-9 w-9 text-white animate-placeholder-pulse" />
                          </div>
                        )}
                        {!product.hasStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium px-2 py-0.5 bg-red-500 rounded-full">
                              Indisponível
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info - aumentada 10% */}
                      <div className="p-2.5 flex flex-col h-[106px]">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1 flex-1">
                          {product.description || ''}
                        </p>
                        <div className="flex items-center justify-between mt-auto gap-1">
                          <span className="text-red-600 font-bold text-sm whitespace-nowrap">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1, '', []);
                              toast.success("Item adicionado!");
                            }}
                            disabled={!product.hasStock}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
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

          {/* Coluna Direita - Carrinho */}
          <div className="w-[370px] bg-gray-50 flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-3 border-b border-border/50 bg-white">
              {/* Tipo de Pedido e Mesa - lado a lado */}
              <div className="flex gap-2">
                {/* Consumo - 50% */}
                <div className="flex-1 flex items-center justify-center gap-2 p-2 bg-red-500 text-white rounded-lg">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="text-sm font-medium">Consumo</span>
                </div>

                {/* Mesa - 50% */}
                <div className="flex-1 relative">
                  <Input
                    value={`Mesa ${tableNumber}`}
                    disabled
                    className="text-center font-medium bg-gray-100 cursor-not-allowed h-full"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-xs font-medium">Nenhum item no pedido</p>
                  <p className="text-[10px]">Clique nos produtos para adicionar</p>
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
                      className="bg-white rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-200"
                      onMouseEnter={() => setExpandedCartItem(index)}
                      onMouseLeave={() => setExpandedCartItem(null)}
                    >
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-1 rounded">
                            {item.quantity}x
                          </span>
                          <h4 className="font-semibold text-sm text-gray-800 truncate">
                            {item.name}
                          </h4>
                        </div>
                        <span className="text-sm font-bold text-gray-900 ml-2">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>

                      {/* Ações expandidas */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {/* Complementos */}
                          {item.complements.length > 0 && (
                            <div className="px-3 py-2 bg-gray-50">
                              <p className="text-xs text-gray-500 font-medium mb-1.5">Complementos:</p>
                              <div className="space-y-1">
                                {item.complements.map((comp, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700">
                                      {comp.quantity > 1 ? `${comp.quantity}x ` : ""}{comp.name}
                                    </span>
                                    <span className="text-gray-600">
                                      {parseFloat(comp.price) > 0 ? `+${formatCurrency(parseFloat(comp.price) * comp.quantity)}` : "Grátis"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Observação */}
                          {item.observation && (
                            <div className="px-3 py-1.5 bg-yellow-50">
                              <p className="text-xs text-yellow-700 italic">
                                <span className="font-medium">Obs:</span> {item.observation}
                              </p>
                            </div>
                          )}
                          {/* Botões de ação */}
                          <div className="px-3 pb-2.5 pt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateCartItem(index, { quantity: item.quantity - 1 });
                                  } else {
                                    removeFromCart(index);
                                  }
                                }}
                                className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="h-3.5 w-3.5 text-gray-600" />
                              </button>
                              <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}
                                className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5 text-gray-600" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditCartItem(index, item)}
                                className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => removeFromCart(index)}
                                className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer - Total e Botão */}
            <div className="p-3 border-t border-border/50 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-semibold">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consumo no local</span>
                <span className="text-sm text-green-600 font-medium">Grátis</span>
              </div>
              {/* Desconto do Cupom */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Desconto ({appliedCoupon.code})</span>
                  <span className="font-medium text-green-600">-{formatCurrency(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(Math.max(0, calculateTotal() - (appliedCoupon?.discount || 0)))}
                </span>
              </div>
              <div className="flex gap-2">
                {/* Botão de Cupom */}
                <Button
                  variant="outline"
                  className={cn("px-3 flex-shrink-0", showCouponField && "border-red-500 bg-red-50")}
                  title="Adicionar cupom"
                  onClick={() => setShowCouponField(!showCouponField)}
                >
                  <Ticket className={cn("h-4 w-4", showCouponField ? "text-red-500" : "text-gray-500")} />
                </Button>
                {/* Botão Limpar/Desfazer */}
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
                {/* Botão Finalizar */}
                <Button
                  onClick={handleFinishOrder}
                  disabled={cart.length === 0 || createOrderMutation.isPending || addTabItemsMutation.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {(createOrderMutation.isPending || addTabItemsMutation.isPending) ? "Enviando..." : tabId ? "Adicionar à Comanda" : "Finalizar Pedido"}
                </Button>
              </div>

              {/* Campo de Cupom */}
              {showCouponField && (
                <div className="mt-2 flex gap-2">
                  {appliedCoupon ? (
                    <div className="flex-1 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium text-sm">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-xs">(-{formatCurrency(appliedCoupon.discount)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                          toast.success("Cupom removido");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button
                        variant="outline"
                        className="px-4 h-9 text-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                            const response = await fetch(`/api/trpc/coupon.validate?input=${encodeURIComponent(JSON.stringify({
                              json: {
                                establishmentId,
                                code: couponCode.toUpperCase(),
                                orderValue: calculateTotal(),
                                deliveryType: "self_service"
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
                        {isValidatingCoupon ? "..." : "Aplicar"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
          />
          
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300" style={{ touchAction: 'pan-y' }}>
            {/* Imagem do Produto ou Complemento Selecionado */}
            {(() => {
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
                                  
                                  {/* Preço */}
                                  {displayPrice > 0 && (
                                    <span className="text-sm text-gray-600 min-w-[70px] text-right">
                                      + {formatCurrency(displayPrice)}
                                    </span>
                                  )}
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
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full py-3"
              >
                + {isEditingMode ? "Atualizar" : "Adicionar"} {formatCurrency(
                  (parseFloat(selectedProduct.price) + 
                    Array.from(selectedComplements.values()).reduce((total, groupMap) => {
                      return total + Array.from(groupMap.entries()).reduce((sum, [itemId, qty]) => {
                        const group = productComplements?.find(g => g.items.some(i => i.id === itemId));
                        const item = group?.items.find(i => i.id === itemId);
                        return sum + (item ? parseFloat(item.price) * qty : 0);
                      }, 0);
                    }, 0)
                  ) * productQuantity
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorias */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCategoriesModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Categorias</h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoriesModal(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 border-b border-gray-100 transition-colors",
                  selectedCategory === null ? "bg-red-50 text-red-600" : "hover:bg-gray-50"
                )}
              >
                <span className="font-medium text-sm">Todos os produtos</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {productsList.filter((p) => p.status === 'active').length}
                </span>
              </button>
              {sortedCategories.map((category) => {
                const count = productsList.filter(
                  (p) => p.status === 'active' && p.categoryId === category.id
                ).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoriesModal(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 border-b border-gray-100 transition-colors",
                      selectedCategory === category.id ? "bg-red-50 text-red-600" : "hover:bg-gray-50"
                    )}
                  >
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Configuração da Aba */}
      <Dialog open={showHandleConfig} onOpenChange={setShowHandleConfig}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuração da Aba</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Posição Vertical */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Posição Vertical</Label>
                <span className="text-sm text-muted-foreground">{tempHandleConfig.positionY}%</span>
              </div>
              <Slider
                value={[tempHandleConfig.positionY]}
                onValueChange={([value]) => {
                  setTempHandleConfig(prev => ({ ...prev, positionY: value }));
                  setHandleConfig(prev => ({ ...prev, positionY: value }));
                }}
                min={10}
                max={90}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Ajuste a posição vertical da aba na tela</p>
            </div>

            {/* Altura da Aba */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Altura da Aba</Label>
                <span className="text-sm text-muted-foreground">{tempHandleConfig.height}px</span>
              </div>
              <Slider
                value={[tempHandleConfig.height]}
                onValueChange={([value]) => {
                  setTempHandleConfig(prev => ({ ...prev, height: value }));
                  setHandleConfig(prev => ({ ...prev, height: value }));
                }}
                min={40}
                max={120}
                step={4}
                className="w-full"
              />
            </div>

            {/* Largura da Aba */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Largura da Aba</Label>
                <span className="text-sm text-muted-foreground">{tempHandleConfig.width}px</span>
              </div>
              <Slider
                value={[tempHandleConfig.width]}
                onValueChange={([value]) => {
                  setTempHandleConfig(prev => ({ ...prev, width: value }));
                  setHandleConfig(prev => ({ ...prev, width: value }));
                }}
                min={16}
                max={48}
                step={4}
                className="w-full"
              />
            </div>

            {/* Opção de Aba Global */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aba Fixa em Todas as Páginas</Label>
                  <p className="text-xs text-muted-foreground">Mostrar a aba em todas as páginas (exceto PDV)</p>
                </div>
                <Switch
                  checked={tempHandleConfig.showGlobally}
                  onCheckedChange={(checked) => {
                    setTempHandleConfig(prev => ({ ...prev, showGlobally: checked }));
                    setHandleConfig(prev => ({ ...prev, showGlobally: checked }));
                  }}
                />
              </div>
            </div>

            {/* Dica de preview ao vivo */}
            <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span className="text-blue-500">💡</span>
                As alterações são aplicadas em tempo real na aba. Olhe para a aba na tela para ver o resultado.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetHandleConfig}>
              Resetar
            </Button>
            <Button onClick={saveHandleConfig} className="bg-red-500 hover:bg-red-600">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
