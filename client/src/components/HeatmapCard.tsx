import { Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

export function HeatmapCard() {
  const { data: heatmapData, isLoading } = trpc.menuViews.getHeatmap.useQuery();
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number } | null>(null);

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

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-12 w-12 rounded-xl" />
          <div>
            <div className="skeleton h-5 w-32 rounded-md mb-1" />
            <div className="skeleton h-4 w-48 rounded-md" />
          </div>
        </div>
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <Eye className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mapa de Calor</h3>
          <p className="text-sm text-muted-foreground">Visualizações por dia e hora</p>
        </div>
      </div>

      {/* Grid do Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header com horas */}
          <div className="flex mb-1">
            <div className="w-10 flex-shrink-0" /> {/* Espaço para labels dos dias */}
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="flex-1 text-center text-xs text-muted-foreground font-medium"
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Linhas do grid (dias) */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              {/* Label do dia */}
              <div className="w-10 flex-shrink-0 text-xs font-medium text-muted-foreground pr-2 text-right">
                {day}
              </div>
              
              {/* Células das horas */}
              {HOURS.map(hour => {
                const count = matrix[dayIndex][hour];
                const colorClass = getColorClass(count, maxCount);
                
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={cn(
                      "flex-1 aspect-square rounded-sm mx-px cursor-pointer transition-all",
                      colorClass,
                      hoveredCell?.day === dayIndex && hoveredCell?.hour === hour && "ring-2 ring-blue-600 ring-offset-1"
                    )}
                    onMouseEnter={() => setHoveredCell({ day: dayIndex, hour, count })}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`${day} ${hour}h: ${count} visualizações`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip flutuante */}
      {hoveredCell && (
        <div className="mt-3 p-2 bg-muted rounded-lg text-sm">
          <span className="font-medium">{DAYS[hoveredCell.day]}</span>
          <span className="text-muted-foreground"> às </span>
          <span className="font-medium">{hoveredCell.hour}h</span>
          <span className="text-muted-foreground">: </span>
          <span className="font-semibold text-blue-600">{hoveredCell.count}</span>
          <span className="text-muted-foreground"> visualizações</span>
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Menos</span>
          <div className="flex gap-0.5">
            {COLOR_SCALE.map((color, index) => (
              <div
                key={index}
                className={cn("w-5 h-5 rounded-sm", color)}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Mais</span>
        </div>
        
        {/* Total de visualizações */}
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{totalViews.toLocaleString('pt-BR')}</span> visualizações
        </div>
      </div>
    </div>
  );
}

export default HeatmapCard;
