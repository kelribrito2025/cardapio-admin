import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike,
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
  Undo2,
  ArrowUpDown,
  Receipt,
  Star,
  ClipboardList,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Constantes para configuração da aba
const HANDLE_CONFIG_KEY = 'pdv-slidebar-handle-config';
const GLOBAL_HANDLE_KEY = 'pdv-slidebar-global-handle';
const CARTS_PER_TABLE_KEY = 'pdv-carts-per-table';
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

// Função helper para calcular preço do complemento no contexto de mesa (dine_in)
function getComplementPriceDineIn(
  item: { price: string | number; priceMode?: string; freeOnDelivery?: boolean; freeOnPickup?: boolean; freeOnDineIn?: boolean }
): number {
  if (item.priceMode === 'free') {
    if (item.freeOnDineIn) return 0;
    if (!item.freeOnDelivery && !item.freeOnPickup && !item.freeOnDineIn) return 0;
    return Number(item.price);
  }
  return Number(item.price);
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

interface TableShortcut {
  id: number;
  number: number;
  status: string;
  tabId?: number;
  tabItemsCount?: number; // Quantidade de itens na comanda
  displayNumber?: string | null; // Número de exibição para mesas combinadas (ex: "1-3")
  mergedIntoId?: number | null; // ID da mesa principal se esta mesa foi juntada
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
  displayNumber?: string | null; // Número de exibição para mesas combinadas (ex: "3-4-5")
}

export function PDVSlidebar({ isOpen, onClose, onToggle, tableNumber, tableId, tabId, onOrderCreated, showHandle = false, tables = [], onTableChange, displayNumber }: PDVSlidebarProps) {
  // Número de exibição da mesa (usa displayNumber se for mesa combinada, senão usa tableNumber)
  const tableDisplayName = displayNumber || tableNumber.toString();
  // Verificar se a mesa atual está reservada
  const currentTableData = tables.find(t => t.number === tableNumber);
  const isCurrentTableReserved = currentTableData?.status === "reserved";
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

  const utils = trpc.useUtils();

  // Mutation para atualizar método de impressão favorito
  const updatePrintMethodMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      utils.printer.getSettings.invalidate();
      toast.success("Método de impressão favorito atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar método de impressão");
    },
  });

  // Função para alternar o método de impressão favorito
  const handleToggleFavoritePrintMethod = (method: 'normal' | 'automatic') => {
    if (!establishmentId) return;
    updatePrintMethodMutation.mutate({
      establishmentId,
      defaultPrintMethod: method,
    });
  };

  // Verificar se o usuário tem API Key gerada (Mindi Printer conectado)
  const hasMindiPrinterApiKey = !!printerSettings?.printerApiKey;

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
    if (printMethod === 'automatic') {
      // Impressão automática via Mindi Printer - não faz nada no frontend
      // A impressão é enviada automaticamente via SSE
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
      if (data.id) {
        handlePrintWithFavoriteMethod(data.id);
      }
      clearCartSilent();
      onOrderCreated?.();
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido", {
        description: error.message,
      });
    },
  });

  // Estado para carrinhos por mesa (indexado por tableId)
  const [cartsPerTable, setCartsPerTable] = useState<Record<number, CartItem[]>>(() => {
    try {
      const saved = localStorage.getItem(CARTS_PER_TABLE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar carrinhos:', e);
    }
    return {};
  });

  // Contador para forçar re-render quando cartsPerTable muda (garante reatividade)
  const [cartsVersion, setCartsVersion] = useState(0);

  // useEffect para forçar re-render quando cartsPerTable muda
  useEffect(() => {
    setCartsVersion(v => v + 1);
  }, [cartsPerTable]);

  // Carrinho da mesa atual (derivado do tableId)
  const cart = useMemo(() => {
    if (!tableId) return [];
    return cartsPerTable[tableId] || [];
  }, [cartsPerTable, tableId]);

  // Função para atualizar o carrinho da mesa atual
  const setCart = (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    if (!tableId) return;
    setCartsPerTable(prev => {
      const currentCart = prev[tableId] || [];
      const newCart = typeof updater === 'function' ? updater(currentCart) : updater;
      const updated = { ...prev, [tableId]: newCart };
      // Persistir no localStorage
      try {
        localStorage.setItem(CARTS_PER_TABLE_KEY, JSON.stringify(updated));
        // Disparar evento customizado fora do ciclo de render para evitar setState durante render
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent('cartsPerTableUpdated', { detail: updated }));
        });
      } catch (e) {
        console.error('Erro ao salvar carrinhos:', e);
      }
      return updated;
    });
  };

  // Estados
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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
  
  // Ref para delay na abertura do dropdown de itens
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para cupom
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number; couponId: number} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Estados para limpar/desfazer
  const [clearedCart, setClearedCart] = useState<CartItem[] | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  
  // Ref para o timer de desfazer
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para aba selecionada (consumo ou comanda)
  const [selectedTab, setSelectedTab] = useState<'consumo' | 'comanda'>('consumo');

  // Estado para modal de conferência ao fechar mesa
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);

  // Estados para edição de itens da comanda
  const [expandedTabItemId, setExpandedTabItemId] = useState<number | null>(null);
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<number | null>(null);
  const [deleteConfirmItemName, setDeleteConfirmItemName] = useState<string>("");

  // Query para buscar itens da comanda (pedidos já enviados)
  const { data: tabData, isLoading: tabItemsLoading, refetch: refetchTabItems } = trpc.tabs.getByTable.useQuery(
    { tableId: tableId! },
    { 
      enabled: !!tableId && selectedTab === 'comanda',
      refetchInterval: selectedTab === 'comanda' ? 5000 : false // Atualizar a cada 5s quando na aba comanda
    }
  );

  // Resetar clearedCart quando trocar de mesa
  useEffect(() => {
    setClearedCart(null);
    setUndoCountdown(0);
    // Limpar timers ao trocar de mesa
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [tableId, tableNumber]);

  // Estado para inversão das barras de mesas e categorias
  const [barsSwapped, setBarsSwapped] = useState(() => {
    try {
      const saved = localStorage.getItem('pdv-bars-swapped');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Salvar preferência de inversão no localStorage
  const toggleBarsSwapped = () => {
    const newValue = !barsSwapped;
    setBarsSwapped(newValue);
    try {
      localStorage.setItem('pdv-bars-swapped', String(newValue));
    } catch (e) {
      console.error('Erro ao salvar preferência de inversão:', e);
    }
  };

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

  // Ref para drag de mesas
  const tablesContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingTables, setIsDraggingTables] = useState(false);
  const [tablesStartX, setTablesStartX] = useState(0);
  const [tablesScrollLeft, setTablesScrollLeft] = useState(0);
  const [tablesHasOverflow, setTablesHasOverflow] = useState(false);

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

  // Verificar overflow das mesas
  useEffect(() => {
    const checkTablesOverflow = () => {
      const container = tablesContainerRef.current;
      if (container) {
        setTablesHasOverflow(container.scrollWidth > container.clientWidth);
      }
    };
    checkTablesOverflow();
    window.addEventListener('resize', checkTablesOverflow);
    return () => window.removeEventListener('resize', checkTablesOverflow);
  }, [tables]);

  // Handlers para drag de mesas
  const handleTablesMouseDown = (e: React.MouseEvent) => {
    if (!tablesContainerRef.current) return;
    setIsDraggingTables(true);
    setTablesStartX(e.pageX - tablesContainerRef.current.offsetLeft);
    setTablesScrollLeft(tablesContainerRef.current.scrollLeft);
  };

  useEffect(() => {
    const handleTablesMouseUp = () => setIsDraggingTables(false);
    const handleTablesMouseMove = (e: MouseEvent) => {
      if (!isDraggingTables || !tablesContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - tablesContainerRef.current.offsetLeft;
      const walk = (x - tablesStartX) * 2;
      tablesContainerRef.current.scrollLeft = tablesScrollLeft - walk;
    };
    document.addEventListener('mouseup', handleTablesMouseUp);
    document.addEventListener('mousemove', handleTablesMouseMove);
    return () => {
      document.removeEventListener('mouseup', handleTablesMouseUp);
      document.removeEventListener('mousemove', handleTablesMouseMove);
    };
  }, [isDraggingTables, tablesStartX, tablesScrollLeft]);

  // Buscar complementos do produto selecionado
  const { data: productComplements } = trpc.publicMenu.getProductComplements.useQuery(
    { productId: selectedProduct?.id || 0 },
    { enabled: !!selectedProduct?.id }
  );

  // Listas processadas
  const productsList = products?.products || [];
  const sortedCategories = categories?.filter(c => c.isActive).slice().sort((a, b) => a.sortOrder - b.sortOrder) || [];

  // Normalizar texto removendo acentos para busca
  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      if (product.status !== 'active') return false;
      const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        normalizeText(product.name).includes(normalizeText(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [productsList, selectedCategory, searchQuery]);

  // Função auxiliar para comparar complementos
  const areComplementsEqual = (a: CartItem['complements'], b: CartItem['complements']): boolean => {
    if (a.length !== b.length) return false;
    // Ordenar por id para comparação consistente
    const sortedA = [...a].sort((x, y) => x.id - y.id);
    const sortedB = [...b].sort((x, y) => x.id - y.id);
    return sortedA.every((itemA, index) => {
      const itemB = sortedB[index];
      return itemA.id === itemB.id && itemA.quantity === itemB.quantity;
    });
  };

  // Funções do carrinho
  const addToCart = (product: Product, quantity: number, observation: string, complements: CartItem['complements']) => {
    // Validar estoque antes de adicionar
    if (product.hasStock && product.stockQuantity != null) {
      const alreadyInCart = cart
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (alreadyInCart + quantity > product.stockQuantity) {
        const remaining = Math.max(0, product.stockQuantity - alreadyInCart);
        toast.error(`Estoque insuficiente: apenas ${remaining} unidade(s) disponível(is)`);
        return;
      }
    }
    
    setCart(prev => {
      // Procurar item existente com mesmo produto, mesmos complementos e mesma observação
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && 
        item.observation === observation &&
        areComplementsEqual(item.complements, complements)
      );

      if (existingIndex !== -1) {
        // Item existe, incrementar quantidade
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Item não existe, adicionar novo
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          observation,
          image: product.images?.[0] || null,
          complements
        }];
      }
    });
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(prev => {
      const item = prev[index];
      if (updates.quantity && updates.quantity > (item?.quantity ?? 0)) {
        // Incrementando quantidade - verificar estoque
        const product = productsList.find(p => p.id === item?.productId);
        if (product && product.hasStock && product.stockQuantity != null) {
          const totalInCart = prev
            .filter(ci => ci.productId === product.id)
            .reduce((sum, ci) => sum + ci.quantity, 0);
          const newTotal = totalInCart - (item?.quantity ?? 0) + updates.quantity;
          if (newTotal > product.stockQuantity) {
            toast.error(`Estoque insuficiente: apenas ${product.stockQuantity} unidade(s) disponível(is)`);
            return prev;
          }
        }
      }
      return prev.map((item, i) => i === index ? { ...item, ...updates } : item);
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Função para limpar carrinho SEM ativar desfazer (usado após enviar pedido)
  const clearCartSilent = () => {
    setCart([]);
    setExpandedCartItem(null);
    setShowCouponField(false);
    setCouponCode("");
    setAppliedCoupon(null);
    // Garantir que não há estado de desfazer ativo
    setClearedCart(null);
    setUndoCountdown(0);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Função para limpar carrinho COM opção de desfazer (usado pelo botão Limpar)
  const clearCart = () => {
    // Salvar itens atuais para possível desfazer
    if (cart.length > 0) {
      setClearedCart([...cart]);
      setUndoCountdown(10);
      
      // Limpar timers anteriores se existirem
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      // Iniciar contador regressivo visual
      countdownIntervalRef.current = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            // Quando chegar a 0, limpar tudo
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setClearedCart(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
      // Limpar os timers ao desfazer
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCart(clearedCart);
      setClearedCart(null);
      setUndoCountdown(0);
      toast.success("Itens restaurados!");
    }
  };

  // Limpar timers ao desmontar o componente
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price);
      const complementsPrice = item.complements.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
      return total + (itemPrice + complementsPrice) * item.quantity;
    }, 0);
  };

  // Calcula o total dos itens da comanda (para a aba Comanda)
  const calculateTabTotal = () => {
    if (!tabData?.items) return 0;
    return tabData.items
      .filter((item: any) => item.status !== 'cancelled')
      .reduce((total: number, item: any) => {
        const itemPrice = parseFloat(item.unitPrice || '0');
        const complementsPrice = item.complements?.reduce((sum: number, c: any) => sum + parseFloat(c.price || '0') * (c.quantity || 1), 0) || 0;
        return total + (itemPrice + complementsPrice) * item.quantity;
      }, 0);
  };

  // Retorna o total apropriado baseado na aba selecionada
  const getDisplayTotal = () => {
    if (selectedTab === 'comanda') {
      return calculateTabTotal();
    }
    return calculateTotal();
  };

  // Handlers
  // Adicionar item rapidamente (botão +): se não tem complementos, adiciona direto
  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) {
      toast.error("Produto indisponível");
      return;
    }
    
    try {
      const complements = await utils.publicMenu.getProductComplements.fetch({ productId: product.id });
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

  const handleProductClick = (product: Product) => {
    // Produto indisponível apenas quando tem controle de estoque ativo E quantidade = 0
    if (product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0)) {
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
        if (group.minQuantity > 0) {
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
            price: String(getComplementPriceDineIn(item)),
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

  // Mutation para atualizar item da comanda (quantidade)
  const updateTabItemMutation = trpc.tabs.updateItem.useMutation({
    onSuccess: () => {
      refetchTabItems();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar item");
    }
  });

  // Mutation para cancelar/excluir item da comanda
  const cancelTabItemMutation = trpc.tabs.cancelItem.useMutation({
    onSuccess: () => {
      toast.success("Item removido da comanda!");
      setDeleteConfirmItemId(null);
      setDeleteConfirmItemName("");
      setExpandedTabItemId(null);
      refetchTabItems();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover item");
    }
  });

  // Mutation para adicionar itens à comanda
  const addTabItemsMutation = trpc.tabs.addItems.useMutation({
    onSuccess: () => {
      toast.success("Itens adicionados à comanda!");
      clearCartSilent();
      onOrderCreated?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar itens");
    }
  });

  // Mutation para abrir mesa e criar comanda
  const openTableMutation = trpc.tables.open.useMutation({
    onSuccess: (data) => {
      // Após abrir a mesa, adicionar os itens à comanda criada
      addTabItemsMutation.mutate({
        tabId: data.tabId,
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
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir mesa");
    }
  });

  // Mutation para fechar mesa
  const closeTableMutation = trpc.tables.close.useMutation({
    onSuccess: () => {
      toast.success(`Mesa ${tableDisplayName} fechada com sucesso!`);
      clearCartSilent();
      onOrderCreated?.();
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar mesa");
    }
  });

  // Função para imprimir recibo da comanda usando método favorito
  const handlePrintTabReceipt = async () => {
    if (!tabId) return;
    const printMethod = printerSettings?.defaultPrintMethod || 'normal';
    
    if (printMethod === 'automatic') {
      // Impressão automática via Mindi Printer - não faz nada no frontend
      return;
    } else {
      try {
        const receiptUrl = `${window.location.origin}/api/print/tab-receipt/${tabId}`;
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
        console.error("Erro ao imprimir recibo:", error);
      }
    }
  };

  // Função para confirmar fechamento da mesa (chamada pelo modal)
  const handleConfirmCloseTable = async () => {
    if (!tableId || !tabId) return;
    
    // Primeiro imprime o recibo
    await handlePrintTabReceipt();
    
    // Depois fecha a mesa
    closeTableMutation.mutate({
      tableId: tableId!,
      paymentMethod: 'cash',
      paidAmount: calculateTabTotal(),
      changeAmount: 0
    });
    
    // Fecha o modal
    setShowCloseTableModal(false);
  };

  // Finalizar pedido
  const handleFinishOrder = () => {
    // Se estiver na aba Comanda e tem itens na comanda, abrir modal de conferência
    if (selectedTab === 'comanda' && tabId && tabData?.items && tabData.items.filter((item: any) => item.status !== 'cancelled').length > 0) {
      // Abrir modal de conferência em vez de fechar diretamente
      setShowCloseTableModal(true);
      return;
    }
    
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido");
      return;
    }

    // Se tem tabId, adiciona diretamente à comanda existente
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

    // Se tem tableId mas não tem tabId, precisa abrir a mesa primeiro (criar comanda)
    // A openTableMutation vai criar a comanda e depois adicionar os itens
    if (tableId) {
      openTableMutation.mutate({ tableId, guests: 1 });
      return;
    }

    // Caso contrário (sem mesa), cria um pedido normal
    const orderNumber = generateOrderNumber();
    const subtotal = calculateTotal();

    createOrderMutation.mutate({
      establishmentId: establishmentId!,
      orderNumber,
      customerName: `Pedido Avulso`,
      customerPhone: "",
      customerAddress: "",
      deliveryType: "dine_in",
      paymentMethod: "cash",
      subtotal: subtotal.toFixed(2),
      deliveryFee: "0.00",
      discount: "0.00",
      total: subtotal.toFixed(2),
      notes: "",
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
          "fixed top-0 right-0 h-full bg-background z-50 shadow-2xl flex flex-col",
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
          {/* Barra Superior - Mesas ou Categorias (depend da inversão) */}
          {barsSwapped ? (
            /* Barra de Categorias no topo quando invertido */
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
                      selectedCategory === null ? "bg-card text-red-500" : "bg-red-500 text-white"
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
                          "relative px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                          selectedCategory === category.id
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                        )}
                      >
                        {categoryNameWithoutEmoji}
                        <span className={cn(
                          "absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-semibold",
                          selectedCategory === category.id ? "bg-card text-red-500" : "bg-red-500 text-white"
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
          ) : (
            /* Abas de Mesas no topo (padrão) */
            tables.length > 0 && (
              <div className="relative bg-muted/50 px-3 py-2">
                <div 
                  ref={tablesContainerRef}
                  className={cn(
                    "flex items-center gap-2 overflow-x-auto pr-8 scrollbar-hide select-none",
                    isDraggingTables ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={handleTablesMouseDown}
                >
                  <button
                    onClick={toggleBarsSwapped}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-card text-muted-foreground hover:bg-muted border border-border/50 transition-all shrink-0"
                    title="Trocar posição das barras"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                  {tables
                    .filter(table => !table.mergedIntoId) // Ocultar mesas juntadas
                    .map((table) => {
                    // Status baseado apenas em itens enviados (comanda), não carrinho local
                    const tabItemsCount = table.tabItemsCount || 0;
                    const tableHasItems = tabItemsCount > 0;
                    const isReserved = table.status === "reserved";
                    const displayNum = table.displayNumber || table.number.toString();
                    return (
                      <button
                        key={`${table.id}-${cartsVersion}-${tableHasItems}`}
                        onClick={() => onTableChange?.(table)}
                        disabled={table.number === tableNumber}
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                          table.number === tableNumber
                            ? tableHasItems
                              ? "bg-red-500 text-white shadow-sm cursor-default"
                              : isReserved
                                ? "bg-blue-500 text-white shadow-sm cursor-default"
                                : "bg-emerald-500 text-white shadow-sm cursor-default"
                            : tableHasItems
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : isReserved
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        )}
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                        {displayNum}
                      </button>
                    );
                  })}
                </div>
                {tablesHasOverflow && (
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none pr-2">
                    <ChevronsRight className="h-5 w-5 text-emerald-400 animate-bounce-x" />
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Barra Secundária - Full Width - Mesas ou Categorias (depend da inversão) */}
        {barsSwapped ? (
          /* Abas de Mesas embaixo quando invertido */
          tables.length > 0 && (
            <div className="relative bg-muted/50 px-3 py-2 border-b border-border/50">
              <div 
                ref={!barsSwapped ? undefined : tablesContainerRef}
                className={cn(
                  "flex items-center gap-2 overflow-x-auto pr-8 scrollbar-hide select-none",
                  isDraggingTables ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseDown={handleTablesMouseDown}
              >
                <button
                  onClick={toggleBarsSwapped}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-card text-muted-foreground hover:bg-muted border border-border/50 transition-all shrink-0"
                  title="Trocar posição das barras"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>
                {tables
                  .filter(table => !table.mergedIntoId)
                  .map((table) => {
                  // Status baseado apenas em itens enviados (comanda), não carrinho local
                  const tabItemsCount = table.tabItemsCount || 0;
                  const tableHasItems = tabItemsCount > 0;
                  const isReserved = table.status === "reserved";
                  const displayNum = table.displayNumber || table.number.toString();
                  return (
                    <button
                      key={`${table.id}-${cartsVersion}-${tableHasItems}`}
                      onClick={() => onTableChange?.(table)}
                      disabled={table.number === tableNumber}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                        table.number === tableNumber
                          ? tableHasItems
                            ? "bg-red-500 text-white shadow-sm cursor-default"
                            : isReserved
                              ? "bg-blue-500 text-white shadow-sm cursor-default"
                              : "bg-emerald-500 text-white shadow-sm cursor-default"
                          : tableHasItems
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : isReserved
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      )}
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                      {displayNum}
                    </button>
                  );
                })}
              </div>
              {tablesHasOverflow && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none pr-2">
                  <ChevronsRight className="h-5 w-5 text-emerald-400 animate-bounce-x" />
                </div>
              )}
            </div>
          )
        ) : (
          /* Barra de Categorias embaixo (padrão) - full width */
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
                    selectedCategory === null ? "bg-card text-red-500" : "bg-red-500 text-white"
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
                          selectedCategory === category.id ? "bg-card text-red-500" : "bg-red-500 text-white"
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
        )}

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Coluna Esquerda - Produtos */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">

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
                        {product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0) && (
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
                            onClick={(e) => handleQuickAdd(product, e)}
                            disabled={product.hasStock && product.stockQuantity != null && product.stockQuantity <= 0}
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
          <div className="w-[370px] bg-muted/30 flex flex-col">
            {/* Header do Carrinho */}
            <div className="border-b border-border/50 bg-muted/40">
              {/* Título do Carrinho */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground leading-tight">Mesa {tableDisplayName}</h3>
                      <p className="text-sm text-muted-foreground leading-tight mt-0.5">
                        {cart.length === 0
                          ? 'Adicione produtos para iniciar um pedido.'
                          : 'Revise os itens e envie para a comanda.'}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const totalItems = cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
                    return (
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0",
                        totalItems > 0
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {/* Abas: Mesa (Consumo) e Comanda - Pill selector com sliding animation */}
              <div className="relative flex items-center bg-background rounded-xl p-1 mx-4 mb-3">
                {/* Sliding pill indicator */}
                <div
                  className={cn(
                    "absolute top-1 bottom-1 rounded-lg shadow-sm transition-all duration-300 ease-in-out",
                    isCurrentTableReserved ? "bg-blue-500" : "bg-red-500"
                  )}
                  style={{
                    width: 'calc((100% - 8px) / 2)',
                    left: selectedTab === 'consumo'
                      ? '4px'
                      : 'calc((100% - 8px) / 2 + 4px)',
                  }}
                />
                <button
                  onClick={() => setSelectedTab('consumo')}
                  className={cn(
                    "relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                    selectedTab === 'consumo'
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Mesa {tableDisplayName}
                </button>
                <button
                  onClick={() => {
                    if (tabId) setSelectedTab('comanda');
                  }}
                  className={cn(
                    "relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 flex items-center justify-center gap-2",
                    !tabId
                      ? "text-muted-foreground/50 cursor-not-allowed opacity-50"
                      : selectedTab === 'comanda'
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                  title={!tabId ? "Mesa sem comanda aberta" : "Ver itens da comanda"}
                >
                  <Receipt className="w-4 h-4" />
                  Comanda
                </button>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20">
              {/* Aba Mesa - Carrinho (itens pendentes) */}
              {selectedTab === 'consumo' && (
                <>
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
                          className="bg-card rounded-lg border border-border/50 shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-300"
                          onMouseEnter={() => {
                            // Limpar timeout anterior se existir
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                            }
                            // Adicionar delay de 300ms antes de expandir
                            hoverTimeoutRef.current = setTimeout(() => {
                              setExpandedCartItem(index);
                            }, 300);
                          }}
                          onMouseLeave={() => {
                            // Limpar timeout se sair antes de completar o delay
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = null;
                            }
                            setExpandedCartItem(null);
                          }}
                        >
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => setExpandedCartItem(isExpanded ? null : index)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-1 rounded">
                                {item.quantity}x
                              </span>
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {item.name}
                              </h4>
                            </div>
                            <span className="text-sm font-bold text-foreground ml-2">
                              {formatCurrency(itemTotal)}
                            </span>
                          </div>

                          {/* Ações expandidas */}
                          {isExpanded && (
                            <div className="border-t border-border/50">
                              {/* Complementos */}
                              {item.complements.length > 0 && (
                                <div className="px-3 py-2 bg-muted/50">
                                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Complementos:</p>
                                  <div className="space-y-1">
                                    {item.complements.map((comp, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs">
                                        <span className="text-foreground/80">
                                          {comp.quantity > 1 ? `${comp.quantity}x ` : ""}{comp.name}
                                        </span>
                                        <span className="text-muted-foreground">
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
                                    className="p-1.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                  <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}
                                    className="p-1.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
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
                </>
              )}

              {/* Aba Comanda - Itens já enviados para preparo */}
              {selectedTab === 'comanda' && (
                <>
                  {tabItemsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-3"></div>
                      <p className="text-xs font-medium">Carregando comanda...</p>
                    </div>
                  ) : !tabData?.items || tabData.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Receipt className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-xs font-medium">Nenhum item na comanda</p>
                      <p className="text-[10px]">Os itens aparecerão aqui após enviar o pedido</p>
                    </div>
                  ) : (
                    tabData.items
                      .filter((item: any) => item.status !== 'cancelled')
                      .map((item: any, index: number) => {
                        const itemTotal = parseFloat(item.totalPrice);
                        const isExpanded = expandedTabItemId === item.id;
                        const unitPrice = parseFloat(item.unitPrice);
                        const complementsTotal = (item.complements || []).reduce(
                          (sum: number, c: any) => sum + (parseFloat(c.price) || 0) * (c.quantity || 1), 0
                        );
                        
                        return (
                          <div
                            key={`tab-item-${item.id}-${index}`}
                            className="bg-card rounded-lg border border-border/50 shadow-sm border-l-4 border-l-red-500 overflow-hidden transition-all duration-200"
                          >
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedTabItemId(isExpanded ? null : item.id)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-1 rounded">
                                  {item.quantity}x
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-foreground truncate">
                                    {item.productName}
                                  </h4>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-foreground ml-2">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>
                            {/* Complementos da comanda */}
                            {item.complements && item.complements.length > 0 && (
                              <div className="px-3 py-2 bg-muted/50 border-t border-border/50">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Complementos:</p>
                                <div className="space-y-0.5">
                                  {item.complements.map((comp: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <span className="text-foreground/80">
                                        {comp.quantity > 1 ? `${comp.quantity}x ` : ""}{comp.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {parseFloat(comp.price) > 0 ? `+${formatCurrency(parseFloat(comp.price) * comp.quantity)}` : ""}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Observação da comanda */}
                            {item.observation && (
                              <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border-t border-border/50">
                                <p className="text-xs text-yellow-700 italic">
                                  <span className="font-medium">Obs:</span> {item.observation}
                                </p>
                              </div>
                            )}
                            {/* Controles de edição expandíveis */}
                            {isExpanded && (
                              <div className="px-3 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <button
                                    className="w-[25px] h-[25px] flex items-center justify-center rounded bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                                    disabled={item.quantity <= 1 || updateTabItemMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTabItemMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                                    }}
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                  <button
                                    className="w-[25px] h-[25px] flex items-center justify-center rounded bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                                    disabled={updateTabItemMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTabItemMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="w-[25px] h-[25px] flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors disabled:opacity-50"
                                    disabled={cancelTabItemMutation.isPending}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmItemId(item.id);
                                      setDeleteConfirmItemName(item.productName);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </>
              )}
            </div>

            {/* Footer - Total e Botão */}
            <div className="p-3 border-t border-border/50 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-semibold">{formatCurrency(getDisplayTotal())}</span>
              </div>

              {/* Desconto do Cupom */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desconto ({appliedCoupon.code})</span>
                  <span className="font-medium text-green-600">-{formatCurrency(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(Math.max(0, getDisplayTotal() - (appliedCoupon?.discount || 0)))}
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
                  <Ticket className={cn("h-4 w-4", showCouponField ? "text-red-500" : "text-muted-foreground")} />
                </Button>
                {/* Botão Imprimir - ao lado do cupom, apenas quando aba Comanda está selecionada */}
                {selectedTab === 'comanda' && tabId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="px-3 flex-shrink-0 border-border hover:bg-muted"
                        title="Opções de impressão"
                      >
                        <Printer className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div 
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" 
                        onClick={() => {
                          const receiptUrl = `${window.location.origin}/api/print/tab-receipt/${tabId}`;
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
                          toast.info("Abrindo impressão normal...");
                        }}
                      >
                        <div className="flex items-center">
                          <Printer className="h-4 w-4 mr-2" />
                          <span className="text-sm">Impressão Normal</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavoritePrintMethod('normal');
                              }}
                              className="p-1 hover:bg-accent-foreground/10 rounded"
                            >
                              <Star 
                                className={cn(
                                  "h-4 w-4 transition-colors",
                                  printerSettings?.defaultPrintMethod === 'normal' 
                                    ? "fill-amber-500 text-amber-500" 
                                    : "text-amber-500"
                                )} 
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px]">
                            <p className="font-medium">Definir como impressão padrão</p>
                            <p className="text-xs text-muted-foreground">Ao marcar como favorito, essa opção será usada automaticamente ao clicar em Aceitar pedido.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {hasMindiPrinterApiKey && (
                      <div 
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer" 
                        onClick={() => {
                          toast.info("Impressão automática ativa", { description: "Os pedidos serão impressos automaticamente via Mindi Printer" });
                        }}
                      >
                        <div className="flex items-center">
                          <Printer className="h-4 w-4 mr-2" />
                          <span className="text-sm">Impressão Automática</span>
                          <span className="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded">Mindi</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavoritePrintMethod('automatic');
                              }}
                              className="p-1 hover:bg-accent-foreground/10 rounded"
                            >
                              <Star 
                                className={cn(
                                  "h-4 w-4 transition-colors",
                                  printerSettings?.defaultPrintMethod === 'automatic' 
                                    ? "fill-amber-500 text-amber-500" 
                                    : "text-amber-500"
                                )} 
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px]">
                            <p className="font-medium">Definir como impressão padrão</p>
                            <p className="text-xs text-muted-foreground">Ao marcar como favorito, os pedidos serão impressos automaticamente via Mindi Printer.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
                      Desfazer ({undoCountdown})
                    </>
                  ) : (
                    "Limpar"
                  )}
                </Button>
                {/* Botão Fechar conta / Adicionar à Comanda */}
                <Button
                  onClick={handleFinishOrder}
                  disabled={
                    (selectedTab === 'comanda' 
                      ? (!tabData?.items || tabData.items.filter((item: any) => item.status !== 'cancelled').length === 0)
                      : cart.length === 0
                    ) || createOrderMutation.isPending || addTabItemsMutation.isPending || openTableMutation.isPending || closeTableMutation.isPending
                  }
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {selectedTab !== 'comanda' && <ClipboardList className="h-4 w-4 mr-2" />}
                  {(createOrderMutation.isPending || addTabItemsMutation.isPending || openTableMutation.isPending || closeTableMutation.isPending) 
                    ? (closeTableMutation.isPending ? "Fechando..." : "Enviando...") 
                    : selectedTab === 'comanda' 
                      ? `Fechar Mesa ${tableDisplayName}` 
                      : "Enviar pedido"}
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
          
          <div className="relative bg-card rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300" style={{ touchAction: 'pan-y' }}>
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
                      className="absolute top-3 right-3 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </div>
                );
              }
              
              return (
                <div className="relative w-full h-[180px] sm:h-48 md:h-56 flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <UtensilsCrossed className="h-16 w-16 md:h-20 md:w-20 text-white/80 animate-placeholder-pulse" />
                  <button 
                    onClick={() => { setSelectedProduct(null); setSelectedComplementImage(null); setIsEditingMode(false); setEditingCartItem(null); }}
                    className="absolute top-3 right-3 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg transition-colors z-10"
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
                      const totalSelectedInGroup = Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0);
                      const isGroupComplete = totalSelectedInGroup >= group.maxQuantity;
                      
                      return (
                        <div key={group.id} id={`pdv-complement-group-${group.id}`} className={`transition-all duration-300 rounded-xl border ${isGroupComplete ? 'border-red-200 dark:border-red-800' : 'border-border'}`}>
                          {/* Header do Grupo - Sticky */}
                          <div className={`px-4 py-3 border-b transition-colors duration-300 sticky z-20 shadow-sm rounded-t-xl ${isGroupComplete ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'bg-muted/50 border-border'}`} style={{paddingTop: '8px', top: 0}}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold transition-colors duration-300 ${isGroupComplete ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{group.name}</h4>
                                {isGroupComplete && (
                                  <svg className="w-4 h-4 text-red-500 animate-in fade-in zoom-in duration-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isGroupComplete && (
                                  <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                                    Completo
                                  </span>
                                )}
                                {!isGroupComplete && (group.isRequired || group.minQuantity >= 1) && (
                                  <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                                    Obrigatório
                                  </span>
                                )}
                                {!isGroupComplete && group.minQuantity === 0 && !(group.isRequired) && (
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                    Opcional
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`text-xs mt-0.5 transition-colors duration-300 ${isGroupComplete ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
                              {(() => {
                                const min = group.minQuantity;
                                const max = group.maxQuantity;
                                if (min === 1 && max === 1) return 'Escolha 1 opção';
                                if (min === 1 && max > 1) return `Escolha até ${max} opções`;
                                if (min === max) return `Escolha ${min} opções`;
                                if (min > 1 && max > min) return `Escolha de ${min} a ${max} opções`;
                                if (min === 0 && max === 1) return 'Escolha até 1 opção';
                                if (min === 0 && max > 1) return `Escolha até ${max} opções`;
                                return '';
                              })()}
                            </p>
                          </div>
                          
                          {/* Itens do Grupo */}
                          <div className="divide-y divide-border/50">
                            {group.items.map((item) => {
                              const itemQuantity = selectedInGroup.get(item.id) || 0;
                              const isSelected = itemQuantity > 0;
                              const itemImageUrl = item.imageUrl;
                              const displayPrice = getComplementPriceDineIn(item);
                              
                              // Função para incrementar
                              const handleIncrement = (e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedComplements((prev) => {
                                  const newMap = new Map(prev);
                                  const currentGroupMap = new Map(prev.get(group.id) || []);
                                  const currentQty = currentGroupMap.get(item.id) || 0;
                                  const totalInGroup = Array.from(currentGroupMap.values()).reduce((a, b) => a + b, 0);
                                  if (totalInGroup < group.maxQuantity) {
                                    currentGroupMap.set(item.id, currentQty + 1);
                                    newMap.set(group.id, currentGroupMap);
                                    if (itemImageUrl) setSelectedComplementImage(itemImageUrl);
                                    // Auto-scroll para próximo grupo se atingiu o máximo
                                    const newTotal = totalInGroup + 1;
                                    if (newTotal >= group.maxQuantity && productComplements) {
                                      const currentIndex = productComplements.findIndex(g => g.id === group.id);
                                      if (currentIndex < productComplements.length - 1) {
                                        const nextGroup = productComplements[currentIndex + 1];
                                        setTimeout(() => {
                                          document.getElementById(`pdv-complement-group-${nextGroup.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 200);
                                      }
                                    }
                                  }
                                  return newMap;
                                });
                              };
                              
                              // Função para decrementar
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
                                    const newGroupMap = new Map<number, number>();
                                    newGroupMap.set(item.id, 1);
                                    newMap.set(group.id, newGroupMap);
                                    if (itemImageUrl) {
                                      setSelectedComplementImage(itemImageUrl);
                                    } else {
                                      setSelectedComplementImage(null);
                                    }
                                    // Auto-scroll para próximo grupo (radio sempre atinge max=1)
                                    if (productComplements) {
                                      const currentIndex = productComplements.findIndex(g => g.id === group.id);
                                      if (currentIndex < productComplements.length - 1) {
                                        const nextGroup = productComplements[currentIndex + 1];
                                        setTimeout(() => {
                                          document.getElementById(`pdv-complement-group-${nextGroup.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 200);
                                      }
                                    }
                                  } else {
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
                                        // Auto-scroll para próximo grupo se atingiu o máximo
                                        const newTotal = totalInGroup + 1;
                                        if (newTotal >= group.maxQuantity && productComplements) {
                                          const currentIndex = productComplements.findIndex(g => g.id === group.id);
                                          if (currentIndex < productComplements.length - 1) {
                                            const nextGroup = productComplements[currentIndex + 1];
                                            setTimeout(() => {
                                              document.getElementById(`pdv-complement-group-${nextGroup.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 200);
                                          }
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
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('[data-qty-controls]')) return;
                                    handleToggle();
                                  }}
                                  className={`flex flex-col px-4 py-3 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-muted/50'
                                  }`}
                                >
                                  {/* Linha: Círculo + Nome + Botões +/- + Preço */}
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`w-5 h-5 rounded-${isRadio ? 'full' : 'md'} border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected ? 'border-red-500 bg-red-500' : 'border-muted-foreground/30 bg-background'
                                      }`}>
                                        {isSelected && (
                                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm text-foreground flex-1 min-w-0">{item.name}</span>
                                      {(item as any).badgeText && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white animate-pulse leading-none flex-shrink-0" style={{width: '69px', height: '19px', borderRadius: '8px'}}>
                                          {(item as any).badgeText}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                      {/* Botões +/- quando selecionado e não é radio */}
                                      {isSelected && !isRadio && (
                                        <div data-qty-controls className="flex items-center gap-2 bg-background border border-border rounded-lg px-1">
                                          <button
                                            type="button"
                                            onClick={handleDecrement}
                                            className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                          >
                                            <Minus className="w-4 h-4" />
                                          </button>
                                          <span className="w-6 text-center text-sm font-medium text-foreground">{itemQuantity}</span>
                                          <button
                                            type="button"
                                            onClick={handleIncrement}
                                            className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                                            <span className="text-sm text-muted-foreground min-w-[70px] text-right">
                                              {isSelected && itemQuantity > 1 
                                                ? `+ ${formatCurrency(totalItemPrice)}` 
                                                : `+ ${formatCurrency(displayPrice)}`
                                              }
                                            </span>
                                          );
                                        } else if (displayPrice === 0 && item.priceMode === 'free') {
                                          return (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-800">
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Grátis
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                  
                                  {/* Linha 2: Descrição (se existir) */}
                                  {(item as any).description && (
                                    <div className="ml-8 mt-1">
                                      <span className="text-xs text-muted-foreground leading-tight">{(item as any).description}</span>
                                    </div>
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observações
                  </label>
                  <textarea
                    value={productObservation}
                    onChange={(e) => setProductObservation(e.target.value)}
                    placeholder="Ex: Sem cebola, bem passado..."
                    rows={2}
                    className="w-full px-4 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer - Quantidade e Adicionar */}
            <div className="border-t p-4 bg-card flex items-center gap-4">
              {/* Controle de Quantidade */}
              <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                <button
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{productQuantity}</span>
                <button
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-muted/50 transition-colors"
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
                        return sum + (item ? getComplementPriceDineIn(item) * qty : 0);
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
          <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Categorias</h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoriesModal(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 border-b border-border/50 transition-colors",
                  selectedCategory === null ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "hover:bg-muted/50"
                )}
              >
                <span className="font-medium text-sm">Todos os produtos</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
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
                      "w-full flex items-center justify-between p-3 border-b border-border/50 transition-colors",
                      selectedCategory === category.id ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Conferência ao Fechar Mesa - Estilo PDV */}
      {showCloseTableModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCloseTableModal(false)}
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
                    <p className="text-sm text-white/80">Consumo no local</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCloseTableModal(false)}
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
                <span className="px-3 py-1 bg-foreground text-background text-xs font-bold rounded">
                  CONSUMO
                </span>
              </div>

              {/* Info da Mesa */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-foreground/80">Mesa:</p>
                <p className="text-sm font-bold">Mesa {tableDisplayName}</p>
                <p className="text-xs text-muted-foreground">
                  Comanda C{String(tabData?.id || 0).padStart(3, '0')} • Aberta em {tabData?.openedAt ? new Date(tabData.openedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>

              {/* Lista de Itens */}
              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}
              
              <div className="space-y-2">
                {tabData?.items?.filter((item: any) => item.status !== 'cancelled').map((item: any, index: number) => {
                  const itemTotal = parseFloat(item.totalPrice) || 0;
                  let complements: any[] = [];
                  try {
                    complements = typeof item.complements === 'string' ? JSON.parse(item.complements) : (item.complements || []);
                  } catch (e) {}
                  
                  return (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.quantity}x {item.productName}
                          </p>
                          {complements.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {complements.map((comp: any, cIndex: number) => {
                                if (comp.items && Array.isArray(comp.items)) {
                                  return comp.items.map((ci: any, ciIndex: number) => {
                                    const qty = ci.quantity || 1;
                                    const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                                    return (
                                      <p key={`${cIndex}-${ciIndex}`} className="text-xs text-muted-foreground pl-2">
                                        + {qtyPrefix}{ci.name}
                                        {ci.price > 0 && (
                                          <span className="ml-1 text-muted-foreground/70">
                                            ({formatCurrency(ci.price * qty)})
                                          </span>
                                        )}
                                      </p>
                                    );
                                  });
                                } else if (comp.name) {
                                  const qty = comp.quantity || 1;
                                  const qtyPrefix = qty > 1 ? `${qty}x ` : '';
                                  return (
                                    <p key={cIndex} className="text-xs text-muted-foreground pl-2">
                                      + {qtyPrefix}{comp.name}
                                      {comp.price > 0 && (
                                        <span className="ml-1 text-muted-foreground/70">
                                          ({formatCurrency(comp.price * qty)})
                                        </span>
                                      )}
                                    </p>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Obs: {item.notes}</p>
                          )}
                        </div>
                        <p className="font-semibold text-sm">
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {printerSettings?.showDividers !== false && (
                <div className="border-t border-dashed border-border" />
              )}

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateTabTotal())}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>TOTAL:</span>
                  <span className="text-red-600">
                    {formatCurrency(calculateTabTotal())}
                  </span>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagamento:</span>
                  <span className="font-medium">Dinheiro</span>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                onClick={handleConfirmCloseTable}
                disabled={closeTableMutation.isPending}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                {closeTableMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Fechando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar e Fechar Mesa
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCloseTableModal(false)}
                variant="outline"
                className="w-full py-3"
                disabled={closeTableMutation.isPending}
              >
                Voltar e Revisar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de item da comanda */}
      <AlertDialog open={deleteConfirmItemId !== null} onOpenChange={(open) => { if (!open) { setDeleteConfirmItemId(null); setDeleteConfirmItemName(""); } }}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Excluir item da comanda</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar exclusão do item</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Excluir item da comanda</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja excluir <strong>{deleteConfirmItemName}</strong> da comanda? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold" disabled={cancelTabItemMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 rounded-xl h-10 font-semibold bg-red-600 hover:bg-red-700 text-white"
                disabled={cancelTabItemMutation.isPending}
                onClick={() => {
                  if (deleteConfirmItemId) {
                    cancelTabItemMutation.mutate({ id: deleteConfirmItemId });
                  }
                }}
              >
                {cancelTabItemMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Configuração da Aba */}
      <Dialog open={showHandleConfig} onOpenChange={setShowHandleConfig}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Configuração da Aba</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Configuração da Aba</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Personalize a aparência e posição da aba do PDV
                </p>
              </div>
            </div>
          <div className="space-y-6">
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
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={resetHandleConfig} className="flex-1 rounded-xl h-10 font-semibold">
              Resetar
            </Button>
            <Button onClick={saveHandleConfig} className="flex-1 rounded-xl h-10 font-semibold bg-red-500 hover:bg-red-600 text-white">
              Salvar
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
