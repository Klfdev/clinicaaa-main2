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
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pacientes" element={<PrivateRoute><Pacientes /></PrivateRoute>} />
          <Route path="/agendamentos" element={<PrivateRoute><Agendamentos /></PrivateRoute>} />
          <Route path="/prontuarios" element={<PrivateRoute><Prontuarios /></PrivateRoute>} />
          <Route path="/vacinas" element={<PrivateRoute><Vacinas /></PrivateRoute>} />
          <Route path="/estoque" element={<PrivateRoute><Estoque /></PrivateRoute>} />
          <Route path="/vendas" element={<PrivateRoute><Vendas /></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
          <Route path="/medicamentos" element={<PrivateRoute><Medicamentos /></PrivateRoute>} />
          <Route path="/receitas" element={<PrivateRoute><Receitas /></PrivateRoute>} />
          <Route path="/internacoes" element={<PrivateRoute><Internacoes /></PrivateRoute>} />
          <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
          <Route path="/exames" element={<PrivateRoute><Exames /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
