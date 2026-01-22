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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: UtensilsCrossed, label: "Cardápio", href: "/catalogo" },
  { icon: ClipboardList, label: "Pedidos", href: "/pedidos" },
  { icon: Package, label: "Estoque", href: "/estoque" },
  { icon: Ticket, label: "Cupons", href: "/cupons" },
];

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

  // Toggle store open/closed
  const toggleOpenMutation = trpc.establishment.toggleOpen.useMutation({
    onSuccess: () => {
      refetchEstablishment();
      toast.success(establishment?.isOpen ? "Loja fechada" : "Loja aberta");
    },
    onError: () => {
      toast.error("Erro ao alterar status da loja");
    },
  });

  const handleToggleOpen = () => {
    if (establishment) {
      toggleOpenMutation.mutate({
        id: establishment.id,
        isOpen: !establishment.isOpen,
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
  const sidebarWidth = sidebarCollapsed ? "w-[78px]" : "w-[269px]";
  const mainPadding = sidebarCollapsed ? "lg:pl-[78px]" : "lg:pl-[269px]";

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
          "fixed top-0 left-0 z-50 h-full border-r border-sidebar-border transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        style={{
          background: "linear-gradient(180deg, oklch(0.99 0.002 250) 0%, oklch(0.96 0.005 250) 100%)",
          boxShadow: "4px 0 25px rgba(0, 0, 0, 0.06), 1px 0 10px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Logo + Toggle button na mesma linha */}
        <div className={cn(
          "flex items-center h-[58px] border-b border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link href="/" className="flex items-center gap-3">
            {establishment?.logo ? (
              <img 
                src={establishment.logo} 
                alt={establishment.name || "Logo"}
                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            {!sidebarCollapsed && (
              <span className="font-semibold text-base text-gray-800 whitespace-nowrap truncate max-w-[140px]">
                {establishment?.name || "Cardápio"}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            {/* Toggle button - Desktop only */}
            <button
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            {/* Close button - Mobile only */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>



        {/* Navigation */}
        <nav className={cn(
          "flex-1 py-1.5 space-y-1 overflow-y-auto",
          sidebarCollapsed ? "px-1.5" : "px-3"
        )}>
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            // Verificar se é o item de Pedidos e se tem pedidos novos
            const showBadge = item.href === "/pedidos" && newOrdersCount > 0;
            
            const navContent = (
              <>
                <div className="relative">
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed && "mx-auto")} />
                  {showBadge && sidebarCollapsed && (
                    <span className={cn(
                      "absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse",
                      isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                    )}>
                      {newOrdersCount > 9 ? "9+" : newOrdersCount}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-sm flex items-center gap-2">
                    {item.label}
                    {showBadge && (
                      <span className={cn(
                        "text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center animate-pulse",
                        isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                      )}>
                        {newOrdersCount > 99 ? "99+" : newOrdersCount}
                      </span>
                    )}
                  </span>
                )}
              </>
            );

            const navClassName = cn(
              "flex items-center gap-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              sidebarCollapsed ? "px-0 justify-center" : "px-3",
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            );

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
                className={navClassName} style={{borderRadius: '9px'}}
              >
                {navContent}
              </Link>
            );
          })}
        </nav>



        {/* Free Trial Card - Expanded (at the very bottom) */}
        {!sidebarCollapsed && (
          <div className="mt-auto mx-3 mb-3 p-4 rounded-xl bg-card border border-border/50 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-foreground font-semibold text-sm">
                  Avaliação gratuita
                </h4>
                <p className="text-muted-foreground text-xs">
                  15 dias restantes
                </p>
              </div>
            </div>
            <button className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              Atualizar agora
            </button>
          </div>
        )}

        {/* Free Trial Card - Collapsed (at the very bottom) */}
        {sidebarCollapsed && (
          <div className="mt-auto">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="mx-2 mb-4 p-3 rounded-xl border border-gray-200/50 flex justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(239,68,68,0.15) 100%)"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p className="text-red-500 font-semibold">Avaliação gratuita</p>
                <p className="text-xs text-gray-500">15 dias restantes</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-300 ease-in-out", mainPadding)}>
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
                  className="w-56 pl-9 h-9 text-sm bg-background border-border/50 rounded-lg focus:ring-2 focus:ring-primary/20"
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "relative h-9 w-9 rounded-lg hover:bg-accent transition-colors",
                      !isAudioUnlocked && "animate-pulse"
                    )}
                    onClick={async () => {
                      if (!isAudioUnlocked) {
                        const unlocked = await unlockAudio();
                        if (unlocked) {
                          setIsSoundEnabled(true);
                          localStorage.setItem("notificationSoundEnabled", "true");
                          toast.success("Som ativado!", {
                            description: "Você receberá notificações sonoras para novos pedidos.",
                          });
                        }
                      } else {
                        // Toggle som
                        if (!isSoundEnabled) {
                          setIsSoundEnabled(true);
                          localStorage.setItem("notificationSoundEnabled", "true");
                          toast.success("Som ativado!");
                        } else {
                          setIsSoundEnabled(false);
                          localStorage.setItem("notificationSoundEnabled", "false");
                          toast.info("Som desativado");
                        }
                      }
                    }}
                  >
                    {isAudioUnlocked ? (
                      isSoundEnabled ? (
                        <Volume2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <VolumeX className="h-4 w-4 text-amber-500" />
                    )}
                    {!isAudioUnlocked && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full ring-2 ring-card flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!isAudioUnlocked 
                    ? "Clique para ativar som de notificação" 
                    : isSoundEnabled
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
                  {/* Container Aberto/Fechado */}
                  {establishment && (
                    <div className="px-3 py-2 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            establishment.isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            establishment.isOpen ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {establishment.isOpen ? "Aberto" : "Fechado"}
                          </span>
                        </div>
                        <Switch
                          checked={establishment.isOpen}
                          onCheckedChange={handleToggleOpen}
                          disabled={toggleOpenMutation.isPending}
                          className="data-[state=checked]:bg-emerald-500 scale-90"
                        />
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
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/planos">
                        <Crown className="h-4 w-4 mr-2.5" />
                        Planos
                      </Link>
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
