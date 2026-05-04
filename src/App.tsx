import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Agendamentos from "@/pages/Agendamentos";
import Agenda from "@/pages/Agenda";
import Clientes from "@/pages/Clientes";
import Servicos from "@/pages/Servicos";
import Profissionais from "@/pages/Profissionais";
import ClientBooking from "@/pages/ClientBooking";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Sonner theme="dark" />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agendamentos" element={<Agendamentos />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/servicos" element={<Servicos />} />
                  <Route path="/profissionais" element={<Profissionais />} />
                </Route>
              </Route>
              <Route path="/agendar" element={<ClientBooking />} />
              <Route path="/agendar-teste" element={<ClientBooking />} />
              <Route path="/agendamento" element={<ClientBooking />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
