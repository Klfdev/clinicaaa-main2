import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Scissors,
    Package,
    FileText,
    Sun,
    Moon,
    ShoppingCart,
    Percent,
    Briefcase,
    Brain
} from 'lucide-react';

export default function Layout({ children }) {
    const { user, signOut, profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme Management - Force Dark/Vintage for this demo or keep toggle?
    // Let's keep toggle but style 'light' as Vintage Cream and 'dark' as Vintage Dark.
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
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'barbeiro', 'recepcionista'] },
        { name: 'Insights IA', path: '/ai-insights', icon: Brain, roles: ['admin', 'barbeiro'] },
        { name: 'Agenda', path: '/agendamentos', icon: Calendar, roles: ['admin', 'barbeiro', 'recepcionista'] },
        { name: 'Clientes', path: '/clientes', icon: Users, roles: ['admin', 'barbeiro', 'recepcionista'] },
        { name: 'Estoque', path: '/estoque', icon: Package, roles: ['admin', 'barbeiro'] },
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, roles: ['admin', 'barbeiro', 'recepcionista'] },
        { name: 'Equipe', path: '/funcionarios', icon: Briefcase, roles: ['admin'] },
        { name: 'Comissões', path: '/comissoes', icon: Percent, roles: ['admin'] },
        { name: 'Financeiro', path: '/financeiro', icon: FileText, roles: ['admin'] },
        { name: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => {
        if (!profile) return false;
        if (profile.role === 'admin') return true;
        return true;
    });

    return (
        <div className="flex h-screen bg-[#f4ecd8] dark:bg-[#1a1a1a] transition-colors duration-200 font-sans">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Vintage Dark Style */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 
                bg-[#1a1a1a] border-r-2 border-[#D4AF37] 
                transform transition-transform duration-200 ease-in-out flex flex-col shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-[#D4AF37]/30">
                    <span className="text-2xl font-bold text-[#D4AF37] flex items-center gap-3 font-display tracking-wider">
                        <Scissors className="w-8 h-8" /> BARBERPRO
                    </span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#f4ecd8]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="px-4 space-y-2">
                        {filteredMenu.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-300
                                        ${isActive
                                            ? 'bg-[#D4AF37] text-[#1a1a1a] shadow-[0_0_15px_rgba(212,175,55,0.3)] transform translate-x-1'
                                            : 'text-[#f4ecd8] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] hover:pl-5'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#1a1a1a]' : 'text-[#D4AF37]'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#D4AF37]/30 space-y-4 bg-[#121212]">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-[#f4ecd8] border border-[#D4AF37]/30 rounded-md hover:bg-[#D4AF37]/10 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            {theme === 'light' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#D4AF37]" />}
                            Modo {theme === 'light' ? 'Clássico' : 'Noturno'}
                        </span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/20">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1a1a1a] font-bold shadow-md border-2 border-[#b5952f]">
                            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#f4ecd8] truncate font-display">
                                {profile?.full_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-[#D4AF37] truncate capitalize">
                                {profile?.role || 'Visitante'}
                            </p>
                        </div>
                        <button onClick={handleSignOut} className="text-[#D4AF37] hover:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-[#1a1a1a] border-b border-[#D4AF37] flex items-center justify-between px-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] z-40">
                    <button onClick={() => setSidebarOpen(true)} className="text-[#D4AF37]">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-bold text-[#D4AF37] font-display tracking-wider">BARBERPRO</span>
                    <div className="w-6" /> {/* Spacer */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f4ecd8] dark:bg-[#0f0f0f] p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
