import { useAuth } from "@/_core/hooks/useAuth";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Package,
  Settings,
  Search,
  Bell,
  Menu,

  LogOut,
  ChevronDown,
  ChevronRight,
  Store,
  PanelLeft,
  PanelLeftClose,
  ExternalLink,
  Crown,
  Ticket,
  Volume2,
  VolumeX,
  Printer,
  Layers,
  Megaphone,
  Monitor,
  HelpCircle,
  MessageSquarePlus,
  Utensils,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Star,
  BookOpen,
  Bike,
  CalendarClock,
  BadgeDollarSign,
  Bot,
  ChefHat,
  AlertTriangle,
  Trophy,
  Target,
  TrendingDown,
  TrendingUp,
  Save,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { WhatsAppDisconnectedBanner } from "@/components/WhatsAppDisconnectedBanner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSearch } from "@/contexts/SearchContext";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

// Seções do menu lateral
const menuSections = [
  {
    title: "OPERAÇÕES",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", disabled: false },
      { icon: Monitor, label: "Frente de Caixa", href: "/pdv", disabled: false },
      { icon: Utensils, label: "Mapa de mesas", href: "/mesas", disabled: false },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { icon: ClipboardList, label: "Pedidos", href: "/pedidos", disabled: false, isParent: true, children: [
        { icon: CalendarClock, label: "Agendados", href: "/agendados", disabled: false },
      ] },
      { icon: Bike, label: "Entregadores", href: "/entregadores", disabled: false },
      { icon: BookOpen, label: "Menu", href: "/menu-parent", disabled: false, isParent: true, children: [
        { icon: UtensilsCrossed, label: "Cardápio", href: "/catalogo", disabled: false },
        { icon: Layers, label: "Grupos", href: "/complementos", disabled: false },
        { icon: Star, label: "Avaliações", href: "/avaliacoes", disabled: false, badgeKey: "reviews" },
      ]},
      { icon: Package, label: "Estoque", href: "/estoque", disabled: false },
    ]
  },
  {
    title: "FINANCEIRO",
    items: [
      { icon: BadgeDollarSign, label: "Finanças", href: "/financas", disabled: false },
    ]
  },
  {
    title: "MARKETING",
    items: [
      { icon: Ticket, label: "Cupons", href: "/cupons", disabled: false },
      { icon: Megaphone, label: "Campanhas", href: "/campanhas", disabled: false },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { icon: Bot, label: "Bot WhatsApp", href: "/bot-whatsapp", disabled: false },
      { icon: Settings, label: "Configurações", href: "/configuracoes", disabled: false },
    ]
  },
];

// Lista plana para compatibilidade
const navItems = menuSections.flatMap(section => section.items);

// Componente de Tempo Médio de Preparo para a top bar
// Mapa de dias em inglês para português
const dayNameMap: Record<string, string> = {
  'Monday': 'Seg', 'Tuesday': 'Ter', 'Wednesday': 'Qua',
  'Thursday': 'Qui', 'Friday': 'Sex', 'Saturday': 'Sáb', 'Sunday': 'Dom',
};

