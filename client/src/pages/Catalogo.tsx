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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categoria</span>
            </Button>
            <Button onClick={() => navigate("/catalogo/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inStock">Em estoque</SelectItem>
                <SelectItem value="outOfStock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>

            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sortOrder">Padrão</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="salesCount">Mais vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-4">
              <div className="skeleton h-6 w-32 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="skeleton h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-48 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
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
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
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
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b bg-muted/30">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="divide-y">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
          >
            {/* Drag handle */}
            <button className="p-1 text-muted-foreground hover:text-foreground cursor-grab">
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Product image */}
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              {product.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="hidden sm:block text-right">
              <p className="font-medium">{formatCurrency(product.price)}</p>
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
              className="data-[state=checked]:bg-primary"
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
