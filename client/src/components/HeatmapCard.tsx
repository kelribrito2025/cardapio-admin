import { Eye, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Dias da semana (começando por Domingo como na imagem)
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Horas do dia (0h a 23h)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Escala de cores azul (do mais claro ao mais escuro)
const COLOR_SCALE = [
  "bg-blue-50",      // 0 - sem visualizações
  "bg-blue-100",     // 1 - muito baixo
  "bg-blue-200",     // 2 - baixo
  "bg-blue-300",     // 3 - médio-baixo
  "bg-blue-400",     // 4 - médio
  "bg-blue-500",     // 5 - médio-alto
  "bg-blue-600",     // 6 - alto
  "bg-blue-700",     // 7 - muito alto
];

// Função para obter a cor baseada no valor
function getColorClass(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return COLOR_SCALE[0];
  
  const ratio = value / maxValue;
  const index = Math.min(Math.floor(ratio * (COLOR_SCALE.length - 1)) + 1, COLOR_SCALE.length - 1);
  return COLOR_SCALE[index];
}

// Hook para detectar se é dispositivo touch/mobile
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Verificar se é dispositivo touch
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    
    checkTouch();
    
    // Re-verificar em resize (para casos de mudança de modo)
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);
  
  return isTouch;
}

export function HeatmapCard() {
  const { data: heatmapData, isLoading } = trpc.menuViews.getHeatmap.useQuery();
  const isTouch = useIsTouchDevice();
  
  // Estado para controlar tooltip ativo (apenas para mobile/touch)
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Criar matriz de dados 7x24
  const matrix = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    
    if (heatmapData?.data) {
      heatmapData.data.forEach(item => {
        if (item.dayOfWeek >= 0 && item.dayOfWeek < 7 && item.hour >= 0 && item.hour < 24) {
          grid[item.dayOfWeek][item.hour] = item.count;
        }
      });
    }
    
    return grid;
  }, [heatmapData?.data]);

  const maxCount = heatmapData?.maxCount || 0;
  const totalViews = heatmapData?.totalViews || 0;

  // Fechar tooltips ao clicar fora (apenas para mobile)
  useEffect(() => {
    if (!isTouch) return;
    
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveCell(null);
        setShowInfoTooltip(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTouch]);

  // Handler para toggle do tooltip da célula (mobile)
  const handleCellClick = (cellKey: string) => {
    if (!isTouch) return;
    setShowInfoTooltip(false);
    setActiveCell(prev => prev === cellKey ? null : cellKey);
  };

  // Handler para toggle do tooltip de info (mobile)
  const handleInfoClick = () => {
    if (!isTouch) return;
    setActiveCell(null);
    setShowInfoTooltip(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div>
            <div className="skeleton h-4 w-28 rounded-md mb-1" />
            <div className="skeleton h-3 w-40 rounded-md" />
          </div>
        </div>
        <div className="skeleton h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div ref={containerRef} className="bg-card rounded-xl border border-border/50 p-4 shadow-sm h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Visualizações do Cardápio</h3>
              <p className="text-xs text-muted-foreground">Horários em que seu cardápio é mais acessado</p>
            </div>
          </div>
          
          {/* Ícone de informação - hover no desktop, click no mobile */}
          <Tooltip open={isTouch ? showInfoTooltip : undefined}>
            <TooltipTrigger asChild>
              <button 
                className="h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                onClick={handleInfoClick}
                onTouchEnd={(e) => {
                  if (isTouch) {
                    e.preventDefault();
                    handleInfoClick();
                  }
                }}
              >
                <Info className="h-4 w-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              align="end"
              className="bg-gray-900 text-white border-0 px-4 py-3 max-w-[280px]"
            >
              <p className="text-sm leading-relaxed">
                Este gráfico mostra quando os clientes mais acessam seu cardápio. Use esses horários para divulgar ofertas ou reforçar o atendimento.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Grid do Heatmap com coluna de dias fixa */}
        <div className="flex-1 flex">
          {/* Coluna fixa dos dias da semana */}
          <div className="flex-shrink-0 z-10 bg-card">
            {/* Espaço para alinhar com header das horas */}
            <div className="h-4 mb-0.5" />
            {/* Labels dos dias */}
            {DAYS.map((day) => (
              <div 
                key={day} 
                className="h-[18px] mb-0.5 flex items-center justify-end pr-2"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Área scrollável com horas e células */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[450px]">
              {/* Header com horas */}
              <div className="flex mb-0.5 h-4">
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
                  >
                    {hour}h
                  </div>
                ))}
              </div>

              {/* Linhas do grid (células das horas) */}
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-0.5 h-[18px]">
                  {/* Células das horas */}
                  {HOURS.map(hour => {
                    const count = matrix[dayIndex][hour];
                    const colorClass = getColorClass(count, maxCount);
                    const cellKey = `${dayIndex}-${hour}`;
                    const isActive = activeCell === cellKey;
                    
                    return (
                      <Tooltip 
                        key={cellKey} 
                        open={isTouch ? isActive : undefined}
                      >
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "flex-1 aspect-square rounded-[3px] mx-[1px] cursor-pointer transition-all hover:ring-2 hover:ring-blue-600 hover:ring-offset-1",
                              colorClass,
                              isActive && "ring-2 ring-blue-600 ring-offset-1"
                            )}
                            onClick={() => handleCellClick(cellKey)}
                            onTouchEnd={(e) => {
                              if (isTouch) {
                                e.preventDefault();
                                handleCellClick(cellKey);
                              }
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-gray-900 text-white border-0 px-3 py-2"
                        >
                          <div className="text-center">
                            <div className="font-semibold">{day} às {hour}h</div>
                            <div className="text-blue-300">{count} visualizações</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Menos</span>
            <div className="flex gap-0.5">
              {COLOR_SCALE.map((color, index) => (
                <div
                  key={index}
                  className={cn("w-3.5 h-3.5 rounded-sm", color)}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">Mais</span>
          </div>
          
          {/* Total de visualizações */}
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalViews.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default HeatmapCard;
