import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  History,
  Edit,
  Trash2,
  PackagePlus,
  PackageMinus,
  Filter,
  UtensilsCrossed,
} from "lucide-react";
import { capitalizeFirst } from "@/lib/utils";
import { Link } from "wouter";

type StockStatus = "ok" | "low" | "critical" | "out_of_stock";

const statusConfig: Record<StockStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  ok: { label: "OK", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle className="h-4 w-4" /> },
  low: { label: "Baixo", color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Crítico", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", icon: <AlertCircle className="h-4 w-4" /> },
  out_of_stock: { label: "Sem estoque", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: <XCircle className="h-4 w-4" /> },
};

const unitLabels: Record<string, string> = {
  kg: "kg",
  g: "g",
  L: "L",
  ml: "ml",
  unidade: "un",
  pacote: "pct",
  caixa: "cx",
  dúzia: "dz",
};

// Unidades que usam formato inteiro (sem vírgula)
const integerUnits = ["unidade", "pacote", "caixa", "dúzia"];

// Formata valor monetário: digita 100 → 1,00 / 050 → 0,50
function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  const formatted = (num / 100).toFixed(2).replace(".", ",");
  return formatted;
}

// Formata quantidade inteira: só dígitos, sem vírgula
function formatInteger(raw: string): string {
  return raw.replace(/\D/g, "");
}

