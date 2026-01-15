import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface WeeklyRevenueCardProps {
  thisWeek: number[];
  lastWeek: number[];
  thisWeekTotal: number;
  lastWeekTotal: number;
  loading?: boolean;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function WeeklyRevenueCard({
  thisWeek,
  lastWeek,
  thisWeekTotal,
  lastWeekTotal,
  loading = false,
}: WeeklyRevenueCardProps) {
  const [showLastWeek, setShowLastWeek] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Calculate percentage change
  const percentChange = useMemo(() => {
    if (lastWeekTotal === 0) return thisWeekTotal > 0 ? 100 : 0;
    return ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  }, [thisWeekTotal, lastWeekTotal]);

  // Get max value for scaling bars
  const maxValue = useMemo(() => {
    const allValues = [...thisWeek, ...lastWeek];
    return Math.max(...allValues, 1);
  }, [thisWeek, lastWeek]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Get current day of week (0 = Monday, 6 = Sunday)
  const today = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="skeleton h-6 w-28 rounded-md" />
        </div>
        <div className="flex items-center gap-2 mb-5">
          <div className="skeleton h-8 w-28 rounded-md" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="skeleton w-full rounded-md" style={{ height: `${30 + Math.random() * 70}%` }} />
              <div className="skeleton h-3 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Acumulado da semana</h3>
        
        {/* Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowLastWeek(false)}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              !showLastWeek ? "text-emerald-600 font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              !showLastWeek ? "bg-emerald-500" : "bg-gray-300"
            )} />
            Esta semana
          </button>
          <button
            onClick={() => setShowLastWeek(true)}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              showLastWeek ? "text-gray-600 font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              showLastWeek ? "bg-gray-400" : "bg-gray-300"
            )} />
            Semana passada
          </button>
        </div>
      </div>

      {/* Total and Delta */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(showLastWeek ? lastWeekTotal : thisWeekTotal)}
        </span>
        {!showLastWeek && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              percentChange >= 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {percentChange >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {percentChange >= 0 ? "+" : ""}
            {percentChange.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Bar Chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32">
          {DAYS.map((day, index) => {
            const thisWeekValue = thisWeek[index] || 0;
            const lastWeekValue = lastWeek[index] || 0;
            const currentValue = showLastWeek ? lastWeekValue : thisWeekValue;
            const comparisonValue = showLastWeek ? thisWeekValue : lastWeekValue;
            
            const currentHeight = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
            const comparisonHeight = maxValue > 0 ? (comparisonValue / maxValue) * 100 : 0;
            
            const isToday = index === today && !showLastWeek;
            const isFutureDay = index > today && !showLastWeek;

            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1.5 relative group"
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Bars container */}
                <div className="relative w-full h-24 flex items-end justify-center">
                  {/* Ghost bar (comparison) */}
                  <div
                    className={cn(
                      "absolute bottom-0 w-full rounded-lg transition-all duration-300",
                      showLastWeek ? "bg-emerald-200/50" : "bg-gray-200"
                    )}
                    style={{ height: `${Math.max(comparisonHeight, 4)}%` }}
                  />
                  
                  {/* Main bar */}
                  <div
                    className={cn(
                      "relative w-full rounded-lg transition-all duration-300 cursor-pointer",
                      showLastWeek
                        ? "bg-gray-400"
                        : isFutureDay
                          ? "bg-gray-200"
                          : "bg-emerald-500",
                      isToday && "ring-2 ring-emerald-300 ring-offset-2"
                    )}
                    style={{ height: `${Math.max(currentHeight, 4)}%` }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isToday ? "text-emerald-600" : "text-muted-foreground"
                  )}
                >
                  {day}
                </span>

                {/* Tooltip */}
                {hoveredDay === index && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 bg-gray-900 text-white px-2 py-1.5 rounded-md shadow-lg text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{showLastWeek ? "Semana passada" : "Esta semana"}:</span>
                      <span className="font-semibold">{formatCurrency(currentValue)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span>{showLastWeek ? "Esta semana" : "Semana passada"}:</span>
                      <span className="font-semibold">{formatCurrency(comparisonValue)}</span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
