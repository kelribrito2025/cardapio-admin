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
  X,
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
  Tag,
  Layers,
  Megaphone,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { toast } from "sonner";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

// Seções do menu lateral
const menuSections = [
  {
    title: "OPERAÇÕES",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", disabled: false },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { icon: ClipboardList, label: "Pedidos", href: "/pedidos", disabled: false },
      { icon: UtensilsCrossed, label: "Cardápio", href: "/catalogo", disabled: false },
      { icon: Tag, label: "Categorias", href: "/categorias", disabled: false },
      { icon: Layers, label: "Complementos", href: "/complementos", disabled: false },
      { icon: Package, label: "Estoque", href: "/estoque", disabled: true, comingSoon: true },
    ]
  },
  {
    title: "MARKETING",
    items: [
      { icon: Ticket, label: "Cupons", href: "/cupons", disabled: true, comingSoon: true },
      { icon: Megaphone, label: "Campanhas", href: "/campanhas", disabled: true, comingSoon: true },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { icon: Settings, label: "Configurações", href: "/configuracoes", disabled: false },
    ]
  },
];

// Lista plana para compatibilidade
const navItems = menuSections.flatMap(section => section.items);

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const [location] = useLocation();
  const { newOrdersCount, unlockAudio, isAudioUnlocked } = useNewOrders();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado local para controlar se o som está habilitado (sincronizado com localStorage)
  // IMPORTANTE: O padrão é FALSE (desativado) até o usuário clicar para ativar
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      // Só retorna true se explicitamente definido como "true"
      return localStorage.getItem("notificationSoundEnabled") === "true";
    }
    return false;
  });
  
  // Sincronizar estado com localStorage quando o componente monta ou navega
  useEffect(() => {
    const syncSoundState = () => {
      const storedValue = localStorage.getItem("notificationSoundEnabled");
      const shouldBeEnabled = storedValue === "true";
      if (isSoundEnabled !== shouldBeEnabled) {
        setIsSoundEnabled(shouldBeEnabled);
      }
    };
    
    // Sincronizar imediatamente
    syncSoundState();
    
    // Ouvir mudanças no localStorage (para sincronizar entre abas)
    window.addEventListener("storage", syncSoundState);
    return () => window.removeEventListener("storage", syncSoundState);
  }, []);
  
  // Listener global para notificação de novo pedido - funciona em todas as páginas
  useEffect(() => {
    const handleNewOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("[AdminLayout] Evento de novo pedido recebido:", customEvent.detail);
      
      // Mostrar toast de notificação global
      toast.success("Novo pedido recebido!", {
        description: "Um novo pedido acabou de chegar.",
        duration: 5000,
        action: {
          label: "Ver pedidos",
          onClick: () => {
            window.location.href = "/pedidos";
          },
        },
      });
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

  // Get establishment data
  const { data: establishment, refetch: refetchEstablishment } = trpc.establishment.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Get business hours to calculate if store is currently open
  const { data: businessHoursData } = trpc.establishment.getBusinessHours.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );

  // Calculate if store is currently open based on business hours
  const isCurrentlyOpen = () => {
    // Se não temos dados de horários, considerar fechado
    // Não usamos mais o campo isOpen do banco
    if (!businessHoursData || businessHoursData.length === 0) {
      return false;
    }
    
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes(); // Minutos desde meia-noite
    
    // Buscar horário do dia atual
    const todayHours = businessHoursData.find((h: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }) => h.dayOfWeek === currentDay);
    const yesterdayDay = currentDay === 0 ? 6 : currentDay - 1;
    const yesterdayHours = businessHoursData.find((h: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }) => h.dayOfWeek === yesterdayDay);
    
    // Função auxiliar para verificar se o horário atravessa meia-noite
    const crossesMidnight = (openTime: string, closeTime: string) => {
      const [openH] = openTime.split(':').map(Number);
      const [closeH] = closeTime.split(':').map(Number);
      return closeH < openH || (closeH === openH && closeTime < openTime);
    };
    
    // Verificar horário de hoje
    if (todayHours?.isActive && todayHours.openTime && todayHours.closeTime) {
      const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
      const openTimeMinutes = openHour * 60 + openMin;
      const closeTimeMinutes = closeHour * 60 + closeMin;
      
      if (crossesMidnight(todayHours.openTime, todayHours.closeTime)) {
        // Horário atravessa meia-noite (ex: 18:00 - 02:00)
        // Está aberto se: hora atual >= abertura (ex: 18:00 até 23:59)
        if (currentTime >= openTimeMinutes) {
          return true;
        }
      } else {
        // Horário normal no mesmo dia (ex: 08:00 - 22:00)
        if (currentTime >= openTimeMinutes && currentTime < closeTimeMinutes) {
          return true;
        }
      }
    }
    
    // Verificar horário de ontem que atravessa meia-noite
    // Ex: Se ontem abriu 18:00-02:00, e agora são 01:00, ainda está aberto
    if (yesterdayHours?.isActive && yesterdayHours.openTime && yesterdayHours.closeTime) {
      if (crossesMidnight(yesterdayHours.openTime, yesterdayHours.closeTime)) {
        const [closeHour, closeMin] = yesterdayHours.closeTime.split(':').map(Number);
        const closeTimeMinutes = closeHour * 60 + closeMin;
        // Está aberto se: hora atual < fechamento (ex: 00:00 até 02:00)
        if (currentTime < closeTimeMinutes) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Calcula o próximo horário de abertura
  const getNextOpeningTime = (): { dayName: string; time: string; isToday: boolean; isTomorrow: boolean } | null => {
    if (!businessHoursData || businessHoursData.length === 0) return null;
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay();
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes();
    
    // Procurar nos próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayHours = businessHoursData.find((h: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }) => h.dayOfWeek === checkDay);
      
      if (dayHours?.isActive && dayHours.openTime) {
        const [openHour, openMin] = dayHours.openTime.split(':').map(Number);
        const openTimeMinutes = openHour * 60 + openMin;
        
        // Se for hoje, verificar se o horário de abertura ainda não passou
        if (i === 0) {
          if (openTimeMinutes > currentTime) {
            return {
              dayName: dayNames[checkDay],
              time: dayHours.openTime,
              isToday: true,
              isTomorrow: false
            };
          }
          // Se já passou o horário de abertura hoje, verificar se ainda está dentro do horário
          if (dayHours.closeTime) {
            const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number);
            const closeTimeMinutes = closeHour * 60 + closeMin;
            if (currentTime < closeTimeMinutes) {
              // Ainda está aberto, não precisa retornar próximo horário
              continue;
            }
          }
        } else {
          return {
            dayName: dayNames[checkDay],
            time: dayHours.openTime,
            isToday: false,
            isTomorrow: i === 1
          };
        }
      }
    }
    
    return null;
  };

  // Verifica se deve reabrir automaticamente (fechamento manual expirou)
  const shouldAutoReopen = (): boolean => {
    if (!establishment?.manuallyClosed || !establishment?.manuallyClosedAt) return false;
    if (!businessHoursData || businessHoursData.length === 0) return false;
    
    // Usar timezone de Brasília para cálculos
    const now = new Date();
    const brasiliaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = brasiliaDate.getDay();
    const currentTime = brasiliaDate.getHours() * 60 + brasiliaDate.getMinutes();
    const closedAt = new Date(establishment.manuallyClosedAt);
    
    // Encontrar o horário de hoje
    const todayHours = businessHoursData.find((h: { dayOfWeek: number; isActive: boolean; openTime: string | null; closeTime: string | null }) => h.dayOfWeek === currentDay);
    
    if (!todayHours?.isActive || !todayHours.openTime) return false;
    
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    
    // Se o fechamento foi em um dia anterior e hoje tem horário de abertura que já passou
    const closedDate = new Date(closedAt);
    closedDate.setHours(0, 0, 0, 0);
    const today = new Date(brasiliaDate);
    today.setHours(0, 0, 0, 0);
    
    if (closedDate.getTime() < today.getTime() && currentTime >= openTimeMinutes) {
      return true;
    }
    
    // Se o fechamento foi antes do horário de abertura de hoje e agora já passou o horário
    const closedTimeMinutes = closedAt.getHours() * 60 + closedAt.getMinutes();
    if (closedAt.toDateString() === brasiliaDate.toDateString() && closedTimeMinutes < openTimeMinutes && currentTime >= openTimeMinutes) {
      return true;
    }
    
    return false;
  };

  // Valor calculado de se está aberto:
  // Lógica simplificada:
  // 1. Se manuallyClosed E não deve reabrir automaticamente → Fechado
  // 2. Se manuallyClosed E deve reabrir automaticamente → Aberto (se dentro do horário)
  // 3. Se não manuallyClosed → Segue horário configurado (ignora toggle isOpen)
  const isWithinBusinessHours = isCurrentlyOpen();
  const autoReopen = shouldAutoReopen();
  const nextOpening = getNextOpeningTime();
  
  // Determinar status final
  let calculatedIsOpen = false;
  let isForcedClosed = false;
  let statusMessage = '';
  
  if (establishment?.manuallyClosed && !autoReopen) {
    // Fechado manualmente e não deve reabrir ainda
    calculatedIsOpen = false;
    isForcedClosed = true;
    if (nextOpening) {
      if (nextOpening.isToday) {
        statusMessage = `Abriremos hoje às ${nextOpening.time}`;
      } else if (nextOpening.isTomorrow) {
        statusMessage = `Abriremos amanhã às ${nextOpening.time}`;
      } else {
        statusMessage = `Abriremos ${nextOpening.dayName} às ${nextOpening.time}`;
      }
    }
  } else if (establishment?.manuallyClosed && autoReopen) {
    // Deve reabrir automaticamente
    calculatedIsOpen = isWithinBusinessHours;
    isForcedClosed = false;
  } else {
    // Segue horário configurado - se estiver dentro do horário, está aberto
    // O toggle isOpen não é mais usado para controlar abertura/fechamento
    calculatedIsOpen = isWithinBusinessHours;
    isForcedClosed = false;
    if (!isWithinBusinessHours && nextOpening) {
      if (nextOpening.isToday) {
        statusMessage = `Abriremos hoje às ${nextOpening.time}`;
      } else if (nextOpening.isTomorrow) {
        statusMessage = `Abriremos amanhã às ${nextOpening.time}`;
      } else {
        statusMessage = `Abriremos ${nextOpening.dayName} às ${nextOpening.time}`;
      }
    }
  }

  // Toggle store open/closed - usa nova lógica de fechamento manual
  const toggleOpenMutation = trpc.establishment.setManualClose.useMutation({
    onSuccess: () => {
      refetchEstablishment();
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

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // Sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? "w-[63px]" : "w-[269px]";
  const mainPadding = sidebarCollapsed ? "lg:pl-[63px]" : "lg:pl-[269px]";

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
          background: "#ffffff"
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
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
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
                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0" style={{width: '37px', height: '37px'}}
                  />
                ) : (
                  <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
                    <Store className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-gray-800 whitespace-nowrap truncate max-w-[140px]">
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
                  className="hidden lg:flex p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
                  title="Minimizar menu"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
                {/* Close button - Mobile only */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </>
          )}
        </div>



        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-4 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "px-1.5" : "px-3"
        )}>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""} style={{marginBottom: '-5px'}}>
              {/* Título da seção */}
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                  {section.title}
                </h3>
              )}
              {sidebarCollapsed && sectionIndex > 0 && (
                <div className="border-t border-gray-200 my-3 mx-2" />
              )}
              
              {/* Itens da seção */}
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = !item.disabled && (location === item.href || 
                    (item.href !== "/" && location.startsWith(item.href)));
                  
                  // Verificar se é o item de Pedidos e se tem pedidos novos
                  const showOrderBadge = item.href === "/pedidos" && newOrdersCount > 0;
                  
                  // Verificar se é item "Em breve"
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
                            isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                          )}>
                            {newOrdersCount > 9 ? "9+" : newOrdersCount}
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
                              isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                            )}>
                              {newOrdersCount > 99 ? "99+" : newOrdersCount}
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                              Breve
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
                      ? "text-gray-400 cursor-default"
                      : isActive
                        ? "bg-red-200/60 text-red-800 rounded-r-xl -ml-3 pl-6"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  );

                  // Se o item está desabilitado, renderizar como div sem navegação
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
                            {item.label} (Em breve)
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return (
                      <div
                        key={item.href}
                        className={navClassName}
                        style={{borderRadius: '12px'}}
                      >
                        {navContent}
                      </div>
                    );
                  }

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={handleNavClick}
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
                      onClick={handleNavClick}
                      className={navClassName} style={{borderRadius: '12px', paddingLeft: '37px', marginRight: '20px', marginLeft: '-27px'}}
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
        className={cn("transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-screen bg-gray-50", mainPadding)}
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
              {/* Ver Menu Button */}
              {establishment?.menuSlug && (
                <a
                  href={`/menu/${establishment.menuSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver menu</span>
                </a>
              )}

              {/* Botão de Som de Notificação */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:bg-gray-200" style={{backgroundColor: '#ffffff'}}
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
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-300 scale-90"
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
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-semibold max-w-[100px] truncate">
                        {user.name || "Usuário"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Admin</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-elevated border-border/50">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-sm font-semibold">{user.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {/* Container Aberto/Fechado - Combina horários automáticos com fechamento manual */}
                  {establishment && (
                    <div className="px-3 py-2 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            calculatedIsOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
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
                                className="data-[state=checked]:bg-emerald-500 scale-90"
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
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/configuracoes">
                        <Settings className="h-4 w-4 mr-2.5" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg cursor-default opacity-50" 
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Crown className="h-4 w-4 mr-2.5" />
                      Planos
                      <span className="ml-auto text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        Breve
                      </span>
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
        <main className="p-3 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
