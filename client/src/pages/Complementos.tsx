import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Layers,
  Gift,
  DollarSign,
  Search,
  Pencil,
  Check,
  X,
  ChevronDown,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda" },
  { value: 2, label: "Ter", fullLabel: "Terça" },
  { value: 3, label: "Qua", fullLabel: "Quarta" },
  { value: 4, label: "Qui", fullLabel: "Quinta" },
  { value: 5, label: "Sex", fullLabel: "Sexta" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

export default function Complementos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedComplementId, setExpandedComplementId] = useState<number | null>(null);

  // Set establishment ID when data is loaded
  useEffect(() => {
    if (establishment?.id) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Query para listar todos os complementos do estabelecimento
  const { data: complements, refetch: refetchComplements, isLoading } = trpc.complement.listAllByEstablishment.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Mutation para atualizar complemento globalmente
  const updateGlobalMutation = trpc.complement.updateGlobal.useMutation({
    onSuccess: () => {
      refetchComplements();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar complemento: " + error.message);
    },
  });

  // Filtrar complementos pela busca
  const filteredComplements = useMemo(() => {
    if (!complements) return [];
    if (!searchTerm.trim()) return complements;
    
    const term = searchTerm.toLowerCase().trim();
    return complements.filter((c: { name: string }) => c.name.toLowerCase().includes(term));
  }, [complements, searchTerm]);

  // Handlers
  const handleToggleActive = (complementName: string, isActive: boolean) => {
    if (!establishmentId) return;
    
    updateGlobalMutation.mutate({
      establishmentId,
      complementName,
      isActive,
    });
    
    toast.success(isActive ? "Complemento ativado em todos os produtos" : "Complemento pausado em todos os produtos");
  };

  const handleTogglePriceMode = (complementName: string, priceMode: "normal" | "free") => {
    if (!establishmentId) return;
    
    updateGlobalMutation.mutate({
      establishmentId,
      complementName,
      priceMode,
    });
    
    toast.success(priceMode === "free" ? "Complemento marcado como GRÁTIS em todos os produtos" : "Complemento voltou ao preço normal");
  };

  const handleUpdatePrice = (complementName: string, price: string) => {
    if (!establishmentId) return;
    
    updateGlobalMutation.mutate({
      establishmentId,
      complementName,
      price,
    });
    
    toast.success("Preço atualizado em todos os produtos");
  };

  const handleUpdateAvailability = (
    complementName: string, 
    availabilityType: "always" | "scheduled",
    availableDays?: number[],
    availableHours?: { day: number; startTime: string; endTime: string }[]
  ) => {
    if (!establishmentId) return;
    
    updateGlobalMutation.mutate({
      establishmentId,
      complementName,
      availabilityType,
      availableDays,
      availableHours,
    });
    
    toast.success("Disponibilidade atualizada em todos os produtos");
  };

  // Loading state
  if (establishmentLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Complementos"
        description="Alterações aqui refletem em todos os produtos."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar complemento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        }
      />

      {/* Lista de complementos */}
      {!filteredComplements || filteredComplements.length === 0 ? (
        <SectionCard className="mt-6">
          <EmptyState
            icon={Layers}
            title="Nenhum complemento encontrado"
            description={searchTerm ? "Tente buscar por outro termo" : "Os complementos cadastrados nos produtos aparecerão aqui"}
          />
        </SectionCard>
      ) : (
        <div className="space-y-3 mt-6">
          {filteredComplements.map((complement: { 
            id: number; 
            name: string; 
            price: string; 
            isActive: boolean; 
            priceMode: "normal" | "free"; 
            usageCount: number;
            availabilityType: "always" | "scheduled";
            availableDays: number[] | null;
            availableHours: { day: number; startTime: string; endTime: string }[] | null;
          }) => (
            <ComplementRow
              key={complement.id}
              complement={complement}
              onToggleActive={handleToggleActive}
              onTogglePriceMode={handleTogglePriceMode}
              onUpdatePrice={handleUpdatePrice}
              onUpdateAvailability={handleUpdateAvailability}
              isUpdating={updateGlobalMutation.isPending}
              isExpanded={expandedComplementId === complement.id}
              onToggleExpand={(id) => setExpandedComplementId(expandedComplementId === id ? null : id)}
            />
          ))}
        </div>
      )}

      {/* Legenda */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg mt-6">
        <p className="font-medium mb-2">Como funciona:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Toggle Ativo/Pausado:</strong> Complemento pausado não aparece em nenhum produto no menu público</li>
          <li><strong>Botão GRÁTIS:</strong> Quando ativo, o complemento aparece com R$ 0,00 em todos os produtos</li>
          <li><strong>Editar preço:</strong> Clique no lápis para alterar o preço em todos os produtos</li>
          <li><strong>Disponibilidade:</strong> Clique na seta para configurar dias e horários específicos</li>
          <li><strong>Uso em X produtos:</strong> Indica em quantos grupos de complementos esse item está presente</li>
        </ul>
      </div>
    </AdminLayout>
  );
}

// Componente de linha do complemento
function ComplementRow({
  complement,
  onToggleActive,
  onTogglePriceMode,
  onUpdatePrice,
  onUpdateAvailability,
  isUpdating,
  isExpanded,
  onToggleExpand,
}: {
  complement: {
    id: number;
    name: string;
    price: string;
    isActive: boolean;
    priceMode: "normal" | "free";
    usageCount: number;
    availabilityType: "always" | "scheduled";
    availableDays: number[] | null;
    availableHours: { day: number; startTime: string; endTime: string }[] | null;
  };
  onToggleActive: (name: string, isActive: boolean) => void;
  onTogglePriceMode: (name: string, priceMode: "normal" | "free") => void;
  onUpdatePrice: (name: string, price: string) => void;
  onUpdateAvailability: (
    name: string, 
    availabilityType: "always" | "scheduled",
    availableDays?: number[],
    availableHours?: { day: number; startTime: string; endTime: string }[]
  ) => void;
  isUpdating: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
}) {
  // Usar isExpanded do pai ao invés de estado local
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(complement.price);
  
  // Estado local para disponibilidade
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">(complement.availabilityType || "always");
  const [selectedDays, setSelectedDays] = useState<number[]>(complement.availableDays || []);
  const [hoursConfig, setHoursConfig] = useState<{ day: number; startTime: string; endTime: string }[]>(
    complement.availableHours || []
  );
  
  const isFree = complement.priceMode === "free";
  const isActive = complement.isActive;
  const price = parseFloat(complement.price);

  // Atualizar estado local quando o complemento mudar
  useEffect(() => {
    setAvailabilityType(complement.availabilityType || "always");
    setSelectedDays(complement.availableDays || []);
    setHoursConfig(complement.availableHours || []);
  }, [complement.availabilityType, complement.availableDays, complement.availableHours]);

  const handleSavePrice = () => {
    const numericPrice = parseFloat(editedPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Preço inválido");
      return;
    }
    onUpdatePrice(complement.name, numericPrice.toFixed(2));
    setIsEditingPrice(false);
  };

  const handleCancelEdit = () => {
    setEditedPrice(complement.price);
    setIsEditingPrice(false);
  };

  const handleDayToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    
    setSelectedDays(newDays);
    
    // Se o dia foi adicionado e não tem horário configurado, adicionar horário padrão
    if (!selectedDays.includes(day)) {
      const existingHours = hoursConfig.filter(h => h.day === day);
      if (existingHours.length === 0) {
        setHoursConfig([...hoursConfig, { day, startTime: "00:00", endTime: "23:59" }]);
      }
    }
  };

  const handleAddHourRange = (day: number) => {
    setHoursConfig([...hoursConfig, { day, startTime: "00:00", endTime: "23:59" }]);
  };

  const handleRemoveHourRange = (day: number, index: number) => {
    const dayHours = hoursConfig.filter(h => h.day === day);
    const otherHours = hoursConfig.filter(h => h.day !== day);
    dayHours.splice(index, 1);
    setHoursConfig([...otherHours, ...dayHours]);
  };

  const handleUpdateHourRange = (day: number, index: number, field: "startTime" | "endTime", value: string) => {
    const newConfig = [...hoursConfig];
    const dayHours = newConfig.filter(h => h.day === day);
    if (dayHours[index]) {
      dayHours[index][field] = value;
    }
    const otherHours = newConfig.filter(h => h.day !== day);
    setHoursConfig([...otherHours, ...dayHours]);
  };

  const handleSaveAvailability = () => {
    if (availabilityType === "scheduled" && selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }
    
    onUpdateAvailability(
      complement.name,
      availabilityType,
      availabilityType === "scheduled" ? selectedDays : undefined,
      availabilityType === "scheduled" ? hoursConfig.filter(h => selectedDays.includes(h.day)) : undefined
    );
    onToggleExpand(complement.id);
  };

  const getAvailabilityLabel = () => {
    if (availabilityType === "always") return "Sempre disponível";
    if (selectedDays.length === 0) return "Configurar disponibilidade";
    if (selectedDays.length === 7) return "Todos os dias (horários específicos)";
    const dayLabels = selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ");
    return dayLabels;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleExpand(complement.id)}>
      <div
        className={cn(
          "bg-card border border-border/50 rounded-xl transition-all cursor-pointer hover:border-border",
          !isActive && "opacity-60"
        )}
        onClick={(e) => {
          // Não abrir se clicou em botões, inputs ou switches
          const target = e.target as HTMLElement;
          const isInteractiveElement = 
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.closest('button') ||
            target.closest('input') ||
            target.closest('[role="switch"]');
          
          if (isInteractiveElement) {
            return;
          }
          onToggleExpand(complement.id);
        }}
      >
        {/* Linha principal */}
        <div className="flex items-center gap-4 p-4">
          {/* Nome, preço e uso - tudo na mesma linha */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn(
                "font-semibold text-base",
                !isActive && "text-muted-foreground"
              )}>
                {complement.name}
              </h4>
              
              {/* Preço inline */}
              {isEditingPrice ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="w-20 h-7 text-sm px-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSavePrice();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSavePrice}
                    disabled={isUpdating}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {isFree ? (
                    <span className="line-through">R$ {price.toFixed(2)}</span>
                  ) : (
                    <span>R$ {price.toFixed(2)}</span>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => setIsEditingPrice(true)}
                          disabled={isUpdating}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar preço em todos os produtos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">Usado em {complement.usageCount} {complement.usageCount === 1 ? "produto" : "produtos"}</span>
              
              {isFree && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <Gift className="h-3 w-3 mr-1" />
                  GRÁTIS
                </Badge>
              )}
              {!isActive && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                  PAUSADO
                </Badge>
              )}
              {availabilityType === "scheduled" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Horário específico
                </Badge>
              )}
            </div>
          </div>

          {/* Botão GRÁTIS */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isFree ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "min-w-[90px]",
                    isFree && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => onTogglePriceMode(complement.name, isFree ? "normal" : "free")}
                  disabled={isUpdating || !isActive}
                >
                  {isFree ? (
                    <>
                      <Gift className="h-4 w-4 mr-1" />
                      GRÁTIS
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-1" />
                      Normal
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFree ? "Clique para voltar ao preço normal" : "Clique para tornar GRÁTIS"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Toggle ativar/pausar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => onToggleActive(complement.name, checked)}
                    disabled={isUpdating}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isActive ? "Clique para pausar" : "Clique para ativar"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Botão de expandir */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Conteúdo expandido - Disponibilidade */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border/50">
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Disponibilidade do complemento
              </h5>

              {/* Radio buttons */}
              <RadioGroup
                value={availabilityType}
                onValueChange={(value: "always" | "scheduled") => setAvailabilityType(value)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="always" id={`always-${complement.id}`} className="mt-0.5" />
                  <div>
                    <Label htmlFor={`always-${complement.id}`} className="font-medium cursor-pointer">
                      Sempre disponível
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      O item ficará disponível sempre que o estabelecimento estiver aberto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="scheduled" id={`scheduled-${complement.id}`} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={`scheduled-${complement.id}`} className="font-medium cursor-pointer">
                      Disponível em dias e horários específicos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Escolha quando o item aparece nos seus canais de venda
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {/* Configuração de dias e horários */}
              {availabilityType === "scheduled" && (
                <div className="space-y-4 pt-2">
                  {/* Seleção de dias */}
                  <div>
                    <Label className="text-sm font-medium">Dias disponíveis</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={selectedDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDayToggle(day.value)}
                          className={cn(
                            "min-w-[50px]",
                            selectedDays.includes(day.value) && "bg-primary hover:bg-primary/90"
                          )}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Configuração de horários por dia */}
                  {selectedDays.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Horários</Label>
                      {selectedDays.map((day) => {
                        const dayInfo = DAYS_OF_WEEK.find(d => d.value === day);
                        const dayHours = hoursConfig.filter(h => h.day === day);
                        
                        return (
                          <div key={day} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                {dayInfo?.fullLabel}
                              </span>
                            </div>
                            
                            {dayHours.length === 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddHourRange(day)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar horário
                              </Button>
                            ) : (
                              dayHours.map((hour, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={hour.startTime}
                                    onChange={(e) => handleUpdateHourRange(day, index, "startTime", e.target.value)}
                                    className="w-28"
                                  />
                                  <span className="text-sm text-muted-foreground">às</span>
                                  <Input
                                    type="time"
                                    value={hour.endTime}
                                    onChange={(e) => handleUpdateHourRange(day, index, "endTime", e.target.value)}
                                    className="w-28"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleAddHourRange(day)}
                                    className="h-9 w-9 shrink-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  {dayHours.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleRemoveHourRange(day, index)}
                                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Botão salvar */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveAvailability}
                  disabled={isUpdating}
                  size="sm"
                >
                  {isUpdating ? "Salvando..." : "Salvar disponibilidade"}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
