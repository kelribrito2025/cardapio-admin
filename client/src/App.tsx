import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import ProductForm from "./pages/ProductForm";
import Pedidos from "./pages/Pedidos";
import Estoque from "./pages/Estoque";
import Configuracoes from "./pages/Configuracoes";
import Planos from "./pages/Planos";
import PublicMenu from "./pages/PublicMenu";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/criar-conta" component={Register} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      
      {/* App routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/catalogo/novo" component={ProductForm} />
      <Route path="/catalogo/editar/:id" component={ProductForm} />
      <Route path="/pedidos" component={Pedidos} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/planos" component={Planos} />
      
      {/* Public menu route */}
      <Route path="/menu/:slug" component={PublicMenu} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
