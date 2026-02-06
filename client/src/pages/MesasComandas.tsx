import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { PDVSlidebar } from "@/components/PDVSlidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Receipt,
  AlertCircle,
  Trash2,
  X,
  ChefHat,
  Utensils,
  Printer,
  Loader2,
  MapPin,
  Settings,
  Pencil,
  Filter,
  Unlink,
  Link2,
  MoreVertical,
  CalendarClock,
  Phone,
  UserRound,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Tipos
type TableStatus = "free" | "occupied" | "reserved";

interface TableSpace {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface TabItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  complements?: Array<{ name: string; price: number; quantity: number }> | null;
  notes?: string | null;
  status: string;
  orderedAt: Date | string;
  deliveredAt?: Date | string | null;
}

interface Tab {
  id: number;
  tabNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  status: string;
  subtotal: string;
  discount: string;
  serviceCharge: string;
  total: string;
  openedAt: Date | string;
  closedAt?: Date | string | null;
}

interface Table {
  id: number;
  number: number;
  name?: string | null;
  capacity: number;
  status: TableStatus;
  currentGuests: number;
  occupiedAt?: Date | string | null;
  reservedFor?: Date | string | null;
  reservedName?: string | null;
  reservedPhone?: string | null;
  spaceId?: number | null;
  // Campos para mesas combinadas
  mergedIntoId?: number | null;
  mergedTableIds?: string | null;
  displayNumber?: string | null;
  tab?: Tab;
  items?: TabItem[];
}

// Helpers
const getStatusConfig = (status: TableStatus) => {
  switch (status) {
    case "free":
      return {
        label: "Livre",
        color: "bg-emerald-500",
        borderColor: "border-l-emerald-500",
        textColor: "text-emerald-600",
        bgLight: "bg-emerald-50",
        hoverBg: "hover:bg-emerald-50",
      };
    case "occupied":
      return {
        label: "Ocupada",
        color: "bg-red-500",
        borderColor: "border-l-red-500",
        textColor: "text-red-600",
        bgLight: "bg-red-50",
        hoverBg: "hover:bg-red-50",
      };
    case "reserved":
      return {
        label: "Reservada",
        color: "bg-blue-500",
        borderColor: "border-l-blue-500",
        textColor: "text-blue-600",
        bgLight: "bg-blue-50",
        hoverBg: "hover:bg-blue-50",
      };
    default:
      return {
        label: "Livre",
        color: "bg-emerald-500",
        borderColor: "border-l-emerald-500",
        textColor: "text-emerald-600",
        bgLight: "bg-emerald-50",
        hoverBg: "hover:bg-emerald-50",
      };
  }
};

