import { Eye, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  "bg-blue-50 dark:bg-blue-950/40",      // 0 - sem visualizações
  "bg-blue-100 dark:bg-blue-900/50",     // 1 - muito baixo
  "bg-blue-200 dark:bg-blue-800/60",     // 2 - baixo
  "bg-blue-300 dark:bg-blue-700/70",     // 3 - médio-baixo
  "bg-blue-400 dark:bg-blue-600/80",     // 4 - médio
  "bg-blue-500 dark:bg-blue-500",        // 5 - médio-alto
  "bg-blue-600 dark:bg-blue-400",        // 6 - alto
  "bg-blue-700 dark:bg-blue-300",        // 7 - muito alto
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
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);
  
  return isTouch;
}

interface HeatmapCardProps {
  period?: 'today' | 'week' | 'month';
}

export function HeatmapCard({ period = 'today' }: HeatmapCardProps) {
  const heatmapInput = useMemo(() => ({ period }), [period]);
  const { data: heatmapData, isLoading } = trpc.menuViews.getHeatmap.useQuery(heatmapInput);
  const isTouch = useIsTouchDevice();
  
  // Estado para controlar tooltip ativo (apenas para mobile/touch)
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Criar matriz de dados 7x24
  const matrix = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    
    if (heatmapData?.data) {
      heatmapData.data.forEach((item: { dayOfWeek: number; hour: number; count: number }) => {
        if (item.dayOfWeek >= 0 && item.dayOfWeek < 7 && item.hour >= 0 && item.hour < 24) {
          grid[item.dayOfWeek][item.hour] = item.count;
        }
      });
    }
    
    return grid;
  }, [heatmapData?.data]);

  const maxCount = heatmapData?.maxCount || 0;
  const periodViews = heatmapData?.periodViews ?? 0;
  const viewsChange = heatmapData?.viewsChange ?? 0;

  // Period label for the views counter
  const periodViewsLabel = useMemo(() => {
    if (period === 'today') return 'Hoje';
    if (period === 'week') return 'Esta semana';
    return 'Este mês';
  }, [period]);

  const comparisonLabel = useMemo(() => {
    if (period === 'today') return 'vs ontem';
    if (period === 'week') return 'vs semana anterior';
    return 'vs mês anterior';
  }, [period]);

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
      <div className="bg-card rounded-xl border border-border/50 p-4 h-full">
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
      <div ref={containerRef} className="bg-card rounded-xl border border-border/50 p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Acessos ao Cardápio</h3>
              <p className="text-xs text-muted-foreground">Dias e horários com mais acessos ao seu cardápio</p>
            </div>
          </div>
          
          {/* Ícone de informação - hover no desktop, click no mobile */}
          <Tooltip open={isTouch ? showInfoTooltip : undefined}>
            <TooltipTrigger asChild>
              <button 
                className="h-6 w-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                onClick={handleInfoClick}
                onTouchEnd={(e) => {
                  if (isTouch) {
                    e.preventDefault();
                    handleInfoClick();
                  }
                }}
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              align="end"
              className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-4 py-3 max-w-[280px]"
            >
              <p className="text-sm leading-relaxed">
                Este gráfico mostra quando os clientes mais acessam seu cardápio. Use esses horários para divulgar ofertas ou reforçar o atendimento.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Period Views Counter with Trend */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-lg font-bold text-foreground">
            {periodViews.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-muted-foreground">{periodViewsLabel}</span>
          {viewsChange !== 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium cursor-default",
                    viewsChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  )}
                >
                  {viewsChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {viewsChange > 0 ? "+" : ""}{viewsChange}%
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2">
                <p className="text-xs">{viewsChange > 0 ? "+" : ""}{viewsChange}% {comparisonLabel}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground cursor-default">
                  <Minus className="w-3 h-3" />
                  0%
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2">
                <p className="text-xs">Sem variação {comparisonLabel}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Grid do Heatmap - mantendo estrutura original */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header com horas */}
            <div className="flex mb-0.5">
              <div className="w-8 flex-shrink-0 sticky left-0 bg-card z-10" /> {/* Espaço para labels dos dias - sticky */}
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Linhas do grid (dias) */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-0.5">
                {/* Label do dia - sticky para ficar fixo durante scroll horizontal */}
                <div className="w-8 flex-shrink-0 text-[10px] font-medium text-muted-foreground pr-1 text-right sticky left-0 bg-card z-10">
                  {day}
                </div>
                
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
                            "flex-1 aspect-square rounded-[3px] mx-[1px] cursor-pointer transition-all hover:ring-2 hover:ring-blue-600 hover:ring-offset-1 hover:ring-offset-card",
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
                        className="bg-gray-900 dark:bg-gray-800 text-white border-0 px-3 py-2"
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
          
          {/* Total de visualizações (acumulado geral) */}
          <div className="text-xs text-muted-foreground">
            Total acumulado: <span className="font-semibold text-foreground">{(heatmapData?.totalViews ?? 0).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default HeatmapCard;
