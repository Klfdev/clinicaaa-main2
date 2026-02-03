import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { DollarSign, Calendar, User, Download, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { pdfService } from '../lib/pdfService';

export default function Comissoes() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [comissoes, setComissoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        carregarDados();
    }, [mesSelecionado]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // 1. Fetch Employees with Commission > 0
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, comissao_percentual')
                .gt('comissao_percentual', 0);

            if (profilesError) throw profilesError;

            // 2. Fetch Sales for the selected month
            const startOfMonth = `${mesSelecionado}-01`;
            const endOfMonth = new Date(new Date(startOfMonth).setMonth(new Date(startOfMonth).getMonth() + 1)).toISOString().slice(0, 10);

            const { data: vendas, error: vendasError } = await supabase
                .from('vendas')
                .select('id, data_venda, vendedor_id, itens')
                .gte('data_venda', startOfMonth)
                .lt('data_venda', endOfMonth);

            if (vendasError) throw vendasError;

            // 3. Calculate Commissions
            const dadosComissoes = profiles.map(func => {
                const vendasFuncionario = vendas.filter(v => v.vendedor_id === func.id);

                let totalVendas = 0;
                vendasFuncionario.forEach(v => {
                    const totalVenda = v.itens.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
                    totalVendas += totalVenda;
                });

                const valorComissao = totalVendas * (func.comissao_percentual / 100);

                return {
                    id: func.id,
                    nome: func.full_name,
                    percentual: func.comissao_percentual,
                    totalVendas,
                    valorComissao,
                    qtdVendas: vendasFuncionario.length
                };
            });

            setFuncionarios(profiles);
            setComissoes(dadosComissoes);

        } catch (error) {
            console.error("Erro ao carregar comissões:", error);
            toast.error("Erro ao calcular comissões.");
        } finally {
            setLoading(false);
        }
    };

    const exportarPDF = async () => {
        try {
            const config = await supabase.from('configuracoes').select('*').limit(1).single().then(r => r.data);

            await pdfService.generate({
                title: `Relatório de Comissões - ${mesSelecionado}`,
                config: config,
                fileName: `comissoes_${mesSelecionado}.pdf`,
                content: [
                    {
                        type: 'info',
                        data: {
                            'Mês Referência': mesSelecionado,
                            'Total a Pagar': `R$ ${comissoes.reduce((a, b) => a + b.valorComissao, 0).toFixed(2)}`,
                            'Funcionários': comissoes.length.toString()
                        }
                    },
                    {
                        type: 'table',
                        head: ['Funcionário', 'Comissão (%)', 'Qtd Vendas', 'Total Vendido', 'A Pagar'],
                        body: comissoes.map(c => [
                            c.nome,
                            `${c.percentual}%`,
                            c.qtdVendas,
                            `R$ ${c.totalVendas.toFixed(2)}`,
                            `R$ ${c.valorComissao.toFixed(2)}`
                        ]),
                        options: {
                            foot: [['TOTAL', '', '', `R$ ${comissoes.reduce((a, b) => a + b.totalVendas, 0).toFixed(2)}`, `R$ ${comissoes.reduce((a, b) => a + b.valorComissao, 0).toFixed(2)}`]],
                            footStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' }
                        }
                    }
                ]
            });
            toast.success('Relatório exportado com sucesso!');
        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            toast.error("Erro ao exportar PDF.");
        }
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-8 h-8 text-purple-600" /> Comissões
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Gerencie os pagamentos de comissão da sua equipe.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <input
                                type="month"
                                value={mesSelecionado}
                                onChange={(e) => setMesSelecionado(e.target.value)}
                                className="bg-transparent outline-none text-gray-700 dark:text-gray-200"
                            />
                        </div>
                        <Button onClick={exportarPDF} variant="outline">
                            <Download className="w-5 h-5 mr-2" /> Exportar PDF
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
                        <CardContent className="p-6">
                            <p className="text-purple-100 mb-1">Total a Pagar</p>
                            <h3 className="text-3xl font-bold">
                                R$ {comissoes.reduce((acc, c) => acc + c.valorComissao, 0).toFixed(2)}
                            </h3>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Total Vendido (Comissionado)</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                R$ {comissoes.reduce((acc, c) => acc + c.totalVendas, 0).toFixed(2)}
                            </h3>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Funcionários Comissionados</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {comissoes.length}
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="p-4">Funcionário</th>
                                    <th className="p-4 text-center">Comissão (%)</th>
                                    <th className="p-4 text-center">Qtd Vendas</th>
                                    <th className="p-4 text-right">Total Vendido</th>
                                    <th className="p-4 text-right">A Pagar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Calculando comissões...</td></tr>
                                ) : comissoes.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nenhuma comissão gerada neste período.</td></tr>
                                ) : (
                                    comissoes.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                                    {c.nome[0]}
                                                </div>
                                                {c.nome}
                                            </td>
                                            <td className="p-4 text-center text-gray-600 dark:text-gray-300">{c.percentual}%</td>
                                            <td className="p-4 text-center text-gray-600 dark:text-gray-300">{c.qtdVendas}</td>
                                            <td className="p-4 text-right font-medium text-gray-900 dark:text-white">R$ {c.totalVendas.toFixed(2)}</td>
                                            <td className="p-4 text-right font-bold text-green-600">R$ {c.valorComissao.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
