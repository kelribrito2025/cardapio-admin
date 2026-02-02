import { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NewOrdersProvider } from "./contexts/NewOrdersContext";

// Lazy loaded pages (heavy pages)
const PublicMenu = lazy(() => import("./pages/PublicMenu"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const ProductForm = lazy(() => import("./pages/ProductForm"));

// Regular imports (frequently accessed or small pages)
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import Estoque from "./pages/Estoque";
import Planos from "./pages/Planos";
import Cupons from "./pages/Cupons";
import CouponForm from "./pages/CouponForm";
import PrinterApp from "./pages/PrinterApp";
import TesteImpressao from "./pages/TesteImpressao";
import Impressoras from "./pages/Impressoras";
import Categorias from "./pages/Categorias";
import Complementos from "./pages/Complementos";
import Campanhas from "./pages/Campanhas";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    </div>
  );
}

// Componente wrapper para rotas do admin que precisam do NewOrdersProvider
function AdminRoutes() {
  return (
    <NewOrdersProvider>
      <Switch>
        {/* App routes - Admin Panel */}
        <Route path="/" component={Dashboard} />
        <Route path="/catalogo" component={Catalogo} />
        <Route path="/catalogo/novo">
          <Suspense fallback={<PageLoader />}>
            <ProductForm />
          </Suspense>
        </Route>
        <Route path="/catalogo/editar/:id">
          {(params) => (
            <Suspense fallback={<PageLoader />}>
              <ProductForm />
            </Suspense>
          )}
        </Route>
        <Route path="/categorias" component={Categorias} />
        <Route path="/complementos" component={Complementos} />
        <Route path="/pedidos">
          <Suspense fallback={<PageLoader />}>
            <Pedidos />
          </Suspense>
        </Route>
        <Route path="/estoque" component={Estoque} />
        <Route path="/configuracoes">
          <Suspense fallback={<PageLoader />}>
            <Configuracoes />
          </Suspense>
        </Route>
        <Route path="/planos" component={Planos} />
        <Route path="/cupons" component={Cupons} />
        <Route path="/cupons/novo" component={CouponForm} />
        <Route path="/cupons/:id" component={CouponForm} />
        <Route path="/teste-impressao" component={TesteImpressao} />
        <Route path="/impressoras" component={Impressoras} />
        <Route path="/campanhas" component={Campanhas} />
        
        
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </NewOrdersProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Auth routes - sem NewOrdersProvider */}
      <Route path="/login" component={Login} />
      <Route path="/criar-conta" component={Register} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Public menu route - sem NewOrdersProvider (não deve ter som de notificação) */}
      <Route path="/menu/:slug">
        {(params) => (
          <Suspense fallback={<PageLoader />}>
            <PublicMenu />
          </Suspense>
        )}
      </Route>
      
      {/* PWA de Impressão Automática */}
      <Route path="/printer-app" component={PrinterApp} />
      
      {/* Admin routes - com NewOrdersProvider */}
      <Route>
        <AdminRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" closeButton />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
