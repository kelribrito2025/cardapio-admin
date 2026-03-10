import { Minus, Plus, Check } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Types
export interface ComplementItem {
  id: number;
  name: string;
  price: string;
  priceMode?: string;
  priceDineIn?: string | null;
  priceDelivery?: string | null;
  imageUrl?: string | null;
  description?: string;
  badgeText?: string;
}

export interface ComplementGroup {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired?: boolean;
  items: ComplementItem[];
}

interface ComplementGroupsProps {
  groups: ComplementGroup[];
  selectedComplements: Map<number, Map<number, number>>;
  onSelectedComplementsChange: (updater: (prev: Map<number, Map<number, number>>) => Map<number, Map<number, number>>) => void;
  getPrice: (item: ComplementItem) => number;
  formatPrice: (value: number) => string;
  onComplementImageChange?: (url: string | null) => void;
  selectedComplementImage?: string | null;
  /** Prefix for element IDs (for scroll targeting). Default: "complement" */
  idPrefix?: string;
  /** Whether to hide groups after the first incomplete required group. Default: false */
  hideBlockedGroups?: boolean;
}

/** Animated checkbox/radio indicator */
function SelectionIndicator({ isSelected, isRadio }: { isSelected: boolean; isRadio: boolean }) {
  return (
    <div
      className={`w-5 h-5 ${isRadio ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-out ${
        isSelected
          ? "border-red-500 bg-red-500 scale-110"
          : "border-gray-300 bg-white scale-100"
      }`}
    >
      <svg
        className={`w-3 h-3 text-white transition-all duration-200 ease-out ${
          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Animated quantity controls with slide-in effect */
function QuantityControls({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      data-qty-controls
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-1 transition-all duration-250 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-0 translate-x-2 scale-95"
      }`}
    >
      <button
        type="button"
        onClick={onDecrement}
        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-all duration-150 active:scale-90"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className="w-6 text-center text-sm font-medium text-gray-900 transition-all duration-150"
        key={quantity}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-all duration-150 active:scale-90"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Animated "Completo" badge */
function CompleteBadge() {
  return (
    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-in fade-in slide-in-from-right-2 duration-300">
      Completo
    </span>
  );
}

/** Animated checkmark icon for group completion */
function CompleteCheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-red-500 animate-in fade-in zoom-in duration-300"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ComplementGroups({
  groups,
  selectedComplements,
  onSelectedComplementsChange,
  getPrice,
  formatPrice,
  onComplementImageChange,
  selectedComplementImage,
  idPrefix = "complement",
  hideBlockedGroups = false,
}: ComplementGroupsProps) {
  // Find first incomplete required group index
  let firstIncompleteRequiredIdx = -1;
  if (hideBlockedGroups) {
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const sel = selectedComplements.get(g.id) || new Map<number, number>();
      const total = Array.from(sel.values()).reduce((a, b) => a + b, 0);
      if (g.minQuantity >= 1 && total < g.minQuantity) {
        firstIncompleteRequiredIdx = i;
        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const selectedInGroup = selectedComplements.get(group.id) || new Map<number, number>();
        const isRadio = group.maxQuantity === 1;
        const totalSelectedInGroup = Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0);
        const isGroupComplete = totalSelectedInGroup >= group.maxQuantity;

        // Hide blocked groups
        if (hideBlockedGroups && firstIncompleteRequiredIdx !== -1 && groupIndex > firstIncompleteRequiredIdx) {
          return null;
        }

        return (
          <div
            key={group.id}
            id={`${idPrefix}-group-${group.id}`}
            className={`transition-all duration-300 ease-out rounded-xl border ${
              isGroupComplete ? "border-red-200 shadow-sm shadow-red-100" : "border-gray-200"
            }`}
          >
            {/* Header do Grupo - Sticky */}
            <div
              className={`px-4 py-3 border-b transition-all duration-300 ease-out sticky z-20 shadow-sm rounded-t-xl ${
                isGroupComplete
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              style={{ paddingTop: "8px", top: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-semibold transition-colors duration-300 ${
                      isGroupComplete ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {group.name}
                  </h4>
                  {isGroupComplete && <CompleteCheckIcon />}
                </div>
                <div className="flex items-center gap-2">
                  {isGroupComplete && <CompleteBadge />}
                  {!isGroupComplete &&
                    (group.isRequired || group.minQuantity >= 1) && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium transition-opacity duration-200">
                        Obrigatório
                      </span>
                    )}
                  {!isGroupComplete &&
                    group.minQuantity === 0 &&
                    !group.isRequired && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium transition-opacity duration-200">
                        Opcional
                      </span>
                    )}
                </div>
              </div>
              <p
                className={`text-xs mt-0.5 transition-colors duration-300 ${
                  isGroupComplete ? "text-red-500" : "text-gray-500"
                }`}
              >
                {(() => {
                  const min = group.minQuantity;
                  const max = group.maxQuantity;
                  if (min === 1 && max === 1) return "Escolha 1 opção";
                  if (min === 1 && max > 1) return `Escolha até ${max} opções`;
                  if (min === max) return `Escolha ${min} opções`;
                  if (min > 1 && max > min)
                    return `Escolha de ${min} a ${max} opções`;
                  if (min === 0 && max === 1) return "Escolha até 1 opção";
                  if (min === 0 && max > 1)
                    return `Escolha até ${max} opções`;
                  return "";
                })()}
              </p>
            </div>

            {/* Itens do Grupo */}
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => {
                const itemQuantity = selectedInGroup.get(item.id) || 0;
                const isSelected = itemQuantity > 0;
                const itemImageUrl = item.imageUrl;
                const displayPrice = getPrice(item);

                // Função para incrementar
                const handleIncrement = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );
                    const currentQty = currentGroupMap.get(item.id) || 0;
                    const totalInGroup = Array.from(
                      currentGroupMap.values()
                    ).reduce((a, b) => a + b, 0);
                    if (totalInGroup < group.maxQuantity) {
                      currentGroupMap.set(item.id, currentQty + 1);
                      newMap.set(group.id, currentGroupMap);
                      if (itemImageUrl) onComplementImageChange?.(itemImageUrl);
                      // Auto-scroll para próximo grupo se atingiu o máximo
                      const newTotal = totalInGroup + 1;
                      if (newTotal >= group.maxQuantity) {
                        const currentIndex = groups.findIndex(
                          (g) => g.id === group.id
                        );
                        if (currentIndex < groups.length - 1) {
                          const nextGroup = groups[currentIndex + 1];
                          setTimeout(() => {
                            document
                              .getElementById(
                                `${idPrefix}-group-${nextGroup.id}`
                              )
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 300);
                        } else {
                          setTimeout(() => {
                            document
                              .querySelector("[data-observation-field]")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 300);
                        }
                      }
                    }
                    return newMap;
                  });
                };

                // Função para decrementar
                const handleDecrement = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );
                    const currentQty = currentGroupMap.get(item.id) || 0;
                    if (currentQty > 1) {
                      currentGroupMap.set(item.id, currentQty - 1);
                    } else {
                      currentGroupMap.delete(item.id);
                      if (
                        itemImageUrl &&
                        selectedComplementImage === itemImageUrl
                      ) {
                        onComplementImageChange?.(null);
                      }
                    }
                    newMap.set(group.id, currentGroupMap);
                    return newMap;
                  });
                };

                // Função para toggle (checkbox/radio)
                const handleToggle = () => {
                  onSelectedComplementsChange((prev) => {
                    const newMap = new Map(prev);
                    const currentGroupMap = new Map(
                      prev.get(group.id) || []
                    );

                    if (isRadio) {
                      const newGroupMap = new Map<number, number>();
                      newGroupMap.set(item.id, 1);
                      newMap.set(group.id, newGroupMap);
                      if (itemImageUrl) {
                        onComplementImageChange?.(itemImageUrl);
                      }
                      // Auto-scroll para próximo grupo
                      const currentIndex = groups.findIndex(
                        (g) => g.id === group.id
                      );
                      if (currentIndex < groups.length - 1) {
                        const nextGroup = groups[currentIndex + 1];
                        setTimeout(() => {
                          document
                            .getElementById(
                              `${idPrefix}-group-${nextGroup.id}`
                            )
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 300);
                      } else {
                        setTimeout(() => {
                          document
                            .querySelector("[data-observation-field]")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 300);
                      }
                    } else {
                      if (isSelected) {
                        currentGroupMap.delete(item.id);
                        if (
                          itemImageUrl &&
                          selectedComplementImage === itemImageUrl
                        ) {
                          onComplementImageChange?.(null);
                        }
                      } else {
                        const totalInGroup = Array.from(
                          currentGroupMap.values()
                        ).reduce((a, b) => a + b, 0);
                        if (
                          group.maxQuantity === 0 ||
                          totalInGroup < group.maxQuantity
                        ) {
                          currentGroupMap.set(item.id, 1);
                          if (itemImageUrl) {
                            onComplementImageChange?.(itemImageUrl);
                          }
                          // Auto-scroll para próximo grupo se atingiu o máximo
                          const newTotal = totalInGroup + 1;
                          if (newTotal >= group.maxQuantity) {
                            const currentIndex = groups.findIndex(
                              (g) => g.id === group.id
                            );
                            if (currentIndex < groups.length - 1) {
                              const nextGroup = groups[currentIndex + 1];
                              setTimeout(() => {
                                document
                                  .getElementById(
                                    `${idPrefix}-group-${nextGroup.id}`
                                  )
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                              }, 300);
                            } else {
                              setTimeout(() => {
                                document
                                  .querySelector("[data-observation-field]")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                              }, 300);
                            }
                          }
                        }
                      }
                      newMap.set(group.id, currentGroupMap);
                    }
                    return newMap;
                  });
                };

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest("[data-qty-controls]")
                      )
                        return;
                      handleToggle();
                    }}
                    className={`flex flex-col px-4 py-3 cursor-pointer transition-all duration-200 ease-out ${
                      isSelected
                        ? "bg-red-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Linha 1: Checkbox + Nome + Badge + (Botões +/- se sem descrição) + Preço */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <SelectionIndicator isSelected={isSelected} isRadio={isRadio} />
                        <span className={`text-sm transition-colors duration-200 flex-1 min-w-0 ${
                          isSelected ? "text-gray-900 font-medium" : "text-gray-900"
                        }`}>
                          {item.name}
                        </span>
                        {item.badgeText && (
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white animate-pulse leading-none flex-shrink-0"
                            style={{
                              width: "69px",
                              height: "19px",
                              borderRadius: "8px",
                            }}
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        {/* Botões +/- na linha 1 APENAS quando NÃO tem descrição */}
                        {isSelected && !isRadio && !item.description && (
                          <QuantityControls
                            quantity={itemQuantity}
                            onIncrement={handleIncrement}
                            onDecrement={handleDecrement}
                          />
                        )}
                        {/* Preço */}
                        {(() => {
                          if (displayPrice > 0) {
                            const totalItemPrice =
                              displayPrice * (itemQuantity || 1);
                            return (
                              <span className={`text-sm min-w-[70px] text-right transition-all duration-200 ${
                                isSelected ? "text-red-600 font-medium" : "text-gray-600"
                              }`}>
                                {isSelected && itemQuantity > 1
                                  ? `+ ${formatPrice(totalItemPrice)}`
                                  : `+ ${formatPrice(displayPrice)}`}
                              </span>
                            );
                          } else if (
                            displayPrice === 0 &&
                            item.priceMode === "free"
                          ) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 transition-all duration-200">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Grátis
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Linha 2: Descrição + Botões +/- à direita (SÓ quando tem descrição) */}
                    {item.description && (
                      <div className="flex items-end justify-between ml-8 mt-1">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-500 leading-tight">
                            {item.description}
                          </span>
                        </div>
                        {isSelected && !isRadio && (
                          <QuantityControls
                            quantity={itemQuantity}
                            onIncrement={handleIncrement}
                            onDecrement={handleDecrement}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper: check if all required complement groups are filled
 */
export function areRequiredGroupsFilled(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>
): boolean {
  return groups.every((group) => {
    if (group.minQuantity === 0 && !group.isRequired) return true;
    const groupSelections = selectedComplements.get(group.id);
    if (!groupSelections) return group.minQuantity === 0;
    const totalQty = Array.from(groupSelections.values()).reduce(
      (sum, q) => sum + q,
      0
    );
    return totalQty >= group.minQuantity;
  });
}

/**
 * Helper: calculate total price of selected complements
 */
export function calculateComplementsTotal(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>,
  getPrice: (item: ComplementItem) => number
): number {
  let total = 0;
  selectedComplements.forEach((groupMap, groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    groupMap.forEach((qty, itemId) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item) {
        total += getPrice(item) * qty;
      }
    });
  });
  return total;
}

/**
 * Helper: collect selected complements as flat array
 */
export function collectSelectedComplements(
  groups: ComplementGroup[],
  selectedComplements: Map<number, Map<number, number>>,
  getPrice: (item: ComplementItem) => number
): Array<{ id: number; name: string; price: string; quantity: number }> {
  const result: Array<{ id: number; name: string; price: string; quantity: number }> = [];
  selectedComplements.forEach((groupMap, groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    groupMap.forEach((qty, itemId) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item && qty > 0) {
        result.push({
          id: item.id,
          name: item.name,
          price: String(getPrice(item)),
          quantity: qty,
        });
      }
    });
  });
  return result;
}
