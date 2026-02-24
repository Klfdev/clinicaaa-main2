import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, ShoppingCart, FileText, Search, X, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';

export default function Vendas() {
    const [vendas, setVendas] = useState([]);
    const [produtos, setProdutos] = useState([]); // Includes services
    const [loading, setLoading] = useState(true);

    // POS State
    const [carrinho, setCarrinho] = useState([]);
    const [cliente, setCliente] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('dinheiro');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [quantidadeInput, setQuantidadeInput] = useState(1);
    const [filtroProduto, setFiltroProduto] = useState('');
    const [filtroVendas, setFiltroVendas] = useState('');

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Load Sales
            const { data: vendasData, error: vendasError } = await supabase
                .from('vendas')
                .select('*')
                .order('data_venda', { ascending: false });
            if (vendasError) throw vendasError;
            setVendas(vendasData || []);

            // Load Products & Services
            const { data: estoqueData, error: estoqueError } = await supabase.from('estoque').select('*');
            const { data: servicosData, error: servicosError } = await supabase.from('servicos').select('*');

            if (estoqueError) throw estoqueError;
            if (servicosError) throw servicosError;

            const listaProdutos = [
                ...estoqueData.map(d => ({ ...d, tipo: 'Produto', preco: d.precoVenda })),
                ...servicosData.map(d => ({ ...d, tipo: 'Serviço', preco: d.precoVenda }))
            ].sort((a, b) => a.nome.localeCompare(b.nome));

            setProdutos(listaProdutos);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados de vendas.");
        } finally {
            setLoading(false);
        }
    };

    // POS Functions
    const adicionarAoCarrinho = () => {
        if (!produtoSelecionado || quantidadeInput <= 0) return;

        const itemExistente = carrinho.find(i => i.id === produtoSelecionado.id);
        if (itemExistente) {
            setCarrinho(carrinho.map(i => i.id === produtoSelecionado.id ? { ...i, quantidade: i.quantidade + quantidadeInput } : i));
        } else {
            setCarrinho([...carrinho, { ...produtoSelecionado, quantidade: quantidadeInput }]);
        }

        setModalProdutoOpen(false);
        setQuantidadeInput(1);
        setProdutoSelecionado(null);
        toast.success('Item adicionado ao carrinho');
    };

    const removerDoCarrinho = (index) => {
        setCarrinho(carrinho.filter((_, i) => i !== index));
    };

    const finalizarVenda = async () => {
        if (carrinho.length === 0 || !cliente) {
            toast.error('Preencha o cliente e adicione itens ao carrinho.');
            return;
        }

        try {
            // 1. Create Sale Record
            const { error: vendaError } = await supabase
                .from('vendas')
                .insert([{
                    cliente_nome: cliente,
                    forma_pagamento: formaPagamento,
                    itens: carrinho, // JSONB
                    data_venda: new Date().toISOString()
                }]);

            if (vendaError) throw vendaError;

            // 2. Update Inventory (Sequentially for simplicity, could be RPC for atomicity)
            for (const item of carrinho) {
                if (item.tipo === 'Produto') {
                    // Fetch current stock first to be safe
                    const { data: currentItem } = await supabase
                        .from('estoque')
                        .select('quantidade')
                        .eq('id', item.id)
                        .single();

                    if (currentItem) {
                        await supabase
                            .from('estoque')
                            .update({ quantidade: currentItem.quantidade - item.quantidade })
                            .eq('id', item.id);
                    }
                }
            }

            toast.success('Venda registrada com sucesso!');
            setCarrinho([]);
            setCliente('');
            setFormaPagamento('dinheiro');
            setModalOpen(false);
            carregarDados(); // Reload sales and inventory
        } catch (error) {
            console.error("Erro ao finalizar venda:", error);
            toast.error('Erro ao registrar venda.');
        }
    };

    // PDF Functions
    const gerarComprovante = (venda) => {
        const doc = new jsPDF();
        const total = venda.itens.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
        const data = new Date(venda.data_venda).toLocaleDateString('pt-BR');
        const hora = new Date(venda.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Header Background
        doc.setFillColor(139, 92, 246); // Purple-600
        doc.rect(0, 0, 210, 40, 'F');

        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("CLÍNICA VETERINÁRIA", 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Comprovante de Venda e Serviços", 105, 30, { align: 'center' });

        // Info Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        // Left Column
        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", 20, 55);
        doc.setFont("helvetica", "normal");
        doc.text(venda.cliente_nome, 40, 55);

        doc.setFont("helvetica", "bold");
        doc.text("Data:", 20, 62);
        doc.setFont("helvetica", "normal");
        doc.text(`${data} às ${hora}`, 40, 62);

        // Right Column
        doc.setFont("helvetica", "bold");
        doc.text("Pagamento:", 120, 55);
        doc.setFont("helvetica", "normal");
        doc.text(venda.forma_pagamento.toUpperCase().replace('_', ' '), 145, 55);

        doc.setFont("helvetica", "bold");
        doc.text("ID Venda:", 120, 62);
        doc.setFont("helvetica", "normal");
        doc.text(`#${venda.id.toString().slice(0, 8)}`, 145, 62);

        // Table
        const body = venda.itens.map(item => [
            item.nome,
            item.tipo,
            `R$ ${item.preco.toFixed(2)}`,
            item.quantidade,
            `R$ ${(item.preco * item.quantidade).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Item / Serviço', 'Tipo', 'Valor Unit.', 'Qtd', 'Subtotal']],
            body: body,
            theme: 'striped',
            headStyles: {
                fillColor: [139, 92, 246],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 80 }, // Item name
                1: { cellWidth: 30, halign: 'center' }, // Type
                2: { halign: 'right' }, // Price
                3: { halign: 'center' }, // Qty
                4: { halign: 'right', fontStyle: 'bold' } // Subtotal
            },
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            foot: [['', '', '', 'TOTAL', `R$ ${total.toFixed(2)}`]],
            footStyles: {
                fillColor: [243, 244, 246], // Gray-100
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'right'
            }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 20;

        doc.setDrawColor(200, 200, 200);
        doc.line(20, finalY, 190, finalY); // Signature line

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Assinatura do Responsável", 105, finalY + 5, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(139, 92, 246);
        doc.text("Obrigado pela preferência!", 105, finalY + 20, { align: 'center' });

        doc.save(`comprovante_${venda.cliente_nome.replace(/\s+/g, '_').toLowerCase()}_${data.replace(/\//g, '-')}.pdf`);
    };

    const vendasFiltradas = vendas.filter(v =>
        v.cliente_nome.toLowerCase().includes(filtroVendas.toLowerCase())
    );

    const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="w-8 h-8 text-purple-600" /> Vendas e Serviços
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Ponto de Venda (POS) e Histórico.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="w-5 h-5 mr-2" /> Nova Venda
                    </Button>
                </div>

                {/* Filters & List */}
                <Card className="overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-100 dark:border-gray-700">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Filtrar por cliente..."
                                value={filtroVendas}
                                onChange={e => setFiltroVendas(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Itens</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Carregando vendas...</td></tr>
                                ) : vendasFiltradas.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nenhuma venda encontrada.</td></tr>
                                ) : (
                                    vendasFiltradas.map((v) => {
                                        const total = v.itens.reduce((acc, i) => acc + (i.quantidade * i.preco), 0);
                                        return (
                                            <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    {new Date(v.data_venda).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="p-4 font-medium text-gray-900 dark:text-white">{v.cliente_nome}</td>
                                                <td className="p-4 text-sm text-gray-500">{v.itens.length} itens</td>
                                                <td className="p-4 font-bold text-green-600">R$ {total.toFixed(2)}</td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => gerarComprovante(v)} title="Comprovante">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={async () => {
                                                        if (window.confirm('Excluir venda?')) {
                                                            await supabase.from('vendas').delete().eq('id', v.id);
                                                            carregarDados();
                                                        }
                                                    }} title="Excluir">
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* POS Modal */}
                <AnimatePresence>
                    {modalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                            >
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-purple-600 text-white">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Nova Venda</h2>
                                    <button onClick={() => setModalOpen(false)} className="hover:bg-purple-700 p-1 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                                </div>

                                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                                    {/* Left: Products List */}
                                    <div className="w-full lg:w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                            <Input
                                                type="text"
                                                placeholder="Buscar produto/serviço..."
                                                value={filtroProduto}
                                                onChange={e => setFiltroProduto(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                            {produtos.filter(p => p.nome.toLowerCase().includes(filtroProduto.toLowerCase())).map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{p.nome}</p>
                                                        <p className="text-sm text-gray-500">{p.tipo} - R$ {p.preco.toFixed(2)}</p>
                                                        {p.tipo === 'Produto' && <p className="text-xs text-gray-400">Estoque: {p.quantidade}</p>}
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => { setProdutoSelecionado(p); setModalProdutoOpen(true); }}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Cart & Checkout */}
                                    <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 dark:bg-gray-900">
                                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4 bg-white dark:bg-gray-800">
                                            <Input
                                                placeholder="Nome do Cliente *"
                                                value={cliente}
                                                onChange={e => setCliente(e.target.value)}
                                            />
                                            <select
                                                value={formaPagamento}
                                                onChange={e => setFormaPagamento(e.target.value)}
                                                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="dinheiro">Dinheiro</option>
                                                <option value="cartao_credito">Cartão de Crédito</option>
                                                <option value="cartao_debito">Cartão de Débito</option>
                                                <option value="pix">PIX</option>
                                            </select>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4">
                                            {carrinho.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                    <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                                                    <p>Carrinho vazio</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {carrinho.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">{item.nome}</p>
                                                                <p className="text-sm text-gray-500">{item.quantidade} x R$ {item.preco.toFixed(2)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-gray-900 dark:text-white">R$ {(item.quantidade * item.preco).toFixed(2)}</span>
                                                                <button onClick={() => removerDoCarrinho(idx)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                            <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-900 dark:text-white">
                                                <span>Total:</span>
                                                <span>R$ {totalCarrinho.toFixed(2)}</span>
                                            </div>
                                            <Button
                                                onClick={finalizarVenda}
                                                className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 shadow-green-500/30"
                                            >
                                                Finalizar Venda
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Product Quantity Modal */}
                <Modal
                    isOpen={modalProdutoOpen}
                    onClose={() => setModalProdutoOpen(false)}
                    title={`Adicionar ${produtoSelecionado?.nome}`}
                    className="max-w-sm"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantidade</label>
                            <Input
                                type="number"
                                min="1"
                                value={quantidadeInput}
                                onChange={e => setQuantidadeInput(parseInt(e.target.value))}
                            />
                            {produtoSelecionado?.tipo === 'Produto' && (
                                <p className="text-xs text-gray-500 mt-1">Disponível: {produtoSelecionado.quantidade}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setModalProdutoOpen(false)}>Cancelar</Button>
                            <Button onClick={adicionarAoCarrinho}>Adicionar</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}
