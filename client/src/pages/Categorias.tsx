import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  GripVertical,
  Layers,
  Check,
  X,
  Pencil,
  MoreVertical,
  Trash2,
  Tag,
} from "lucide-react";
import { useState, useEffect } from "react";
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

// Hook para detectar se é mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Sortable Category Item Component
function SortableCategoryItem({
  category,
  productCount,
  onEdit,
  onDelete,
  isEditing,
  editingName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  isMobile,
}: {
  category: any;
  productCount: number;
  onEdit: (id: number, name: string) => void;
  onDelete: (category: { id: number; name: string; productCount: number }) => void;
  isEditing: boolean;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isMobile: boolean;
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
        "flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:bg-muted/30 transition-colors",
        isDragging && "shadow-lg",
        isMobile && "cursor-pointer"
      )}
      onClick={() => {
        // No mobile, clicar em qualquer lugar abre o bottom sheet
        if (isMobile && !isDragging) {
          onEdit(category.id, category.name);
        }
      }}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1 min-w-0">
        {/* No desktop, permite edição inline. No mobile, apenas mostra o nome */}
        {!isMobile && isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editingName}
              onChange={(e) => onEditNameChange(capitalizeFirst(e.target.value))}
              className="h-9 w-full max-w-xs font-semibold"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingName.trim()) {
                  onSaveEdit();
                } else if (e.key === "Escape") {
                  onCancelEdit();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onSaveEdit}
              disabled={!editingName.trim()}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelEdit}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className={cn(
              "flex items-center gap-2 group",
              !isMobile && "cursor-pointer"
            )}
            onClick={(e) => {
              if (!isMobile) {
                e.stopPropagation();
                onEdit(category.id, category.name);
              }
            }}
          >
            <h4 className={cn(
              "font-semibold text-base transition-colors",
              !isMobile && "group-hover:text-primary"
            )}>
              {category.name} <span className="text-muted-foreground font-normal">({productCount} {productCount === 1 ? "item" : "itens"})</span>
            </h4>
            {!isMobile && (
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </div>
      
      {/* Menu de ações - apenas no desktop */}
      {!isMobile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category.id, category.name)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete({ id: category.id, name: category.name, productCount })}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function Categorias() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const isMobile = useIsMobile();
  
  // Local state for categories
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  
  // Edit state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  
  // Dialog/Sheet state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string; productCount: number } | null>(null);
  
  // Bottom sheet state for mobile edit
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetCategory, setEditSheetCategory] = useState<{ id: number; name: string; productCount: number } | null>(null);
  const [editSheetName, setEditSheetName] = useState("");

  // Set establishment ID when data is loaded
  useEffect(() => {
    if (establishment?.id) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // DnD sensors
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

  // Queries
  const { data: categories, refetch: refetchCategories, isLoading } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: productsData } = trpc.product.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Sync local state with server data
  useEffect(() => {
    if (categories) {
      setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [categories]);

  // Calculate product count by category
  const productCountByCategory = productsData?.products?.reduce((acc, product) => {
    const categoryId = product.categoryId || 0;
    acc[categoryId] = (acc[categoryId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  // Mutations
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
    onError: () => {
      toast.error("Erro ao reordenar categorias");
      if (categories) {
        setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    },
  });

  const updateCategoryMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      refetchCategories();
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setEditSheetOpen(false);
      setEditSheetCategory(null);
      setEditSheetName("");
      toast.success("Categoria atualizada");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });

  const deleteCategoryMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      refetchCategories();
      setCategoryToDelete(null);
      setDeleteCategoryDialogOpen(false);
      setEditSheetOpen(false);
      setEditSheetCategory(null);
      toast.success("Categoria excluída com sucesso");
    },
    onError: () => toast.error("Erro ao excluir categoria"),
  });

  // Handlers
  const handleCreateCategory = () => {
    if (!newCategoryName.trim() || !establishmentId) return;
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      establishmentId,
    });
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newOrder);

    // Save to server
    reorderCategoriesMutation.mutate(
      newOrder.map((c, index) => ({ id: c.id, sortOrder: index }))
    );
  };

  const handleEditCategory = (id: number, name: string) => {
    if (isMobile) {
      // No mobile, abre o bottom sheet
      const category = localCategories.find(c => c.id === id);
      const productCount = productCountByCategory[id] || 0;
      setEditSheetCategory({ id, name, productCount });
      setEditSheetName(name);
      setEditSheetOpen(true);
    } else {
      // No desktop, edição inline
      setEditingCategoryId(id);
      setEditingCategoryName(name);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    updateCategoryMutation.mutate({
      id: editingCategoryId,
      name: editingCategoryName.trim(),
    });
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleDeleteCategory = (category: { id: number; name: string; productCount: number }) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  // Handlers para o bottom sheet mobile
  const handleSaveEditSheet = () => {
    if (!editSheetCategory || !editSheetName.trim()) return;
    updateCategoryMutation.mutate({
      id: editSheetCategory.id,
      name: editSheetName.trim(),
    });
  };

  const handleDeleteFromSheet = () => {
    if (!editSheetCategory) return;
    setCategoryToDelete(editSheetCategory);
    setDeleteCategoryDialogOpen(true);
  };

  // Handler para abrir o dialog/sheet de nova categoria
  const handleOpenNewCategory = () => {
    setNewCategoryName("");
    setCategoryDialogOpen(true);
  };

  // Loading state
  if (establishmentLoading || isLoading) {
    return (
      <AdminLayout>
        <PageHeader
          title="Categorias"
          description="Organize as categorias do seu cardápio"
        />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-4">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-5 w-48 rounded" />
                <div className="flex-1" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Categorias"
        description="Organize as categorias do seu cardápio"
        actions={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleOpenNewCategory}
                  className="rounded-lg shadow-sm h-9 px-3 text-xs sm:text-sm sm:px-3.5"
                >
                  <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Nova Categoria</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Nova Categoria</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      {localCategories.length === 0 ? (
        <SectionCard className="mt-6">
          <EmptyState
            icon={Tag}
            title="Nenhuma categoria encontrada"
            description="Crie categorias para organizar os produtos do seu cardápio"
            action={{
              label: "Criar Categoria",
              onClick: handleOpenNewCategory
            }}
          />
        </SectionCard>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={localCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 mt-6">
              {localCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  productCount={productCountByCategory[category.id] || 0}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  isEditing={editingCategoryId === category.id}
                  editingName={editingCategoryName}
                  onEditNameChange={setEditingCategoryName}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Category - Dialog no desktop, Bottom Sheet no mobile */}
      {isMobile ? (
        <Sheet open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
            <SheetHeader className="p-0 mb-6">
              <SheetTitle className="text-xl">Nova categoria</SheetTitle>
              <SheetDescription>
                Crie uma nova categoria para organizar seus produtos.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(capitalizeFirst(e.target.value))}
                className="h-12 rounded-xl text-base"
                autoFocus
              />
            </div>
            <SheetFooter className="p-0 mt-6 flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCategoryDialogOpen(false)} 
                className="flex-1 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                className="flex-1 h-12 rounded-xl"
              >
                {createCategoryMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategoryName.trim()) {
                    handleCreateCategory();
                  }
                }}
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
      )}

      {/* Edit Category Bottom Sheet - apenas mobile */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl">Editar categoria</SheetTitle>
            <SheetDescription>
              {editSheetCategory?.productCount 
                ? `${editSheetCategory.productCount} ${editSheetCategory.productCount === 1 ? 'produto' : 'produtos'} nesta categoria`
                : 'Nenhum produto nesta categoria'
              }
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da categoria"
              value={editSheetName}
              onChange={(e) => setEditSheetName(capitalizeFirst(e.target.value))}
              className="h-12 rounded-xl text-base"
              autoFocus
            />
          </div>
          <SheetFooter className="p-0 mt-6 flex-col gap-3">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setEditSheetOpen(false)} 
                className="flex-1 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditSheet}
                disabled={!editSheetName.trim() || updateCategoryMutation.isPending}
                className="flex-1 h-12 rounded-xl"
              >
                {updateCategoryMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleDeleteFromSheet}
              className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir categoria
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir categoria</DialogTitle>
            <DialogDescription>
              {categoryToDelete?.productCount && categoryToDelete.productCount > 0 ? (
                <>
                  A categoria <strong>"{categoryToDelete?.name}"</strong> possui <strong>{categoryToDelete?.productCount} {categoryToDelete?.productCount === 1 ? 'produto' : 'produtos'}</strong>. 
                  Ao excluir, os produtos serão movidos para "Sem categoria".
                </>
              ) : (
                <>Tem certeza que deseja excluir a categoria <strong>"{categoryToDelete?.name}"</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate({ id: categoryToDelete.id });
                }
              }}
              disabled={deleteCategoryMutation.isPending}
              className="rounded-xl"
            >
              {deleteCategoryMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
