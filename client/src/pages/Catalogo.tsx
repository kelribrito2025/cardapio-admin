import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Edit,
  Copy,
  Trash2,
  GripVertical,
  FolderPlus,
  ArrowUpDown,
  ImageIcon,
  Layers,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, capitalizeFirst } from "@/lib/utils";

// Sortable Product Item Component
function SortableProductItem({
  product,
  isDragDisabled,
  onToggleStatus,
  onDuplicate,
  onDelete,
  onEdit,
  formatCurrency,
}: {
  product: any;
  isDragDisabled: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  formatCurrency: (value: string | number) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{height: '60px'}}
      className={cn(
        "flex items-center gap-3.5 p-3.5 hover:bg-muted/30 transition-colors bg-card",
        isDragging && "shadow-lg rounded-lg"
      )}
    >
      {!isDragDisabled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Arraste para reordenar</TooltipContent>
        </Tooltip>
      )}
      {/* Área clicável para edição */}
      <div 
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onEdit(product.id)}
      >
        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/30">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-base truncate">{product.name}</h4>
            {product.status !== "active" && (
              <StatusBadge variant={product.status === "paused" ? "warning" : "default"}>
                {product.status === "paused" ? "Pausado" : "Arquivado"}
              </StatusBadge>
            )}
            {product.hasStock && product.stockQuantity !== null && product.stockQuantity <= 0 && (
              <StatusBadge variant="error">Sem estoque</StatusBadge>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {product.description}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-base text-primary">{formatCurrency(product.price)}</p>
        </div>
      </div>
      {/* Botões de ação (toggle, duplicar, excluir) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Switch
          checked={product.status === "active"}
          onCheckedChange={() => onToggleStatus(product.id, product.status)}
          className="scale-90"
        />
<Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDuplicate(product.id)}
                          className="h-8 w-8 rounded-md hover:bg-accent"
                        >
                          <Copy className="h-4 w-4" />
        </Button>
<Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(product.id)}
                          className="h-8 w-8 rounded-md hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Sortable Category Item Component (for reorder mode)
function SortableCategoryItem({
  category,
  productCount,
}: {
  category: any;
  productCount: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-5 bg-card border border-border/50 rounded-xl hover:bg-muted/30 transition-colors",
        isDragging && "shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <h4 className="font-semibold">{category.name}</h4>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>
        )}
      </div>
      <span className="text-sm text-muted-foreground font-medium">
        {productCount} {productCount === 1 ? "item" : "itens"}
      </span>
    </div>
  );
}

export default function Catalogo() {
  const [, navigate] = useLocation();
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
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
  
  // Reorder mode
  const [reorderCategoriesMode, setReorderCategoriesMode] = useState(false);
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [localProductsByCategory, setLocalProductsByCategory] = useState<Record<number, any[]>>({});
  
  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Check if filters are active (disable drag when filters are active)
  const hasActiveFilters: boolean = !!(search || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all" || orderBy !== "sortOrder");

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries - MUST be called before any early return
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

  // Sync local state with server data
  useEffect(() => {
    if (categories) {
      setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [categories]);

  useEffect(() => {
    if (productsData?.products) {
      const grouped = productsData.products.reduce((acc, product) => {
        const categoryId = product.categoryId || 0;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(product);
        return acc;
      }, {} as Record<number, typeof productsData.products>);
      
      // Sort products within each category by sortOrder
      Object.keys(grouped).forEach(catId => {
        grouped[Number(catId)].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      
      setLocalProductsByCategory(grouped);
    }
  }, [productsData]);

  // Mutations - MUST be called before any early return
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

  const reorderCategoriesMutation = trpc.category.reorder.useMutation({
    onError: (error) => {
      toast.error("Erro ao reordenar categorias");
      // Revert on error
      if (categories) {
        setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    },
  });

  const reorderProductsMutation = trpc.product.reorder.useMutation({
    onError: (error) => {
      toast.error("Erro ao reordenar produtos");
      refetchProducts();
    },
  });

  const updateCategoryMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      refetchCategories();
      setEditingCategoryId(null);
      setEditingCategoryName("");
      toast.success("Categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });

  // Se não há estabelecimento, mostrar tela de criação
  if (!establishmentLoading && !establishment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 bg-muted/30 rounded-3xl mb-6">
            <UtensilsCrossed className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configure seu estabelecimento</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Antes de adicionar produtos, você precisa configurar as informações do seu estabelecimento.
          </p>
          <Button onClick={() => navigate("/configuracoes")} className="rounded-xl">
            Ir para Configurações
          </Button>
        </div>
      </AdminLayout>
    );
  }

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

  // Handle product drag end
  const handleProductDragEnd = (event: DragEndEvent, categoryId: number) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const categoryProducts = localProductsByCategory[categoryId] || [];
    const oldIndex = categoryProducts.findIndex((p) => p.id === active.id);
    const newIndex = categoryProducts.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newProducts = arrayMove(categoryProducts, oldIndex, newIndex);
    setLocalProductsByCategory({
      ...localProductsByCategory,
      [categoryId]: newProducts,
    });

    // Persist to server
    const updates = newProducts.map((product, index) => ({
      id: product.id,
      sortOrder: index,
    }));
    
    reorderProductsMutation.mutate(updates, {
      onSuccess: () => {
        toast.success("Ordem atualizada");
      },
    });
  };

  // Handle category drag end
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newCategories = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newCategories);

    // Persist to server
    const updates = newCategories.map((category, index) => ({
      id: category.id,
      sortOrder: index,
    }));
    
    reorderCategoriesMutation.mutate(updates, {
      onSuccess: () => {
        toast.success("Ordem das categorias atualizada");
      },
    });
  };

  const handleExitReorderMode = () => {
    setReorderCategoriesMode(false);
    refetchCategories();
    refetchProducts();
  };

  const products = productsData?.products || [];

  // Count products per category for reorder mode
  const productCountByCategory = useMemo(() => {
    const counts: Record<number, number> = {};
    products.forEach((p) => {
      const catId = p.categoryId || 0;
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Reorder Categories Mode View
  if (reorderCategoriesMode) {
    return (
      <AdminLayout>
        <PageHeader
          title="Reordenar Categorias"
          description="Arraste as categorias para reorganizar a ordem de exibição"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExitReorderMode}
                className="rounded-xl border-border/50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleExitReorderMode}
                className="rounded-xl shadow-sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            </div>
          }
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={localCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  productCount={productCountByCategory[category.id] || 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {localCategories.length === 0 && (
          <SectionCard>
            <EmptyState
              icon={Layers}
              title="Nenhuma categoria encontrada"
              description="Crie categorias para organizar seus produtos"
              action={{
                label: "Criar Categoria",
                onClick: () => {
                  setReorderCategoriesMode(false);
                  setCategoryDialogOpen(true);
                }
              }}
            />
          </SectionCard>
        )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Cardápio"
        description="Gerencie seus produtos e categorias"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setReorderCategoriesMode(true)}
              className="rounded-lg border-border/50 hover:bg-accent h-9 px-3.5 text-sm"
            >
              <Layers className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reordenar</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(true)}
              className="rounded-lg border-border/50 hover:bg-accent h-9 px-3.5 text-sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Categoria</span>
            </Button>
            <Button onClick={() => navigate("/catalogo/novo")} className="rounded-lg shadow-sm h-9 px-3.5 text-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo íten</span>
            </Button>
          </div>
        }
      />



      {/* Products List */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
              <div className="skeleton h-5 w-28 rounded-md mb-4" />
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="skeleton h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-40 rounded-md" />
                      <div className="skeleton h-3 w-24 rounded-md" />
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
            description="Comece adicionando seu primeiro produto ao catálogo"
            action={{
              label: "Criar Produto",
              onClick: () => navigate("/catalogo/novo")
            }}
          />
        </SectionCard>
      ) : (
        <div className="space-y-5">
          {localCategories.map((category) => {
            const categoryProducts = localProductsByCategory[category.id] || [];
            if (categoryProducts.length === 0) return null;
            
            return (
              <div key={category.id} className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20" style={{height: '46px'}}>
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(capitalizeFirst(e.target.value))}
                        className="h-8 w-48 font-bold text-base"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingCategoryName.trim()) {
                            updateCategoryMutation.mutate({ id: category.id, name: editingCategoryName.trim() });
                          } else if (e.key === "Escape") {
                            setEditingCategoryId(null);
                            setEditingCategoryName("");
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                        onClick={() => {
                          if (editingCategoryName.trim()) {
                            updateCategoryMutation.mutate({ id: category.id, name: editingCategoryName.trim() });
                          }
                        }}
                        disabled={!editingCategoryName.trim() || updateCategoryMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="group flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer hover:bg-muted/50 transition-all duration-200"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setEditingCategoryName(category.name);
                      }}
                    >
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {categoryProducts.length} {categoryProducts.length === 1 ? "ítem" : "ítens"}
                  </span>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleProductDragEnd(event, category.id)}
                >
                  <SortableContext
                    items={categoryProducts.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border/50">
                      {categoryProducts.map((product) => (
                        <SortableProductItem
                          key={product.id}
                          product={product}
                          isDragDisabled={hasActiveFilters}
                          onToggleStatus={handleToggleStatus}
                          onDuplicate={handleDuplicate}
                          onDelete={(id) => {
                            setProductToDelete(id);
                            setDeleteDialogOpen(true);
                          }}
                          onEdit={(id) => navigate(`/catalogo/editar/${id}`)}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
          
          {/* Products without category */}
          {localProductsByCategory[0] && localProductsByCategory[0].length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
                <h3 className="font-bold text-lg">Sem categoria</h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {localProductsByCategory[0].length} {localProductsByCategory[0].length === 1 ? "produto" : "produtos"}
                </span>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleProductDragEnd(event, 0)}
              >
                <SortableContext
                  items={localProductsByCategory[0].map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border/50">
                    {localProductsByCategory[0].map((product) => (
                      <SortableProductItem
                        key={product.id}
                        product={product}
                        isDragDisabled={hasActiveFilters}
                        onToggleStatus={handleToggleStatus}
                        onDuplicate={handleDuplicate}
                        onDelete={(id) => {
                          setProductToDelete(id);
                          setDeleteDialogOpen(true);
                        }}
                        onEdit={(id) => navigate(`/catalogo/editar/${id}`)}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
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

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar seus produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(capitalizeFirst(e.target.value))}
              className="h-11 rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
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
