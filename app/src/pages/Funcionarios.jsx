import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Users, Briefcase, DollarSign, Calendar, Phone, CreditCard, Edit2, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Funcionarios() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFuncionario, setSelectedFuncionario] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        role: 'recepcionista',
        cargo: '',
        cpf: '',
        telefone: '',
        data_admissao: '',
        salario: '',
        comissao_percentual: '',
        pix_chave: ''
    });

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const fetchFuncionarios = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setFuncionarios(data || []);
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            toast.error("Erro ao carregar lista de funcionários.");
        } finally {
            setLoading(false);
        }
    };

    const handleNewClick = () => {
        setSelectedFuncionario(null);
        setFormData({
            role: 'recepcionista',
            nome: '',
            cargo: '',
            cpf: '',
            telefone: '',
            data_admissao: '',
            salario: '',
            comissao_percentual: '',
            pix_chave: ''
        });
        setModalOpen(true);
    };

    const handleEditClick = (func) => {
        setSelectedFuncionario(func);
        setFormData({
            role: 'recepcionista', // Campo legado ou visual, já que acesso é via profiles
            nome: func.nome,
            cargo: func.cargo || '',
            cpf: func.cpf || '',
            telefone: func.telefone || '',
            data_admissao: func.data_admissao || '',
            salario: func.salario || '',
            comissao_percentual: func.comissao_percentual || '',
            pix_chave: func.pix_chave || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
            try {
                const { error } = await supabase.from('funcionarios').delete().eq('id', id);
                if (error) throw error;
                toast.success('Funcionário removido!');
                fetchFuncionarios();
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error("Erro ao remover funcionário.");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                nome: formData.nome,
                cargo: formData.cargo,
                cpf: formData.cpf,
                telefone: formData.telefone,
                data_admissao: formData.data_admissao || null,
                salario: formData.salario ? parseFloat(formData.salario) : null,
                comissao_percentual: formData.comissao_percentual ? parseFloat(formData.comissao_percentual) : 0,
                pix_chave: formData.pix_chave
            };

            if (selectedFuncionario) {
                const { error } = await supabase
                    .from('funcionarios')
                    .update(payload)
                    .eq('id', selectedFuncionario.id);
                if (error) throw error;
                toast.success('Funcionário atualizado!');
            } else {
                const { error } = await supabase
                    .from('funcionarios')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Funcionário cadastrado!');
            }

            setModalOpen(false);
            fetchFuncionarios();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar dados.");
        }
    };

    const filteredFuncionarios = funcionarios.filter(f =>
        (f.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.cargo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-8 h-8 text-purple-600" /> Gestão de Funcionários
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Administre cargos, salários e permissões da sua equipe.</p>
                    </div>
                    <Button onClick={handleNewClick}>
                        <Users className="w-5 h-5 mr-2" /> Novo Funcionário
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center py-12 text-gray-500">Carregando funcionários...</p>
                    ) : filteredFuncionarios.length === 0 ? (
                        <p className="col-span-full text-center py-12 text-gray-500">Nenhum funcionário encontrado.</p>
                    ) : (
                        filteredFuncionarios.map((func) => (
                            <Card key={func.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                {func.nome?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]" title={func.nome}>
                                                    {func.nome || 'Sem Nome'}
                                                </h3>
                                                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{func.cargo || 'Sem Cargo'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => handleEditClick(func)}>
                                                <Edit2 className="w-4 h-4 text-gray-500" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(func.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{func.telefone || 'Sem telefone'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-gray-400" />
                                            <span>CPF: {func.cpf || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <span>Salário: R$ {func.salario ? func.salario.toFixed(2) : '-'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedFuncionario ? `Editar: ${selectedFuncionario.nome}` : 'Novo Funcionário'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="Nome Completo *"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cargo (Ex: Gerente)"
                                value={formData.cargo}
                                onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                            />
                            <Input
                                label="CPF"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Telefone"
                                value={formData.telefone}
                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                            <Input
                                label="Data de Admissão"
                                type="date"
                                value={formData.data_admissao}
                                onChange={e => setFormData({ ...formData, data_admissao: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Salário (R$)"
                                type="number"
                                step="0.01"
                                value={formData.salario}
                                onChange={e => setFormData({ ...formData, salario: e.target.value })}
                            />
                            <Input
                                label="Comissão (%)"
                                type="number"
                                step="0.1"
                                value={formData.comissao_percentual}
                                onChange={e => setFormData({ ...formData, comissao_percentual: e.target.value })}
                            />
                        </div>

                        <Input
                            label="Chave Pix (Para Pagamentos)"
                            value={formData.pix_chave}
                            onChange={e => setFormData({ ...formData, pix_chave: e.target.value })}
                            placeholder="Email, CPF ou Aleatória"
                        />

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
