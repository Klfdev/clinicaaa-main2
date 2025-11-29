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
    Clock
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard() {
    const { profile, organization } = useAuth();
    const [stats, setStats] = useState({
        pacientes: 0,
        agendamentosHoje: 0,
        vendasHoje: 0,
        faturamentoMes: 0
    });
    const [loading, setLoading] = useState(true);

    // Chart Carousel State
    const [currentChart, setCurrentChart] = useState(0);
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [financialData, setFinancialData] = useState({ labels: [], datasets: [] });
    const [inventoryData, setInventoryData] = useState({ labels: [], datasets: [] });
    const [alerts, setAlerts] = useState([]);
    const [weeklyAppointmentsList, setWeeklyAppointmentsList] = useState([]);

    const chartTypes = [
        { title: 'Atendimentos da Semana (Gráfico)', type: 'appointments' },
        { title: 'Atendimentos da Semana (Lista)', type: 'appointments-list' },
        { title: 'Financeiro (Mês)', type: 'financial' },
        { title: 'Estoque Baixo', type: 'inventory' }
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

                // 1. Total Pacientes
                const { count: pacientesCount } = await supabase
                    .from('pacientes')
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

                setStats({
                    pacientes: pacientesCount || 0,
                    agendamentosHoje: agendamentosCount || 0,
                    vendasHoje: vendasCount || 0,
                    faturamentoMes: faturamento
                });

                // 5. Chart Data: Appointments (Last 7 Days)
                const { data: weeklyAppointments } = await supabase
                    .from('agendamentos')
                    .select('data, horario, "nomePet", servico')
                    .gte('data', sevenDaysAgo.toISOString().split('T')[0])
                    .lte('data', todayStr)
                    .order('data', { ascending: false })
                    .order('horario', { ascending: true });

                setWeeklyAppointmentsList(weeklyAppointments || []);

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

                // 6. Chart Data: Financial (Income vs Expense)
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

                // 7. Chart Data: Inventory (Low Stock)
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

                // 8. Alerts (Appointments + Low Stock)
                const { data: upcomingAppointments } = await supabase
                    .from('agendamentos')
                    .select('data, horario, "nomePet", servico')
                    .gte('data', todayStr)
                    .lte('data', tomorrowStr)
                    .order('data', { ascending: true })
                    .order('horario', { ascending: true })
                    .limit(5);

                const newAlerts = [];

                // Add Appointment Alerts
                upcomingAppointments?.forEach(app => {
                    const isToday = app.data === todayStr;
                    newAlerts.push({
                        type: 'appointment',
                        title: isToday ? 'Agendamento Hoje' : 'Agendamento Amanhã',
                        message: `${app.horario} - ${app.nomePet} (${app.servico})`,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50 dark:bg-blue-900/10',
                        border: 'border-blue-100 dark:border-blue-900/30',
                        dot: 'bg-blue-500'
                    });
                });

                // Add Low Stock Alerts
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
                                            <p className="font-medium text-gray-900 dark:text-white">{app.nomePet}</p>
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
            title: 'Pacientes Totais',
            value: stats.pacientes,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            link: '/pacientes'
        },
        {
            title: 'Agendamentos Hoje',
            value: stats.agendamentosHoje,
            icon: Calendar,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            link: '/agendamentos'
        },
        {
            title: 'Vendas Hoje',
            value: stats.vendasHoje,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/30',
            link: '/vendas'
        },
        {
            title: 'Faturamento Mês',
            value: `R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            link: '/financeiro'
        }
    ];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Olá, {profile?.full_name || 'Doutor(a)'}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Aqui está o resumo da sua clínica hoje.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm">
                            <Clock className="w-4 h-4 mr-2" /> Histórico
                        </Button>
                        <Button size="sm">
                            <Activity className="w-4 h-4 mr-2" /> Novo Atendimento
                        </Button>
                    </div>
                </div>

                {/* Public Link Card */}
                <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> Agendamento Online
                            </h3>
                            <p className="text-purple-100 text-sm mt-1">
                                Compartilhe este link com seus clientes para eles agendarem sozinhos.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg w-full md:w-auto">
                            <code className="text-sm font-mono truncate max-w-[200px] md:max-w-[300px]">
                                {window.location.origin}/agendar/{organization?.slug}
                            </code>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white text-purple-600 hover:bg-gray-100 border-none"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/agendar/${organization?.slug}`);
                                    alert('Link copiado!');
                                }}
                            >
                                Copiar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {widgets.map((widget, index) => (
                        <Card key={index} className="hover:-translate-y-1 transition-transform duration-300">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        {widget.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {loading ? <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 block rounded"></span> : widget.value}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${widget.bg}`}>
                                    <widget.icon className={`w-6 h-6 ${widget.color}`} />
                                </div>
                            </CardContent>
                            <div className="px-6 pb-4">
                                <Link to={widget.link} className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 group">
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
                                            <div>
                                                <p className={`text-sm font-medium ${alert.color}`}>{alert.title}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{alert.message}</p>
                                            </div>
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
