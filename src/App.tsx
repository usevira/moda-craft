import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Estoque from "./pages/Estoque";
import Producao from "./pages/Producao";
import Vendas from "./pages/Vendas";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/producao" element={<Producao />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
