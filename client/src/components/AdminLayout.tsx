import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Package,
  Tag,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: UtensilsCrossed, label: "Cardápio", href: "/catalogo" },
  { icon: ClipboardList, label: "Pedidos", href: "/pedidos" },
  { icon: Package, label: "Estoque", href: "/estoque", placeholder: true },
  { icon: Tag, label: "Promoções", href: "/promocoes", placeholder: true },
  { icon: Users, label: "Clientes", href: "/clientes", placeholder: true },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios", placeholder: true },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
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

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.placeholder) {
      toast.info("Funcionalidade em breve");
    }
    setSidebarOpen(false);
  };

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
          "fixed top-0 left-0 z-50 h-full w-72 border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, oklch(0.99 0.002 250) 0%, oklch(0.96 0.005 250) 100%)",
          boxShadow: "4px 0 25px rgba(0, 0, 0, 0.06), 1px 0 10px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-gray-800">Cardápio</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            if (item.placeholder) {
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Store info at bottom */}
        {establishment && (
          <div className="p-4 mx-4 mb-4 bg-gray-100/80 rounded-xl border border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
              Estabelecimento
            </p>
            <p className="font-semibold text-gray-800 truncate">
              {establishment.name || "Meu Restaurante"}
            </p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[72px] bg-card/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 hover:bg-accent rounded-xl transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos, pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 pl-11 h-11 bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Store toggle */}
              {establishment && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-background rounded-xl border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      establishment.isOpen ? "bg-emerald-500 pulse-dot" : "bg-gray-400"
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
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-accent">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-card" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 px-3 h-11 rounded-xl hover:bg-accent">
                    <Avatar className="h-9 w-9 ring-2 ring-border/50">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold max-w-[120px] truncate">
                        {user.name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">Admin</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-elevated border-border/50">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-sm font-semibold">{user.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/configuracoes">
                        <Settings className="h-4 w-4 mr-2.5" />
                        Configurações
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
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
