import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Package,
  FileText,
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
import AddGroupSheet from "@/components/AddGroupSheet";
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

// ---- Group Min/Max Fields with local state (prevents mutation on every keystroke) ----
function GroupMinMaxFields({
  group,
  updateGroupMutation,
}: {
  group: any;
  updateGroupMutation: any;
}) {
  const [localMin, setLocalMin] = useState(String(group.minQuantity ?? 0));
  const [localMax, setLocalMax] = useState(String(group.maxQuantity ?? 0));
  const [minError, setMinError] = useState(false);
  const [maxError, setMaxError] = useState(false);

  useEffect(() => {
    setLocalMin(String(group.minQuantity ?? 0));
    setMinError(false);
  }, [group.minQuantity]);

  useEffect(() => {
    setLocalMax(String(group.maxQuantity ?? 0));
    setMaxError(false);
  }, [group.maxQuantity]);

  const commitMin = () => {
    const val = parseInt(localMin, 10);
    const finalVal = isNaN(val) ? 0 : Math.min(val, 999);
    const currentMax = parseInt(localMax, 10) || group.maxQuantity || 0;
    
    if (finalVal > currentMax && currentMax > 0) {
      // Mín maior que Máx: ajusta o Máx automaticamente
      setLocalMin(String(finalVal));
      setLocalMax(String(finalVal));
      setMinError(false);
      setMaxError(false);
      updateGroupMutation.mutate({ id: group.id, minQuantity: finalVal, maxQuantity: finalVal });
      toast.info(`Máximo ajustado para ${finalVal} (não pode ser menor que o mínimo)`);
      return;
    }
    
    setLocalMin(String(finalVal));
    setMinError(false);
    if (finalVal !== group.minQuantity) {
      updateGroupMutation.mutate({ id: group.id, minQuantity: finalVal });
    }
  };

  const commitMax = () => {
    const val = parseInt(localMax, 10);
    const finalVal = isNaN(val) ? 0 : Math.min(val, 999);
    const currentMin = parseInt(localMin, 10) || group.minQuantity || 0;
    
    if (finalVal < currentMin && finalVal > 0) {
      // Máx menor que Mín: mostra erro e corrige
      setMaxError(true);
      const corrected = currentMin;
      setLocalMax(String(corrected));
      toast.error(`Máximo não pode ser menor que o mínimo (${currentMin})`);
      updateGroupMutation.mutate({ id: group.id, maxQuantity: corrected });
      setTimeout(() => setMaxError(false), 1500);
      return;
    }
    
    setLocalMax(String(finalVal));
    setMaxError(false);
    if (finalVal !== group.maxQuantity) {
      updateGroupMutation.mutate({ id: group.id, maxQuantity: finalVal });
    }
  };

  // Verificar se os valores atuais estão inválidos (feedback visual em tempo real)
  const minVal = parseInt(localMin, 10) || 0;
  const maxVal = parseInt(localMax, 10) || 0;
  const isInvalid = minVal > 0 && maxVal > 0 && minVal > maxVal;

  return (
    <div className="flex items-center gap-3 mb-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Mín:</label>
        <Input
          type="text"
          inputMode="numeric"
          value={localMin}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setLocalMin(raw);
            setMinError(false);
          }}
          onBlur={commitMin}
          onKeyDown={(e) => { if (e.key === 'Enter') commitMin(); }}
          onFocus={(e) => { if (e.target.value === '0') setLocalMin(''); }}
          placeholder="0"
          className={cn(
            "w-16 h-7 text-sm text-center rounded-md transition-colors",
            (minError || isInvalid) && "border-red-500 ring-1 ring-red-500/30"
          )}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Máx:</label>
        <Input
          type="text"
          inputMode="numeric"
          value={localMax}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setLocalMax(raw);
            setMaxError(false);
          }}
          onBlur={commitMax}
          onKeyDown={(e) => { if (e.key === 'Enter') commitMax(); }}
          onFocus={(e) => { if (e.target.value === '0') setLocalMax(''); }}
          placeholder="0"
          className={cn(
            "w-16 h-7 text-sm text-center rounded-md transition-colors",
            (maxError || isInvalid) && "border-red-500 ring-1 ring-red-500/30"
          )}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          id={`required-${group.id}`}
          checked={group.minQuantity >= 1}
          onChange={(e) => {
            const newRequired = e.target.checked;
            updateGroupMutation.mutate({
              id: group.id,
              isRequired: newRequired,
              minQuantity: newRequired ? Math.max(group.minQuantity || 0, 1) : 0,
            });
          }}
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
        />
        <label htmlFor={`required-${group.id}`} className="text-xs font-medium cursor-pointer">
          Obrigatório
        </label>
      </div>
    </div>
  );
}

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
  const [description, setDescription] = useState(item.description || "");
  const [badgeText, setBadgeText] = useState(item.badgeText || "");
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">(
    item.availabilityType || "always"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(item.availableDays || []);
  const [hoursConfig, setHoursConfig] = useState<{ day: number; startTime: string; endTime: string }[]>(
    item.availableHours || []
  );

  useEffect(() => {
    setDescription(item.description || "");
    setBadgeText(item.badgeText || "");
    setAvailabilityType(item.availabilityType || "always");
    setSelectedDays(item.availableDays || []);
    setHoursConfig(item.availableHours || []);
  }, [item.description, item.badgeText, item.availabilityType, item.availableDays, item.availableHours]);

  const handleSaveDescription = () => {
    onUpdateItem(item.id, { description: description.trim() || null });
    toast.success(description.trim() ? "Descrição salva" : "Descrição removida");
  };

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
      {/* Description Section */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <h6 className="font-medium text-xs flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Descrição do complemento
        </h6>
        <p className="text-xs text-muted-foreground">
          Texto descritivo exibido abaixo do nome do complemento no menu público (opcional).
        </p>
        <Textarea
          placeholder="Ex: Molho artesanal feito com tomates frescos e manjericão..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          rows={2}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-red-700 hover:bg-red-800 text-white"
            onClick={handleSaveDescription}
            disabled={isUpdating}
          >
            {isUpdating ? "Salvando..." : "Salvar descrição"}
          </Button>
          {item.description && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-600 hover:text-red-700"
              onClick={() => {
                setDescription("");
                onUpdateItem(item.id, { description: null });
                toast.success("Descrição removida");
              }}
              disabled={isUpdating}
            >
              Remover
            </Button>
          )}
        </div>
      </div>

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
  globalTemplatePrice,
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
  globalTemplatePrice?: string | null;
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

  // Currency mask: store as cents for proper formatting
  const priceToCents = (price: string | number) => Math.round(Number(typeof price === 'string' ? parseFloat(price) : price) * 100) || 0;
  const formatPriceBR = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    return `${str.slice(0, -2)},${str.slice(-2)}`;
  };

  const [priceCents, setPriceCents] = useState(item.price ? priceToCents(item.price) : 0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const isFree = item.priceMode === "free";
  const hasFreeContexts = item.freeOnDelivery || item.freeOnPickup || item.freeOnDineIn;
  const freeContextCount = [item.freeOnDelivery, item.freeOnPickup, item.freeOnDineIn].filter(Boolean).length;

  function handleToggleFreeContext(field: 'freeOnDelivery' | 'freeOnPickup' | 'freeOnDineIn', currentValue: boolean) {
    // Se está desmarcando, sempre permite
    if (currentValue) {
      onUpdateItem(item.id, { [field]: false });
      return;
    }
    // Se está marcando, verificar limite de 2
    if (freeContextCount >= 2) {
      toast.error("Máximo de 2 contextos de gratuidade");
      return;
    }
    onUpdateItem(item.id, { [field]: true });
  }

  // Check if this item's price differs from the global template price
  const isCustomized = (() => {
    if (!globalTemplatePrice) return false;
    const currentPrice = parseFloat(String(item.price || "0"));
    const templatePrice = parseFloat(globalTemplatePrice);
    return Math.abs(currentPrice - templatePrice) >= 0.01;
  })();

  useEffect(() => {
    setPriceCents(item.price ? priceToCents(item.price) : 0);
  }, [item.price]);

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(raw, 10) || 0;
    setPriceCents(cents);
  }

  function handlePriceBlur() {
    const newPrice = priceCents / 100;
    const finalPrice = newPrice.toFixed(2);
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
    if (newMode === "normal") {
      // Ao desmarcar grátis, resetar todos os contextos
      onUpdateItem(item.id, { priceMode: newMode, freeOnDelivery: false, freeOnPickup: false, freeOnDineIn: false });
      toast.success("Preço normal restaurado");
    } else {
      onUpdateItem(item.id, { priceMode: newMode });
      toast.success("Marcado como GRÁTIS — selecione os contextos abaixo");
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card rounded-lg border border-border/50",
        isDragging && "shadow-lg ring-2 ring-primary/30",
        !item.isActive && "bg-muted/40"
      )}
    >
      <div
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={(e) => {
          // Não disparar toggle se clicou em botões, inputs, links ou elementos interativos
          const target = e.target as HTMLElement;
          if (target.closest('button, input, a, [role="menuitem"], [data-radix-collection-item], label, .cursor-grab')) return;
          onToggleExpand();
        }}
      >
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
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-1 min-w-0">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-7 text-sm min-w-0"
                style={{ width: `${Math.max(editedName.length * 14 + 32, 120)}px`, maxWidth: '400px' }}
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
                size="sm"
                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0 gap-1"
                onClick={handleSaveName}
              >
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs">Salvar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 flex-shrink-0 gap-1"
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(item.name);
                }}
              >
                <X className="h-3.5 w-3.5" />
                <span className="text-xs">Cancelar</span>
              </Button>
            </div>
          ) : (
            <div className={cn("flex items-center gap-1 min-w-0", !item.isActive && "opacity-50")}>
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
                className="hidden md:hidden md:group-hover:inline text-red-600 hover:text-red-700 text-[10px] font-medium flex-shrink-0 hover:underline"
              >
                Editar
              </button>
              {item.description && (
                <>
                  <span className="text-gray-300 text-sm flex-shrink-0">|</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
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

              {item.exclusiveProductId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] px-1 py-0 h-4 flex-shrink-0 cursor-help">
                        <Package className="h-2.5 w-2.5 mr-0.5" />
                        Exclusivo
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Este item só aparece neste produto</p>
                    <p className="text-xs text-muted-foreground">Não será exibido nos outros produtos que usam este grupo</p>
                  </TooltipContent>
                </Tooltip>
              )}

            </div>
          )}
        </div>

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
              )} style={{height: '28px'}}
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

        {/* Price - editable inline with currency mask (hidden if free) */}
        {!isFree && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "relative flex-shrink-0 flex items-center gap-0",
                !item.isActive && "opacity-50"
              )}>
                {/* Personalizado indicator wrapping the price field */}
                {isCustomized && (
                  <div className="flex items-center gap-0.5 bg-amber-100 border border-amber-300 rounded-lg pl-1.5 pr-0 py-0 h-7">
                    <Pencil className="h-3 w-3 text-amber-600 flex-shrink-0" />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatPriceBR(priceCents)}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        onFocus={(e) => { requestAnimationFrame(() => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-[90px] h-[26px] pl-7 pr-2 text-sm text-right font-semibold rounded-md border-0 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                      />
                    </div>
                  </div>
                )}
                {/* Normal price field (no customization) */}
                {!isCustomized && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatPriceBR(priceCents)}
                      onChange={handlePriceChange}
                      onBlur={handlePriceBlur}
                      onFocus={(e) => { requestAnimationFrame(() => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-[90px] h-7 pl-7 pr-2 text-sm text-right font-semibold rounded-lg border border-border/60 bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-border/50 focus:border-border transition-all"
                    />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {isCustomized && (
              <TooltipContent>
                <p className="text-xs">Preço diferente do template global</p>
                <p className="text-xs text-muted-foreground">Template: R$ {parseFloat(globalTemplatePrice!).toFixed(2).replace('.', ',')}</p>
              </TooltipContent>
            )}
          </Tooltip>
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

      {/* Checkboxes de gratuidade por contexto */}
      {isFree && (
        <div className="px-3 pb-2 animate-in slide-in-from-top-1 duration-150">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Aplicar gratuidade para:</span>
              {freeContextCount > 0 && (
                <span className="text-[10px] text-green-600 dark:text-green-500 ml-auto">{freeContextCount}/2</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnDelivery}
                  onChange={() => handleToggleFreeContext('freeOnDelivery', !!item.freeOnDelivery)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Delivery</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnPickup}
                  onChange={() => handleToggleFreeContext('freeOnPickup', !!item.freeOnPickup)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Retirada</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!item.freeOnDineIn}
                  onChange={() => handleToggleFreeContext('freeOnDineIn', !!item.freeOnDineIn)}
                  className="h-3.5 w-3.5 rounded border-green-300 accent-green-600 cursor-pointer"
                />
                <span className="text-xs text-green-700 dark:text-green-400">Consumo no local</span>
              </label>
            </div>
            {freeContextCount === 0 && (
              <p className="text-[10px] text-green-600/70 dark:text-green-500/70">Nenhum contexto selecionado — o complemento será cobrado normalmente em todos os contextos.</p>
            )}
          </div>
        </div>
      )}

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
  establishmentId,
  isOpen,
  onClose,
}: {
  productId: number;
  establishmentId?: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [addingGroupName, setAddingGroupName] = useState("");
  const [addingItemToGroup, setAddingItemToGroup] = useState<number | null>(null);
  const [addingExclusiveToGroup, setAddingExclusiveToGroup] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPriceCents, setNewItemPriceCents] = useState(0);
  const formatNewItemPrice = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    return `${str.slice(0, -2)},${str.slice(-2)}`;
  };
  const handleNewItemPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const cents = parseInt(raw, 10) || 0;
    setNewItemPriceCents(cents);
  };
  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    requestAnimationFrame(() => {
      const len = e.target.value.length;
      e.target.setSelectionRange(len, len);
    });
  };
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [addGroupSheetOpen, setAddGroupSheetOpen] = useState(false);

  // Fetch complement groups for this product
  const { data: groups, isLoading, refetch } = trpc.complement.listGroups.useQuery(
    { productId },
    { enabled: isOpen }
  );

  // Fetch global template prices for "Personalizado" badge comparison
  const { data: globalTemplatePrices } = trpc.complement.getGlobalTemplatePrices.useQuery(
    { establishmentId: establishmentId || 0 },
    { enabled: isOpen && !!establishmentId }
  );

  // Mutations
  const createGroupMutation = trpc.complement.createGroup.useMutation({
    onSuccess: () => {
      refetch();
      // Invalidar lista de produtos para atualizar o badge de contagem de complementos
      utils.product.list.invalidate();
      setAddingGroupName("");
      toast.success("Grupo criado");
    },
    onError: () => toast.error("Erro ao criar grupo"),
  });

  const deleteGroupMutation = trpc.complement.deleteGroup.useMutation({
    onSuccess: () => {
      refetch();
      // Invalidar lista de produtos para atualizar o badge de contagem de complementos
      utils.product.list.invalidate();
      toast.success("Grupo excluído");
    },
    onError: () => toast.error("Erro ao excluir grupo"),
  });

  const createItemMutation = trpc.complement.createItem.useMutation({
    onSuccess: () => {
      refetch();
      // Invalidar lista de produtos para atualizar o badge de contagem de complementos
      utils.product.list.invalidate();
      setAddingItemToGroup(null);
      setNewItemName("");
      setNewItemPriceCents(0);
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
      // Invalidar lista de produtos para atualizar o badge de contagem de complementos
      utils.product.list.invalidate();
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

  const addExclusiveItemMutation = trpc.complement.addExclusiveItem.useMutation({
    onSuccess: () => {
      refetch();
      utils.product.list.invalidate();
      utils.complement.listAllGroups.invalidate();
      setNewItemName("");
      setNewItemPriceCents(0);
      toast.success("Item exclusivo adicionado");
    },
    onError: (error: { message: string }) => toast.error("Erro: " + error.message),
  });

  const removeExclusiveItemMutation = trpc.complement.removeExclusiveItem.useMutation({
    onSuccess: () => {
      refetch();
      utils.product.list.invalidate();
      utils.complement.listAllGroups.invalidate();
      toast.success("Item exclusivo removido");
    },
    onError: () => toast.error("Erro ao remover item exclusivo"),
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

      // Optimistically update the cache so the UI reflects the new order immediately
      utils.complement.listGroups.setData({ productId }, (prev: any) => {
        if (!prev) return prev;
        return prev.map((g: any) => {
          if (g.id !== groupId) return g;
          const updatedItems = reordered.map((item: any, idx: number) => ({
            ...item,
            sortOrder: idx,
          }));
          return { ...g, items: updatedItems };
        });
      });

      // Then persist to server
      reordered.forEach((item, idx) => {
        updateItemMutation.mutate({ id: item.id, sortOrder: idx });
      });
    },
    [updateItemMutation, utils, productId]
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
    const finalPrice = (newItemPriceCents / 100).toFixed(2);

    createItemMutation.mutate({
      groupId,
      name: newItemName.trim(),
      price: finalPrice,
      sortOrder: 999,
    });
  };

  const handleCreateExclusiveItem = (groupName: string) => {
    if (!newItemName.trim() || !establishmentId) return;
    const finalPrice = (newItemPriceCents / 100).toFixed(2);
    addExclusiveItemMutation.mutate({
      establishmentId,
      productId,
      groupName,
      name: newItemName.trim(),
      price: finalPrice,
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
        <div className="flex flex-col items-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Nenhum complemento configurado</p>
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setAddGroupSheetOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar grupo
          </Button>
          <AddGroupSheet
            productId={productId}
            establishmentId={establishmentId || 0}
            open={addGroupSheetOpen}
            onOpenChange={setAddGroupSheetOpen}
            onGroupCreated={() => { refetch(); utils.product.list.invalidate(); }}
          />
        </div>
      ) : (
        /* Groups list */
        <div className="space-y-3">
          {groups.map((group: any) => {
            const items = group.items || [];
            return (
              <div
                key={group.id}
                className={`border border-border/50 rounded-xl p-3 md:p-4 bg-muted/20 ${group.isActive === false ? 'opacity-50' : ''}`}
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
                    {group.isActive === false && (
                      <span className="text-[10px] md:text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                        Pausado
                      </span>
                    )}
                    {(group.isRequired || group.minQuantity >= 1) ? (
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
                <GroupMinMaxFields
                  group={group}
                  updateGroupMutation={updateGroupMutation}
                />

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
                          globalTemplatePrice={
                            globalTemplatePrices
                              ? globalTemplatePrices[
                                  `${group.name.toLowerCase().trim()}::${item.name.toLowerCase().trim()}`
                                ] ?? null
                              : null
                          }
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
                          setNewItemPriceCents(0);
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
                        value={formatNewItemPrice(newItemPriceCents)}
                        onChange={handleNewItemPriceChange}
                        onFocus={handlePriceFocus}
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
                        setNewItemPriceCents(0);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : addingExclusiveToGroup === group.id ? (
                  <div className="flex items-center gap-2 mt-2 flex-wrap md:flex-nowrap">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Package className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-[10px] text-purple-600 font-medium">Exclusivo</span>
                    </div>
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                      placeholder="Nome do item exclusivo"
                      className="flex-1 min-w-[120px] h-7 text-sm rounded-md border-purple-300 focus-visible:ring-purple-300"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateExclusiveItem(group.name);
                        if (e.key === "Escape") {
                          setAddingExclusiveToGroup(null);
                          setNewItemName("");
                          setNewItemPriceCents(0);
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
                        value={formatNewItemPrice(newItemPriceCents)}
                        onChange={handleNewItemPriceChange}
                        onFocus={handlePriceFocus}
                        className="w-20 h-7 text-sm rounded-md text-right pl-7 border-purple-300 focus-visible:ring-purple-300"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateExclusiveItem(group.name);
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-md px-2 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => handleCreateExclusiveItem(group.name)}
                      disabled={!newItemName.trim() || addExclusiveItemMutation.isPending}
                    >
                      {addExclusiveItemMutation.isPending ? (
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
                        setAddingExclusiveToGroup(null);
                        setNewItemName("");
                        setNewItemPriceCents(0);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingItemToGroup(group.id);
                        setAddingExclusiveToGroup(null);
                        setNewItemName("");
                        setNewItemPriceCents(0);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 py-2 px-4 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5 flex-1 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar item
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingExclusiveToGroup(group.id);
                            setAddingItemToGroup(null);
                            setNewItemName("");
                            setNewItemPriceCents(0);
                          }}
                          className="flex items-center justify-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 py-2 px-4 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 flex-1 transition-all"
                        >
                          <Package className="h-4 w-4" />
                          Adicionar exclusivo
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Adiciona um item que só aparecerá neste produto</p>
                        <p className="text-xs text-muted-foreground">Não será exibido nos outros produtos que usam este grupo</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new group */}
          <div className="flex justify-center pt-2">
            <Button
              size="sm"
              className="h-8 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-4"
              onClick={() => setAddGroupSheetOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar grupo
            </Button>
            <AddGroupSheet
              productId={productId}
              establishmentId={establishmentId || 0}
              open={addGroupSheetOpen}
              onOpenChange={setAddGroupSheetOpen}
              onGroupCreated={() => { refetch(); utils.product.list.invalidate(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
