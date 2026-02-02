import { Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

// Tipo para os estados visuais
type ViewsState = "up" | "down" | "neutral";

// Cores por estado
const stateColors = {
  up: {
    text: "#16A34A", // Verde
    icon: TrendingUp,
    line: "#22C55E",
    symbol: "▲",
  },
  down: {
    text: "#DC2626", // Vermelho
    icon: TrendingDown,
    line: "#EF4444",
    symbol: "▼",
  },
  neutral: {
    text: "#9CA3AF", // Cinza
    icon: Minus,
    line: "#D1D5DB",
    symbol: "—",
  },
};

// Componente Sparkline
function Sparkline({ 
  data, 
  color, 
  width = 120, 
  height = 32 
}: { 
  data: number[]; 
  color: string; 
  width?: number; 
  height?: number;
}) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;
    
    return data.map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [data, width, height]);

  const lastPoint = useMemo(() => {
    if (data.length === 0) return null;
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    
    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;
    
    const lastIndex = data.length - 1;
    const x = padding + (lastIndex / (data.length - 1 || 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((data[lastIndex] - min) / range) * effectiveHeight;
    
    return { x, y };
  }, [data, width, height]);

  // Se não há dados, mostrar linha pontilhada
  if (data.length === 0 || data.every(v => v === 0)) {
    return (
      <svg width={width} height={height} className="opacity-40">
        <line 
          x1="4" 
          y1={height / 2} 
          x2={width - 4} 
          y2={height / 2} 
          stroke={color} 
          strokeWidth="2" 
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height}>
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4"
          fill={color}
        />
      )}
    </svg>
  );
}

export function ViewsCard() {
  const { data: stats, isLoading } = trpc.menuViews.getStats.useQuery();

  // Determinar o estado baseado na variação percentual
  const state: ViewsState = useMemo(() => {
    if (!stats) return "neutral";
    if (stats.percentageChange >= 5) return "up";
    if (stats.percentageChange <= -5) return "down";
    return "neutral";
  }, [stats?.percentageChange]);

  const stateConfig = stateColors[state];
  const StateIcon = stateConfig.icon;

  // Verificar se há poucas visualizações
  const hasLowVolume = stats && stats.totalViews < 10;
  
  // Verificar se não há dados
  const hasNoData = !stats || (stats.totalViews === 0 && stats.previousTotalViews === 0);

  // Preparar dados para o sparkline
  const sparklineData = useMemo(() => {
    if (!stats?.dailyViews) return [];
    return stats.dailyViews.map(d => d.views);
  }, [stats?.dailyViews]);

  // Obter nome do dia da semana
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[date.getDay()];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">
          Visualizações
        </span>
        <Eye className="h-5 w-5 text-gray-400" />
      </div>

      {/* Número principal */}
      <div className="mb-1">
        <span className="text-[28px] font-bold text-gray-900">
          {hasNoData ? "—" : stats?.totalViews || 0}
        </span>
      </div>

      {/* Variação percentual */}
      <div className="flex items-center gap-1 mb-3">
        {hasNoData ? (
          <span className="text-[12px] font-medium text-gray-400">
            Sem visualizações ainda
          </span>
        ) : hasLowVolume ? (
          <span className="text-[12px] font-medium text-amber-500">
            Volume baixo de visualizações
          </span>
        ) : (
          <>
            <span 
              className="text-[12px] font-medium"
              style={{ color: stateConfig.text }}
            >
              {stats?.percentageChange > 0 ? "+" : ""}
              {stats?.percentageChange}%
            </span>
            <span 
              className="text-[12px]"
              style={{ color: stateConfig.text }}
            >
              {stateConfig.symbol}
            </span>
            <span className="text-[12px] text-gray-400 ml-1">
              vs últimos 7 dias
            </span>
          </>
        )}
      </div>

      {/* Mini gráfico sparkline */}
      <div className="relative group">
        <Sparkline 
          data={sparklineData} 
          color={hasNoData ? "#D1D5DB" : stateConfig.line}
          width={140}
          height={32}
        />
        
        {/* Tooltip com dados por dia (hover) */}
        {stats?.dailyViews && stats.dailyViews.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              <div className="space-y-1">
                {stats.dailyViews.slice(-3).map((day, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <span className="text-gray-300">{getDayName(day.date)}</span>
                    <span className="font-medium">{day.views} visualizações</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewsCard;
