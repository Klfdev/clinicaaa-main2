import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando permissões...</div>;
    }

    // If no profile or no role, deny access (or redirect to login if not handled by PrivateRoute)
    if (!profile || !profile.role) {
        return <Navigate to="/login" />;
    }

    // Admin always has access
    if (profile.role === 'admin') {
        return children;
    }

    // Check if user's role is in the allowed list
    if (allowedRoles.includes(profile.role)) {
        return children;
    }

    // Access Denied
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <h1 className="text-4xl font-bold mb-4">403</h1>
            <p className="text-xl mb-6">Acesso Negado</p>
            <p className="text-gray-500 mb-8">Você não tem permissão para acessar esta página.</p>
            <a href="/" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Voltar ao Dashboard
            </a>
        </div>
    );
}
