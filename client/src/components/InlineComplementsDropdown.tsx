import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Gift,
  Clock,
  Pencil,
  Check,
  MoreVertical,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useCallback, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

// ---- Expanded Item Details (Badge + Availability) ----
function ItemExpandedDetails({
  item,
  onUpdateItem,
  isUpdating,
}: {
  item: any;
  onUpdateItem: (id: number, data: any) => void;
  isUpdating: boolean;
}) {
  const [badgeText, setBadgeText] = useState(item.badgeText || "");
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">(
    item.availabilityType || "always"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(item.availableDays || []);
  const [hoursConfig, setHoursConfig] = useState<{ day: number; startTime: string; endTime: string }[]>(
    item.availableHours || []
  );

  useEffect(() => {
    setBadgeText(item.badgeText || "");
    setAvailabilityType(item.availabilityType || "always");
    setSelectedDays(item.availableDays || []);
    setHoursConfig(item.availableHours || []);
  }, [item.badgeText, item.availabilityType, item.availableDays, item.availableHours]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const updateHoursForDay = (day: number, startTime: string, endTime: string) => {
    setHoursConfig((prev) => {
      const filtered = prev.filter((h) => h.day !== day);
      return [...filtered, { day, startTime, endTime }].sort((a, b) => a.day - b.day);
    });
  };

  const handleSaveBadge = () => {
    onUpdateItem(item.id, { badgeText: badgeText.trim() || null });
    toast.success(badgeText.trim() ? `Badge "${badgeText.trim()}" salvo` : "Badge removido");
  };

  const handleSaveAvailability = () => {
    onUpdateItem(item.id, {
      availabilityType,
      availableDays: availabilityType === "scheduled" ? selectedDays : null,
      availableHours: availabilityType === "scheduled" ? hoursConfig : null,
    });
    toast.success("Disponibilidade atualizada");
  };

  return (
    <div className="mt-2 border-t border-border/30 pt-3 space-y-4 animate-in slide-in-from-top-1 duration-150">
      {/* Badge Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <span className="text-red-500 text-sm">&#9679;</span>
          Badge / Destaque
        </h6>
        <p className="text-xs text-muted-foreground">
          Texto de destaque ao lado do complemento no menu público (ex: "Novo", "Promoção").
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Ex: Novo, Novidade, Promoção..."
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            className="max-w-[200px] h-8 text-xs"
            maxLength={50}
          />
          <Button
            size="sm"
            className="h-8 text-xs bg-red-700 hover:bg-red-800 text-white"
            onClick={handleSaveBadge}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar badge"}
          </Button>
          {item.badgeText && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-600 hover:text-red-700"
              onClick={() => {
                setBadgeText("");
                onUpdateItem(item.id, { badgeText: null });
                toast.success("Badge removido");
              }}
              disabled={isUpdating}
            >
              Remover
            </Button>
          )}
        </div>
        {badgeText.trim() && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Preview:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-600 border-red-200 animate-pulse text-[10px]">
              {badgeText.trim()}
            </Badge>
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-3">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Disponibilidade do complemento
        </h6>

        {/* Radio buttons */}
        <div className="space-y-2">
          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name={`avail-${item.id}`}
              checked={availabilityType === "always"}
              onChange={() => setAvailabilityType("always")}
              className="mt-0.5 accent-red-700"
            />
            <div>
              <span className="text-xs font-medium">Sempre disponível</span>
              <p className="text-[10px] text-muted-foreground">
                O item ficará disponível sempre que o estabelecimento estiver aberto
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name={`avail-${item.id}`}
              checked={availabilityType === "scheduled"}
              onChange={() => setAvailabilityType("scheduled")}
              className="mt-0.5 accent-red-700"
            />
            <div>
              <span className="text-xs font-medium">Disponível em dias e horários específicos</span>
              <p className="text-[10px] text-muted-foreground">
                Escolha quando o item aparece nos seus canais de venda
              </p>
            </div>
          </label>
        </div>

        {/* Day/Hour selector */}
        {availabilityType === "scheduled" && (
          <div className="space-y-2 pl-2">
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                    selectedDays.includes(day.value)
                      ? "bg-red-700 text-white border-red-700"
                      : "bg-background text-muted-foreground border-border hover:border-red-300"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {selectedDays.length > 0 && (
              <div className="space-y-1.5">
                {selectedDays.map((day) => {
                  const dayLabel = DAYS_OF_WEEK.find((d) => d.value === day)?.label;
                  const existing = hoursConfig.find((h) => h.day === day);
                  return (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <span className="w-8 font-medium text-muted-foreground">{dayLabel}</span>
                      <Input
                        type="time"
                        value={existing?.startTime || "00:00"}
                        onChange={(e) =>
                          updateHoursForDay(day, e.target.value, existing?.endTime || "23:59")
                        }
                        className="w-24 h-7 text-xs"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={existing?.endTime || "23:59"}
                        onChange={(e) =>
                          updateHoursForDay(day, existing?.startTime || "00:00", e.target.value)
                        }
                        className="w-24 h-7 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-8 text-xs bg-red-700 hover:bg-red-800 text-white"
            onClick={handleSaveAvailability}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar disponibilidade"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Sortable Item inside a group ----
function SortableInlineItem({
  item,
  groupId,
  onUpdatePrice,
  onToggleActive,
  onDelete,
  onUpdateItem,
  isExpanded,
  onToggleExpand,
  isUpdating,
}: {
  item: any;
  groupId: number;
  onUpdatePrice: (itemId: number, price: string) => void;
  onToggleActive: (itemId: number, isActive: boolean) => void;
  onDelete: (itemId: number) => void;
  onUpdateItem: (id: number, data: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isUpdating: boolean;
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const isFree = item.priceMode === "free";

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

  function handleSaveName() {
    if (editedName.trim() && editedName.trim() !== item.name) {
      onUpdateItem(item.id, { name: editedName.trim() });
      toast.success("Nome atualizado");
    }
    setIsEditingName(false);
  }

  function handleToggleFree() {
    const newMode = isFree ? "normal" : "free";
    onUpdateItem(item.id, { priceMode: newMode });
    toast.success(newMode === "free" ? "Marcado como GRÁTIS" : "Preço normal restaurado");
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card rounded-lg border border-border/50",
        isDragging && "shadow-lg ring-2 ring-primary/30",
        !item.isActive && "bg-muted/40"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none flex-shrink-0",
            !item.isActive && "opacity-50"
          )}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </button>

        {/* Image indicator */}
        {item.imageUrl && (
          <div className={cn("h-7 w-7 rounded-md overflow-hidden flex-shrink-0", !item.isActive && "opacity-50 grayscale")}>
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Name - editable */}
        {isEditingName ? (
          <div className="flex items-center gap-1 min-w-0">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="h-7 text-sm w-40 md:w-56"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setIsEditingName(false);
                  setEditedName(item.name);
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
              onClick={handleSaveName}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 flex-shrink-0"
              onClick={() => {
                setIsEditingName(false);
                setEditedName(item.name);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className={cn("flex items-center gap-1 flex-1 min-w-0", !item.isActive && "opacity-50")}>
            <span
              className={cn(
                "text-sm truncate",
                !item.isActive && "line-through text-muted-foreground"
              )}
            >
              {item.name}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="hidden md:inline text-red-600 hover:text-red-700 text-[10px] font-medium flex-shrink-0 hover:underline"
            >
              Editar
            </button>
            {/* Badges */}
            {item.badgeText && (
              <Badge variant="secondary" className="bg-red-100 text-red-600 border-red-200 animate-pulse text-[9px] px-1 py-0 h-4 flex-shrink-0">
                {item.badgeText}
              </Badge>
            )}

            {item.availabilityType === "scheduled" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                Horário
              </Badge>
            )}
          </div>
        )}

        {/* Price toggle: Normal / Grátis - desktop only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleToggleFree}
              className={cn(
                "hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors flex-shrink-0",
                isFree
                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                !item.isActive && "opacity-50"
              )}
            >
              {isFree ? (
                <>
                  <Gift className="h-3 w-3" />
                  Grátis
                </>
              ) : (
                <>
                  <span className="text-xs">$</span>
                  Normal
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isFree ? "Clique para preço normal" : "Clique para marcar como GRÁTIS"}</TooltipContent>
        </Tooltip>

        {/* Mobile: show free badge inline (no toggle, just indicator) */}
        {isFree && (
          <span className={cn("flex md:hidden items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-green-100 text-green-700 border-green-300 flex-shrink-0", !item.isActive && "opacity-50")}>
            <Gift className="h-3 w-3" />
            Grátis
          </span>
        )}

        {/* Price - editable inline (hidden if free) */}
        {!isFree && (
          <div className={cn("relative flex-shrink-0", !item.isActive && "opacity-50")}>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
              R$
            </span>
            <Input
              type="text"
              inputMode="numeric"
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              onBlur={handlePriceBlur}
              className="w-20 md:w-24 h-7 text-xs md:text-sm rounded-md border-border/50 text-right pl-7" style={{marginRight: '-1px', marginLeft: '-6px', width: '69px'}}
            />
          </div>
        )}

        {/* Desktop: individual action buttons */}
        <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
          {/* Toggle active - NOT affected by opacity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToggleActive(item.id, !item.isActive)}
                className={cn(
                  "p-1 rounded-md transition-colors",
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
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                  !item.isActive && "opacity-50"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>

          {/* Expand/Collapse for badge + availability */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleExpand}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  isExpanded
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                  !item.isActive && "opacity-50"
                )}
              >
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Badge e disponibilidade</TooltipContent>
          </Tooltip>
        </div>

        {/* Mobile: 3-dot dropdown menu */}
        <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
          {/* Expand/Collapse for badge + availability */}
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              "p-1 rounded-md transition-colors",
              isExpanded
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5",
              !item.isActive && "opacity-50"
            )}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                  !item.isActive && "opacity-50"
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFree}>
                {isFree ? (
                  <>
                    <span className="text-xs mr-2 font-bold">$</span>
                    Preço normal
                  </>
                ) : (
                  <>
                    <Gift className="h-3.5 w-3.5 mr-2" />
                    Marcar grátis
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(item.id, !item.isActive)}>
                {item.isActive ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-2 pb-2">
          <ItemExpandedDetails
            item={item}
            onUpdateItem={onUpdateItem}
            isUpdating={isUpdating}
          />
        </div>
      )}
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
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editedGroupName, setEditedGroupName] = useState("");

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

  const updateGroupMutation = trpc.complement.updateGroup.useMutation({
    onSuccess: () => {
      refetch();
      setEditingGroupId(null);
    },
    onError: () => toast.error("Erro ao atualizar grupo"),
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

  const handleSaveGroupName = (groupId: number) => {
    if (editedGroupName.trim()) {
      updateGroupMutation.mutate({ id: groupId, name: editedGroupName.trim() });
      toast.success("Nome do grupo atualizado");
    }
    setEditingGroupId(null);
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 hidden md:block cursor-grab" />

                  {/* Group name - editable */}
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <Input
                        value={editedGroupName}
                        onChange={(e) => setEditedGroupName(e.target.value)}
                        className="h-7 text-sm font-semibold flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveGroupName(group.id);
                          if (e.key === "Escape") setEditingGroupId(null);
                        }}
                        onBlur={() => handleSaveGroupName(group.id)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <h5 className="font-semibold text-sm truncate">{group.name}</h5>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditedGroupName(group.name);
                        }}
                        className="text-red-600 hover:text-red-700 text-[10px] font-medium flex-shrink-0 hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  )}

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

                {/* Group settings: Mín, Máx, Obrigatório */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Mín:</label>
                    <Input
                      type="number"
                      min={0}
                      value={group.minQuantity ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateGroupMutation.mutate({ id: group.id, minQuantity: val });
                      }}
                      className="w-16 h-7 text-sm text-center rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Máx:</label>
                    <Input
                      type="number"
                      min={0}
                      value={group.maxQuantity ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateGroupMutation.mutate({ id: group.id, maxQuantity: val });
                      }}
                      className="w-16 h-7 text-sm text-center rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`required-${group.id}`}
                      checked={!!group.isRequired}
                      onChange={(e) => {
                        updateGroupMutation.mutate({ id: group.id, isRequired: e.target.checked });
                      }}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <label htmlFor={`required-${group.id}`} className="text-xs font-medium cursor-pointer">
                      Obrigatório
                    </label>
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
                          onUpdateItem={(id, data) => {
                            updateItemMutation.mutate({ id, ...data });
                          }}
                          isExpanded={expandedItemId === item.id}
                          onToggleExpand={() =>
                            setExpandedItemId((prev) => (prev === item.id ? null : item.id))
                          }
                          isUpdating={updateItemMutation.isPending}
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
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        R$
                      </span>
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
