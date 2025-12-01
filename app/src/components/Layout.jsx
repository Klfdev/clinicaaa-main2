import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    Stethoscope,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    FileText,
    Activity,
    Briefcase,
    DollarSign,
    ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Agenda', path: '/agendamentos', icon: Calendar, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Pacientes', path: '/pacientes', icon: Users, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Prontuários', path: '/prontuarios', icon: ClipboardList, roles: ['admin', 'veterinario'] },
        { name: 'Internações', path: '/internacoes', icon: Activity, roles: ['admin', 'veterinario'] },
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, roles: ['admin', 'recepcionista'] },
        { name: 'Estoque', path: '/estoque', icon: Package, roles: ['admin', 'veterinario'] },
        { name: 'Financeiro', path: '/financeiro', icon: DollarSign, roles: ['admin'] },
        { name: 'Comissões', path: '/comissoes', icon: DollarSign, roles: ['admin'] },
        { name: 'Funcionários', path: '/funcionarios', icon: Briefcase, roles: ['admin'] },
        { name: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['admin'] },
    ];

    const handleSignOut = async () => {
        await logout();
        navigate('/login');
    };

    // Filter menu items based on user role
    const filteredMenu = menuItems.filter(item =>
        profile?.role && item.roles.includes(profile.role)
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                        <Stethoscope className="w-8 h-8 text-purple-600 mr-2" />
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            VetSys
                        </span>
                        <button
                            className="ml-auto lg:hidden text-gray-500"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {filteredMenu.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {profile?.full_name || 'Usuário'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                                    {profile?.role || 'Visitante'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">VetSys</span>
                    <div className="w-6" /> {/* Spacer for centering */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
