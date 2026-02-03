import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Package, Search, Tag, DollarSign, Layers, History } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Estoque() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // History State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedItemName, setSelectedItemName] = useState('');

    // Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [itemType, setItemType] = useState('Produto'); // Produto or Serviço
    const [formData, setFormData] = useState({
        nome: '',
        precoVenda: '',
        quantidade: '',
        descricao: ''
    });

    useEffect(() => {
        carregarEstoque();
    }, []);

    const carregarEstoque = async () => {
        setLoading(true);
        try {
            // Fetch Products
            const { data: produtos, error: errorProd } = await supabase
                .from('estoque')
                .select('*');
            if (errorProd) throw errorProd;

            // Fetch Services
            const { data: servicos, error: errorServ } = await supabase
                .from('servicos')
                .select('*');
            if (errorServ) throw errorServ;

            const listaCompleta = [
                ...produtos.map(p => ({ ...p, tipo: 'Produto' })),
                ...servicos.map(s => ({ ...s, tipo: 'Serviço', quantidade: '-' }))
            ].sort((a, b) => a.nome.localeCompare(b.nome));

            setItems(listaCompleta);
        } catch (error) {
            console.error("Erro ao carregar estoque:", error);
            toast.error("Erro ao carregar itens.");
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async (item) => {
        setSelectedItemName(item.nome);
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('movimentacoes_estoque')
                .select('*')
                .eq('item_id', item.id)
                .order('data', { ascending: false });

            if (error) throw error;
            setHistoryItems(data || []);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            toast.error("Erro ao carregar histórico.");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.precoVenda) {
            toast.error("Nome e Preço são obrigatórios.");
            return;
        }

        try {
            const table = itemType === 'Produto' ? 'estoque' : 'servicos';
            const payload = {
                nome: formData.nome,
                precoVenda: parseFloat(formData.precoVenda),
                descricao: formData.descricao
            };

            let newQty = 0;
            if (itemType === 'Produto') {
                newQty = parseInt(formData.quantidade) || 0;
                payload.quantidade = newQty;
            }

            let itemId = editingId;

            if (editingId) {
                const { error } = await supabase
                    .from(table)
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success('Item atualizado!');

                // Record Movement if Quantity Changed (Only for Products)
                if (itemType === 'Produto') {
                    const oldItem = items.find(i => i.id === editingId);
                    if (oldItem) {
                        const oldQty = parseInt(oldItem.quantidade) || 0;
                        const diff = newQty - oldQty;

                        if (diff !== 0) {
                            await supabase.from('movimentacoes_estoque').insert([{
                                item_id: editingId,
                                tipo: diff > 0 ? 'entrada' : 'saida',
                                quantidade: Math.abs(diff),
                                motivo: 'Ajuste Manual'
                            }]);
                        }
                    }
                }

            } else {
                const { data, error } = await supabase
                    .from(table)
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                itemId = data.id;
                toast.success('Item cadastrado!');

                // Record Initial Entry
                if (itemType === 'Produto' && newQty > 0) {
                    await supabase.from('movimentacoes_estoque').insert([{
                        item_id: itemId,
                        tipo: 'entrada',
                        quantidade: newQty,
                        motivo: 'Cadastro Inicial'
                    }]);
                }
            }

            closeModal();
            carregarEstoque();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar item.');
        }
    };

    const handleDelete = async (id, tipo) => {
        if (window.confirm(`Remover este ${tipo.toLowerCase()}?`)) {
            try {
                const table = tipo === 'Produto' ? 'estoque' : 'servicos';
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setItems(items.filter(i => i.id !== id));
                toast.success('Item removido!');
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao remover item.');
            }
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setItemType(item.tipo);
            setFormData({
                nome: item.nome,
                precoVenda: item.precoVenda,
                quantidade: item.quantidade === '-' ? '' : item.quantidade,
                descricao: item.descricao || ''
            });
        } else {
            setEditingId(null);
            setItemType('Produto');
            setFormData({
                nome: '',
                precoVenda: '',
                quantidade: '',
                descricao: ''
            });
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const filteredItems = items.filter(i =>
        i.nome.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="w-8 h-8 text-purple-600" /> Estoque e Serviços
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Gerencie produtos e serviços oferecidos.</p>
                    </div>
                    <Button onClick={() => openModal()}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Item
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 relative">
                        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Buscar item..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>

                {/* List */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="p-4 font-semibold">Nome</th>
                                    <th className="p-4 font-semibold">Tipo</th>
                                    <th className="p-4 font-semibold">Preço</th>
                                    <th className="p-4 font-semibold">Qtd.</th>
                                    <th className="p-4 font-semibold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Carregando estoque...</td></tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nenhum item encontrado.</td></tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                {item.nome}
                                                {item.descricao && <p className="text-xs text-gray-400">{item.descricao}</p>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.tipo === 'Produto'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}>
                                                    {item.tipo}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                R$ {item.precoVenda.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">
                                                {item.quantidade}
                                            </td>
                                            <td className="p-4 flex justify-center gap-2">
                                                {item.tipo === 'Produto' && (
                                                    <Button variant="ghost" size="icon" onClick={() => loadHistory(item)} title="Histórico">
                                                        <History className="w-4 h-4 text-purple-600" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => openModal(item)}>
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.tipo)}>
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

                {/* History Modal */}
                <Modal
                    isOpen={historyModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    title={`Histórico: ${selectedItemName}`}
                >
                    <div className="max-h-96 overflow-y-auto">
                        {historyLoading ? (
                            <p className="text-center py-4">Carregando...</p>
                        ) : historyItems.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">Nenhuma movimentação registrada.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2">Qtd</th>
                                        <th className="p-2">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {historyItems.map((h) => (
                                        <tr key={h.id}>
                                            <td className="p-2 text-gray-600 dark:text-gray-400">
                                                {new Date(h.data).toLocaleDateString('pt-BR')} {new Date(h.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.tipo === 'entrada' ? 'bg-green-100 text-green-700' :
                                                    h.tipo === 'saida' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {h.tipo.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-2 font-medium">{h.quantidade}</td>
                                            <td className="p-2 text-gray-500">{h.motivo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={() => setHistoryModalOpen(false)}>Fechar</Button>
                    </div>
                </Modal>

                {/* Edit/Create Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title={editingId ? 'Editar Item' : 'Novo Item'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        {!editingId && (
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="Produto"
                                        checked={itemType === 'Produto'}
                                        onChange={() => setItemType('Produto')}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Produto</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="Serviço"
                                        checked={itemType === 'Serviço'}
                                        onChange={() => setItemType('Serviço')}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Serviço</span>
                                </label>
                            </div>
                        )}

                        <Input
                            label="Nome *"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Preço de Venda *"
                                type="number"
                                step="0.01"
                                value={formData.precoVenda}
                                onChange={e => setFormData({ ...formData, precoVenda: e.target.value })}
                                required
                            />
                            {itemType === 'Produto' && (
                                <Input
                                    label="Quantidade *"
                                    type="number"
                                    value={formData.quantidade}
                                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                    required
                                />
                            )}
                        </div>

                        <Input
                            label="Descrição"
                            value={formData.descricao}
                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                        />

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
