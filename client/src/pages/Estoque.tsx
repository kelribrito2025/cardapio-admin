import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  History,
  Edit,
  Trash2,
  PackagePlus,
  PackageMinus,
  Filter,
} from "lucide-react";

type StockStatus = "ok" | "low" | "critical" | "out_of_stock";

const statusConfig: Record<StockStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ok: { label: "OK", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="h-4 w-4" /> },
  low: { label: "Baixo", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Crítico", color: "text-orange-600", bgColor: "bg-orange-100", icon: <AlertCircle className="h-4 w-4" /> },
  out_of_stock: { label: "Em falta", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="h-4 w-4" /> },
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
      costPerUnit: newItemCost || null,
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
      costPerUnit: newItemCost || null,
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
    setNewItemMinQuantity(item.minQuantity);
    setNewItemUnit(item.unit);
    setNewItemCost(item.costPerUnit || "");
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
      default: return "bg-gray-500";
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
      default: return { label: type, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Estoque</h1>
            <p className="text-muted-foreground">Gerencie o estoque de ingredientes e produtos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categoria</span>
            </Button>
            <Button onClick={() => {
              resetNewItemForm();
              setIsNewItemDialogOpen(true);
            }} style={{ borderRadius: '9px' }}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Item</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Total</p>
                <p className="text-2xl font-bold mt-1 tracking-tight">{stockSummary?.total ?? 0}</p>
              </div>
              <div className="p-2.5 bg-muted/50 rounded-xl shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
          {/* OK */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">OK</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-green-600">{stockSummary?.ok ?? 0}</p>
              </div>
              <div className="p-2.5 bg-green-100 rounded-xl shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          {/* Baixo */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Baixo</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-yellow-600">{stockSummary?.low ?? 0}</p>
              </div>
              <div className="p-2.5 bg-yellow-100 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          {/* Crítico */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Crítico</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-orange-600">{stockSummary?.critical ?? 0}</p>
              </div>
              <div className="p-2.5 bg-orange-100 rounded-xl shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
          {/* Em falta */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 border-red-200/50 bg-red-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Em falta</p>
                <p className="text-2xl font-bold mt-1 tracking-tight text-red-600">{stockSummary?.outOfStock ?? 0}</p>
              </div>
              <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Items Table */}
        <Card>
          <CardContent className="p-0">
            {isLoadingItems ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : stockItems && stockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px]">Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd. Atual</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Máximo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => {
                    const status = item.status as StockStatus;
                    const config = statusConfig[status];
                    const currentQty = Number(item.currentQuantity);
                    const minQty = Number(item.minQuantity);
                    const maxQty = item.maxQuantity ? Number(item.maxQuantity) : null;
                    const costPerUnit = item.costPerUnit ? Number(item.costPerUnit) : null;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Package className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(item.categoryId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${config.color}`}>
                            {currentQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {minQty}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {maxQty ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {unitLabels[item.unit] || item.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {costPerUnit ? (
                            <span className="text-muted-foreground">
                              R$ {costPerUnit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMovementDialog(item, "entry")}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Entrada"
                            >
                              <PackagePlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMovementDialog(item, "exit")}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Saída"
                            >
                              <PackageMinus className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openHistoryDialog(item)}>
                                  <History className="h-4 w-4 mr-2" />
                                  Histórico
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => markOutOfStockMutation.mutate({ id: item.id })}
                                  className="text-orange-600"
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
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum item no estoque</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione itens para começar a controlar seu estoque
                </p>
                <Button onClick={() => {
                  resetNewItemForm();
                  setIsNewItemDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Item de Estoque</DialogTitle>
            <DialogDescription>
              Adicione um novo item ao controle de estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do item *</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ex: Carne bovina"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade inicial</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
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
                  type="number"
                  value={newItemMinQuantity}
                  onChange={(e) => setNewItemMinQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Custo por unidade (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateItem} disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome do item *</Label>
              <Input
                id="edit-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoria</Label>
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-minQuantity">Quantidade mínima</Label>
                <Input
                  id="edit-minQuantity"
                  type="number"
                  value={newItemMinQuantity}
                  onChange={(e) => setNewItemMinQuantity(e.target.value)}
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
            <div className="grid gap-2">
              <Label htmlFor="edit-cost">Custo por unidade (R$)</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateItem} disabled={updateItemMutation.isPending}>
              {updateItemMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {movementType === "entry" ? "Adicionar Estoque" : "Registrar Saída"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name} - Atual: {Number(selectedItem?.currentQuantity || 0)} {unitLabels[selectedItem?.unit] || selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddMovement}
              disabled={addMovementMutation.isPending}
              className={movementType === "entry" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {addMovementMutation.isPending ? "Registrando..." : (movementType === "entry" ? "Adicionar" : "Registrar saída")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingMovements ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria de Estoque</DialogTitle>
            <DialogDescription>
              Crie uma categoria para organizar os itens do estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome da categoria *</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Carnes, Bebidas, Temperos..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
