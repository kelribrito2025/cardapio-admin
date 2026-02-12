import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  GripVertical,
  Plus,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useCallback } from "react";
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
import { toast } from "sonner";

// ---- Sortable Item inside a group ----
function SortableInlineItem({
  item,
  groupId,
  onUpdatePrice,
  onToggleActive,
  onDelete,
}: {
  item: any;
  groupId: number;
  onUpdatePrice: (itemId: number, price: string) => void;
  onToggleActive: (itemId: number, isActive: boolean) => void;
  onDelete: (itemId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const [localPrice, setLocalPrice] = useState(
    item.price ? formatDisplayPrice(item.price) : "0,00"
  );

  function formatDisplayPrice(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0,00";
    return num.toFixed(2).replace(".", ",");
  }

  function handlePriceBlur() {
    const cleaned = localPrice.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    const finalPrice = isNaN(num) ? "0" : num.toFixed(2);
    setLocalPrice(formatDisplayPrice(finalPrice));
    onUpdatePrice(item.id, finalPrice);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-card rounded-lg border border-border/50",
        isDragging && "shadow-lg ring-2 ring-primary/30",
        !item.isActive && "opacity-60"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none flex-shrink-0"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </button>

      {/* Image indicator */}
      {item.imageUrl && (
        <div className="h-7 w-7 rounded-md overflow-hidden flex-shrink-0">
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <span className={cn(
        "flex-1 min-w-0 text-sm truncate",
        !item.isActive && "line-through text-muted-foreground"
      )}>
        {item.name}
      </span>

      {/* Price - editable inline */}
      <div className="relative flex-shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
        <Input
          type="text"
          inputMode="numeric"
          value={localPrice}
          onChange={(e) => setLocalPrice(e.target.value)}
          onBlur={handlePriceBlur}
          className="w-20 md:w-24 h-7 text-xs md:text-sm rounded-md border-border/50 text-right pl-7"
        />
      </div>

      {/* Toggle active */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onToggleActive(item.id, !item.isActive)}
            className={cn(
              "p-1 rounded-md transition-colors flex-shrink-0",
              item.isActive
                ? "text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            )}
          >
            {item.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>{item.isActive ? "Pausar" : "Ativar"}</TooltipContent>
      </Tooltip>

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ---- Sortable Group ----
function SortableInlineGroup({
  group,
  children,
}: {
  group: any;
  children: (props: { dragAttributes: any; dragListeners: any }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` });

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
        "border border-border/50 rounded-xl p-3 md:p-4 bg-muted/20",
        isDragging && "shadow-xl ring-2 ring-primary/30"
      )}
    >
      {children({ dragAttributes: attributes, dragListeners: listeners })}
    </div>
  );
}

// ---- Main Component ----
export default function InlineComplementsDropdown({
  productId,
  isOpen,
  onClose,
}: {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [addingGroupName, setAddingGroupName] = useState("");
  const [addingItemToGroup, setAddingItemToGroup] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0,00");

  // Fetch complement groups for this product
  const { data: groups, isLoading, refetch } = trpc.complement.listGroups.useQuery(
    { productId },
    { enabled: isOpen }
  );

  // Mutations
  const createGroupMutation = trpc.complement.createGroup.useMutation({
    onSuccess: () => {
      refetch();
      setAddingGroupName("");
      toast.success("Grupo criado");
    },
    onError: () => toast.error("Erro ao criar grupo"),
  });

  const deleteGroupMutation = trpc.complement.deleteGroup.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Grupo excluído");
    },
    onError: () => toast.error("Erro ao excluir grupo"),
  });

  const createItemMutation = trpc.complement.createItem.useMutation({
    onSuccess: () => {
      refetch();
      setAddingItemToGroup(null);
      setNewItemName("");
      setNewItemPrice("0,00");
      toast.success("Item adicionado");
    },
    onError: () => toast.error("Erro ao adicionar item"),
  });

  const updateItemMutation = trpc.complement.updateItem.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  const deleteItemMutation = trpc.complement.deleteItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Item excluído");
    },
    onError: () => toast.error("Erro ao excluir item"),
  });

  const toggleActiveMutation = trpc.complement.toggleActive.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle item reorder within a group
  const handleItemDragEnd = useCallback(
    (groupId: number, items: any[]) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = Number(String(active.id).replace("item-", ""));
      const overId = Number(String(over.id).replace("item-", ""));

      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      // Update sortOrder for each item
      reordered.forEach((item, idx) => {
        updateItemMutation.mutate({ id: item.id, sortOrder: idx });
      });
    },
    [updateItemMutation]
  );

  const handleCreateGroup = () => {
    if (!addingGroupName.trim()) return;
    createGroupMutation.mutate({
      productId,
      name: addingGroupName.trim(),
      minQuantity: 0,
      maxQuantity: 4,
      isRequired: false,
    });
  };

  const handleCreateItem = (groupId: number) => {
    if (!newItemName.trim()) return;
    const cleaned = newItemPrice.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    const finalPrice = isNaN(num) ? "0" : num.toFixed(2);
    createItemMutation.mutate({
      groupId,
      name: newItemName.trim(),
      price: finalPrice,
      sortOrder: 999,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-muted/30 border-t border-border/30 px-3 md:px-5 py-3 md:py-4 animate-in slide-in-from-top-2 duration-200">
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando complementos...</span>
        </div>
      ) : !groups || groups.length === 0 ? (
        /* Empty state */
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Nenhum complemento configurado</p>
          <div className="flex items-center gap-2 justify-center">
            <Input
              value={addingGroupName}
              onChange={(e) => setAddingGroupName(capitalizeFirst(e.target.value))}
              placeholder="Nome do grupo (ex: Molhos)"
              className="max-w-[240px] h-8 text-sm rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
            <Button
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={handleCreateGroup}
              disabled={!addingGroupName.trim() || createGroupMutation.isPending}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar grupo
            </Button>
          </div>
        </div>
      ) : (
        /* Groups list */
        <div className="space-y-3">
          {groups.map((group: any) => {
            const items = group.items || [];
            return (
              <div
                key={group.id}
                className="border border-border/50 rounded-xl p-3 md:p-4 bg-muted/20"
              >
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 hidden md:block cursor-grab" />
                  <h5 className="font-semibold text-sm flex-1 min-w-0 truncate">{group.name}</h5>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    {/* Tags */}
                    {group.isRequired ? (
                      <span className="text-[10px] md:text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                        Obrigatório
                      </span>
                    ) : (
                      <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        Opcional
                      </span>
                    )}
                    <span className="text-[10px] md:text-xs text-muted-foreground">
                      Mín: {group.minQuantity} / Máx: {group.maxQuantity}
                    </span>
                    {/* Delete group */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => deleteGroupMutation.mutate({ id: group.id })}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir grupo</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Items list with DnD */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleItemDragEnd(group.id, items)}
                >
                  <SortableContext
                    items={items.map((i: any) => `item-${i.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {items.map((item: any) => (
                        <SortableInlineItem
                          key={item.id}
                          item={item}
                          groupId={group.id}
                          onUpdatePrice={(itemId, price) => {
                            updateItemMutation.mutate({ id: itemId, price });
                          }}
                          onToggleActive={(itemId, isActive) => {
                            toggleActiveMutation.mutate({ id: itemId, isActive });
                          }}
                          onDelete={(itemId) => {
                            deleteItemMutation.mutate({ id: itemId });
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add item inline */}
                {addingItemToGroup === group.id ? (
                  <div className="flex items-center gap-2 mt-2 flex-wrap md:flex-nowrap">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                      placeholder="Nome do item"
                      className="flex-1 min-w-[120px] h-7 text-sm rounded-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateItem(group.id);
                        if (e.key === "Escape") {
                          setAddingItemToGroup(null);
                          setNewItemName("");
                          setNewItemPrice("0,00");
                        }
                      }}
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-20 h-7 text-sm rounded-md text-right pl-7"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateItem(group.id);
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-md px-2"
                      onClick={() => handleCreateItem(group.id)}
                      disabled={!newItemName.trim() || createItemMutation.isPending}
                    >
                      {createItemMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Salvar"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs rounded-md px-2"
                      onClick={() => {
                        setAddingItemToGroup(null);
                        setNewItemName("");
                        setNewItemPrice("0,00");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingItemToGroup(group.id);
                      setNewItemName("");
                      setNewItemPrice("0,00");
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-2 py-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar item
                  </button>
                )}
              </div>
            );
          })}

          {/* Add new group */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={addingGroupName}
              onChange={(e) => setAddingGroupName(capitalizeFirst(e.target.value))}
              placeholder="Novo grupo (ex: Molhos)"
              className="max-w-[240px] h-7 text-sm rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg text-xs"
              onClick={handleCreateGroup}
              disabled={!addingGroupName.trim() || createGroupMutation.isPending}
            >
              <Plus className="h-3 w-3 mr-1" />
              Grupo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
