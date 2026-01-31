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
  Layers,
  Gift,
  DollarSign,
  Search,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Complementos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="space-y-6">
        <PageHeader
          title="Complementos Globais"
          description="Gerencie complementos de forma centralizada. Alterações aqui refletem em todos os produtos."
        />

        <SectionCard>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar complemento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de complementos */}
          {!filteredComplements || filteredComplements.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Nenhum complemento encontrado"
              description={searchTerm ? "Tente buscar por outro termo" : "Os complementos cadastrados nos produtos aparecerão aqui"}
            />
          ) : (
            <div className="space-y-3">
              {filteredComplements.map((complement: { id: number; name: string; price: string; isActive: boolean; priceMode: "normal" | "free"; usageCount: number }) => (
                <ComplementRow
                  key={complement.id}
                  complement={complement}
                  onToggleActive={handleToggleActive}
                  onTogglePriceMode={handleTogglePriceMode}
                  isUpdating={updateGlobalMutation.isPending}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Legenda */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <p className="font-medium mb-2">Como funciona:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Toggle Ativo/Pausado:</strong> Complemento pausado não aparece em nenhum produto no menu público</li>
            <li><strong>Botão GRÁTIS:</strong> Quando ativo, o complemento aparece com R$ 0,00 em todos os produtos</li>
            <li><strong>Uso em X produtos:</strong> Indica em quantos grupos de complementos esse item está presente</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente de linha do complemento
function ComplementRow({
  complement,
  onToggleActive,
  onTogglePriceMode,
  isUpdating,
}: {
  complement: {
    id: number;
    name: string;
    price: string;
    isActive: boolean;
    priceMode: "normal" | "free";
    usageCount: number;
  };
  onToggleActive: (name: string, isActive: boolean) => void;
  onTogglePriceMode: (name: string, priceMode: "normal" | "free") => void;
  isUpdating: boolean;
}) {
  const isFree = complement.priceMode === "free";
  const isActive = complement.isActive;
  const price = parseFloat(complement.price);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl transition-all",
        !isActive && "opacity-60"
      )}
    >
      {/* Nome e preço */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-semibold text-base",
            !isActive && "text-muted-foreground"
          )}>
            {complement.name}
          </h4>
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
        </div>
        <p className="text-sm text-muted-foreground">
          {isFree ? (
            <span className="line-through">R$ {price.toFixed(2)}</span>
          ) : (
            <span>R$ {price.toFixed(2)}</span>
          )}
          {" · "}
          <span>Usado em {complement.usageCount} {complement.usageCount === 1 ? "produto" : "produtos"}</span>
        </p>
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
    </div>
  );
}
