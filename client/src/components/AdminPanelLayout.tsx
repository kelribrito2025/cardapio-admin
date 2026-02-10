/**
 * AdminPanelLayout - Layout do painel administrativo global (/admin).
 * Sidebar com navegação, header com info do admin.
 * Mesmo estilo visual da dashboard do restaurante.
 * NÃO confundir com AdminLayout.tsx (layout do painel do restaurante).
 */
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Clock,
  BarChart3,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Store, label: "Restaurantes", path: "/admin/restaurantes" },
  { icon: CreditCard, label: "Planos", path: "/admin/planos" },
  { icon: Clock, label: "Trials", path: "/admin/trials" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
];

interface AdminPanelLayoutProps {
  children: React.ReactNode;
}

export default function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { forceTheme } = useTheme();

  // Forçar tema light no /admin - nunca herdar dark mode de outras áreas
  useEffect(() => {
    forceTheme("light");
    return () => {
      forceTheme(null);
    };
  }, [forceTheme]);

  const adminMe = trpc.admin.auth.me.useQuery(undefined, {
    retry: false,
  });

  const logoutMutation = trpc.admin.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado.");
      navigate("/admin/login");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!adminMe.isLoading && !adminMe.data) {
      navigate("/admin/login");
    }
  }, [adminMe.isLoading, adminMe.data, navigate]);

  if (adminMe.isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!adminMe.data) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-muted/50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">Super Admin</h2>
            <p className="text-xs text-muted-foreground truncate">{adminMe.data.email}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-red-50 text-red-600"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-red-500" : "text-muted-foreground"}`} />
                  {item.label}
                  {active && <ChevronRight className="h-4 w-4 ml-auto text-red-400" />}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border/50 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="font-medium">Administrador</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
