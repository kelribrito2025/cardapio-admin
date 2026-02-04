import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NewOrdersProvider } from "./contexts/NewOrdersContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import ProductForm from "./pages/ProductForm";
import Pedidos from "./pages/Pedidos";
import Estoque from "./pages/Estoque";
import Configuracoes from "./pages/Configuracoes";
import Planos from "./pages/Planos";
import PublicMenu from "./pages/PublicMenu";
import Cupons from "./pages/Cupons";
import CouponForm from "./pages/CouponForm";
import PrinterApp from "./pages/PrinterApp";
import TesteImpressao from "./pages/TesteImpressao";
import Impressoras from "./pages/Impressoras";
import Categorias from "./pages/Categorias";
import Complementos from "./pages/Complementos";
import Campanhas from "./pages/Campanhas";
import PDV from "./pages/PDV";
import AccountSecurity from "./pages/AccountSecurity";


// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";

// Componente wrapper para rotas do admin que precisam do NewOrdersProvider
function AdminRoutes() {
  return (
    <NewOrdersProvider>
      <Switch>
        {/* App routes - Admin Panel */}
        <Route path="/" component={Dashboard} />
        <Route path="/catalogo" component={Catalogo} />
        <Route path="/catalogo/novo" component={ProductForm} />
        <Route path="/catalogo/editar/:id" component={ProductForm} />
        <Route path="/categorias" component={Categorias} />
        <Route path="/complementos" component={Complementos} />
        <Route path="/pedidos" component={Pedidos} />
        <Route path="/estoque" component={Estoque} />
        <Route path="/configuracoes" component={Configuracoes} />
        <Route path="/planos" component={Planos} />
        <Route path="/cupons" component={Cupons} />
        <Route path="/cupons/novo" component={CouponForm} />
        <Route path="/cupons/:id" component={CouponForm} />
        <Route path="/teste-impressao" component={TesteImpressao} />
        <Route path="/impressoras" component={Impressoras} />
        <Route path="/campanhas" component={Campanhas} />
        <Route path="/pdv" component={PDV} />
        <Route path="/conta-seguranca" component={AccountSecurity} />
        
        
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
      <Route path="/menu/:slug" component={PublicMenu} />
      
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
          <Toaster 
            position="top-right" 
            closeButton 
            toastOptions={{
              classNames: {
                toast: 'bg-red-600 border-red-600 text-white',
                title: 'text-white font-medium',
                description: 'text-white/90',
                actionButton: 'bg-white text-red-600 hover:bg-white/90',
                cancelButton: 'bg-white/20 text-white hover:bg-white/30',
                closeButton: 'bg-white/20 text-white hover:bg-white/30 border-0',
                success: 'bg-red-600 border-red-600',
                error: 'bg-red-700 border-red-700',
                info: 'bg-red-600 border-red-600',
                warning: 'bg-red-600 border-red-600',
                loading: 'bg-red-600 border-red-600',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
