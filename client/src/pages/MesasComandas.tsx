import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { PDVSlidebar } from "@/components/PDVSlidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
} from "lucide-react";

// Tipos
type TableStatus = "free" | "occupied" | "reserved" | "requesting_bill";

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
      };
    case "occupied":
      return {
        label: "Ocupada",
        color: "bg-amber-500",
        borderColor: "border-l-amber-500",
        textColor: "text-amber-600",
        bgLight: "bg-amber-50",
      };
    case "reserved":
      return {
        label: "Reservada",
        color: "bg-blue-500",
        borderColor: "border-l-blue-500",
        textColor: "text-blue-600",
        bgLight: "bg-blue-50",
      };
    case "requesting_bill":
      return {
        label: "Pedindo conta",
        color: "bg-red-500",
        borderColor: "border-l-red-500",
        textColor: "text-red-600",
        bgLight: "bg-red-50",
      };
  }
};

const formatDuration = (startTime: Date | string | null | undefined) => {
  if (!startTime) return "";
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const diff = Date.now() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  }
  return `${minutes}min`;
};

const formatTime = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Constante para persistência da mesa selecionada
const SELECTED_TABLE_KEY = 'mesas-selected-table-id';

export default function MesasComandas() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPDVSlidebar, setShowPDVSlidebar] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTableCount, setNewTableCount] = useState(10);
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [persistedTableId, setPersistedTableId] = useState<number | null>(null);

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

  // Restaurar mesa selecionada quando as mesas carregarem
  useEffect(() => {
    if (persistedTableId && tables.length > 0 && !selectedTable) {
      const table = tables.find(t => t.id === persistedTableId);
      if (table) {
        setSelectedTable(table as Table);
      }
    }
  }, [persistedTableId, tables, selectedTable]);

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
  
  // Mutations
  const createBatchMutation = trpc.tables.createBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} mesas criadas com sucesso!`);
      setShowCreateDialog(false);
      refetch();
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

  // Cálculos de resumo
  const summary = useMemo(() => {
    const free = tables.filter((t) => t.status === "free").length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const requestingBill = tables.filter((t) => t.status === "requesting_bill").length;
    
    const occupiedTables = tables.filter((t) => t.status === "occupied" || t.status === "requesting_bill");
    const totalRevenue = occupiedTables.reduce((sum, t) => sum + parseFloat(t.tab?.total || "0"), 0);
    const avgTicket = occupiedTables.length > 0 ? totalRevenue / occupiedTables.length : 0;
    
    const tablesWithTime = occupiedTables.filter((t) => t.occupiedAt);
    const avgTime = tablesWithTime.length > 0
      ? tablesWithTime.reduce((sum, t) => {
          const start = typeof t.occupiedAt === "string" ? new Date(t.occupiedAt) : t.occupiedAt;
          return sum + (Date.now() - (start?.getTime() || Date.now()));
        }, 0) / tablesWithTime.length
      : 0;
    const avgTimeMinutes = Math.floor(avgTime / (1000 * 60));

    return {
      free,
      occupied,
      reserved,
      requestingBill,
      totalRevenue,
      avgTicket,
      avgTimeMinutes,
    };
  }, [tables]);

  // Filtrar mesas
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = statusFilter === "all" || table.status === statusFilter;
      const matchesSearch = searchQuery === "" || table.number.toString().includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
  }, [tables, statusFilter, searchQuery]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setShowPDVSlidebar(true);
  };

  const handlePDVSlidebarClose = () => {
    setShowPDVSlidebar(false);
  };

  const handleOrderCreated = () => {
    // Atualizar os dados das mesas
    refetch();
    setShowPDVSlidebar(false);
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
    requestBillMutation.mutate({ tableId: table.id });
  };

  const handleClearTable = (table: Table) => {
    updateStatusMutation.mutate({ id: table.id, status: "free" });
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
    });
  };

  const statusFilters: { value: TableStatus | "all"; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "free", label: "Livres" },
    { value: "occupied", label: "Ocupadas" },
    { value: "requesting_bill", label: "Pedindo conta" },
    { value: "reserved", label: "Reservadas" },
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

        {/* Filtros e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filtros de Status */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              // Calcular contagem para cada filtro
              const count = filter.value === "all" 
                ? tables.length 
                : tables.filter(t => t.status === filter.value).length;
              
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    statusFilter === filter.value
                      ? "bg-red-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {filter.label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center",
                    statusFilter === filter.value
                      ? "bg-white/20 text-white"
                      : "bg-red-500 text-white"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Busca e Botão Adicionar */}
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
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legenda de Status */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span className="font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Pedindo conta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Reservada</span>
          </div>
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
              const statusConfig = getStatusConfig(table.status as TableStatus);
              const total = parseFloat(table.tab?.total || "0");
              
              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={cn(
                    "bg-white rounded-xl border border-border/50 p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                    "border-l-4",
                    statusConfig.borderColor
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">{table.number}</span>
                    <span className={cn("text-xs font-semibold", statusConfig.textColor)}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {/* Informações da mesa ocupada */}
                  {(table.status === "occupied" || table.status === "requesting_bill") && (
                    <div className="space-y-1 text-sm text-gray-600">
                      {table.occupiedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(table.occupiedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{table.currentGuests}</span>
                      </div>
                      {total > 0 && (
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(total)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informações da mesa reservada */}
                  {table.status === "reserved" && (
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{table.currentGuests || table.capacity}</span>
                      </div>
                      {table.reservedFor && (
                        <div className={cn("font-semibold", statusConfig.textColor)}>
                          {formatTime(table.reservedFor)}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
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

                {selectedTable.status === "requesting_bill" && (
                  <>
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleCloseTable(selectedTable)}
                      disabled={closeTableMutation.isPending}
                    >
                      {closeTableMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="h-4 w-4 mr-2" />
                      )}
                      Fechar Conta
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Comanda
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

                {(selectedTable.status === "occupied" || selectedTable.status === "requesting_bill") && (
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
      />
    </AdminLayout>
  );
}
