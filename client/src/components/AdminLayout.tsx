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
  { icon: UtensilsCrossed, label: "Catálogo", href: "/catalogo" },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Cardápio</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-sidebar-accent rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            if (item.placeholder) {
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Store name at bottom */}
        {establishment && (
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 mb-1">Estabelecimento</p>
            <p className="font-medium truncate">{establishment.name}</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos, pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9 bg-background"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Store toggle */}
              {establishment && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border">
                  <span className={cn(
                    "text-sm font-medium",
                    establishment.isOpen ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {establishment.isOpen ? "Aberto" : "Fechado"}
                  </span>
                  <Switch
                    checked={establishment.isOpen}
                    onCheckedChange={handleToggleOpen}
                    disabled={toggleOpenMutation.isPending}
                  />
                </div>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                      {user.name || "Usuário"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/configuracoes" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
