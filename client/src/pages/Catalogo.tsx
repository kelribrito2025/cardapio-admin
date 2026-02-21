import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { getThumbUrl } from "../../../shared/imageUtils";
import { BlurImage } from "@/components/BlurImage";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Copy,
  Trash2,
  GripVertical,
  Check,
  X,
  Pencil,
  MoreVertical,
  Pause,
  Play,
  ChevronUp,
  ChevronDown,
  Layers,
  FolderPlus,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback, startTransition, type FocusEvent } from "react";
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
  DragStartEvent,
  useDroppable,
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
import { useSearch } from "@/contexts/SearchContext";
import CreateComboSheet from "@/components/CreateComboSheet";
import CreateProductSheet from "@/components/CreateProductSheet";
import InlineComplementsDropdown from "@/components/InlineComplementsDropdown";

// Sortable Product Item Component
function SortableProductItem({
  product,
  isDragDisabled,
  onToggleStatus,
  onDuplicate,
  onDelete,
  onEdit,
  formatCurrency,
  expandedComplementProductId,
  onToggleComplements,
  onUpdateInline,
  establishmentId,
  categoryIsActive = true,
}: {
  product: any;
  isDragDisabled: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  formatCurrency: (value: string | number) => string;
  expandedComplementProductId: number | null;
  onToggleComplements: (id: number) => void;
  onUpdateInline?: (id: number, data: { price?: string; stockQuantity?: number | null; hasStock?: boolean }) => void;
  establishmentId?: number;
  categoryIsActive?: boolean;
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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isComplementsOpen = expandedComplementProductId === product.id;

  // Status efetivo: se a categoria está pausada, todos os itens devem aparecer como pausados visualmente
  const effectiveStatus = !categoryIsActive ? 'paused' : product.status;

  // Inline editable fields state
  const formatPriceBR = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    const reais = str.slice(0, -2);
    const centavos = str.slice(-2);
    return `${reais},${centavos}`;
  };

  const priceToCents = (price: string | number) => Math.round(Number(price) * 100);

  const [priceCents, setPriceCents] = useState(product.price ? priceToCents(product.price) : 0);
  const [localStock, setLocalStock] = useState(product.hasStock && product.stockQuantity !== null ? String(product.stockQuantity) : '');
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  // Sync local state when product changes from server
  useEffect(() => {
    setPriceCents(product.price ? priceToCents(product.price) : 0);
    setLocalStock(product.hasStock && product.stockQuantity !== null ? String(product.stockQuantity) : '');
  }, [product.price, product.stockQuantity, product.hasStock]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(raw, 10) || 0;
    setPriceCents(cents);
  };

  const handlePriceBlur = () => {
    const newPrice = priceCents / 100;
    if (newPrice !== Number(product.price)) {
      onUpdateInline?.(product.id, { price: newPrice.toFixed(2) });
    }
  };

  const handleStockBlur = () => {
    const parsed = parseInt(localStock, 10);
    if (localStock === '' && product.hasStock) {
      // User cleared stock - disable stock control
      onUpdateInline?.(product.id, { hasStock: false, stockQuantity: null });
    } else if (!isNaN(parsed) && (parsed !== product.stockQuantity || !product.hasStock)) {
      onUpdateInline?.(product.id, { hasStock: true, stockQuantity: parsed });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "shadow-lg rounded-lg border border-border/50"
      )}
    >
      <div
        style={{ height: '60px' }}
        className={cn(
          "flex items-center gap-3.5 p-3.5 transition-colors",
          effectiveStatus === "active"
            ? "hover:bg-muted/30 bg-card"
            : "bg-muted/40"
        )}
      >
        {!isDragDisabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  "cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none",
                  effectiveStatus !== "active" && "opacity-50"
                )}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Arraste para reordenar</TooltipContent>
          </Tooltip>
        )}
        {/* Área clicável para edição */}
        <div 
          className={cn(
            "flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity",
            effectiveStatus !== "active" && "opacity-50"
          )}
          onClick={() => onEdit(product.id)}
        >
          <div
            className={cn(
              "hidden md:flex h-12 w-12 rounded-lg items-center justify-center overflow-hidden flex-shrink-0",
              effectiveStatus === "active"
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-gray-400 to-gray-500 grayscale"
            )}>
            {product.images && product.images.length > 0 ? (
              <BlurImage
                src={product.images[0]}
                blurDataUrl={product.blurPlaceholder}
                alt={product.name}
                containerClassName="h-full w-full"
                className="h-full w-full object-cover"
                responsive
                sizes="48px"
              />
            ) : (
              <UtensilsCrossed className="h-5 w-5 text-white animate-placeholder-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={cn(
                "font-semibold text-base truncate",
                effectiveStatus !== "active" && "text-muted-foreground"
              )}>{product.name}</h4>

              {product.hasStock && product.stockQuantity !== null && product.stockQuantity <= 0 && (
                <StatusBadge variant="error">Sem estoque</StatusBadge>
              )}
            </div>
            {/* Mobile: preço abaixo do nome */}
            {Number(product.price) > 0 && (
              <p className="md:hidden text-sm font-medium text-primary mt-0.5">{formatCurrency(product.price)}</p>
            )}
            {product.description && (
              <p className="hidden md:block text-sm text-muted-foreground truncate mt-1">
                {product.description}
              </p>
            )}
          </div>
        </div>
        {/* Botão Complementos (desktop) + seta (mobile) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Desktop: botão texto "Complementos" */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-lg text-xs font-medium px-2.5 hidden md:inline-flex",
              isComplementsOpen
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20",
              effectiveStatus !== "active" && "opacity-50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplements(product.id);
            }}
          >
            {product.complementCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                {product.complementCount}
              </span>
            )}
            Complementos
            {isComplementsOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </Button>
          {/* Mobile: ícone seta */}
          <div className={cn("relative md:hidden", effectiveStatus !== "active" && "opacity-50")}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg",
                isComplementsOpen
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplements(product.id);
              }}
            >
              {isComplementsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {product.complementCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold">
                {product.complementCount}
              </span>
            )}
          </div>
          {/* Desktop: Estoque + Preço editáveis inline */}
          <div className={cn("hidden md:flex items-center gap-2 flex-shrink-0", effectiveStatus !== "active" && "opacity-50")}>
            <input
              ref={stockRef}
              type="text"
              inputMode="numeric"
              value={localStock}
              placeholder="Estoque"
              onChange={(e) => setLocalStock(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={handleStockBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') stockRef.current?.blur(); }}
              onClick={(e) => e.stopPropagation()}
              className="w-[77px] h-8 text-sm text-center font-medium rounded-lg border border-border/60 bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" style={{paddingRight: '7px', paddingLeft: '7px'}}
            />
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-primary font-medium pointer-events-none">R$</span>
              <input
                ref={priceRef}
                type="text"
                inputMode="numeric"
                value={formatPriceBR(priceCents)}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') priceRef.current?.blur(); }}
                onClick={(e) => e.stopPropagation()}
                className="w-[92px] h-8 pl-8 pr-2.5 text-sm text-right font-semibold rounded-lg border border-border/60 bg-muted/30 text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          {/* Botão Pausar/Play igual ao da categoria */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  effectiveStatus === "active"
                    ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                    : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(product.id, product.status);
                }}
              >
                {effectiveStatus === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{effectiveStatus === "active" ? "Pausar item" : "Ativar item"}</TooltipContent>
          </Tooltip>
          {/* Menu 3 pontinhos sem estilo de botão */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn("p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground", effectiveStatus !== "active" && "opacity-50")}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4.5 w-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Inline Complements Dropdown */}
      <InlineComplementsDropdown
        productId={product.id}
        establishmentId={establishmentId}
        isOpen={isComplementsOpen}
        onClose={() => onToggleComplements(product.id)}
      />
    </div>
  );
}