function AvgPrepTimeButton({ establishmentId }: { establishmentId?: number }) {
  const [prepSidebarOpen, setPrepSidebarOpen] = useState(false);
  const [goalValue, setGoalValue] = useState<number>(30);
  const [goalChanged, setGoalChanged] = useState(false);

  const { data } = trpc.dashboard.avgPrepTime.useQuery(
    { establishmentId: establishmentId || 0, period: 'today' },
    { enabled: !!establishmentId, refetchInterval: 300000, staleTime: 120000 }
  );

  const { data: analysis, refetch: refetchAnalysis } = trpc.dashboard.prepTimeAnalysis.useQuery(
    { establishmentId: establishmentId || 0 },
    { enabled: !!establishmentId && prepSidebarOpen, staleTime: 60000 }
  );

  const updateGoalMutation = trpc.dashboard.updatePrepGoal.useMutation({
    onSuccess: () => {
      toast.success('Meta de preparo atualizada!');
      setGoalChanged(false);
      refetchAnalysis();
    },
    onError: () => toast.error('Erro ao atualizar meta'),
  });

  useEffect(() => {
    if (analysis?.prepGoal && !goalChanged) {
      setGoalValue(analysis.prepGoal);
    }
  }, [analysis?.prepGoal, goalChanged]);

  const avgMin = data?.avgMinutes ?? null;
  if (avgMin === null) return null;

  const goal = analysis?.prepGoal ?? 30;
  const isWithinGoal = avgMin <= goal;
  const color = isWithinGoal ? '#22c55e' : '#ef4444';
  const isPulsing = !isWithinGoal && avgMin > 0;

  const chartData = analysis?.dailyData?.map((d: any) => ({
    day: dayNameMap[d.dayName] || d.dayName.substring(0, 3),
    avgMinutes: d.avgMinutes,
    totalOrders: d.totalOrders,
  })) ?? [];
  const avgLine = analysis?.avgMinutes ?? 0;

  const handleSaveGoal = () => {
    if (establishmentId) {
      updateGoalMutation.mutate({ establishmentId, goalMinutes: goalValue });
    }
  };

  const diff = analysis?.diffFromYesterday ?? 0;
  const diffText = diff === 0 ? 'Sem variação' : diff < 0
    ? `${Math.abs(diff)} min mais rápido que ontem`
    : `${diff} min mais lento que ontem`;

  return (
    <>
      <button
        onClick={() => setPrepSidebarOpen(true)}
        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${isPulsing ? 'animate-pulse' : ''}`}
        style={{
          borderRadius: '10px',
          backgroundColor: color ? `${color}15` : undefined,
          color: color || undefined,
          border: `1px solid ${color}30`,
        }}
      >
        <Clock className="h-3.5 w-3.5" style={{ color: color || undefined }} />
        <span>{avgMin}min</span>
      </button>

      <Sheet open={prepSidebarOpen} onOpenChange={setPrepSidebarOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[460px] p-0 overflow-hidden flex flex-col bg-white dark:bg-background" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div>
              <SheetTitle className="text-lg font-bold">Tempo de preparo dos pedidos</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">Análise dos últimos 7 dias</SheetDescription>
            </div>
            <button onClick={() => setPrepSidebarOpen(false)} className="rounded-lg p-2 hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">

          {/* KPI Principal */}
          <div className="text-center py-4">
            <div className="text-5xl font-bold" style={{ color }}>
              {analysis?.avgMinutes ?? avgMin} min
            </div>
            <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${diff <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {diff <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              <span>{diffText}</span>
            </div>
          </div>

          {/* 3 Indicadores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{analysis?.avgMinutes ?? 0} min</div>
              <div className="text-[10px] text-muted-foreground">Tempo médio</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{analysis?.prepGoal ?? 30} min</div>
              <div className="text-[10px] text-muted-foreground">Meta</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <ClipboardList className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <div className="text-lg font-bold">{analysis?.totalOrders ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Pedidos</div>
            </div>
          </div>

          {/* Gráfico Semanal */}
          {chartData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tempo médio por dia</h4>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="m" />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} min`, 'Tempo médio']}
                    />
                    <ReferenceLine y={analysis?.prepGoal ?? 30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Meta', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                    {avgLine > 0 && <ReferenceLine y={avgLine} stroke="#94a3b8" strokeDasharray="3 3" />}
                    <Area type="monotone" dataKey="avgMinutes" stroke={color} fill="url(#prepGrad)" strokeWidth={2} dot={{ r: 3, fill: color }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tempo médio por etapa */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tempo médio por etapa</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3">
                <div className="bg-orange-100 dark:bg-orange-900/40 rounded-lg p-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{analysis?.prepMinutes ?? 0} min</div>
                  <div className="text-[10px] text-muted-foreground">Preparo</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2">
                  <Bike className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{analysis?.deliveryMinutes ?? 0} min</div>
                  <div className="text-[10px] text-muted-foreground">Entrega</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pior tempo da semana */}
          {analysis?.worstOrder && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Pior tempo da semana</h4>
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 rounded-xl p-3">
                <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{analysis.worstOrder.minutes} min</div>
                  <div className="text-[10px] text-muted-foreground">
                    Pedido #{analysis.worstOrder.orderNumber} &middot; {dayNameMap[analysis.worstOrder.dayName] || analysis.worstOrder.dayName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            {analysis?.bestDay && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Melhor dia:</span>
                <span className="font-semibold">{dayNameMap[analysis.bestDay.dayName] || analysis.bestDay.dayName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Média diária:</span>
              <span className="font-semibold">{analysis?.avgDailyOrders ?? 0} pedidos</span>
            </div>
          </div>

          {/* Meta de preparo configurável */}
          <div className="mt-5 border-t pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Meta de preparo</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[goalValue]}
                  onValueChange={(v) => { setGoalValue(v[0]); setGoalChanged(true); }}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="text-lg font-bold w-16 text-center">{goalValue} min</div>
              {goalChanged && (
                <Button
                  size="sm"
                  onClick={handleSaveGoal}
                  disabled={updateGoalMutation.isPending}
                  className="gap-1"
                >
                  <Save className="h-3 w-3" />
                  Salvar
                </Button>
              )}
            </div>
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { newOrdersCount, unlockAudio, isAudioUnlocked } = useNewOrders();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  // Estado para submenus expandidos (Menu pai) - persistido no localStorage
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      // Tentar restaurar do localStorage
      const saved = localStorage.getItem('expandedMenus');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
      // Fallback: auto-expandir se estamos numa rota filha
      const path = window.location.pathname;
      const initial: Record<string, boolean> = {};
      if (path === '/catalogo' || path.startsWith('/catalogo/') || path === '/avaliacoes' || path === '/complementos') {
        initial['/menu-parent'] = true;
      }
      if (path === '/pedidos' || path.startsWith('/pedidos/') || path === '/agendados') {
        initial['/pedidos'] = true;
      }
      if (Object.keys(initial).length > 0) return initial;
    }
    return {};
  });

  // Persistir estado dos submenus expandidos no localStorage
  useEffect(() => {
    localStorage.setItem('expandedMenus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);
  
  // Estado local para controlar se o som está habilitado
  // IMPORTANTE: SEMPRE inicia FALSE ao carregar/atualizar a página (F5 ou primeiro acesso)
  // O navegador bloqueia reprodução de áudio sem interação do usuário (autoplay policy)
  // Estratégia: usamos uma flag em memória (window.__soundMounted) para distinguir:
  //   - Reload real (F5/refresh): window.__soundMounted não existe → forçar desativado
  //   - Navegação SPA (troca de rota): window.__soundMounted existe → preservar estado
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Se o componente já foi montado nesta "vida" da página (navegação SPA),
    // preservar o estado atual do localStorage
    if ((window as any).__soundMounted === true) {
      return localStorage.getItem("notificationSoundEnabled") === "true";
    }
    // Reload real (F5) ou primeiro acesso: forçar desativado
    return false;
  });
  
  // Ao montar, detectar se é reload real ou navegação SPA
  // window.__soundMounted é limpo automaticamente em reload (F5) pois vive apenas em memória JS
  useEffect(() => {
    if ((window as any).__soundMounted !== true) {
      // Reload real (F5, novo acesso, nova aba) — forçar desativado
      localStorage.setItem("notificationSoundEnabled", "false");
      (window as any).__soundMounted = true;
    }
    
    // Ouvir mudanças no localStorage (para sincronizar entre abas)
    const syncSoundState = () => {
      const storedValue = localStorage.getItem("notificationSoundEnabled");
      const shouldBeEnabled = storedValue === "true";
      setIsSoundEnabled(shouldBeEnabled);
    };
    
    window.addEventListener("storage", syncSoundState);
    return () => window.removeEventListener("storage", syncSoundState);
  }, []);
  
  // Listener global para notificação de novo pedido - funciona em todas as páginas
  useEffect(() => {
    const handleNewOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const orderData = customEvent.detail;
      console.log("[AdminLayout] Evento de novo pedido recebido:", orderData);
      
      const isScheduled = orderData?.isScheduled === true;
      
      // Mostrar toast de notificação global - diferenciado para pedidos agendados
      if (isScheduled) {
        toast.success("Novo pedido agendado!", {
          description: `Um pedido agendado acabou de chegar.${orderData?.scheduledAt ? ` Agendado para ${new Date(orderData.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`,
          duration: 8000,
          action: {
            label: "Ver pedido agendado",
            onClick: () => {
              navigate("/agendados");
            },
          },
        });
      } else {
        toast.success("Novo pedido recebido!", {
          description: "Um novo pedido acabou de chegar.",
          duration: 5000,
          action: {
            label: "Ver pedidos",
            onClick: () => {
              navigate("/pedidos");
            },
          },
        });
      }
    };
    
    // Registrar listener
    window.addEventListener("new-order-notification", handleNewOrderNotification);
    console.log("[AdminLayout] Listener de notificação global registrado");
    
    return () => {
      window.removeEventListener("new-order-notification", handleNewOrderNotification);
      console.log("[AdminLayout] Listener de notificação global removido");
    };
  }, []);
  
  // Sidebar collapsed state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === "true";
    }
    return false;
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Minimizar menu automaticamente ao acessar a página PDV, Pedidos, Configurações ou Mesas
  // Limpar busca global ao mudar de página
  useEffect(() => {
    setSearchQuery("");
  }, [location]);



  // Get establishment data
  const { data: establishment, refetch: refetchEstablishment } = trpc.establishment.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Get trial info
  const { data: trialInfo } = trpc.establishment.getTrialInfo.useQuery();

  // Get unread reviews count for badge (only when reviews are enabled)
  const reviewsEnabled = establishment?.reviewsEnabled !== false;
  const { data: unreadReviewCount } = trpc.reviewsAdmin.unreadCount.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id && reviewsEnabled, refetchOnWindowFocus: true }
  );

  // Get out of stock count for badge
  const { data: outOfStockData } = trpc.stock.outOfStockCount.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, refetchOnWindowFocus: true }
  );
  const outOfStockCount = outOfStockData?.count || 0;

  // Check if scheduling is enabled for this establishment
  const schedulingEnabled = establishment?.schedulingEnabled === true;

  // Get scheduled orders pending count for badge (only when scheduling is enabled)
  const { data: scheduledPendingData } = trpc.scheduling.pendingCount.useQuery(
    undefined,
    { enabled: !!establishment?.id && schedulingEnabled, refetchInterval: 30000, refetchOnWindowFocus: true }
  );
  const scheduledPendingCount = scheduledPendingData?.count || 0;

  // Auto-expandir submenu Menu quando navegar para rotas filhas (apenas se não estiver já expandido)
  useEffect(() => {
    if (location === '/catalogo' || location.startsWith('/catalogo/') || location === '/avaliacoes' || location === '/complementos') {
      setExpandedMenus(prev => {
        if (prev['/menu-parent']) return prev;
        return { ...prev, '/menu-parent': true };
      });
    }
    if (location === '/pedidos' || location.startsWith('/pedidos/') || location === '/agendados') {
      setExpandedMenus(prev => {
        if (prev['/pedidos']) return prev;
        return { ...prev, '/pedidos': true };
      });
    }
  }, [location]);

  // Get server-computed open status (single source of truth)
  const { data: openStatusData, refetch: refetchOpenStatus } = trpc.establishment.getOpenStatus.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id, refetchInterval: 60000 } // Refresh every 60 seconds
  );

  // Use server-computed values as the single source of truth
  const calculatedIsOpen = openStatusData?.isOpen ?? false;
  const isForcedClosed = openStatusData?.manuallyClosed ?? false;
  const isForcedOpen = !isForcedClosed && calculatedIsOpen && establishment?.manuallyOpened === true;
  
  // Build status message from server data
  let statusMessage = '';
  if (!calculatedIsOpen && openStatusData?.nextOpeningTime) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const next = openStatusData.nextOpeningTime;
    if (next.isToday) {
      statusMessage = `Abriremos hoje às ${next.openTime}`;
    } else if (next.isTomorrow) {
      statusMessage = `Abriremos amanhã às ${next.openTime}`;
    } else {
      statusMessage = `Abriremos ${dayNames[next.dayOfWeek]} às ${next.openTime}`;
    }
  }

  // Toggle store open/closed - usa nova lógica de fechamento manual
  const toggleOpenMutation = trpc.establishment.setManualClose.useMutation({
    onSuccess: () => {
      refetchEstablishment();
      refetchOpenStatus();
      // Usar calculatedIsOpen para determinar a mensagem correta
      toast.success(calculatedIsOpen ? "Loja fechada manualmente" : "Loja aberta");
    },
    onError: () => {
      toast.error("Erro ao alterar status da loja");
    },
  });

  const handleToggleOpen = () => {
    if (establishment) {
      // Se está aberto (calculatedIsOpen = true), fechar manualmente
      // Se está fechado (calculatedIsOpen = false), abrir manualmente
      toggleOpenMutation.mutate({
        id: establishment.id,
        close: calculatedIsOpen, // true = fechar, false = abrir
      });
    }
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Ref para preservar scroll da sidebar
  const sidebarNavRef = useRef<HTMLElement>(null);
  const sidebarScrollPos = useRef<number>(0);

  // Salvar posição do scroll antes da navegação
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav) return;
    const handleScroll = () => {
      sidebarScrollPos.current = nav.scrollTop;
    };
    nav.addEventListener('scroll', handleScroll);
    return () => nav.removeEventListener('scroll', handleScroll);
  }, []);

  // Restaurar posição do scroll após navegação
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (nav && sidebarScrollPos.current > 0) {
      requestAnimationFrame(() => {
        nav.scrollTop = sidebarScrollPos.current;
      });
    }
  }, [location]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleNavClick = (href: string) => {
    // Salvar posição do scroll antes de navegar
    if (sidebarNavRef.current) {
      sidebarScrollPos.current = sidebarNavRef.current.scrollTop;
    }
    // Fechar sidebar mobile
    setSidebarOpen(false);
  };

  // Sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? "w-[63px]" : "w-[263px]";
  const mainPadding = sidebarCollapsed ? "lg:pl-[63px]" : "lg:pl-[263px]";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full border-r border-sidebar-border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 flex flex-col",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        style={{
          background: 'var(--card)'
        }}
      >
        {/* Logo + Toggle button na mesma linha */}
        <div className={cn(
          "flex items-center h-[58px] border-b border-sidebar-border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {/* Quando colapsado, mostrar apenas o botão de expandir */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebarCollapsed}
                  className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Abrir barra lateral</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-3">
                {establishment?.logo ? (
                  <img 
                    src={establishment.logo} 
                    alt={establishment.name || "Logo"}
                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0 ring-1 ring-border/50" style={{width: '37px', height: '37px'}}
                  />
                ) : (
                  <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
                    <Store className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-foreground whitespace-nowrap truncate max-w-[140px]">
                    {establishment?.name || "Cardápio"}
                  </span>
                  {/* Badge de status Aberto/Fechado */}
                  <span className={cn(
                    "text-[10px] font-medium flex items-center gap-1",
                    calculatedIsOpen ? "text-green-600" : "text-red-500"
                  )} style={{fontSize: '12px'}}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      calculatedIsOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} style={{width: '7px', height: '7px'}} />
                    {calculatedIsOpen ? "Aberto" : "Fechado"}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                {/* Toggle button - Desktop only */}
                <button
                  onClick={toggleSidebarCollapsed}
                  className="hidden lg:flex p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  title="Minimizar menu"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
                {/* Close button - Mobile only */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>



        {/* Navigation */}
        <nav ref={sidebarNavRef} className={cn(
          "flex-1 py-4 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "px-1.5" : "px-3"
        )}>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""} style={{marginBottom: '-5px'}}>
              {/* Título da seção */}
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-bold text-primary/70 uppercase tracking-wider px-3 mb-3">
                  {section.title}
                </h3>
              )}
              {sidebarCollapsed && sectionIndex > 0 && (
                <div className="border-t border-border my-3 mx-2" />
              )}
              
              {/* Itens da seção */}
              <div className="space-y-1.5">
                {section.items.map((item: any) => {
                  // ===== PARENT MENU WITH CHILDREN =====
                  if (item.isParent && item.children) {
                    // Filtrar filhos visíveis antes de renderizar
                    const visibleChildren = item.children.filter((child: any) => {
                      if (child.href === '/avaliacoes' && !reviewsEnabled) return false;
                      if (child.href === '/agendados' && !schedulingEnabled) return false;
                      return true;
                    });

                    // Se não há filhos visíveis e o item tem href navegável, renderizar como link direto
                    if (visibleChildren.length === 0 && item.href && !item.href.endsWith('-parent')) {
                      // Renderizar como item regular (sem submenu)
                      const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                      const showOrderBadge = item.href === '/pedidos' && newOrdersCount > 0;

                      const linkContent = (
                        <Link
                          href={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                            sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                            isActive
                              ? "bg-primary/15 text-primary rounded-r-xl -ml-3 pl-6 border-r-4 border-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                          style={!sidebarCollapsed ? {borderRadius: '12px', paddingLeft: '37px', marginRight: '43px', marginLeft: '-27px'} : undefined}
                        >
                          <div className="relative">
                            <item.icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                            {showOrderBadge && sidebarCollapsed && (
                              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse bg-red-500 text-white">
                                {newOrdersCount > 9 ? "9+" : newOrdersCount}
                              </span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-sm flex items-center gap-2 flex-1">
                              {item.label}
                              {showOrderBadge && (
                                <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                  {newOrdersCount > 99 ? "99+" : newOrdersCount}
                                </span>
                              )}
                            </span>
                          )}
                        </Link>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <div key={item.href}>{linkContent}</div>;
                    }

                    const isExpanded = expandedMenus[item.href] || false;
                    const isChildActive = item.children.some((child: any) => 
                      location === child.href || (child.href !== '/' && location.startsWith(child.href))
                    );
                    // Verificar se o próprio item pai está ativo (ex: /pedidos)
                    const isDirectActive = item.href && !item.href.endsWith('-parent') && (
                      location === item.href || (item.href !== '/' && location.startsWith(item.href) && !isChildActive)
                    );
                    // Total badge count from children
                    const childReviewBadge = item.href === '/menu-parent' && reviewsEnabled && typeof unreadReviewCount === 'number' ? unreadReviewCount : 0;
                    const childScheduledBadge = item.href === '/pedidos' ? scheduledPendingCount : 0;
                    const totalBadge = childReviewBadge + childScheduledBadge;

                    const parentClassName = cn(
                      "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer",
                      sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                      isDirectActive
                        ? "bg-primary/15 text-primary border-r-4 border-primary"
                        : isChildActive
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    );

                    if (sidebarCollapsed) {
                      // Quando colapsado, clicar no menu pai expande a sidebar e abre o submenu
                      return (
                        <div key={item.href}>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div
                                className={parentClassName}
                                onClick={() => {
                                  setSidebarCollapsed(false);
                                  setExpandedMenus(prev => ({ ...prev, [item.href]: true }));
                                }}
                              >
                                <div className="relative">
                                  <item.icon className="h-4 w-4 flex-shrink-0 mx-auto" />
                                  {totalBadge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse bg-red-500 text-white">
                                      {totalBadge > 9 ? "9+" : totalBadge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              <p>{item.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }

                    return (
                      <div key={item.href}>
                        {/* Parent item */}
                        <div
                          className={cn(parentClassName, "select-none")}
                          style={{borderRadius: '12px', paddingLeft: '37px', marginRight: '43px', marginLeft: '-27px'}}
                          onClick={() => {
                            // For items that have a navigable href (not just a parent placeholder), navigate to it
                            if (item.href && !item.href.endsWith('-parent')) {
                              navigate(item.href);
                            }
                            // Always toggle the submenu
                            setExpandedMenus(prev => ({ ...prev, [item.href]: !prev[item.href] }));
                          }}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm flex items-center gap-2 flex-1">
                            {item.label}
                            {totalBadge > 0 && (
                               <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                {totalBadge > 99 ? "99+" : totalBadge}
                              </span>
                            )}
                          </span>
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            isExpanded ? "rotate-0" : "-rotate-90"
                          )} />
                        </div>
                        {/* Children */}
                        <div className={cn(
                          "overflow-hidden transition-all duration-200",
                          isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-border/50 pl-1">
                            {item.children.filter((child: any) => {
                              // Ocultar submenu Avaliações quando reviewsEnabled === false
                              if (child.href === '/avaliacoes' && !reviewsEnabled) return false;
                              // Ocultar submenu Agendados quando agendamento não está ativado
                              if (child.href === '/agendados' && !schedulingEnabled) return false;
                              return true;
                            }).map((child: any) => {
                              const childActive = location === child.href || (child.href !== '/' && location.startsWith(child.href));
                              const childBadge = child.badgeKey === 'reviews' && reviewsEnabled && typeof unreadReviewCount === 'number' && unreadReviewCount > 0 ? unreadReviewCount 
                                : child.href === '/agendados' && scheduledPendingCount > 0 ? scheduledPendingCount 
                                : 0;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => handleNavClick(child.href)}
                                  className={cn(
                                    "flex items-center gap-2.5 py-2 text-sm font-medium transition-all duration-200 relative",
                                    "pl-3 pr-3",
                                    childActive
                                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                  )}
                                  style={{borderRadius: '8px', paddingLeft: '12px', marginRight: '8px'}}
                                >
                                  <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="text-sm flex items-center gap-2">
                                    {child.label}
                                    {childBadge > 0 && (
                                      <span className="text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white">
                                        {childBadge > 99 ? "99+" : childBadge}
                                      </span>
                                    )}
                                    {child.isNew && childBadge === 0 && (
                                      <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                        Novo
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ===== REGULAR MENU ITEM =====
                  const isActive = !item.disabled && (location === item.href || 
                    (item.href !== "/" && location.startsWith(item.href)));
                  
                  const showOrderBadge = item.href === "/pedidos" && newOrdersCount > 0;
                  const showStockBadge = item.href === "/estoque" && outOfStockCount > 0;
                  const isComingSoon = item.comingSoon === true;
                  
                  const navContent = (
                    <>
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0", 
                          sidebarCollapsed && "mx-auto",
                          isComingSoon && "opacity-50"
                        )} />
                        {showOrderBadge && sidebarCollapsed && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse",
                            isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                          )}>
                            {newOrdersCount > 9 ? "9+" : newOrdersCount}
                          </span>
                        )}
                        {showStockBadge && sidebarCollapsed && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center",
                            isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                          )}>
                            {outOfStockCount > 9 ? "9+" : outOfStockCount}
                          </span>
                        )}
                        {item.isNew && sidebarCollapsed && !showOrderBadge && !showStockBadge && (
                          <span className="absolute -top-1 -right-2 text-[7px] font-bold bg-red-500 text-white px-1 py-0.5 rounded-full leading-none">
                            N
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className={cn(
                          "text-sm flex items-center gap-2",
                          isComingSoon && "opacity-50"
                        )}>
                          {item.label}
                          {showOrderBadge && (
                            <span className={cn(
                              "text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center animate-pulse",
                              isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                            )}>
                              {newOrdersCount > 99 ? "99+" : newOrdersCount}
                            </span>
                          )}
                          {showStockBadge && (
                            <span className={cn(
                              "text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center",
                              isActive ? "bg-card text-primary" : "bg-red-500 text-white"
                            )}>
                              {outOfStockCount > 99 ? "99+" : outOfStockCount}
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                              Breve
                            </span>
                          )}
                          {item.isNew && !showOrderBadge && !showStockBadge && !isComingSoon && (
                            <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              Novo
                            </span>
                          )}
                        </span>
                      )}
                    </>
                  );

                  const navClassName = cn(
                    "flex items-center gap-2.5 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                    sidebarCollapsed ? "px-0 justify-center rounded-lg" : "pl-3 pr-3",
                    isComingSoon 
                      ? "text-muted-foreground cursor-default"
                      : isActive
                        ? "bg-primary/15 text-primary rounded-r-xl -ml-3 pl-6 border-r-4 border-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  );

                  if (item.disabled) {
                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div className={navClassName}>
                              {navContent}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <p>{item.label}</p>
                            <p className="text-xs text-blue-400">Funcionalidade em desenvolvimento</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            className={navClassName}
                            style={{borderRadius: '12px'}}
                          >
                            {navContent}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          <p>Funcionalidade em desenvolvimento</p>
                          <p className="text-xs text-blue-400">Disponível em breve!</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={() => handleNavClick(item.href)}
                            className={navClassName}
                          >
                            {navContent}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={navClassName} style={{borderRadius: '12px', paddingLeft: '37px', marginRight: '43px', marginLeft: '-27px'}}
                    >
                      {navContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div 
        className={cn("transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-screen overflow-hidden flex flex-col bg-background", mainPadding)}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[58px] bg-card/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between h-full px-3 lg:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos, pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-9 pr-0 h-9 text-sm bg-background border-border/50 rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Tempo Médio de Preparo - Desktop only */}
              <AvgPrepTimeButton establishmentId={establishment?.id} />

              {/* Ver Menu Button */}
              {establishment?.menuSlug && (
                <a
                  href={`/menu/${establishment.menuSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors" style={{borderRadius: '10px'}}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver menu</span>
                </a>
              )}

              {/* Badge Trial */}
              {trialInfo?.isTrial && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-medium transition-colors border",
                        trialInfo.daysRemaining <= 3
                          ? "bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800/50 animate-pulse"
                          : "bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
                      )}
                      style={{ borderRadius: '10px' }}
                    >
                      <Clock className={cn("h-3.5 w-3.5 shrink-0", trialInfo.daysRemaining <= 3 && "text-red-600 dark:text-red-400 animate-pulse")} />
                      {/* Mobile: apenas ícone | Desktop: texto completo */}
                      <span className="hidden md:inline">Avaliação gratuita: {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? 'dia' : 'dias'}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Período de Avaliação</p>
                          <p className="text-xs text-muted-foreground">{trialInfo.trialDays} dias gratuitos</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-100 dark:border-amber-800/30">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          {trialInfo.trialExpired
                            ? 'Seu período de avaliação expirou. Faça upgrade para continuar usando todas as funcionalidades.'
                            : `Você ainda tem ${trialInfo.daysRemaining} ${trialInfo.daysRemaining === 1 ? 'dia' : 'dias'} restantes na sua avaliação gratuita.`
                          }
                        </p>
                      </div>
                      {/* Barra de progresso */}
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(0, ((trialInfo.trialDays! - trialInfo.daysRemaining) / trialInfo.trialDays!) * 100)}%` }}
                        />
                      </div>
                      <Link href="/planos">
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white" size="sm">
                          <Crown className="h-4 w-4 mr-2" />
                          Fazer upgrade agora
                        </Button>
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Botão de Som de Notificação */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:bg-accent bg-card"
                  >
                    {/* Ícone de Som com 2 ondas de volume - cor dinâmica */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={isSoundEnabled ? "#10b981" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-colors">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={isSoundEnabled ? "#10b981" : "#f87171"} />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                    
                    {/* Toggle Switch - mesmo estilo do toggle de abrir/fechar restaurante */}
                    <Switch
                      checked={isSoundEnabled}
                      onCheckedChange={async (checked) => {
                        // Função auxiliar para tocar som de teste
                        const playTestSound = () => {
                          // Pequeno delay para garantir que o áudio está pronto
                          setTimeout(() => {
                            const testAudio = new Audio("/notification.mp3");
                            testAudio.volume = 0.5;
                            testAudio.play().catch(err => {
                              console.log("[Som] Erro ao tocar som de teste:", err);
                            });
                          }, 100);
                        };
                        
                        if (checked) {
                          // Ativando o som
                          // Sempre tentar desbloquear o áudio ao ativar (necessário para mobile)
                          if (!isAudioUnlocked) {
                            await unlockAudio();
                          }
                          setIsSoundEnabled(true);
                          localStorage.setItem("notificationSoundEnabled", "true");
                          // Tocar som de teste breve ao ativar
                          playTestSound();
                          toast.success("Som ativado!", {
                            description: "Você receberá notificações sonoras para novos pedidos.",
                          });
                        } else {
                          // Desativando o som
                          setIsSoundEnabled(false);
                          localStorage.setItem("notificationSoundEnabled", "false");
                          toast.info("Som desativado");
                        }
                      }}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 dark:data-[state=unchecked]:bg-red-600 scale-90"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isSoundEnabled
                    ? "Som ativado - clique para desativar"
                    : "Som desativado - clique para ativar"
                  }
                </TooltipContent>
              </Tooltip>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-accent">
                    <Avatar className="h-7 w-7 ring-2 ring-border/50">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {(establishment?.ownerDisplayName || user.name)?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-semibold max-w-[100px] truncate">
                        {establishment?.ownerDisplayName || user.name || "Usuário"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Admin</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-elevated border-border/50">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-sm font-semibold">{establishment?.ownerDisplayName || user.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {/* Container Aberto/Fechado - Combina horários automáticos com fechamento manual */}
                  {establishment && (
                    <div className="px-3 py-2 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            calculatedIsOpen ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                          )} />
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-sm font-medium",
                              calculatedIsOpen ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                              {calculatedIsOpen ? "Aberto agora" : "Fechado agora"}
                            </span>
                            {isForcedClosed && (
                              <span className="text-[10px] text-amber-600">
                                Fechado manualmente
                              </span>
                            )}
                            {isForcedOpen && (
                              <span className="text-[10px] text-blue-600">
                                Aberto manualmente
                              </span>
                            )}
                            {!calculatedIsOpen && statusMessage && (
                              <span className="text-[10px] text-muted-foreground">
                                {statusMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={calculatedIsOpen}
                                onCheckedChange={handleToggleOpen}
                                disabled={toggleOpenMutation.isPending}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-400 scale-90"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px]">
                            <p className="text-xs">
                              {calculatedIsOpen
                                ? "Desative para fechar a loja manualmente (imprevistos, força maior). A loja reabrirá automaticamente no próximo horário configurado." 
                                : "Ative para abrir a loja manualmente agora."}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                  <div className="p-1">
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer" 
                      onSelect={() => { window.location.href = "/ajuda"; }}
                    >
                      <HelpCircle className="h-4 w-4 mr-2.5" />
                      Ajuda e suporte
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer" 
                      onSelect={() => setFeedbackOpen(true)}
                    >
                      <MessageSquarePlus className="h-4 w-4 mr-2.5" />
                      Enviar Feedback
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg cursor-pointer" 
                      onSelect={() => window.location.href = '/planos'}
                    >
                      <Crown className="h-4 w-4 mr-2.5" />
                      Planos
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {/* Tema */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-xs font-medium text-muted-foreground">Tema</p>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="rounded-lg cursor-pointer"
                    >
                      {theme === 'dark' ? (
                        <Moon className="h-4 w-4 mr-2.5 text-blue-500" />
                      ) : (
                        <Sun className="h-4 w-4 mr-2.5 text-amber-500" />
                      )}
                      {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                      <span className="ml-auto text-[10px] text-muted-foreground">Ativado</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive cursor-pointer rounded-lg focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2.5" />
                      Sair
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-3 lg:p-6 [&:has(>[data-settings-page])]:overflow-hidden [&:has(>[data-settings-page])]:p-0">
          {children}
        </main>

        {/* Banner de WhatsApp desconectado - fixo no inferior */}
        <WhatsAppDisconnectedBanner />
      </div>

      {/* Modal de Feedback */}
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        establishmentId={establishment?.id}
        establishmentName={establishment?.name}
      />

      {/* Modal obrigatório de upgrade quando trial expira */}
      {/* Não mostra na página de planos (exceção) */}
      {trialInfo?.trialExpired && location !== "/planos" && (
        <TrialExpiredModal />
      )}
    </div>
  );
}
