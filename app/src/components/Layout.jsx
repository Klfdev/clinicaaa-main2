import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    Stethoscope,
    Activity,
    Syringe,
    Package,
    FileText,
    Sun,
    Moon,
    ShoppingCart,
    Percent
} from 'lucide-react';

export default function Layout({ children }) {
    const { user, signOut, profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme Management
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Agenda', path: '/agendamentos', icon: Calendar, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Pacientes', path: '/pacientes', icon: Users, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Prontuários', path: '/prontuarios', icon: ClipboardList, roles: ['admin', 'veterinario'] },
        { name: 'Internações', path: '/internacoes', icon: Activity, roles: ['admin', 'veterinario'] },
        { name: 'Vacinas', path: '/vacinas', icon: Syringe, roles: ['admin', 'veterinario'] },
        { name: 'Estoque', path: '/estoque', icon: Package, roles: ['admin', 'veterinario'] },
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, roles: ['admin', 'veterinario', 'recepcionista'] },
        { name: 'Receitas', path: '/receitas', icon: FileText, roles: ['admin', 'veterinario'] },
        { name: 'Funcionários', path: '/funcionarios', icon: Stethoscope, roles: ['admin'] },
        { name: 'Comissões', path: '/comissoes', icon: Percent, roles: ['admin'] },
        { name: 'Financeiro', path: '/financeiro', icon: FileText, roles: ['admin'] },
        { name: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => {
        if (!profile) return false;
        if (profile.role === 'admin') return true;
        return item.roles.includes(profile.role);
    });

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        VetSys
                    </span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-3 space-y-1">
                        {filteredMenu.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            {theme === 'light' ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
                            Tema {theme === 'light' ? 'Claro' : 'Escuro'}
                        </span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2">
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
