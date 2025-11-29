import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Agendamentos from "./pages/Agendamentos";
import Prontuarios from "./pages/Prontuarios";
import Vacinas from "./pages/Vacinas";
import Estoque from "./pages/Estoque";
import Financeiro from "./pages/Financeiro";
import Vendas from "./pages/Vendas";
import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Internacoes from "./pages/Internacoes";
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Exames from './pages/Exames';
import Equipe from './pages/Equipe';
import PublicLayout from './components/PublicLayout';
import PublicScheduling from './pages/PublicScheduling';
import RoleRoute from './components/RoleRoute';

const PrivateRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

function App() {
  // Main App Component
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/agendar/:slug" element={<PublicScheduling />} />
          </Route>

          {/* Private Routes (Protected by Role) */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* Shared Routes */}
          <Route path="/agendamentos" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario', 'recepcionista']}><Agendamentos /></RoleRoute></PrivateRoute>} />
          <Route path="/pacientes" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario', 'recepcionista']}><Pacientes /></RoleRoute></PrivateRoute>} />
          <Route path="/estoque" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario', 'recepcionista']}><Estoque /></RoleRoute></PrivateRoute>} />

          {/* Veterinarian Routes */}
          <Route path="/prontuarios" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Prontuarios /></RoleRoute></PrivateRoute>} />
          <Route path="/vacinas" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Vacinas /></RoleRoute></PrivateRoute>} />
          <Route path="/medicamentos" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Medicamentos /></RoleRoute></PrivateRoute>} />
          <Route path="/receitas" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Receitas /></RoleRoute></PrivateRoute>} />
          <Route path="/internacoes" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Internacoes /></RoleRoute></PrivateRoute>} />
          <Route path="/exames" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'veterinario']}><Exames /></RoleRoute></PrivateRoute>} />

          {/* Receptionist/Admin Routes */}
          <Route path="/vendas" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'recepcionista']}><Vendas /></RoleRoute></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'recepcionista']}><Financeiro /></RoleRoute></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><RoleRoute allowedRoles={['admin', 'recepcionista']}><Relatorios /></RoleRoute></PrivateRoute>} />

          {/* Admin Only */}
          <Route path="/configuracoes" element={<PrivateRoute><RoleRoute allowedRoles={['admin']}><Configuracoes /></RoleRoute></PrivateRoute>} />
          <Route path="/equipe" element={<PrivateRoute><RoleRoute allowedRoles={['admin']}><Equipe /></RoleRoute></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