export default function Estoque() {
  const utils = trpc.useUtils();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Dialogs
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [movementType, setMovementType] = useState<"entry" | "exit">("entry");

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemMinQuantity, setNewItemMinQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState<string>("unidade");
  const [newItemCost, setNewItemCost] = useState("");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Queries
  const { data: establishment } = trpc.establishment.get.useQuery();
  
  const { data: stockItems, isLoading: isLoadingItems } = trpc.stock.listItems.useQuery(
    {
      establishmentId: establishment?.id ?? 0,
      search: search || undefined,
      status: statusFilter !== "all" ? (statusFilter as StockStatus) : undefined,
      categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    },
    { enabled: !!establishment?.id }
  );

  const { data: stockCategories } = trpc.stock.listCategories.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  const { data: stockSummary } = trpc.stock.summary.useQuery(
    { establishmentId: establishment?.id ?? 0 },
    { enabled: !!establishment?.id }
  );

  const { data: itemMovements, isLoading: isLoadingMovements } = trpc.stock.listMovements.useQuery(
    { stockItemId: selectedItem?.id ?? 0, limit: 50 },
    { enabled: !!selectedItem?.id && isHistoryDialogOpen }
  );

  // Mutations
  const createItemMutation = trpc.stock.createItem.useMutation({
    onSuccess: () => {
      toast.success("Item adicionado ao estoque!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
      resetNewItemForm();
      setIsNewItemDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao adicionar item: " + error.message);
    },
  });

  const updateItemMutation = trpc.stock.updateItem.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
      setIsEditItemDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });

  const deleteItemMutation = trpc.stock.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("Item removido do estoque!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover item: " + error.message);
    },
  });

  const markOutOfStockMutation = trpc.stock.markOutOfStock.useMutation({
    onSuccess: () => {
      toast.success("Item marcado como em falta!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao marcar item: " + error.message);
    },
  });

  const addMovementMutation = trpc.stock.addMovement.useMutation({
    onSuccess: () => {
      toast.success(movementType === "entry" ? "Entrada registrada!" : "Saída registrada!");
      utils.stock.listItems.invalidate();
      utils.stock.summary.invalidate();
      utils.stock.listMovements.invalidate();
      setIsMovementDialogOpen(false);
      setMovementQuantity("");
      setMovementReason("");
    },
    onError: (error) => {
      toast.error("Erro ao registrar movimentação: " + error.message);
    },
  });

  const createCategoryMutation = trpc.stock.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada!");
      utils.stock.listCategories.invalidate();
      setNewCategoryName("");
      setIsNewCategoryDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });

  const resetNewItemForm = () => {
    setNewItemName("");
    setNewItemCategory("");
    setNewItemQuantity("");
    setNewItemMinQuantity("");
    setNewItemUnit("unidade");
    setNewItemCost("");
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }
    if (!establishment?.id) return;

    createItemMutation.mutate({
      establishmentId: establishment.id,
      name: newItemName.trim(),
      categoryId: newItemCategory ? parseInt(newItemCategory) : null,
      currentQuantity: newItemQuantity || "0",
      minQuantity: newItemMinQuantity || "0",
      unit: newItemUnit as any,
      costPerUnit: newItemCost ? newItemCost.replace(",", ".") : null,
    });
  };

  const handleUpdateItem = () => {
    if (!selectedItem) return;

    updateItemMutation.mutate({
      id: selectedItem.id,
      name: newItemName.trim() || selectedItem.name,
      categoryId: newItemCategory ? parseInt(newItemCategory) : null,
      minQuantity: newItemMinQuantity || selectedItem.minQuantity,
      unit: newItemUnit as any,
      costPerUnit: newItemCost ? newItemCost.replace(",", ".") : null,
    });
  };

  const handleAddMovement = () => {
    if (!selectedItem || !movementQuantity) {
      toast.error("Quantidade é obrigatória");
      return;
    }

    addMovementMutation.mutate({
      stockItemId: selectedItem.id,
      type: movementType,
      quantity: movementQuantity,
      reason: movementReason || undefined,
    });
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.categoryId?.toString() || "");
    // Formatar quantidade mínima conforme unidade
    const minQty = item.minQuantity || "0";
    if (integerUnits.includes(item.unit)) {
      setNewItemMinQuantity(String(parseInt(minQty) || 0));
    } else {
      setNewItemMinQuantity(minQty);
    }
    setNewItemUnit(item.unit);
    // Formatar custo como monetário
    const cost = item.costPerUnit || "";
    if (cost) {
      const numCost = parseFloat(cost);
      setNewItemCost(numCost.toFixed(2).replace(".", ","));
    } else {
      setNewItemCost("");
    }
    setIsEditItemDialogOpen(true);
  };

  const openMovementDialog = (item: any, type: "entry" | "exit") => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQuantity("");
    setMovementReason("");
    setIsMovementDialogOpen(true);
  };

  const openHistoryDialog = (item: any) => {
    setSelectedItem(item);
    setIsHistoryDialogOpen(true);
  };

  const getProgressPercentage = (current: number, min: number, max?: number) => {
    if (max) {
      return Math.min(100, (current / max) * 100);
    }
    // If no max, use min * 3 as reference
    const reference = min > 0 ? min * 3 : 100;
    return Math.min(100, (current / reference) * 100);
  };

  const getProgressColor = (status: StockStatus) => {
    switch (status) {
      case "ok": return "bg-green-500";
      case "low": return "bg-yellow-500";
      case "critical": return "bg-orange-500";
      case "out_of_stock": return "bg-red-500";
      default: return "bg-muted/500";
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sem categoria";
    const category = stockCategories?.find(c => c.id === categoryId);
    return category?.name || "Sem categoria";
  };

  const formatMovementType = (type: string) => {
    switch (type) {
      case "entry": return { label: "Entrada", color: "text-green-600", bg: "bg-green-100" };
      case "exit": return { label: "Saída", color: "text-red-600", bg: "bg-red-100" };
      case "adjustment": return { label: "Ajuste", color: "text-blue-600", bg: "bg-blue-100" };
      case "loss": return { label: "Perda", color: "text-orange-600", bg: "bg-orange-100" };
      default: return { label: type, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Estoque"
          description="Gerencie o estoque de ingredientes e produtos"
          icon={<Package className="h-6 w-6 text-blue-500" />}
          actions={
            <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(true)} className="h-9 px-3.5 text-sm rounded-lg">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categoria</span>
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total */}
          <div
            onClick={() => setStatusFilter(statusFilter === "all" ? "all" : "all")}
            className={cn(
              "bg-card rounded-xl p-5 border border-t-4 border-t-blue-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
              statusFilter === "all" ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Total</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-2xl font-bold tracking-tight">{stockSummary?.total ?? 0}</span>
                </div>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-lg shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          {/* OK */}
          <div
            onClick={() => setStatusFilter(statusFilter === "ok" ? "all" : "ok")}
            className={cn(
              "bg-card rounded-xl p-5 border border-t-4 border-t-green-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
              statusFilter === "ok" ? "border-green-500 ring-2 ring-green-500/30 shadow-md" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">OK</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-2xl font-bold tracking-tight text-green-600">{stockSummary?.ok ?? 0}</span>
                </div>
              </div>
              <div className="p-2.5 bg-green-100 rounded-lg shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          {/* Baixo */}
          <div
            onClick={() => setStatusFilter(statusFilter === "low" ? "all" : "low")}
            className={cn(
              "bg-card rounded-xl p-5 border border-t-4 border-t-yellow-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
              statusFilter === "low" ? "border-yellow-500 ring-2 ring-yellow-500/30 shadow-md" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Baixo</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-2xl font-bold tracking-tight text-yellow-600">{stockSummary?.low ?? 0}</span>
                </div>
              </div>
              <div className="p-2.5 bg-yellow-100 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          {/* Crítico */}
          <div
            onClick={() => setStatusFilter(statusFilter === "critical" ? "all" : "critical")}
            className={cn(
              "bg-card rounded-xl p-5 border border-t-4 border-t-orange-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
              statusFilter === "critical" ? "border-orange-500 ring-2 ring-orange-500/30 shadow-md" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Crítico</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-2xl font-bold tracking-tight text-orange-600">{stockSummary?.critical ?? 0}</span>
                </div>
              </div>
              <div className="p-2.5 bg-orange-100 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
          {/* Em falta */}
          <div
            onClick={() => setStatusFilter(statusFilter === "out_of_stock" ? "all" : "out_of_stock")}
            className={cn(
              "bg-card rounded-xl p-5 border border-t-4 border-t-red-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
              statusFilter === "out_of_stock" ? "border-red-500 ring-2 ring-red-500/30 shadow-md" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Em falta</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-2xl font-bold tracking-tight text-red-600">{stockSummary?.outOfStock ?? 0}</span>
                </div>
              </div>
              <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="out_of_stock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
            {stockCategories && stockCategories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {stockCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Stock Items List */}
        {isLoadingItems ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !stockItems || stockItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum item no estoque"
            description="Para adicionar itens ao estoque, ative o controle de estoque nos produtos do seu cardápio."
            action={{ label: "Ir para o Cardápio", onClick: () => window.location.href = "/catalogo" }}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estoque atual</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Última atualização</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item) => {
                    const status = item.status as StockStatus;
                    const config = statusConfig[status];
                    const currentQty = Number(item.currentQuantity);
                    const unitLabel = unitLabels[item.unit] || item.unit;
                    const categoryName = getCategoryName(item.categoryId);
                    
                    const updatedAt = new Date(item.updatedAt);
                    const now = new Date();
                    const diffMs = now.getTime() - updatedAt.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffWeeks = Math.floor(diffDays / 7);
                    
                    let timeAgo = "";
                    if (diffHours < 1) {
                      timeAgo = "Agora";
                    } else if (diffHours < 24) {
                      timeAgo = `${diffHours} hora${diffHours > 1 ? "s" : ""} atrás`;
                    } else if (diffDays < 7) {
                      timeAgo = `${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;
                    } else {
                      timeAgo = `${diffWeeks} semana${diffWeeks > 1 ? "s" : ""} atrás`;
                    }

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => openEditDialog(item)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              status === "ok" ? "bg-green-100" :
                              status === "low" ? "bg-yellow-100" :
                              status === "critical" ? "bg-orange-100" : "bg-red-100"
                            )}>
                              <Package className={cn(
                                "h-5 w-5",
                                status === "ok" ? "text-green-600" :
                                status === "low" ? "text-yellow-600" :
                                status === "critical" ? "text-orange-600" : "text-red-600"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{categoryName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-foreground">{currentQty} {unitLabel}</span>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1`}
                          >
                            {config.icon}
                            {config.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{timeAgo}</span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openMovementDialog(item, "entry")}>
                                <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                                Entrada
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMovementDialog(item, "exit")}>
                                <PackageMinus className="h-4 w-4 mr-2 text-red-600" />
                                Saída
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openHistoryDialog(item)}>
                                <History className="h-4 w-4 mr-2" />
                                Histórico
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => markOutOfStockMutation.mutate({ id: item.id })}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Marcar em falta
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este item?")) {
                                    deleteItemMutation.mutate({ id: item.id });
                                  }
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/30">
              {stockItems.map((item) => {
                const status = item.status as StockStatus;
                const config = statusConfig[status];
                const currentQty = Number(item.currentQuantity);
                const unitLabel = unitLabels[item.unit] || item.unit;
                const categoryName = getCategoryName(item.categoryId);

                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-muted/20 transition-colors"
                    onClick={() => openEditDialog(item)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          status === "ok" ? "bg-green-100" :
                          status === "low" ? "bg-yellow-100" :
                          status === "critical" ? "bg-orange-100" : "bg-red-100"
                        )}>
                          <Package className={cn(
                            "h-5 w-5",
                            status === "ok" ? "text-green-600" :
                            status === "low" ? "text-yellow-600" :
                            status === "critical" ? "text-orange-600" : "text-red-600"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{categoryName}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openMovementDialog(item, "entry")}>
                              <PackagePlus className="h-4 w-4 mr-2 text-green-600" />
                              Entrada
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMovementDialog(item, "exit")}>
                              <PackageMinus className="h-4 w-4 mr-2 text-red-600" />
                              Saída
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openHistoryDialog(item)}>
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => markOutOfStockMutation.mutate({ id: item.id })}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Marcar em falta
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este item?")) {
                                  deleteItemMutation.mutate({ id: item.id });
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {currentQty} {unitLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4 border-t-emerald-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Novo Item de Estoque</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/50">
                <PackagePlus className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Novo Item de Estoque</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Adicione um novo item ao controle de estoque
                </p>
              </div>
            </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do item *</Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                  placeholder="Ex: Carne bovina"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade inicial</Label>
                <Input
                  id="quantity"
                  inputMode="numeric"
                  value={newItemQuantity}
                  onChange={(e) => {
                    if (integerUnits.includes(newItemUnit)) {
                      setNewItemQuantity(formatInteger(e.target.value));
                    } else {
                      setNewItemQuantity(e.target.value);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="L">Litro (L)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="pacote">Pacote</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="dúzia">Dúzia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minQuantity">Quantidade mínima</Label>
                <Input
                  id="minQuantity"
                  inputMode="numeric"
                  value={newItemMinQuantity}
                  onChange={(e) => {
                    if (integerUnits.includes(newItemUnit)) {
                      setNewItemMinQuantity(formatInteger(e.target.value));
                    } else {
                      setNewItemMinQuantity(e.target.value);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Custo por unidade (R$)</Label>
                <Input
                  id="cost"
                  inputMode="numeric"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(formatCurrency(e.target.value))}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
              onClick={handleCreateItem}
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4 border-t-blue-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Editar Item</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-blue-100 dark:bg-blue-950/50">
                <Edit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Editar Item</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Atualize as informações do item
                </p>
              </div>
            </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome do item *</Label>
                <Input
                  id="edit-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-minQuantity">Quantidade mínima</Label>
                <Input
                  id="edit-minQuantity"
                  inputMode="numeric"
                  value={newItemMinQuantity}
                  onChange={(e) => {
                    if (integerUnits.includes(newItemUnit)) {
                      setNewItemMinQuantity(formatInteger(e.target.value));
                    } else {
                      setNewItemMinQuantity(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Unidade</Label>
                <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="L">Litro (L)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="pacote">Pacote</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="dúzia">Dúzia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-blue-500 hover:bg-blue-600 text-white mt-4"
              onClick={handleUpdateItem}
              disabled={updateItemMutation.isPending}
            >
              {updateItemMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4"
          style={{ borderRadius: '16px', borderTopColor: movementType === 'entry' ? '#16a34a' : '#dc2626' }}
        >
          <DialogTitle className="sr-only">{movementType === "entry" ? "Adicionar Estoque" : "Registrar Saída"}</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl flex-shrink-0", movementType === 'entry' ? 'bg-green-100 dark:bg-green-950/50' : 'bg-red-100 dark:bg-red-950/50')}>
                {movementType === 'entry' ? <PackagePlus className="h-6 w-6 text-green-600" /> : <PackageMinus className="h-6 w-6 text-red-600" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{movementType === "entry" ? "Adicionar Estoque" : "Registrar Saída"}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {selectedItem?.name} - Atual: {Number(selectedItem?.currentQuantity || 0)} {unitLabels[selectedItem?.unit] || selectedItem?.unit}
                </p>
              </div>
            </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="movement-quantity">Quantidade *</Label>
              <Input
                id="movement-quantity"
                type="number"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="movement-reason">Motivo (opcional)</Label>
              <Input
                id="movement-reason"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder={movementType === "entry" ? "Ex: Compra semanal" : "Ex: Pedido #123"}
              />
            </div>
          </div>
            <Button
              className={cn("w-full rounded-xl h-10 font-semibold text-white mt-4", movementType === 'entry' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}
              onClick={handleAddMovement}
              disabled={addMovementMutation.isPending}
            >
              {addMovementMutation.isPending ? "Registrando..." : (movementType === "entry" ? "Adicionar" : "Registrar saída")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px] p-0 overflow-hidden border-t-4 border-t-slate-500"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Histórico de Movimentações</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-slate-100 dark:bg-slate-950/50">
                <History className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Histórico de Movimentações</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {selectedItem?.name}
                </p>
              </div>
            </div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingMovements ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : itemMovements && itemMovements.length > 0 ? (
              <div className="space-y-3">
                {itemMovements.map((movement) => {
                  const typeConfig = formatMovementType(movement.type);
                  return (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={`${typeConfig.bg} ${typeConfig.color} border-0`}>
                          {typeConfig.label}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {movement.type === "entry" ? "+" : "-"}{Number(movement.quantity)} {unitLabels[selectedItem?.unit] || selectedItem?.unit}
                          </p>
                          {movement.reason && (
                            <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</p>
                        <p>{new Date(movement.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma movimentação registrada</p>
              </div>
            )}
          </div>
            <Button
              variant="outline"
              className="w-full rounded-xl h-10 font-semibold mt-4"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">Nova Categoria de Estoque</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <UtensilsCrossed className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Nova Categoria de Estoque</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Crie uma categoria para organizar os itens do estoque
                </p>
              </div>
            </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome da categoria *</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(capitalizeFirst(e.target.value))}
                placeholder="Ex: Carnes, Bebidas, Temperos..."
              />
            </div>
          </div>
            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-700 hover:bg-red-800 text-white mt-4"
              onClick={() => {
                if (!newCategoryName.trim()) {
                  toast.error("Nome da categoria é obrigatório");
                  return;
                }
                if (!establishment?.id) return;
                createCategoryMutation.mutate({
                  establishmentId: establishment.id,
                  name: newCategoryName.trim(),
                });
              }}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