// Droppable Category Drop Zone Component
function CategoryDropZone({ categoryId, categoryName, isActive }: { categoryId: number | null; categoryName: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-drop-${categoryId ?? 0}`,
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 border-b text-center text-sm font-medium transition-all duration-200",
        isOver 
          ? "bg-green-100 border-green-400 text-green-700" 
          : "bg-primary/10 border-primary/20 text-primary animate-pulse"
      )}
    >
      {isOver ? `Soltar em "${categoryName}"` : `Solte aqui para mover para "${categoryName}"`}
    </div>
  );
}

// Sortable Category Item Component - wraps the entire category card to make it draggable
function SortableCategoryItem({
  category,
  categoryProducts,
  isDropTarget,
  isDraggingCategory,
  isCollapsed,
  isEditing,
  editingName,
  hasActiveFilters,
  onToggleCategoryCollapse,
  onStartEditing,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onToggleCategoryStatus,
  onDuplicateCategory,
  onDeleteCategory,
  onCreateCombo,
  toggleCategoryStatusPending,
  updateCategoryPending,
  duplicateCategoryPending,
  children,
}: {
  category: any;
  categoryProducts: any[];
  isDropTarget: boolean;
  isDraggingCategory: boolean;
  isCollapsed: boolean;
  isEditing: boolean;
  editingName: string;
  hasActiveFilters: boolean;
  onToggleCategoryCollapse: (id: number) => void;
  onStartEditing: (id: number, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onSaveEdit: (id: number, name: string) => void;
  onCancelEdit: () => void;
  onToggleCategoryStatus: (id: number, isActive: boolean) => void;
  onDuplicateCategory: (id: number) => void;
  onDeleteCategory: (id: number, name: string, productCount: number) => void;
  onCreateCombo: (categoryId: number, categoryName: string) => void;
  toggleCategoryStatusPending: boolean;
  updateCategoryPending: boolean;
  duplicateCategoryPending: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `cat-${category.id}`,
    disabled: hasActiveFilters,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: isDragging ? 'relative' as const : undefined,
  };

  // Se todos os itens da categoria estão pausados, considerar a categoria como efetivamente pausada
  const allItemsPaused = categoryProducts.length > 0 && categoryProducts.every((p: any) => p.status !== 'active');
  const effectiveIsActive = category.isActive && !allItemsPaused;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-category-id={category.id}
      className={cn(
        "bg-card rounded-xl border border-border/50 overflow-hidden",
        isDropTarget && "ring-2 ring-primary/50 ring-offset-2",
        "border-t-4 border-t-red-500",
        isDragging && "shadow-2xl ring-2 ring-primary/30"
      )}
    >
      {/* Drop zone for this category - hidden during category drag */}
      {!isDraggingCategory && (
        <CategoryDropZone 
          categoryId={category.id} 
          categoryName={category.name} 
          isActive={isDropTarget} 
        />
      )}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20" style={{height: '52px'}}>
        {/* Drag handle + title area */}
        <div className="flex items-center gap-1.5">
          {/* GripVertical drag handle for category */}
          {!hasActiveFilters && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(capitalizeFirst(e.target.value))}
                className="h-8 w-48 font-bold text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editingName.trim()) {
                    onSaveEdit(category.id, editingName.trim());
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                onClick={() => {
                  if (editingName.trim()) {
                    onSaveEdit(category.id, editingName.trim());
                  }
                }}
                disabled={!editingName.trim() || updateCategoryPending}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={onCancelEdit}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div
                className="group flex items-center gap-1.5 px-2 py-1 -my-1 rounded-md cursor-pointer hover:bg-muted/50 transition-all duration-200"
                onClick={() => onStartEditing(category.id, category.name)}
              >
                <h3 className={cn(
                  "font-bold text-base group-hover:text-primary transition-colors",
                  !effectiveIsActive && "text-muted-foreground line-through"
                )}>
                  {category.name}
                </h3>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors duration-200" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {categoryProducts.length} {categoryProducts.length === 1 ? "ítem" : "ítens"}
              </span>
              {!effectiveIsActive && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{allItemsPaused && category.isActive ? 'Todos pausados' : 'Pausada'}</span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Botão Criar Combo - hidden on mobile */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 px-3 hidden sm:inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCombo(category.id, category.name);
            }}
          >
            Criar Combo
          </Button>
          {/* Botão Pausar/Play - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg hidden sm:inline-flex",
                  effectiveIsActive
                    ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                    : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCategoryStatus(category.id, !category.isActive);
                }}
                disabled={toggleCategoryStatusPending}
              >
                {effectiveIsActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{effectiveIsActive ? "Pausar categoria" : "Ativar categoria"}</TooltipContent>
          </Tooltip>
          {/* Botão 3 pontinhos - Duplicar/Remover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Mobile-only: Pausar/Ativar e Criar Combo */}
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => onToggleCategoryStatus(category.id, !category.isActive)}
                disabled={toggleCategoryStatusPending}
              >
                {effectiveIsActive ? (
                  <><Pause className="h-4 w-4 mr-2" />Pausar categoria</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" />Ativar categoria</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => onCreateCombo(category.id, category.name)}
              >
                <Layers className="h-4 w-4 mr-2" />
                Criar Combo
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                onClick={() => onDuplicateCategory(category.id)}
                disabled={duplicateCategoryPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar categoria
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteCategory(category.id, category.name, categoryProducts.length)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover categoria
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Botão Minimizar/Expandir */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCategoryCollapse(category.id);
                }}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? "Expandir itens" : "Minimizar itens"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Products list - hidden when collapsed or when dragging categories */}
      {!isCollapsed && !isDraggingCategory && children}
    </div>
  );
}

export default function Catalogo() {
  const [, navigate] = useLocation();
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  // Filters - use global search from topbar + local mobile search
  const { searchQuery: globalSearch } = useSearch();
  const [mobileSearch, setMobileSearch] = useState("");
  // Combine global search (topbar) with local mobile search
  const search = globalSearch || mobileSearch;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("sortOrder");

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string; productCount: number } | null>(null);
  
  // Combo Sheet state
  const [comboSheetOpen, setComboSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [comboSheetCategoryId, setComboSheetCategoryId] = useState<number>(0);
  const [comboSheetCategoryName, setComboSheetCategoryName] = useState("");
  
  // Local state for drag and drop
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [localProductsByCategory, setLocalProductsByCategory] = useState<Record<number, any[]>>({});
  
  // Inline editing state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  
  // Drag between categories state
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeProductCategoryId, setActiveProductCategoryId] = useState<number | null>(null);
  
  // Inline complements dropdown state
  const [expandedComplementProductId, setExpandedComplementProductId] = useState<number | null>(null);
  const handleToggleComplements = useCallback((productId: number) => {
    setExpandedComplementProductId(prev => prev === productId ? null : productId);
  }, []);

  // Category drag state
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const preCollapseStateRef = useRef<Set<number> | null>(null);
  
  // Collapsed categories state (persisted in localStorage)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('collapsedCategories');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  
  const toggleCategoryCollapse = useCallback((categoryId: number) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      localStorage.setItem('collapsedCategories', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

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

  // Scroll restoration: when returning from product edit, scroll to the category
  useEffect(() => {
    const scrollCategoryId = sessionStorage.getItem('catalogo_scroll_category');
    if (scrollCategoryId && productsData?.products && localCategories.length > 0) {
      sessionStorage.removeItem('catalogo_scroll_category');
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.querySelector(`[data-category-id="${scrollCategoryId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Adjust for fixed header offset
            setTimeout(() => {
              window.scrollBy({ top: -80, behavior: 'smooth' });
            }, 300);
          }
        }, 100);
      });
    }
  }, [productsData, localCategories]);

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
      // Scroll to bottom after a short delay to let the new category render
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 500);
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const reorderCategoriesMutation = trpc.category.reorder.useMutation({
    onError: () => {
      toast.error("Erro ao reordenar categorias");
      // Revert on error
      if (categories) {
        setLocalCategories([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    },
  });

  const reorderProductsMutation = trpc.product.reorder.useMutation({
    onError: () => {
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

  const deleteCategoryMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      refetchCategories();
      refetchProducts();
      setCategoryToDelete(null);
      setDeleteCategoryDialogOpen(false);
      toast.success("Categoria excluída com sucesso");
    },
    onError: () => toast.error("Erro ao excluir categoria"),
  });

  const duplicateCategoryMutation = trpc.category.duplicate.useMutation({
    onSuccess: () => {
      refetchCategories();
      refetchProducts();
      toast.success("Categoria duplicada com sucesso");
    },
    onError: () => toast.error("Erro ao duplicar categoria"),
  });

  const toggleCategoryStatusMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Status da categoria atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status da categoria"),
  });

  // Mutation para mover produto entre categorias
  const moveProductCategoryMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto movido para nova categoria");
    },
    onError: () => {
      toast.error("Erro ao mover produto");
      refetchProducts();
    },
  });

  // Mutation para atualização inline (preço/estoque)
  const inlineUpdateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      refetchProducts();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
      refetchProducts();
    },
  });

  const handleInlineUpdate = useCallback((id: number, data: { price?: string; stockQuantity?: number | null; hasStock?: boolean }) => {
    inlineUpdateMutation.mutate({ id, ...data });
  }, [inlineUpdateMutation]);

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

  // Category sortable IDs (prefixed with "cat-" to distinguish from product IDs)
  const categorySortableIds = useMemo(() => 
    localCategories.map(c => `cat-${c.id}`),
    [localCategories]
  );

  // Handle drag start - detect if dragging a category or product
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    
    if (activeId.startsWith('cat-')) {
      // Dragging a category - auto-collapse all categories
      setIsDraggingCategory(true);
      // Save current collapse state before collapsing all
      preCollapseStateRef.current = new Set(collapsedCategories);
      // Use startTransition to batch the collapse update as low-priority
      startTransition(() => {
        const allCategoryIds = new Set(localCategories.map(c => c.id));
        setCollapsedCategories(allCategoryIds);
      });
    } else {
      // Dragging a product
      const productId = active.id as number;
      for (const [catId, products] of Object.entries(localProductsByCategory)) {
        const product = products.find((p: any) => p.id === productId);
        if (product) {
          setActiveProduct(product);
          setActiveProductCategoryId(Number(catId));
          break;
        }
      }
    }
  };

  // Handle drag end - check if dropped on different category or reorder categories
  const handleGlobalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    
    // Handle category drag end
    if (activeId.startsWith('cat-')) {
      setIsDraggingCategory(false);
      
      // Restore previous collapse state
      if (preCollapseStateRef.current !== null) {
        setCollapsedCategories(preCollapseStateRef.current);
        // Also persist the restored state to localStorage
        localStorage.setItem('collapsedCategories', JSON.stringify(Array.from(preCollapseStateRef.current)));
        preCollapseStateRef.current = null;
      }
      
      if (!over) return;
      
      const overId = String(over.id);
      if (!overId.startsWith('cat-')) return;
      
      const activeCatId = Number(activeId.replace('cat-', ''));
      const overCatId = Number(overId.replace('cat-', ''));
      
      if (activeCatId === overCatId) return;
      
      const oldIndex = localCategories.findIndex(c => c.id === activeCatId);
      const newIndex = localCategories.findIndex(c => c.id === overCatId);
      
      if (oldIndex === -1 || newIndex === -1) return;
      
      // Optimistic update
      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);
      
      // Persist to server
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        sortOrder: index,
      }));
      
      reorderCategoriesMutation.mutate(updates, {
        onSuccess: () => {
          toast.success("Ordem das categorias atualizada");
        },
      });
      return;
    }
    
    // Handle product drag end
    setActiveProduct(null);
    setActiveProductCategoryId(null);
    
    if (!over) return;
    
    const productId = active.id as number;
    const overId = String(over.id);
    
    // Check if dropped on a category drop zone
    if (overId.startsWith('category-drop-')) {
      const targetCategoryId = overId === 'category-drop-0' ? null : Number(overId.replace('category-drop-', ''));
      const sourceCategoryId = activeProductCategoryId;
      
      // Only move if dropping on a different category
      if (sourceCategoryId !== (targetCategoryId ?? 0)) {
        // Optimistic update
        const sourceProducts = [...(localProductsByCategory[sourceCategoryId ?? 0] || [])];
        const productIndex = sourceProducts.findIndex((p) => p.id === productId);
        
        if (productIndex !== -1) {
          const [movedProduct] = sourceProducts.splice(productIndex, 1);
          const targetProducts = [...(localProductsByCategory[targetCategoryId ?? 0] || []), movedProduct];
          
          setLocalProductsByCategory({
            ...localProductsByCategory,
            [sourceCategoryId ?? 0]: sourceProducts,
            [targetCategoryId ?? 0]: targetProducts,
          });
          
          // Persist to server
          moveProductCategoryMutation.mutate({
            id: productId,
            categoryId: targetCategoryId,
          });
        }
      }
      return;
    }
    
    // Handle reordering within same category
    if (activeProductCategoryId !== null) {
      const categoryProducts = localProductsByCategory[activeProductCategoryId] || [];
      const oldIndex = categoryProducts.findIndex((p) => p.id === active.id);
      const newIndex = categoryProducts.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newProducts = arrayMove(categoryProducts, oldIndex, newIndex);
        setLocalProductsByCategory({
          ...localProductsByCategory,
          [activeProductCategoryId]: newProducts,
        });

        const updates = newProducts.map((product, index) => ({
          id: product.id,
          sortOrder: index,
        }));
        
        reorderProductsMutation.mutate(updates, {
          onSuccess: () => {
            toast.success("Ordem atualizada");
          },
        });
      }
    }
  };

  const products = productsData?.products || [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <PageHeader
          title="Cardápio"
          description="Gerencie seus produtos e categorias"
          icon={<UtensilsCrossed className="h-6 w-6 text-blue-600" />}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setCategoryDialogOpen(true)} className="hidden md:flex rounded-lg h-9 px-3 text-xs sm:text-sm sm:px-3.5">
                <FolderPlus className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">categoria</span>
              </Button>
              <Button onClick={() => setProductSheetOpen(true)} className="hidden md:flex rounded-lg h-9 px-3 text-xs sm:text-sm sm:px-3.5">
                <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm">item</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Mobile Search + Novo Produto - visible only on mobile */}
      <div className="mb-4 md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border/50"
          />
          {mobileSearch && (
            <button
              onClick={() => setMobileSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setCategoryDialogOpen(true)}
          className="h-10 w-10 rounded-xl flex-shrink-0"
        >
          <FolderPlus className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={() => setProductSheetOpen(true)}
          className="h-10 w-10 rounded-xl flex-shrink-0"
          style={{ backgroundColor: '#db262f', color: 'white' }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 p-4">
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
              onClick: () => setProductSheetOpen(true)
            }}
          />
        </SectionCard>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleGlobalDragEnd}
        >
        <SortableContext
          items={categorySortableIds}
          strategy={verticalListSortingStrategy}
        >
        <div className="space-y-5">
          {localCategories.map((category) => {
            const categoryProducts = localProductsByCategory[category.id] || [];
            const isDropTarget = activeProduct && activeProductCategoryId !== category.id;
            
            // Mostrar categoria se tiver produtos OU se estiver arrastando um produto (para mostrar como drop target)
            if (categoryProducts.length === 0 && !activeProduct) return null;
            
            return (
              <SortableCategoryItem
                key={category.id}
                category={category}
                categoryProducts={categoryProducts}
                isDropTarget={isDropTarget}
                isDraggingCategory={isDraggingCategory}
                isCollapsed={collapsedCategories.has(category.id)}
                isEditing={editingCategoryId === category.id}
                editingName={editingCategoryName}
                hasActiveFilters={hasActiveFilters}
                onToggleCategoryCollapse={toggleCategoryCollapse}
                onStartEditing={(id, name) => {
                  setEditingCategoryId(id);
                  setEditingCategoryName(name);
                }}
                onEditingNameChange={setEditingCategoryName}
                onSaveEdit={(id, name) => {
                  updateCategoryMutation.mutate({ id, name });
                }}
                onCancelEdit={() => {
                  setEditingCategoryId(null);
                  setEditingCategoryName("");
                }}
                onToggleCategoryStatus={(id, isActive) => {
                  toggleCategoryStatusMutation.mutate({ id, isActive });
                }}
                onDuplicateCategory={(id) => {
                  duplicateCategoryMutation.mutate({ id });
                }}
                onDeleteCategory={(id, name, productCount) => {
                  setCategoryToDelete({ id, name, productCount });
                  setDeleteCategoryDialogOpen(true);
                }}
                onCreateCombo={(id, name) => {
                  setComboSheetCategoryId(id);
                  setComboSheetCategoryName(name);
                  setComboSheetOpen(true);
                }}
                toggleCategoryStatusPending={toggleCategoryStatusMutation.isPending}
                updateCategoryPending={updateCategoryMutation.isPending}
                duplicateCategoryPending={duplicateCategoryMutation.isPending}
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
                        onEdit={(id) => {
                          sessionStorage.setItem('catalogo_scroll_category', String(category.id));
                          navigate(`/catalogo/editar/${id}`);
                        }}
                        formatCurrency={formatCurrency}
                        expandedComplementProductId={expandedComplementProductId}
                        onToggleComplements={handleToggleComplements}
                        onUpdateInline={handleInlineUpdate}
                        establishmentId={establishmentId || undefined}
                        categoryIsActive={category.isActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </SortableCategoryItem>
            );
          })}
          
          {/* Products without category */}
          {(localProductsByCategory[0] && localProductsByCategory[0].length > 0) || activeProduct ? (
            <div 
              data-category-id="0"
              className={cn(
                "bg-card rounded-xl border border-border/50 overflow-hidden",
                activeProduct && activeProductCategoryId !== 0 && "ring-2 ring-primary/50 ring-offset-2"
              )}
            >
              {/* Drop zone for uncategorized */}
              <CategoryDropZone 
                categoryId={null} 
                categoryName="Sem categoria" 
                isActive={activeProduct && activeProductCategoryId !== 0} 
              />
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
                <h3 className="font-bold text-lg">Sem categoria</h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {(localProductsByCategory[0]?.length || 0)} {(localProductsByCategory[0]?.length || 0) === 1 ? "produto" : "produtos"}
                </span>
              </div>
              {!isDraggingCategory && (
              <SortableContext
                items={(localProductsByCategory[0] || []).map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-border/50">
                  {(localProductsByCategory[0] || []).map((product) => (
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
                      onEdit={(id) => {
                        sessionStorage.setItem('catalogo_scroll_category', '0');
                        navigate(`/catalogo/editar/${id}`);
                      }}
                      formatCurrency={formatCurrency}
                      expandedComplementProductId={expandedComplementProductId}
                      onToggleComplements={handleToggleComplements}
                      onUpdateInline={handleInlineUpdate}
                      establishmentId={establishmentId || undefined}
                    />
                  ))}
                </div>
              </SortableContext>
              )}
            </div>
          ) : null}
        </div>
        </SortableContext>
        </DndContext>
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

      {/* Create Product Sheet */}
      {establishmentId && (
        <CreateProductSheet
          open={productSheetOpen}
          onOpenChange={setProductSheetOpen}
          establishmentId={establishmentId}
          onSuccess={() => {
            refetchProducts();
            refetchCategories();
          }}
        />
      )}

      {/* Create Combo Sheet */}
      {establishmentId && (
        <CreateComboSheet
          open={comboSheetOpen}
          onOpenChange={setComboSheetOpen}
          establishmentId={establishmentId}
          categoryId={comboSheetCategoryId}
          categoryName={comboSheetCategoryName}
          onSuccess={() => {
            refetchProducts();
            refetchCategories();
          }}
        />
      )}
    </AdminLayout>
  );
}
