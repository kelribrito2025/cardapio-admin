import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, ActionMenu, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Search,
  Filter,
  UtensilsCrossed,
  Edit,
  Copy,
  Pause,
  Archive,
  Trash2,
  GripVertical,
  FolderPlus,
  ArrowUpDown,
  ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Catalogo() {
  const [, navigate] = useLocation();
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("sortOrder");

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [reorderMode, setReorderMode] = useState(false);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Queries
  const { data: categories, refetch: refetchCategories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: productsData, refetch: refetchProducts, isLoading } = trpc.product.list.useQuery(
    {
      establishmentId: establishmentId!,
      search: search || undefined,
      categoryId: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
      status: statusFilter !== "all" ? statusFilter as "active" | "paused" | "archived" : undefined,
      hasStock: stockFilter === "inStock" ? true : stockFilter === "outOfStock" ? false : undefined,
      orderBy: orderBy === "name" ? "name" : orderBy === "price" ? "price" : orderBy === "salesCount" ? "salesCount" : undefined,
    },
    { enabled: !!establishmentId }
  );

  // Mutations
  const toggleStatusMutation = trpc.product.toggleStatus.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const duplicateMutation = trpc.product.duplicate.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto duplicado");
    },
    onError: () => toast.error("Erro ao duplicar produto"),
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success("Produto excluído");
    },
    onError: () => toast.error("Erro ao excluir produto"),
  });

  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      setCategoryDialogOpen(false);
      setNewCategoryName("");
      toast.success("Categoria criada");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const handleToggleStatus = (productId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toggleStatusMutation.mutate({ id: productId, status: newStatus });
  };

  const handleDuplicate = (productId: number) => {
    duplicateMutation.mutate({ id: productId });
  };

  const handleDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate({ id: productToDelete });
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim() && establishmentId) {
      createCategoryMutation.mutate({
        establishmentId,
        name: newCategoryName.trim(),
      });
    }
  };

  const products = productsData?.products || [];

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const categoryId = product.categoryId || 0;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<number, typeof products>);

  return (
    <AdminLayout>
      <PageHeader
        title="Catálogo"
        description="Gerencie seus produtos e categorias"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(true)}
              className="rounded-xl border-border/50 hover:bg-accent"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categoria</span>
            </Button>
            <Button onClick={() => navigate("/catalogo/novo")} className="rounded-xl shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 mb-8 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-11 rounded-xl border-border/50">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-elevated">
                <SelectItem value="all" className="rounded-lg">Todas</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)} className="rounded-lg">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-11 rounded-xl border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-elevated">
                <SelectItem value="all" className="rounded-lg">Todos</SelectItem>
                <SelectItem value="active" className="rounded-lg">Ativo</SelectItem>
                <SelectItem value="paused" className="rounded-lg">Pausado</SelectItem>
                <SelectItem value="archived" className="rounded-lg">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[140px] h-11 rounded-xl border-border/50">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-elevated">
                <SelectItem value="all" className="rounded-lg">Todos</SelectItem>
                <SelectItem value="inStock" className="rounded-lg">Em estoque</SelectItem>
                <SelectItem value="outOfStock" className="rounded-lg">Sem estoque</SelectItem>
              </SelectContent>
            </Select>

            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="w-[150px] h-11 rounded-xl border-border/50">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-elevated">
                <SelectItem value="sortOrder" className="rounded-lg">Padrão</SelectItem>
                <SelectItem value="name" className="rounded-lg">Nome</SelectItem>
                <SelectItem value="price" className="rounded-lg">Preço</SelectItem>
                <SelectItem value="salesCount" className="rounded-lg">Mais vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 shadow-soft">
              <div className="skeleton h-6 w-36 rounded-lg mb-5" />
              <div className="space-y-4">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="skeleton h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-52 rounded-lg" />
                      <div className="skeleton h-4 w-28 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={UtensilsCrossed}
            title="Nenhum produto encontrado"
            description={search || categoryFilter !== "all" || statusFilter !== "all" 
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando seu primeiro produto ao catálogo"}
            action={{
              label: "Criar Produto",
              onClick: () => navigate("/catalogo/novo"),
            }}
          />
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {/* Uncategorized products */}
          {productsByCategory[0] && productsByCategory[0].length > 0 && (
            <ProductCategorySection
              title="Sem categoria"
              products={productsByCategory[0]}
              onToggleStatus={handleToggleStatus}
              onDuplicate={handleDuplicate}
              onDelete={(id) => {
                setProductToDelete(id);
                setDeleteDialogOpen(true);
              }}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Categorized products */}
          {categories?.map((category) => {
            const categoryProducts = productsByCategory[category.id];
            if (!categoryProducts || categoryProducts.length === 0) return null;

            return (
              <ProductCategorySection
                key={category.id}
                title={category.name}
                products={categoryProducts}
                onToggleStatus={handleToggleStatus}
                onDuplicate={handleDuplicate}
                onDelete={(id) => {
                  setProductToDelete(id);
                  setDeleteDialogOpen(true);
                }}
                formatCurrency={formatCurrency}
              />
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar seus produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              className="h-11 rounded-xl border-border/50"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              className="rounded-xl"
            >
              {createCategoryMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// Product Category Section Component
interface ProductCategorySectionProps {
  title: string;
  products: any[];
  onToggleStatus: (id: number, status: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  formatCurrency: (value: string | number) => string;
}

function ProductCategorySection({
  title,
  products,
  onToggleStatus,
  onDuplicate,
  onDelete,
  formatCurrency,
}: ProductCategorySectionProps) {
  const [, navigate] = useLocation();

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <div className="divide-y divide-border/50">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors"
          >
            {/* Drag handle */}
            <button className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab rounded-lg hover:bg-muted/50 transition-colors">
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Product image */}
            <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/30">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              {product.description && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="hidden sm:block text-right">
              <p className="font-semibold text-base">{formatCurrency(product.price)}</p>
            </div>

            {/* Status badges */}
            <div className="hidden md:flex items-center gap-2">
              <StatusBadge
                variant={product.status === "active" ? "success" : product.status === "paused" ? "warning" : "default"}
              >
                {product.status === "active" ? "Ativo" : product.status === "paused" ? "Pausado" : "Arquivado"}
              </StatusBadge>
              {!product.hasStock && (
                <StatusBadge variant="error">Sem estoque</StatusBadge>
              )}
            </div>

            {/* Toggle */}
            <Switch
              checked={product.status === "active"}
              onCheckedChange={() => onToggleStatus(product.id, product.status)}
              className="data-[state=checked]:bg-emerald-500"
            />

            {/* Actions */}
            <ActionMenu
              items={[
                {
                  label: "Editar",
                  icon: Edit,
                  onClick: () => navigate(`/catalogo/editar/${product.id}`),
                },
                {
                  label: "Duplicar",
                  icon: Copy,
                  onClick: () => onDuplicate(product.id),
                },
                {
                  label: product.status === "active" ? "Pausar" : "Ativar",
                  icon: Pause,
                  onClick: () => onToggleStatus(product.id, product.status),
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => onDelete(product.id),
                  variant: "destructive",
                  separator: true,
                },
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
