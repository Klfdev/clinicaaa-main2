import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    Syringe,
    Package,
    DollarSign,
    ShoppingCart,
    Settings,
    LogOut,
    Menu,
    X,
    Moon,
    Sun,
    Pill,
    FileText,
    HeartPulse,
    PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export default function Layout({ children }) {
    const { user, profile, organization, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error("Erro ao sair:", error);
            window.location.href = '/login';
        }
    };

    const ROLE_PERMISSIONS = {
        admin: ['*'], // Access to everything
        veterinario: [
            '/',
            '/agendamentos',
            '/pacientes',
            '/prontuarios',
            '/vacinas',
            '/internacoes',
            '/medicamentos',
            '/receitas',
            '/exames',
            '/estoque' // Vets might need to check stock
        ],
        recepcionista: [
            '/',
            '/agendamentos',
            '/pacientes',
            '/vendas',
            '/financeiro', // Maybe restricted view?
            '/estoque',
            '/relatorios'
        ]
    };

    const allMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
        { icon: Users, label: 'Pacientes', path: '/pacientes' },
        { icon: ClipboardList, label: 'Prontuários', path: '/prontuarios' },
        { icon: Syringe, label: 'Vacinas', path: '/vacinas' },
        { icon: HeartPulse, label: 'Internação', path: '/internacoes' },
        { icon: Package, label: 'Estoque', path: '/estoque' },
        { icon: Pill, label: 'Medicamentos', path: '/medicamentos' },
        { icon: FileText, label: 'Receitas', path: '/receitas' },
        { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
        { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
        { icon: FileText, label: 'Exames', path: '/exames' },
        { icon: PieChart, label: 'Relatórios', path: '/relatorios' },
        { icon: Users, label: 'Equipe', path: '/equipe' },
        { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    ];

    const userRole = profile?.role || 'recepcionista'; // Default to lowest privilege if undefined

    const menuItems = allMenuItems.filter(item => {
        if (userRole === 'admin') return true;
        const allowedPaths = ROLE_PERMISSIONS[userRole] || [];
        return allowedPaths.includes(item.path);
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={clsx(
                    "fixed top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl lg:translate-x-0 transition-transform duration-300 ease-in-out",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <span className="text-white font-bold text-xl">
                                {organization?.name?.[0]?.toUpperCase() || 'P'}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                {organization?.name || 'PetClínica'}
                            </h1>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                {organization?.slug || 'Sistema'}
                            </p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-300"
                                    )}
                                >
                                    <item.icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive && "animate-pulse")} />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                                    {profile?.role || 'Usuário'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sair
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="lg:ml-72 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 ml-auto">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                title="Alternar Tema"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
