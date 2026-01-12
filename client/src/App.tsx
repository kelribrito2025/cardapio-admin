import { Toaster } from "@/components/ui/sonner";
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
import Configuracoes from "./pages/Configuracoes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/catalogo/novo" component={ProductForm} />
      <Route path="/catalogo/editar/:id" component={ProductForm} />
      <Route path="/pedidos" component={Pedidos} />
      <Route path="/configuracoes" component={Configuracoes} />
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
