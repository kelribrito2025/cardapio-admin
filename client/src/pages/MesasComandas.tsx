import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
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
} from "lucide-react";

// Tipos
type TableStatus = "free" | "occupied" | "reserved" | "requesting_bill";

interface TableItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Table {
  id: number;
  number: number;
  status: TableStatus;
  guests: number;
  startTime?: Date;
  reservationTime?: Date;
  items: TableItem[];
  total: number;
}

// Dados mockados para demonstração
const mockTables: Table[] = [
  {
    id: 1,
    number: 1,
    status: "free",
    guests: 0,
    items: [],
    total: 0,
  },
  {
    id: 2,
    number: 2,
    status: "occupied",
    guests: 4,
    startTime: new Date(Date.now() - 1000 * 60 * 110), // 1h50 atrás
    items: [
      { id: 1, name: "Picanha na Brasa", quantity: 2, price: 89.90 },
      { id: 2, name: "Refrigerante 2L", quantity: 1, price: 12.00 },
      { id: 3, name: "Porção de Fritas", quantity: 1, price: 29.90 },
    ],
    total: 221.70,
  },
  {
    id: 3,
    number: 3,
    status: "reserved",
    guests: 2,
    reservationTime: new Date(Date.now() + 1000 * 60 * 40), // 19:40
    items: [],
    total: 0,
  },
  {
    id: 4,
    number: 4,
    status: "occupied",
    guests: 3,
    startTime: new Date(Date.now() - 1000 * 60 * 45), // 45min atrás
    items: [
      { id: 1, name: "Combo Família", quantity: 1, price: 159.90 },
      { id: 2, name: "Suco Natural 1L", quantity: 2, price: 15.00 },
    ],
    total: 189.90,
  },
  {
    id: 5,
    number: 5,
    status: "requesting_bill",
    guests: 2,
    startTime: new Date(Date.now() - 1000 * 60 * 165), // 2h45 atrás
    items: [
      { id: 1, name: "Pizza Grande", quantity: 1, price: 69.90 },
      { id: 2, name: "Cerveja Long Neck", quantity: 6, price: 12.00 },
      { id: 3, name: "Sobremesa Petit Gateau", quantity: 2, price: 24.90 },
    ],
    total: 191.70,
  },
  {
    id: 6,
    number: 6,
    status: "free",
    guests: 0,
    items: [],
    total: 0,
  },
  {
    id: 7,
    number: 7,
    status: "occupied",
    guests: 6,
    startTime: new Date(Date.now() - 1000 * 60 * 30), // 30min atrás
    items: [
      { id: 1, name: "Rodízio Completo", quantity: 6, price: 79.90 },
    ],
    total: 479.40,
  },
  {
    id: 8,
    number: 8,
    status: "free",
    guests: 0,
    items: [],
    total: 0,
  },
  {
    id: 9,
    number: 9,
    status: "reserved",
    guests: 4,
    reservationTime: new Date(Date.now() + 1000 * 60 * 120), // 21:00
    items: [],
    total: 0,
  },
  {
    id: 10,
    number: 10,
    status: "occupied",
    guests: 3,
    startTime: new Date(Date.now() - 1000 * 60 * 50), // 50min atrás
    items: [
      { id: 1, name: "Hambúrguer Artesanal", quantity: 3, price: 42.90 },
      { id: 2, name: "Batata Rústica", quantity: 2, price: 22.00 },
      { id: 3, name: "Milk Shake", quantity: 3, price: 18.00 },
    ],
    total: 226.70,
  },
  {
    id: 11,
    number: 11,
    status: "requesting_bill",
    guests: 4,
    startTime: new Date(Date.now() - 1000 * 60 * 165), // 2h45 atrás
    items: [
      { id: 1, name: "Costela no Bafo", quantity: 1, price: 129.90 },
      { id: 2, name: "Arroz Carreteiro", quantity: 1, price: 35.00 },
      { id: 3, name: "Cerveja 600ml", quantity: 4, price: 18.00 },
      { id: 4, name: "Água Mineral", quantity: 2, price: 6.00 },
    ],
    total: 248.90,
  },
  {
    id: 12,
    number: 12,
    status: "free",
    guests: 0,
    items: [],
    total: 0,
  },
];

// Helpers
const getStatusConfig = (status: TableStatus) => {
  switch (status) {
    case "free":
      return {
        label: "Livre",
        color: "bg-emerald-500",
        textColor: "text-emerald-600",
        bgLight: "bg-emerald-50",
      };
    case "occupied":
      return {
        label: "Ocupada",
        color: "bg-amber-500",
        textColor: "text-amber-600",
        bgLight: "bg-amber-50",
      };
    case "reserved":
      return {
        label: "Reservada",
        color: "bg-blue-500",
        textColor: "text-blue-600",
        bgLight: "bg-blue-50",
      };
    case "requesting_bill":
      return {
        label: "Pedindo conta",
        color: "bg-red-500",
        textColor: "text-red-600",
        bgLight: "bg-red-50",
      };
  }
};