const formatDuration = (startTime: Date | string | null | undefined) => {
  if (!startTime) return "—";
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const diff = Date.now() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Formato: 1Min, 1h, 2h40
  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${minutes}`;
  }
  return `${minutes}Min`;
};

const formatTime = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Constante para persistência da mesa selecionada
const SELECTED_TABLE_KEY = 'mesas-selected-table-id';
const CARTS_PER_TABLE_KEY = 'pdv-carts-per-table';

// Tipo para itens do carrinho
interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  observation: string;
  image: string | null;
  complements: Array<{ id: number; name: string; price: string; quantity: number }>;
}

export default function MesasComandas() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPDVSlidebar, setShowPDVSlidebar] = useState(false);
  
  // Estado para carrinhos por mesa (sincronizado com PDVSlidebar)
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

  // Sincronizar carrinhos quando localStorage mudar (outras abas) ou evento customizado (mesma aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CARTS_PER_TABLE_KEY && e.newValue) {
        try {
          setCartsPerTable(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao parsear carrinhos:', err);
        }
      }
    };
    
    // Listener para evento customizado (atualizações na mesma aba)
    const handleCartsUpdate = (e: CustomEvent<Record<number, CartItem[]>>) => {
      setCartsPerTable(e.detail);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartsPerTableUpdated', handleCartsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartsPerTableUpdated', handleCartsUpdate as EventListener);
    };
  }, []);

  // Função para verificar se mesa tem itens (apenas itens enviados/comanda, não carrinho local)
  const tableHasItems = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    const tabItems = table?.items?.length || 0;
    return tabItems > 0;
  };

  // Função para obter total de itens da mesa (apenas itens enviados/comanda)
  const getTableItemsCount = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    const tabItems = table?.items?.length || 0;
    return tabItems;
  };

  // Função para calcular total da mesa (apenas itens enviados/comanda)
  const getTableTotal = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    const tabTotal = table?.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
    return tabTotal;
  };

  // Função para obter status derivado da mesa
  const getDerivedStatus = (table: typeof tables[number]): TableStatus => {
    if (tableHasItems(table.id)) return "occupied";
    if (table.status === "reserved") return "reserved";
    return "free";
  };
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageSpacesDialog, setShowManageSpacesDialog] = useState(false);
  const [newTableCount, setNewTableCount] = useState(10);
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [persistedTableId, setPersistedTableId] = useState<number | null>(null);
  
  // Estados para reserva de mesa
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [reserveTableId, setReserveTableId] = useState<number | null>(null);
  const [reserveTableNumber, setReserveTableNumber] = useState<string>("");
  const [reserveName, setReserveName] = useState("");
  const [reservePhone, setReservePhone] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  
  // Estado para forçar re-render do timer de ocupação das mesas a cada minuto
  const [, setTimerTick] = useState(0);
  
  // Estados para gerenciar espaços
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [editingSpaceName, setEditingSpaceName] = useState("");
  const [newSpaceNameInput, setNewSpaceNameInput] = useState("");

  // Carregar mesa selecionada do localStorage
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(SELECTED_TABLE_KEY);
      if (savedId) {
        setPersistedTableId(parseInt(savedId, 10));
      }
    } catch (e) {
      console.error('Erro ao carregar mesa selecionada:', e);
    }
  }, []);

  // Persistir mesa selecionada no localStorage
  useEffect(() => {
    if (selectedTable) {
      try {
        localStorage.setItem(SELECTED_TABLE_KEY, selectedTable.id.toString());
      } catch (e) {
        console.error('Erro ao salvar mesa selecionada:', e);
      }
    }
  }, [selectedTable]);

  // Buscar mesas do banco
  const { data: tables = [], isLoading, refetch } = trpc.tables.list.useQuery();
  
  // Buscar espaços do banco
  const { data: spaces = [], refetch: refetchSpaces } = trpc.tableSpaces.list.useQuery();

  // Restaurar mesa selecionada quando as mesas carregarem
  useEffect(() => {
    if (persistedTableId && tables.length > 0 && !selectedTable) {
      const table = tables.find(t => t.id === persistedTableId);
      if (table) {
        setSelectedTable(table as Table);
      }
    }
  }, [persistedTableId, tables, selectedTable]);

  // Timer para atualizar o contador de tempo das mesas ocupadas a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  // Atalhos de teclado F2 para abrir e ESC para fechar a slidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não capturar se estiver em um input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // F2 para abrir a slidebar (se houver mesa selecionada)
      if (e.key === 'F2' && selectedTable) {
        e.preventDefault();
        setShowPDVSlidebar(true);
      }
      
      // ESC para fechar a slidebar
      if (e.key === 'Escape' && showPDVSlidebar) {
        e.preventDefault();
        setShowPDVSlidebar(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, showPDVSlidebar]);
  
  // Mutations para mesas
  const createBatchMutation = trpc.tables.createBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} mesas criadas com sucesso!`);
      setShowCreateDialog(false);
      setNewSpaceName("");
      refetch();
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar mesas");
    },
  });

  const openTableMutation = trpc.tables.open.useMutation({
    onSuccess: () => {
      toast.success("Mesa aberta com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir mesa");
    },
  });

  const closeTableMutation = trpc.tables.close.useMutation({
    onSuccess: () => {
      toast.success("Mesa fechada com sucesso!");
      setShowSidebar(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar mesa");
    },
  });

  const updateStatusMutation = trpc.tables.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const requestBillMutation = trpc.tabs.requestBill.useMutation({
    onSuccess: () => {
      toast.success("Conta solicitada!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao solicitar conta");
    },
  });

  // Mutations para espaços
  const createSpaceMutation = trpc.tableSpaces.create.useMutation({
    onSuccess: () => {
      toast.success("Espaço criado com sucesso!");
      setNewSpaceNameInput("");
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar espaço");
    },
  });

  const updateSpaceMutation = trpc.tableSpaces.update.useMutation({
    onSuccess: () => {
      toast.success("Espaço atualizado!");
      setEditingSpaceId(null);
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar espaço");
    },
  });

  const deleteSpaceMutation = trpc.tableSpaces.delete.useMutation({
    onSuccess: () => {
      toast.success("Espaço removido!");
      refetchSpaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover espaço");
    },
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      toast.success("Mesa excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir mesa");
    },
  });

  // Mutation para juntar mesas
  const mergeTablesMutation = trpc.tables.merge.useMutation({
    onSuccess: (data) => {
      toast.success(`Mesas juntadas: ${data.displayNumber}`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao juntar mesas");
    },
  });

  // Mutation para separar mesas
  const splitTablesMutation = trpc.tables.split.useMutation({
    onSuccess: () => {
      toast.success("Mesas separadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao separar mesas");
    },
  });

  // Estados para drag and drop
  const [draggedTableId, setDraggedTableId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  // Cálculos de resumo (usando status derivado baseado em itens do carrinho + comanda)
  const summary = useMemo(() => {
    // Contar mesas por status derivado
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    let totalRevenue = 0;
    
    tables.forEach((t) => {
      const tabItemsCount = t.items?.length || 0;
      const hasItems = tabItemsCount > 0;
      
      if (hasItems) {
        occupied++;
        // Calcular total da comanda (apenas itens enviados)
        const tabTotal = t.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
        totalRevenue += tabTotal;
      } else if (t.status === "reserved") {
        reserved++;
      } else {
        free++;
      }
    });
    
    const avgTicket = occupied > 0 ? totalRevenue / occupied : 0;

    return {
      free,
      occupied,
      reserved,
      totalRevenue,
      avgTicket,
      avgTimeMinutes: 0,
    };
  }, [tables]);

  // Contagem de mesas por status (para a legenda) - usando status derivado
  const statusCounts = useMemo(() => {
    let free = 0;
    let occupied = 0;
    let reserved = 0;
    
    tables.forEach((t) => {
      // Verificar apenas itens enviados (comanda), não carrinho local
      const tabItems = t.items?.length || 0;
      const hasItems = tabItems > 0;
      
      if (hasItems) {
        occupied++;
      } else if (t.status === "reserved") {
        reserved++;
      } else {
        free++;
      }
    });
    
    return { free, occupied, reserved };
  }, [tables]);

  // Filtrar mesas por espaço e status (usando status derivado)
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      // Ocultar mesas que foram juntadas a outra (mergedIntoId != null)
      if (table.mergedIntoId) return false;
      // Filtro por espaço
      const matchesSpace = selectedSpaceId === "all" || table.spaceId === selectedSpaceId;
      // Filtro por status derivado (da legenda)
      const derivedStatus = getDerivedStatus(table);
      const matchesStatus = statusFilter === null || derivedStatus === statusFilter;
      // Filtro por busca (incluindo displayNumber para mesas combinadas)
      const displayNum = table.displayNumber || table.number.toString();
      const matchesSearch = searchQuery === "" || displayNum.includes(searchQuery) || table.number.toString().includes(searchQuery);
      return matchesSpace && matchesStatus && matchesSearch;
    });
  }, [tables, selectedSpaceId, statusFilter, searchQuery]);

  // Contagem de mesas por espaço
  const spaceTablesCount = useMemo(() => {
    const counts: Record<string | number, number> = { all: tables.length };
    spaces.forEach(space => {
      counts[space.id] = tables.filter(t => t.spaceId === space.id).length;
    });
    // Mesas sem espaço definido
    const noSpaceCount = tables.filter(t => !t.spaceId).length;
    counts.noSpace = noSpaceCount;
    return counts;
  }, [tables, spaces]);

  const handleTableClick = (table: typeof tables[number]) => {
    // Cast para Table, tratando requesting_bill como occupied
    const normalizedTable: Table = {
      ...table,
      status: table.status === "requesting_bill" ? "occupied" : table.status as TableStatus
    };
    setSelectedTable(normalizedTable);
    setShowPDVSlidebar(true);
  };

  const handlePDVSlidebarClose = () => {
    setShowPDVSlidebar(false);
  };

  const handleOrderCreated = async () => {
    // Atualizar os dados das mesas
    const result = await refetch();
    // Atualizar selectedTable com os dados atualizados (incluindo tabId)
    if (result.data && selectedTable) {
      const updatedTable = result.data.find(t => t.id === selectedTable.id);
      if (updatedTable) {
        setSelectedTable({
          ...updatedTable,
          status: updatedTable.status === "requesting_bill" ? "occupied" : updatedTable.status as TableStatus
        } as Table);
      }
    }
    // Não fechar a sidebar após enviar pedido para permitir adicionar mais itens
  };

  const handleOpenTable = (table: Table) => {
    openTableMutation.mutate({ tableId: table.id, guests: 1 });
  };

  const handleCloseTable = (table: Table) => {
    if (!table.tab) return;
    closeTableMutation.mutate({
      tableId: table.id,
      paymentMethod: "dinheiro",
      paidAmount: parseFloat(table.tab.total),
    });
  };

  const handleRequestBill = (table: Table) => {
    if (!table.tab) return;
    requestBillMutation.mutate({ tableId: table.id });
  };

  const handleClearTable = (table: Table) => {
    updateStatusMutation.mutate({ id: table.id, status: "free" });
  };

  // Abrir modal de reserva
  const handleOpenReserveDialog = (tableId: number, displayNum: string) => {
    setReserveTableId(tableId);
    setReserveTableNumber(displayNum);
    setReserveName("");
    setReservePhone("");
    setReserveTime("");
    setShowReserveDialog(true);
  };

  // Confirmar reserva
  const handleConfirmReservation = () => {
    if (!reserveTableId) return;
    
    const reservedFor = reserveTime ? new Date(`${new Date().toISOString().split('T')[0]}T${reserveTime}:00`).toISOString() : undefined;
    
    updateStatusMutation.mutate({
      id: reserveTableId,
      status: "reserved",
      reservedName: reserveName || undefined,
      reservedPhone: reservePhone || undefined,
      reservedFor: reservedFor,
    }, {
      onSuccess: () => {
        toast.success(`Mesa ${reserveTableNumber} reservada!`);
        setShowReserveDialog(false);
        refetch();
      },
    });
  };

  // Cancelar reserva
  const handleCancelReservation = (tableId: number, displayNum: string) => {
    updateStatusMutation.mutate({ id: tableId, status: "free" }, {
      onSuccess: () => {
        toast.success(`Reserva da Mesa ${displayNum} cancelada!`);
        refetch();
      },
    });
  };

  const handleCreateTables = () => {
    // Encontrar o maior número de mesa existente
    const maxNumber = tables.length > 0 
      ? Math.max(...tables.map(t => t.number)) 
      : 0;
    
    createBatchMutation.mutate({
      startNumber: maxNumber + 1,
      count: newTableCount,
      capacity: newTableCapacity,
      spaceName: newSpaceName || undefined,
    });
  };

  const handleStatusFilterClick = (status: TableStatus) => {
    // Toggle: se já está selecionado, desseleciona
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  const handleCreateSpace = () => {
    if (!newSpaceNameInput.trim()) {
      toast.error("Digite um nome para o espaço");
      return;
    }
    createSpaceMutation.mutate({ name: newSpaceNameInput.trim() });
  };

  const handleUpdateSpace = (id: number) => {
    if (!editingSpaceName.trim()) {
      toast.error("Digite um nome para o espaço");
      return;
    }
    updateSpaceMutation.mutate({ id, name: editingSpaceName.trim() });
  };

  const handleDeleteSpace = (id: number) => {
    if (confirm("Tem certeza que deseja remover este espaço? As mesas não serão excluídas.")) {
      deleteSpaceMutation.mutate({ id });
    }
  };

  const handleDeleteTable = (tableId: number, tableNumber: number) => {
    if (confirm(`Tem certeza que deseja excluir a Mesa ${tableNumber}? Todos os itens da comanda também serão excluídos.`)) {
      deleteTableMutation.mutate({ id: tableId });
    }
  };

  // Lista de status para a legenda clicável
  const statusLegend: { status: TableStatus; label: string; color: string }[] = [
    { status: "free", label: "Livre", color: "bg-emerald-500" },
    { status: "occupied", label: "Ocupada", color: "bg-red-500" },
    { status: "reserved", label: "Reservada", color: "bg-blue-500" },
  ];

  // Se não há mesas, mostrar tela de criação
  if (!isLoading && tables.length === 0) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <PageHeader 
            title="Mapa de mesas" 
            description="Visualização e controle das mesas do salão"
          />
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Utensils className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma mesa cadastrada</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Crie suas mesas para começar a gerenciar o salão do seu estabelecimento.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Criar Mesas
          </Button>
        </div>

        {/* Dialog para criar mesas */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Mesas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome do espaço das mesas</label>
                <Input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Ex: Salão, Varanda, Área Externa..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional. Agrupa as mesas por local físico do restaurante.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Quantidade de mesas</label>
                <Input
                  type="number"
                  value={newTableCount}
                  onChange={(e) => setNewTableCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Capacidade por mesa</label>
                <Input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  min={1}
                  max={20}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateTables}
                disabled={createBatchMutation.isPending}
              >
                {createBatchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar {newTableCount} Mesas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <PageHeader 
          title="Mapa de mesas" 
          description="Visualização e controle das mesas do salão"
        />
      </div>

      <div className="space-y-5">

        {/* Cards de Resumo - Apenas Ticket Médio e Faturamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[585px]">
          {/* Ticket Médio */}
          <div className="bg-white rounded-xl border border-border/50 border-t-4 border-t-blue-500 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avgTicket)}</span>
                </div>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Faturamento */}
          <div className="bg-white rounded-xl border border-border/50 border-t-4 border-t-emerald-500 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faturamento</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de Espaços e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filtros de Espaços */}
          <div className="flex flex-wrap gap-2">
            {/* Botão "Todas" */}
            <button
              onClick={() => setSelectedSpaceId("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                selectedSpaceId === "all"
                  ? "bg-red-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <MapPin className="h-4 w-4" />
              Todas
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center",
                selectedSpaceId === "all"
                  ? "bg-white/20 text-white"
                  : "bg-red-500 text-white"
              )}>
                {tables.length}
              </span>
            </button>

            {/* Botões de Espaços */}
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setSelectedSpaceId(space.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  selectedSpaceId === space.id
                    ? "bg-red-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {space.name}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center",
                  selectedSpaceId === space.id
                    ? "bg-white/20 text-white"
                    : "bg-red-500 text-white"
                )}>
                  {spaceTablesCount[space.id] || 0}
                </span>
              </button>
            ))}

            {/* Botão para adicionar mesa/espaço */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 bg-red-500 text-white hover:bg-red-600 w-[42px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Adicionar mesas</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão para gerenciar espaços */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowManageSpacesDialog(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Gerenciar espaços</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Busca */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar mesa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Legenda de Status (clicável) */}
        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <Filter className="h-5 w-5 text-gray-400" />
          {statusLegend.map((item, index) => (
            <button
              key={item.status}
              onClick={() => handleStatusFilterClick(item.status)}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md transition-all",
                statusFilter === item.status
                  ? "bg-gray-100 ring-2 ring-gray-300"
                  : "hover:bg-gray-50",
                index === 0 && "-ml-2.5"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full", item.color)} />
              <span>{item.label}</span>
              <span className="text-xs text-gray-400">({statusCounts[item.status]})</span>
            </button>
          ))}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter(null)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar filtro
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Grid de Mesas */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTables.map((table) => {
              // Status derivado baseado em itens no carrinho ou comanda
              const derivedStatus = getDerivedStatus(table);
              const statusConfig = getStatusConfig(derivedStatus);
              const hasItems = tableHasItems(table.id);
              const itemsCount = getTableItemsCount(table.id);
              const tableTotal = getTableTotal(table.id);
              const isMergedTable = !!table.mergedTableIds;
              const displayNumber = table.displayNumber || table.number.toString();
              const isDragging = draggedTableId === table.id;
              const isDropTarget = dropTargetId === table.id && draggedTableId !== table.id;
              
              return (
                <div
                  key={table.id}
                  className="relative"
                >
                  {/* Botão ⋮ no canto superior direito */}
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200/80 transition-colors text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {derivedStatus === "free" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReserveDialog(table.id, displayNumber);
                            }}
                            className="cursor-pointer"
                          >
                            <CalendarClock className="h-4 w-4 mr-2 text-blue-500" />
                            Reservar mesa
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "reserved" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelReservation(table.id, displayNumber);
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancelar reserva
                          </DropdownMenuItem>
                        )}
                        {derivedStatus === "occupied" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearTable(table as Table);
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpar mesa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(table.id, table.number);
                          }}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir mesa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <button
                    draggable
                    onDragStart={(e) => {
                      setDraggedTableId(table.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', table.id.toString());
                    }}
                    onDragEnd={() => {
                      setDraggedTableId(null);
                      setDropTargetId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedTableId && draggedTableId !== table.id) {
                        setDropTargetId(table.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDropTargetId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedTableId && draggedTableId !== table.id) {
                        mergeTablesMutation.mutate({
                          sourceTableId: draggedTableId,
                          targetTableId: table.id,
                        });
                      }
                      setDraggedTableId(null);
                      setDropTargetId(null);
                    }}
                    onClick={() => handleTableClick(table)}
                    className={cn(
                      "w-full bg-white rounded-xl border border-border/50 p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                      "border-l-4 min-h-[120px]",
                      statusConfig.borderColor,
                      isDragging && "opacity-50 scale-95",
                      isDropTarget && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">{displayNumber}</span>
                        {/* Indicador de mesa combinada */}
                        <div className="min-h-[20px]">
                          {isMergedTable ? (
                            <div className="group/merged relative w-fit">
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1 md:group-hover/merged:opacity-0 transition-opacity">
                                <Link2 className="h-3 w-3" />
                                Mesas unidas
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!splitTablesMutation.isPending) {
                                    splitTablesMutation.mutate({ tableId: table.id });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    if (!splitTablesMutation.isPending) {
                                      splitTablesMutation.mutate({ tableId: table.id });
                                    }
                                  }
                                }}
                                className={cn(
                                  "text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-all inline-flex items-center gap-1 cursor-pointer w-fit",
                                  "md:absolute md:top-0 md:left-0 md:opacity-0 md:group-hover/merged:opacity-100",
                                  "max-md:mt-1",
                                  splitTablesMutation.isPending && "opacity-50 cursor-not-allowed"
                                )}
                                title="Separar mesas"
                              >
                                <Unlink className="h-3 w-3" />
                                <span>Separar</span>
                              </span>
                            </div>
                          ) : null}
                          {/* Badge Reservada */}
                          {derivedStatus === "reserved" && !isMergedTable && (
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              Reservada
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Contador de tempo para mesas ocupadas */}
                      {hasItems && table.occupiedAt && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mr-6">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(table.occupiedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Informações da mesa ocupada */}
                    {hasItems && (
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Receipt className="h-3.5 w-3.5" />
                          <span>{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</span>
                        </div>
                        {tableTotal > 0 && (
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(tableTotal)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informações da mesa reservada */}
                    {derivedStatus === "reserved" && !hasItems && (
                      <div className="space-y-1 text-sm text-gray-600">
                        {table.reservedName && (
                          <div className="flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            <span className="truncate">{table.reservedName}</span>
                          </div>
                        )}
                        {table.reservedFor && (
                          <div className={cn("font-semibold", statusConfig.textColor)}>
                            {formatTime(table.reservedFor)}
                          </div>
                        )}
                        {!table.reservedName && !table.reservedFor && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{table.currentGuests || table.capacity}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensagem quando não há mesas no filtro */}
        {!isLoading && filteredTables.length === 0 && tables.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
            <p>Nenhuma mesa encontrada com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSelectedSpaceId("all");
                setStatusFilter(null);
                setSearchQuery("");
              }}
              className="text-sm text-red-500 hover:text-red-700 mt-2"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Sidebar de Detalhes da Mesa */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedTable && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                    getStatusConfig(selectedTable.status as TableStatus).color
                  )}>
                    {selectedTable.number}
                  </div>
                  <div>
                    <span className="text-xl">Mesa {selectedTable.number}</span>
                    <p className={cn(
                      "text-sm font-medium",
                      getStatusConfig(selectedTable.status as TableStatus).textColor
                    )}>
                      {getStatusConfig(selectedTable.status as TableStatus).label}
                    </p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Informações da Comanda */}
              {selectedTable.tab && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Comanda</span>
                    <span className="font-medium">{selectedTable.tab.tabNumber}</span>
                  </div>
                  {selectedTable.occupiedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tempo de uso</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(selectedTable.occupiedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Pessoas</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedTable.currentGuests}
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de Itens */}
              {selectedTable.items && selectedTable.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Itens da Comanda</h4>
                  <div className="space-y-2">
                    {selectedTable.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity}x {formatCurrency(parseFloat(item.unitPrice))}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-400 italic">{item.notes}</p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(item.totalPrice))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totais */}
              {selectedTable.tab && (
                <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(parseFloat(selectedTable.tab.subtotal))}</span>
                  </div>
                  {parseFloat(selectedTable.tab.serviceCharge) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Taxa de Serviço (10%)</span>
                      <span>{formatCurrency(parseFloat(selectedTable.tab.serviceCharge))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTable.tab.discount) > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(parseFloat(selectedTable.tab.discount))}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(selectedTable.tab.total))}</span>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3">
                {selectedTable.status === "free" && (
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleOpenTable(selectedTable)}
                    disabled={openTableMutation.isPending}
                  >
                    {openTableMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Abrir Mesa
                  </Button>
                )}

                {selectedTable.status === "occupied" && (
                  <>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      onClick={() => {
                        setShowSidebar(false);
                        setShowPDVSlidebar(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-amber-300 text-amber-600 hover:bg-amber-50"
                      onClick={() => handleRequestBill(selectedTable)}
                      disabled={requestBillMutation.isPending}
                    >
                      {requestBillMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Receipt className="h-4 w-4 mr-2" />
                      )}
                      Pedir Conta
                    </Button>
                  </>
                )}

                {selectedTable.status === "reserved" && (
                  <>
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleOpenTable(selectedTable)}
                      disabled={openTableMutation.isPending}
                    >
                      {openTableMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Chegada
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleClearTable(selectedTable)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  </>
                )}

                {selectedTable.status === "occupied" && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-500 hover:text-gray-700"
                    onClick={() => handleClearTable(selectedTable)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Mesa
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog para criar mesas */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Mesas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do espaço das mesas</label>
              <Input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Ex: Salão, Varanda, Área Externa..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional. Agrupa as mesas por local físico do restaurante.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantidade de mesas</label>
              <Input
                type="number"
                value={newTableCount}
                onChange={(e) => setNewTableCount(parseInt(e.target.value) || 1)}
                min={1}
                max={100}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Capacidade por mesa</label>
              <Input
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                min={1}
                max={20}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTables}
              disabled={createBatchMutation.isPending}
            >
              {createBatchMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar {newTableCount} Mesas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar espaços */}
      <Dialog open={showManageSpacesDialog} onOpenChange={setShowManageSpacesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gerenciar Espaços
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Lista de espaços existentes */}
            {spaces.length > 0 ? (
              <div className="space-y-2">
                {spaces.map((space) => (
                  <div key={space.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {editingSpaceId === space.id ? (
                      <>
                        <Input
                          value={editingSpaceName}
                          onChange={(e) => setEditingSpaceName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSpace(space.id)}
                          disabled={updateSpaceMutation.isPending}
                        >
                          {updateSpaceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Salvar"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSpaceId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium">{space.name}</span>
                        <span className="text-sm text-gray-500">
                          {spaceTablesCount[space.id] || 0} mesas
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSpaceId(space.id);
                            setEditingSpaceName(space.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteSpace(space.id)}
                          disabled={deleteSpaceMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Nenhum espaço cadastrado.</p>
                <p className="text-sm">Use o botão <strong>+</strong> ao lado do campo de busca para criar espaços.</p>
              </div>
            )}

            {/* Lista de mesas para excluir */}
            {tables.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Mesas ({tables.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span>Mesa {table.number}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTable(table.id, table.number)}
                        disabled={deleteTableMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageSpacesDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para reservar mesa */}
      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-500" />
              Reservar Mesa {reserveTableNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do cliente</label>
              <div className="relative mt-1">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={reservePhone}
                  onChange={(e) => setReservePhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Horário da reserva</label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={reserveTime}
                  onChange={(e) => setReserveTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Todos os campos são opcionais.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReserveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReservation}
              disabled={updateStatusMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4 mr-2" />
              )}
              Reservar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDV Slidebar */}
      <PDVSlidebar
        isOpen={showPDVSlidebar}
        onClose={handlePDVSlidebarClose}
        onToggle={() => setShowPDVSlidebar(true)}
        tableNumber={selectedTable?.number || 0}
        tableId={selectedTable?.id}
        tabId={selectedTable?.tab?.id}
        onOrderCreated={handleOrderCreated}
        showHandle={true}
        displayNumber={selectedTable?.displayNumber}
        tables={tables.map(t => ({
          id: t.id,
          number: t.number,
          status: t.status === "requesting_bill" ? "occupied" : t.status,
          tabId: t.tab?.id,
          tabItemsCount: t.items?.length || 0,
          displayNumber: t.displayNumber,
          mergedIntoId: t.mergedIntoId
        }))}
        onTableChange={(table) => {
          const fullTable = tables.find(t => t.id === table.id);
          if (fullTable) {
            setSelectedTable({
              ...fullTable,
              status: fullTable.status === "requesting_bill" ? "occupied" : fullTable.status as TableStatus
            } as Table);
          }
        }}
      />
    </AdminLayout>
  );
}
