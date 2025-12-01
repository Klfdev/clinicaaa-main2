import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, PieChart } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export default function Relatorios() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [dateRange, setDateRange] = useState('month'); // month, year, all
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        carregarDados();
    }, [dateRange, customStart, customEnd]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('financeiro')
                .select('*')
                .order('data', { ascending: true });

            const today = new Date();
            let startDate = new Date();

            if (dateRange === 'month') {
                startDate.setDate(1); // First day of current month
                query = query.gte('data', startDate.toISOString().split('T')[0]);
            } else if (dateRange === 'year') {
                startDate.setMonth(0, 1); // First day of current year
                query = query.gte('data', startDate.toISOString().split('T')[0]);
            } else if (dateRange === 'custom' && customStart && customEnd) {
                query = query.gte('data', customStart).lte('data', customEnd);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
            toast.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((acc, curr) => acc + Number(curr.valor), 0);
    const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + Number(curr.valor), 0);
    const saldo = totalReceitas - totalDespesas;

    // Chart Data Preparation
    const categories = [...new Set(transactions.map(t => t.categoria))];

    // Expenses by Category
    const expensesByCategory = categories.map(cat => {
        return transactions
            .filter(t => t.tipo === 'despesa' && t.categoria === cat)
            .reduce((acc, curr) => acc + Number(curr.valor), 0);
    });

    // Income by Category
    const incomeByCategory = categories.map(cat => {
        return transactions
            .filter(t => t.tipo === 'receita' && t.categoria === cat)
            .reduce((acc, curr) => acc + Number(curr.valor), 0);
    });

    // Daily Balance (Line Chart)
    // Group by date
    const transactionsByDate = transactions.reduce((acc, curr) => {
        const date = new Date(curr.data).toLocaleDateString('pt-BR');
        if (!acc[date]) acc[date] = 0;
        acc[date] += curr.tipo === 'receita' ? Number(curr.valor) : -Number(curr.valor);
        return acc;
    }, {});

    const lineChartData = {
        labels: Object.keys(transactionsByDate),
        datasets: [
            {
                label: 'Saldo Diário',
                data: Object.values(transactionsByDate),
                borderColor: '#9333ea',
                backgroundColor: 'rgba(147, 51, 234, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const doughnutData = {
        labels: categories,
        datasets: [
            {
                label: 'Despesas por Categoria',
                data: expensesByCategory,
                backgroundColor: [
                    '#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'
                ],
                borderWidth: 1,
            },
        ],
    };

    const barChartData = {
        labels: categories,
        datasets: [
            {
                label: 'Receitas',
                data: incomeByCategory,
                backgroundColor: '#22c55e',
            },
            {
                label: 'Despesas',
                data: expensesByCategory,
                backgroundColor: '#ef4444',
            },
        ],
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <PieChart className="w-8 h-8 text-purple-600" /> Relatórios Financeiros
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Análise detalhada de receitas e despesas.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 dark:text-gray-300"
                        >
                            <option value="month">Este Mês</option>
                            <option value="year">Este Ano</option>
                            <option value="all">Todo o Período</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                </div>

                {dateRange === 'custom' && (
                    <div className="flex gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Início</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="p-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Fim</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="p-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Receitas</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Despesas</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Saldo</span>
                            </div>
                            <h3 className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fluxo de Caixa (Diário)</h3>
                        <div className="h-64">
                            <Line data={lineChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Receitas vs Despesas por Categoria</h3>
                        <div className="h-64">
                            <Bar data={barChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </Card>

                    <Card className="p-6 lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Distribuição de Despesas</h3>
                                <div className="h-64 flex justify-center">
                                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, responsive: true }} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumo por Categoria</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            <tr>
                                                <th className="px-4 py-2">Categoria</th>
                                                <th className="px-4 py-2 text-right">Receitas</th>
                                                <th className="px-4 py-2 text-right">Despesas</th>
                                                <th className="px-4 py-2 text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((cat, i) => {
                                                const inc = incomeByCategory[i];
                                                const exp = expensesByCategory[i];
                                                return (
                                                    <tr key={cat} className="border-b dark:border-gray-700">
                                                        <td className="px-4 py-2 font-medium">{cat}</td>
                                                        <td className="px-4 py-2 text-right text-green-600">R$ {inc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-2 text-right text-red-600">R$ {exp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-2 text-right font-bold">R$ {(inc - exp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
