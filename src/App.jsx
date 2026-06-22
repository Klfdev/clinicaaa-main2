import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Agendamentos from './pages/Agendamentos';
import Financeiro from './pages/Financeiro';
import Configuracoes from './pages/Configuracoes';
import Onboarding from './pages/Onboarding';
import AgendamentoPublico from './pages/PublicScheduling';
import Estoque from './pages/Estoque';
import Vendas from './pages/Vendas';
import Funcionarios from './pages/Funcionarios';
import Comissoes from './pages/Comissoes';
import AiInsights from './pages/AiInsights';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/agendar/:slug" element={<AgendamentoPublico />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-insights" element={<AiInsights />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/comissoes" element={<Comissoes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