const formatDuration = (startTime: Date) => {
  const diff = Date.now() - startTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  }
  return `${minutes}min`;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export default function MesasComandas() {
  const [tables] = useState<Table[]>(mockTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cálculos de resumo
  const summary = useMemo(() => {
    const free = tables.filter((t) => t.status === "free").length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const requestingBill = tables.filter((t) => t.status === "requesting_bill").length;
    
    const occupiedTables = tables.filter((t) => t.status === "occupied" || t.status === "requesting_bill");
    const totalRevenue = occupiedTables.reduce((sum, t) => sum + t.total, 0);
    const avgTicket = occupiedTables.length > 0 ? totalRevenue / occupiedTables.length : 0;
    
    const tablesWithTime = occupiedTables.filter((t) => t.startTime);
    const avgTime = tablesWithTime.length > 0
      ? tablesWithTime.reduce((sum, t) => sum + (Date.now() - t.startTime!.getTime()), 0) / tablesWithTime.length
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
    setShowSidebar(true);
  };

  const statusFilters: { value: TableStatus | "all"; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "free", label: "Livres" },
    { value: "occupied", label: "Ocupadas" },
    { value: "requesting_bill", label: "Pedindo conta" },
    { value: "reserved", label: "Reservadas" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas e Comandas</h1>
          <p className="text-gray-500">Controle de mesas e comandas do salão</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Mesas Livres */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Livres</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.free}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Utensils className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Mesas Ocupadas */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ocupadas</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{summary.occupied}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Mesas Reservadas */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reservadas</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{summary.reserved}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pedindo Conta */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pedindo Conta</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.requestingBill}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.avgTicket)}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Faturamento */}
          <div className="bg-white rounded-xl border border-border/50 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faturamento</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filtros de Status */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  statusFilter === filter.value
                    ? "bg-red-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar mesa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Legenda de Status */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span className="font-medium">Status da mesa:</span>
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

        {/* Grid de Mesas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const statusConfig = getStatusConfig(table.status);
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className="bg-white rounded-xl border border-border/50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
              >
                <div className="flex h-full">
                  {/* Barra lateral colorida */}
                  <div className={cn("w-1.5 shrink-0", statusConfig.color)} />
                  
                  {/* Conteúdo do card */}
                  <div className="flex-1 p-4">
                    {/* Número da mesa e tempo/status */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl font-bold text-gray-900">{table.number}</span>
                      {table.status === "occupied" && table.startTime && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">{formatDuration(table.startTime)}</span>
                        </div>
                      )}
                      {table.status === "requesting_bill" && table.startTime && (
                        <div className="flex items-center gap-1 text-red-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">{formatDuration(table.startTime)}</span>
                        </div>
                      )}
                      {table.status === "free" && (
                        <span className={cn("text-sm font-medium", statusConfig.textColor)}>
                          {statusConfig.label}
                        </span>
                      )}
                      {table.status === "reserved" && (
                        <span className={cn("text-sm font-medium", statusConfig.textColor)}>
                          {statusConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Pessoas e valor / Horário reserva */}
                    <div className="flex items-center justify-between">
                      {(table.status === "occupied" || table.status === "requesting_bill") && (
                        <>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-sm font-medium">{table.guests}</span>
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(table.total)}
                          </span>
                        </>
                      )}
                      {table.status === "reserved" && table.reservationTime && (
                        <>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-sm font-medium">{table.guests}</span>
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-blue-600">
                            {formatTime(table.reservationTime)}
                          </span>
                        </>
                      )}
                      {table.status === "free" && (
                        <div className="w-full h-6" /> 
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mensagem quando não há mesas */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma mesa encontrada com os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Sidebar de Detalhes da Mesa */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {selectedTable && (
            <>
              {/* Header da Sidebar */}
              <SheetHeader className={cn(
                "p-6",
                selectedTable.status === "free" && "bg-emerald-500",
                selectedTable.status === "occupied" && "bg-amber-500",
                selectedTable.status === "reserved" && "bg-blue-500",
                selectedTable.status === "requesting_bill" && "bg-red-500"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Utensils className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-white text-xl">Mesa {selectedTable.number}</SheetTitle>
                      <p className="text-white/80 text-sm">
                        {getStatusConfig(selectedTable.status).label}
                        {selectedTable.startTime && ` • ${formatDuration(selectedTable.startTime)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </SheetHeader>

              {/* Conteúdo da Sidebar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Info da Mesa */}
                {(selectedTable.status === "occupied" || selectedTable.status === "requesting_bill") && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">{selectedTable.guests} pessoas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">{selectedTable.startTime && formatDuration(selectedTable.startTime)}</span>
                    </div>
                  </div>
                )}

                {selectedTable.status === "reserved" && selectedTable.reservationTime && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-700">{selectedTable.guests} pessoas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-700">Reserva às {formatTime(selectedTable.reservationTime)}</span>
                    </div>
                  </div>
                )}

                {/* Lista de Itens da Comanda */}
                {selectedTable.items.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-gray-500" />
                      Itens da Comanda
                    </h3>
                    <div className="space-y-2">
                      {selectedTable.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity}x {formatCurrency(item.price)}
                            </p>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.quantity * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totais */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedTable.total)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatCurrency(selectedTable.total)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedTable.status === "free"
                        ? "Mesa disponível para novos clientes"
                        : selectedTable.status === "reserved"
                        ? "Aguardando chegada dos clientes"
                        : "Nenhum item na comanda ainda"}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer com Ações */}
              <div className="border-t p-4 space-y-3 bg-white">
                {selectedTable.status === "free" && (
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Abrir Mesa
                  </Button>
                )}

                {selectedTable.status === "occupied" && (
                  <>
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Pedir Conta
                      </Button>
                      <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        <Receipt className="h-4 w-4 mr-2" />
                        Fechar Conta
                      </Button>
                    </div>
                  </>
                )}

                {selectedTable.status === "requesting_bill" && (
                  <>
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                      <Receipt className="h-4 w-4 mr-2" />
                      Fechar Conta
                    </Button>
                    <Button variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </>
                )}

                {selectedTable.status === "reserved" && (
                  <>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                      <Users className="h-4 w-4 mr-2" />
                      Confirmar Chegada
                    </Button>
                    <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  </>
                )}

                {(selectedTable.status === "occupied" || selectedTable.status === "requesting_bill") && (
                  <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Mesa
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
