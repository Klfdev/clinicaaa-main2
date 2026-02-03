import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Search, Pill, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Medicamentos() {
    const [medicamentos, setMedicamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        principio_ativo: '',
        concentracao: '',
        forma_farmaceutica: 'Comprimido',
        apresentacao: '',
        instrucoes_padrao: ''
    });

    useEffect(() => {
        carregarMedicamentos();
    }, []);

    const carregarMedicamentos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('medicamentos')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setMedicamentos(data || []);
        } catch (error) {
            console.error("Erro ao carregar medicamentos:", error);
            toast.error("Erro ao carregar lista.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.nome) {
            toast.error("Nome do medicamento é obrigatório.");
            return;
        }

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('medicamentos')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success('Medicamento atualizado!');
            } else {
                const { error } = await supabase
                    .from('medicamentos')
                    .insert([formData]);
                if (error) throw error;
                toast.success('Medicamento cadastrado!');
            }

            setModalOpen(false);
            setEditingId(null);
            setFormData({
                nome: '',
                principio_ativo: '',
                concentracao: '',
                forma_farmaceutica: 'Comprimido',
                apresentacao: '',
                instrucoes_padrao: ''
            });
            carregarMedicamentos();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar medicamento.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este medicamento?')) {
            try {
                const { error } = await supabase
                    .from('medicamentos')
                    .delete()
                    .eq('id', id);
                if (error) throw error;

                setMedicamentos(medicamentos.filter(m => m.id !== id));
                toast.success('Medicamento excluído!');
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao excluir medicamento.');
            }
        }
    };

    const openModal = (med = null) => {
        if (med) {
            setEditingId(med.id);
            setFormData({
                nome: med.nome,
                principio_ativo: med.principio_ativo || '',
                concentracao: med.concentracao || '',
                forma_farmaceutica: med.forma_farmaceutica || 'Comprimido',
                apresentacao: med.apresentacao || '',
                instrucoes_padrao: med.instrucoes_padrao || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                nome: '',
                principio_ativo: '',
                concentracao: '',
                forma_farmaceutica: 'Comprimido',
                apresentacao: '',
                instrucoes_padrao: ''
            });
        }
        setModalOpen(true);
    };

    const filteredMedicamentos = medicamentos.filter(m =>
        m.nome.toLowerCase().includes(filter.toLowerCase()) ||
        (m.principio_ativo && m.principio_ativo.toLowerCase().includes(filter.toLowerCase()))
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Pill className="w-8 h-8 text-purple-600" /> Banco de Medicamentos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Gerencie os remédios para prescrição rápida.</p>
                    </div>
                    <Button onClick={() => openModal()}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Medicamento
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 relative">
                        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Buscar por nome ou princípio ativo..."
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
                                    <th className="p-4 font-semibold">Princípio Ativo</th>
                                    <th className="p-4 font-semibold">Apresentação</th>
                                    <th className="p-4 font-semibold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Carregando medicamentos...</td></tr>
                                ) : filteredMedicamentos.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Nenhum medicamento encontrado.</td></tr>
                                ) : (
                                    filteredMedicamentos.map((med) => (
                                        <tr key={med.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{med.nome}</div>
                                                <div className="text-xs text-gray-500">{med.forma_farmaceutica} • {med.concentracao}</div>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">{med.principio_ativo || '-'}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">{med.apresentacao || '-'}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openModal(med)}>
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(med.id)}>
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

                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={editingId ? 'Editar Medicamento' : 'Novo Medicamento'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="Nome Comercial *"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Apoquel"
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Princípio Ativo"
                                value={formData.principio_ativo}
                                onChange={e => setFormData({ ...formData, principio_ativo: e.target.value })}
                                placeholder="Ex: Oclacitinib"
                            />
                            <Input
                                label="Concentração"
                                value={formData.concentracao}
                                onChange={e => setFormData({ ...formData, concentracao: e.target.value })}
                                placeholder="Ex: 5.4mg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Forma</label>
                                <select
                                    value={formData.forma_farmaceutica}
                                    onChange={e => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                                    className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option>Comprimido</option>
                                    <option>Cápsula</option>
                                    <option>Xarope</option>
                                    <option>Suspensão</option>
                                    <option>Injetável</option>
                                    <option>Pomada</option>
                                    <option>Colírio</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                            <Input
                                label="Apresentação"
                                value={formData.apresentacao}
                                onChange={e => setFormData({ ...formData, apresentacao: e.target.value })}
                                placeholder="Ex: Caixa c/ 20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Instruções Padrão (Opcional)</label>
                            <textarea
                                value={formData.instrucoes_padrao}
                                onChange={e => setFormData({ ...formData, instrucoes_padrao: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                placeholder="Ex: Dar 1 comprimido a cada 12 horas por 5 dias..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
