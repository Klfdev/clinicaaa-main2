import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    Users,
    Calendar,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle,
    ArrowRight,
    Clock,
    UserPlus,
    Scissors,
    Phone,
    Plus
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function Dashboard() {
    const { profile, organization } = useAuth();
    const [stats, setStats] = useState({
        clientes: 0,
        agendamentosHoje: 0,
        vendasHoje: 0,
        faturamentoMes: 0,
        novosClientes: 0
    });
    const [loading, setLoading] = useState(true);

    // Chart Carousel State
    const [currentChart, setCurrentChart] = useState(0);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [financialData, setFinancialData] = useState({ labels: [], datasets: [] });
    const [inventoryData, setInventoryData] = useState({ labels: [], datasets: [] });
    const [topProductsData, setTopProductsData] = useState({ labels: [], datasets: [] });
    const [alerts, setAlerts] = useState([]);
    const [weeklyAppointmentsList, setWeeklyAppointmentsList] = useState([]);

    const chartTypes = [
        { title: 'Atendimentos da Semana (Gráfico)', type: 'appointments' },
        { title: 'Top 5 Produtos/Serviços', type: 'top-products' },
        { title: 'Financeiro (Mês)', type: 'financial' },
        { title: 'Estoque Baixo', type: 'inventory' },
        { title: 'Atendimentos da Semana (Lista)', type: 'appointments-list' }
    ];

    const nextChart = () => {
        setCurrentChart((prev) => (prev + 1) % chartTypes.length);
    };

    const prevChart = () => {
        setCurrentChart((prev) => (prev - 1 + chartTypes.length) % chartTypes.length);
    };

    useEffect(() => {
        async function fetchStats() {
            try {
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);

                const todayStr = today.toISOString().split('T')[0];
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

                // 1. Total Clientes
                const { count: clientesCount } = await supabase
                    .from('clientes')
                    .select('*', { count: 'exact', head: true });

                // 2. Agendamentos Hoje
                const { count: agendamentosCount } = await supabase
                    .from('agendamentos')
                    .select('*', { count: 'exact', head: true })
                    .eq('data', todayStr);

                // 3. Vendas Hoje
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const { count: vendasCount } = await supabase
                    .from('vendas')
                    .select('*', { count: 'exact', head: true })
                    .gte('data_venda', startOfDay.toISOString())
                    .lte('data_venda', endOfDay.toISOString());

                // 4. Faturamento Mês
                const { data: financeiroRaw } = await supabase
                    .from('financeiro')
                    .select('valor, tipo')
                    .gte('data', firstDayOfMonth);

                let entradas = 0;
                let saidas = 0;

                financeiroRaw?.forEach(curr => {
                    if (curr.tipo === 'entrada') {
                        entradas += Number(curr.valor);
                    } else {
                        saidas += Number(curr.valor);
                    }
                });

                const faturamento = entradas - saidas;

                // 5. Novos Clientes (Linkados a criação no mês)
                // Assuming 'created_at' exists in clientes. If not, this might return 0 or error if field missing.
                // We'll try-catch or assume it exists/will exist.
                let novosClientesCount = 0;
                const { count: novosCount, error: novosError } = await supabase
                    .from('clientes')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', firstDayOfMonth);

                if (!novosError) {
                    novosClientesCount = novosCount;
                }

                setStats({
                    clientes: clientesCount || 0,
                    agendamentosHoje: agendamentosCount || 0,
                    vendasHoje: vendasCount || 0,
                    faturamentoMes: faturamento,
                    novosClientes: novosClientesCount
                });

                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 7);

                // 6. Chart Data: Appointments (Last 7 Days + Next 7 Days)
                const { data: weeklyAppointments } = await supabase
                    .from('agendamentos')
                    .select('data, horario, "nomeCliente", servico, clientes(nome)')
                    .gte('data', sevenDaysAgo.toISOString().split('T')[0])
                    .lte('data', sevenDaysFromNow.toISOString().split('T')[0])
                    .order('data', { ascending: false })
                    .order('horario', { ascending: true });

                // Map nomeCliente from relation if available
                const mappedAppointments = (weeklyAppointments || []).map(app => ({
                    ...app,
                    displayNome: app.clientes?.nome || app.nomeCliente || 'Cliente'
                }));

                setWeeklyAppointmentsList(mappedAppointments);

                const labels = [];
                const dataPoints = [];

                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });

                    labels.push(dayName);
                    const count = weeklyAppointments?.filter(a => a.data === dateStr).length || 0;
                    dataPoints.push(count);
                }

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Atendimentos',
                            data: dataPoints,
                            backgroundColor: 'rgba(147, 51, 234, 0.7)',
                            borderRadius: 6,
                        },
                    ],
                });

                // 7. Chart Data: Financial (Income vs Expense)
                setFinancialData({
                    labels: ['Entradas', 'Saídas'],
                    datasets: [
                        {
                            label: 'Valor (R$)',
                            data: [entradas, saidas],
                            backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
                            borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
                            borderWidth: 1,
                        },
                    ],
                });

                // 8. Chart Data: Top 5 Products
                const { data: vendasMes } = await supabase
                    .from('vendas')
                    .select('itens')
                    .gte('data_venda', firstDayOfMonth);

                const productCounts = {};
                vendasMes?.forEach(venda => {
                    venda.itens.forEach(item => {
                        productCounts[item.nome] = (productCounts[item.nome] || 0) + item.quantidade;
                    });
                });

                const sortedProducts = Object.entries(productCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                setTopProductsData({
                    labels: sortedProducts.map(([name]) => name),
                    datasets: [
                        {
                            data: sortedProducts.map(([, count]) => count),
                            backgroundColor: [
                                'rgba(139, 92, 246, 0.7)',
                                'rgba(59, 130, 246, 0.7)',
                                'rgba(16, 185, 129, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                            ],
                            borderWidth: 1,
                        },
                    ],
                });

                // 9. Chart Data: Inventory (Low Stock)
                const { data: lowStockItems } = await supabase
                    .from('estoque')
                    .select('nome, quantidade')
                    .lt('quantidade', 10)
                    .order('quantidade', { ascending: true })
                    .limit(5);

                setInventoryData({
                    labels: lowStockItems?.map(item => item.nome) || [],
                    datasets: [
                        {
                            label: 'Quantidade',
                            data: lowStockItems?.map(item => item.quantidade) || [],
                            backgroundColor: 'rgba(249, 115, 22, 0.7)',
                            borderRadius: 4,
                            indexAxis: 'y',
                        },
                    ],
                });

                // 10. Alerts (Appointments + Low Stock)
                const newAlerts = [];

                // 10.1 Appointments
                const { data: upcomingAppointments } = await supabase
                    .from('agendamentos')
                    .select('data, horario, "nomeCliente", servico, telefone, clientes(nome, whatsapp)')
                    .gte('data', todayStr)
                    .lte('data', tomorrowStr)
                    .order('data', { ascending: true })
                    .order('horario', { ascending: true })
                    .limit(5);

                upcomingAppointments?.forEach(app => {
                    const isToday = app.data === todayStr;
                    const clientName = app.clientes?.nome || app.nomeCliente || 'Cliente';
                    const phone = app.clientes?.whatsapp || app.telefone;

                    newAlerts.push({
                        type: 'appointment',
                        title: isToday ? 'Agendamento Hoje' : 'Agendamento Amanhã',
                        message: `${app.horario} - ${clientName} (${app.servico})`,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 dark:bg-blue-900/10',
                        border: 'border-blue-100 dark:border-blue-900/30',
                        dot: 'bg-blue-500',
                        phone: phone,
                        clientName: clientName
                    });
                });

                // 10.2 Low Stock (Keep)
                lowStockItems?.forEach(item => {
                    newAlerts.push({
                        type: 'stock',
                        title: 'Estoque Baixo',
                        message: `${item.nome} tem apenas ${item.quantidade} unidades.`,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50 dark:bg-orange-900/10',
                        border: 'border-orange-100 dark:border-orange-900/30',
                        dot: 'bg-orange-500'
                    });
                });

                setAlerts(newAlerts);

            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const renderChart = () => {
        const type = chartTypes[currentChart].type;

        if (type === 'appointments') {
            return (
                <Bar
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }}
                />
            );
        } else if (type === 'top-products') {
            return (
                <div className="h-full flex items-center justify-center">
                    <Pie
                        data={topProductsData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'right' } }
                        }}
                    />
                </div>
            );
        } else if (type === 'appointments-list') {
            return (
                <div className="h-full overflow-y-auto pr-2">
                    {weeklyAppointmentsList.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum atendimento nesta semana.</p>
                    ) : (
                        <div className="space-y-3">
                            {weeklyAppointmentsList.map((app, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{app.displayNome}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{app.servico}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {new Date(app.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{app.horario}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        } else if (type === 'financial') {
            return (
                <Bar
                    data={financialData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }}
                />
            );
        } else if (type === 'inventory') {
            return (
                <Bar
                    data={inventoryData}
                    options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true } }
                    }}
                />
            );
        }
    };

    const widgets = [
        {
            title: 'Clientes Totais',
            value: stats.clientes,
            icon: Users,
            color: 'text-[#D4AF37]',
            bg: 'bg-[#1a1a1a] border border-[#D4AF37]/20',
            link: '/clientes'
        },
        {
            title: 'Novos (Mês)',
            value: stats.novosClientes,
            icon: UserPlus,
            color: 'text-[#D4AF37]',
            bg: 'bg-[#1a1a1a] border border-[#D4AF37]/20',
            link: '/clientes'
        },
        {
            title: 'Vendas Hoje',
            value: stats.vendasHoje,
            icon: TrendingUp,
            color: 'text-green-500',
            bg: 'bg-[#1a1a1a] border border-green-500/20',
            link: '/vendas'
        },
        {
            title: 'Faturamento Mês',
            value: `R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-green-500',
            bg: 'bg-[#1a1a1a] border border-green-500/20',
            link: '/financeiro'
        }
    ];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-[#f4ecd8] font-display">
                            Olá, {profile?.full_name?.split(' ')[0] || 'Barbeiro'}! <span className="text-2xl">🎩</span>
                        </h1>
                        <p className="text-[#5c4d3c] dark:text-[#a89f91] mt-1">
                            Resumo da sua barbearia hoje.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/historico">
                            <Button variant="outline" size="sm">
                                <Clock className="w-4 h-4 mr-2" /> Histórico
                            </Button>
                        </Link>
                        <Link to="/agendamentos/novo">
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Vintage Banner */}
                <div className="bg-[#1a1a1a] rounded-xl p-6 text-[#f4ecd8] shadow-2xl border-l-4 border-[#D4AF37] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scissors className="w-48 h-48 transform -rotate-12 text-[#D4AF37]" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#D4AF37]/20 rounded-lg border border-[#D4AF37]">
                                <Calendar className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-display text-[#D4AF37]">Link de Agendamento</h2>
                                <p className="text-gray-400 text-sm mt-1 max-w-md">
                                    Envie este link para seus clientes agendarem horários diretamente com você.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto bg-[#2c2c2c] p-2 rounded-lg border border-[#D4AF37]/30">
                            <code className="text-sm px-2 truncate text-[#D4AF37] font-mono max-w-[200px]">
                                {window.location.origin}/agendar/{organization?.slug}
                            </code>
                            <Button
                                size="sm"
                                className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#b5952f]"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/agendar/${organization?.slug}`);
                                    alert('Link copiado!');
                                }}
                            >
                                Copiar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {widgets.map((widget, index) => (
                        <Card key={index} className="hover:-translate-y-1 transition-transform duration-300 border-[#D4AF37]/20">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <p className="text-sm font-medium text-[#5c4d3c] dark:text-[#a89f91] mb-1 font-sans">
                                        {widget.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#f4ecd8] font-display">
                                        {loading ? <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 block rounded"></span> : widget.value}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${widget.bg}`}>
                                    <widget.icon className={`w-6 h-6 ${widget.color}`} />
                                </div>
                            </CardContent>
                            <div className="px-6 pb-4">
                                <Link to={widget.link} className="text-xs font-medium text-[#D4AF37] hover:text-[#b5952f] flex items-center gap-1 group">
                                    Ver detalhes <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Interactive Chart Carousel */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{chartTypes[currentChart].title}</CardTitle>
                            <div className="flex gap-2">
                                <button
                                    onClick={prevChart}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                </button>
                                <button
                                    onClick={nextChart}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : (
                                    renderChart()
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alerts / Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-purple-600" /> Avisos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[250px] overflow-y-auto">
                                {alerts.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Nenhum aviso no momento.</p>
                                ) : (
                                    alerts.map((alert, i) => (
                                        <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${alert.bg} ${alert.border}`}>
                                            <div className={`w-2 h-2 mt-2 rounded-full ${alert.dot} shrink-0`} />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${alert.color}`}>{alert.title}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{alert.message}</p>
                                            </div>
                                            {alert.type === 'appointment' && alert.phone && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white border-none flex items-center justify-center shrink-0"
                                                    title="Enviar WhatsApp"
                                                    onClick={() => {
                                                        const phone = alert.phone.replace(/\D/g, '');
                                                        const message = `Olá ${alert.clientName || ''}, lembrete: ${alert.message}. Confirmado? ✂️`;
                                                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                    }}
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
