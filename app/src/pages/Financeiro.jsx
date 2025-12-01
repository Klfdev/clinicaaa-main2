import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp, TrendingDown, FileText, Download, PieChart } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { pdfService } from '../lib/pdfService';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Financeiro() {
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resumo, setResumo] = useState({ entradas: 0, saidas: 0, saldo: 0 });
    const [config, setConfig] = useState(null);

    // Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        tipo: 'entrada',
        descricao: '',
        valor: '',
        categoria: 'Geral',
        data: new Date().toISOString().split('T')[0]
    });

    const categorias = [
        'Geral', 'Vendas', 'Serviços', 'Aluguel', 'Fornecedores',
        'Salários', 'Impostos', 'Manutenção', 'Marketing', 'Outros'
    ];

    useEffect(() => {
        carregarFinanceiro();
    }, []);

    const carregarFinanceiro = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financeiro')
                .select('*')
                .order('data', { ascending: false });

            if (error) throw error;
            setLancamentos(data || []);
            calcularResumo(data || []);

            const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).single();
            setConfig(configData);
        } catch (error) {
            console.error("Erro ao carregar financeiro:", error);
            toast.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    };

    const calcularResumo = (dados) => {
        const entradas = dados.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + l.valor, 0);
        const saidas = dados.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + l.valor, 0);
        setResumo({
            entradas,
            saidas,
            saldo: entradas - saidas
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.descricao || !formData.valor) {
            toast.error("Descrição e Valor são obrigatórios.");
            return;
        }

        try {
            const payload = {
                tipo: formData.tipo,
                descricao: formData.descricao,
                valor: parseFloat(formData.valor),
                categoria: formData.categoria,
                data: formData.data
            };

            if (editingId) {
                const { error } = await supabase
                    .from('financeiro')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success('Lançamento atualizado!');
            } else {
                const { error } = await supabase
                    .from('financeiro')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Lançamento registrado!');
            }

            closeModal();
            carregarFinanceiro();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar lançamento.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Remover este lançamento?')) {
            try {
                const { error } = await supabase
                    .from('financeiro')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                const novosLancamentos = lancamentos.filter(l => l.id !== id);
                setLancamentos(novosLancamentos);
                calcularResumo(novosLancamentos);
                toast.success('Lançamento removido!');
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao remover lançamento.');
            }
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                tipo: item.tipo,
                descricao: item.descricao,
                valor: item.valor,
                categoria: item.categoria || 'Geral',
                data: item.data
            });
        } else {
            setEditingId(null);
            setFormData({
                tipo: 'entrada',
                descricao: '',
                valor: '',
                categoria: 'Geral',
                data: new Date().toISOString().split('T')[0]
            });

        }
        setModalOpen(true);
    };
    // Chart Data
    const chartData = {
        labels: ['Entradas', 'Saídas'],
        datasets: [
            {
                label: 'Valores (R$)',
                data: [resumo.entradas, resumo.saidas],
                backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
                borderWidth: 1,
            },
        ],
    };

    // Pie Chart Data (Expenses by Category)
    const expensesByCategory = lancamentos
        .filter(l => l.tipo === 'saida')
        .reduce((acc, curr) => {
            const cat = curr.categoria || 'Geral';
            acc[cat] = (acc[cat] || 0) + curr.valor;
            return acc;
        }, {});

    const pieData = {
        labels: Object.keys(expensesByCategory),
        datasets: [
            {
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderWidth: 1,
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
                            <DollarSign className="w-8 h-8 text-purple-600" /> Financeiro
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Controle de fluxo de caixa.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={gerarRelatorioPDF}>
                            <Download className="w-4 h-4 mr-2" /> Relatório
                        </Button>
                        <Button onClick={() => openModal()}>
                            <Plus className="w-5 h-5 mr-2" /> Novo Lançamento
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Entradas</p>
                                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">R$ {resumo.entradas.toFixed(2)}</h3>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">Saídas</p>
                                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">R$ {resumo.saidas.toFixed(2)}</h3>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Saldo</p>
                                <h3 className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                                    R$ {resumo.saldo.toFixed(2)}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" /> Fluxo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" /> Despesas por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(expensesByCategory).length > 0 ? (
                                    <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                                ) : (
                                    <p className="text-center text-gray-500 py-4">Sem despesas registradas.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* List */}
                    <Card className="lg:col-span-2 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Histórico de Lançamentos</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 font-semibold">Data</th>
                                        <th className="p-4 font-semibold">Descrição</th>
                                        <th className="p-4 font-semibold">Categoria</th>
                                        <th className="p-4 font-semibold">Valor</th>
                                        <th className="p-4 font-semibold text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">Carregando dados...</td></tr>
                                    ) : lancamentos.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nenhum lançamento registrado.</td></tr>
                                    ) : (
                                        lancamentos.map((l) => (
                                            <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    {new Date(l.data).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                    {l.descricao}
                                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${l.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {l.tipo}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                                        {l.categoria || 'Geral'}
                                                    </span>
                                                </td>
                                                <td className={`p-4 font-bold ${l.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                                    R$ {l.valor.toFixed(2)}
                                                </td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openModal(l)}>
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title={editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="tipo"
                                    value="entrada"
                                    checked={formData.tipo === 'entrada'}
                                    onChange={() => setFormData({ ...formData, tipo: 'entrada' })}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium text-green-600">Entrada</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="tipo"
                                    value="saida"
                                    checked={formData.tipo === 'saida'}
                                    onChange={() => setFormData({ ...formData, tipo: 'saida' })}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium text-red-600">Saída</span>
                            </label>
                        </div>

                        <Input
                            label="Descrição *"
                            value={formData.descricao}
                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                            <select
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                {categorias.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Valor (R$) *"
                                type="number"
                                step="0.01"
                                value={formData.valor}
                                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                required
                            />
                            <Input
                                label="Data *"
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData({ ...formData, data: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
