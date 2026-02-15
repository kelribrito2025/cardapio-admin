import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NewOrdersProvider } from "./contexts/NewOrdersContext";
import { SearchProvider } from "./contexts/SearchContext";

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
import Complementos from "./pages/Complementos";
import Campanhas from "./pages/Campanhas";
import PDV from "./pages/PDV";
import AccountSecurity from "./pages/AccountSecurity";
import Ajuda from "./pages/Ajuda";
import MesasComandas from "./pages/MesasComandas";
import Avaliacoes from "./pages/Avaliacoes";
import Entregadores from "./pages/Entregadores";
import Agendados from "./pages/Agendados";
import EntregadorDetalhes from "./pages/EntregadorDetalhes";
import { GlobalPDVHandle } from "./components/GlobalPDVHandle";

// Admin Pages (Super Admin)
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurantes from "./pages/admin/AdminRestaurantes";
import AdminRestauranteDetalhe from "./pages/admin/AdminRestauranteDetalhe";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminTrials from "./pages/admin/AdminTrials";
import AdminRelatorios from "./pages/admin/AdminRelatorios";

// Landing Page
import LandingPage from "./pages/LandingPage";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";

// Componente wrapper para rotas do admin que precisam do NewOrdersProvider
function AdminRoutes() {
  return (
    <SearchProvider>
    <NewOrdersProvider>
      <GlobalPDVHandle />
      <Switch>
        {/* App routes - Admin Panel */}
        <Route path="/" component={Dashboard} />
        <Route path="/catalogo" component={Catalogo} />
        <Route path="/catalogo/novo" component={ProductForm} />
        <Route path="/catalogo/editar/:id" component={ProductForm} />
        <Route path="/complementos" component={Complementos} />
        <Route path="/pedidos" component={Pedidos} />
        <Route path="/agendados" component={Agendados} />
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
        <Route path="/mesas" component={MesasComandas} />
        <Route path="/avaliacoes" component={Avaliacoes} />
        <Route path="/entregadores" component={Entregadores} />
        <Route path="/entregadores/:id" component={EntregadorDetalhes} />
        <Route path="/conta-seguranca" component={AccountSecurity} />
        <Route path="/ajuda" component={Ajuda} />
        
        
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </NewOrdersProvider>
    </SearchProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing Page - rota pública */}
      <Route path="/landing" component={LandingPage} />
      
      {/* Auth routes - sem NewOrdersProvider */}
      <Route path="/login" component={Login} />
      <Route path="/criar-conta" component={Register} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Public menu route - sem NewOrdersProvider (não deve ter som de notificação) */}
      <Route path="/menu/:slug" component={PublicMenu} />
      
      {/* PWA de Impressão Automática */}
      <Route path="/printer-app" component={PrinterApp} />
      
      {/* Super Admin routes - sem NewOrdersProvider */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/restaurantes/:id" component={AdminRestauranteDetalhe} />
      <Route path="/admin/restaurantes" component={AdminRestaurantes} />
      <Route path="/admin/planos" component={AdminPlanos} />
      <Route path="/admin/trials" component={AdminTrials} />
      <Route path="/admin/relatorios" component={AdminRelatorios} />
      
      {/* Restaurant admin routes - com NewOrdersProvider */}
      <Route>
        <AdminRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster position="top-right" closeButton />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
