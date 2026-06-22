import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Search, User, Phone, Mail, MapPin, ChevronDown, ChevronRight, Scissors, Calendar, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // Client Form State
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState(null);
    const [clientFormData, setClientFormData] = useState({
        nome: '',
        cpf: '',
        whatsapp: '',
        email: '',
        endereco: '',
        observacoes: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nome');

            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };

    // --- Client Actions ---

    const handleSaveClient = async (e) => {
        e.preventDefault();
        if (!clientFormData.nome) {
            toast.error("Nome do Cliente é obrigatório.");
            return;
        }

        try {
            if (editingClientId) {
                const { error } = await supabase
                    .from('clientes')
                    .update(clientFormData)
                    .eq('id', editingClientId);
                if (error) throw error;
                toast.success('Cliente atualizado!');
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .insert([clientFormData]);
                if (error) throw error;
                toast.success('Cliente cadastrado!');
            }
            closeClientModal();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar cliente:", error);
            toast.error('Erro ao salvar cliente.');
        }
    };

    const handleDeleteClient = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este cliente?')) {
            try {
                const { error } = await supabase
                    .from('clientes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setClientes(clientes.filter(c => c.id !== id));
                toast.success('Cliente removido!');
            } catch (error) {
                console.error("Erro ao deletar cliente:", error);
                toast.error('Erro ao remover cliente.');
            }
        }
    };

    const openClientModal = (client = null) => {
        if (client) {
            setEditingClientId(client.id);
            setClientFormData({
                nome: client.nome,
                cpf: client.cpf || '',
                whatsapp: client.whatsapp || '',
                email: client.email || '',
                endereco: client.endereco || '',
                observacoes: client.observacoes || ''
            });
        } else {
            setEditingClientId(null);
            setClientFormData({
                nome: '',
                cpf: '',
                whatsapp: '',
                email: '',
                endereco: '',
                observacoes: ''
            });

        }
        setClientModalOpen(true);
    };

    const closeClientModal = () => {
        setClientModalOpen(false);
        setEditingClientId(null);
    };


    const filteredClients = clientes.filter(c =>
        c.nome.toLowerCase().includes(filter.toLowerCase()) ||
        (c.whatsapp && c.whatsapp.includes(filter))
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">

                {/* Vintage Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#f4ecd8] flex items-center gap-2 font-display">
                            <User className="w-8 h-8 text-[#D4AF37]" /> Clientes VIP
                        </h1>
                        <p className="text-[#5c4d3c] dark:text-[#a89f91]">Gerencie sua carteira de clientes exclusivos.</p>
                    </div>
                    <Button onClick={() => openClientModal()}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Cliente
                    </Button>
                </div>

                {/* Filter */}
                <Card className="border-[#D4AF37]/20">
                    <div className="p-4 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome ou telefone..."
                                className="pl-10"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Client Grid */}
                {loading ? (
                    <p className="text-center py-10 text-gray-500">Carregando carteira de clientes...</p>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12 bg-[#fcf6e8] dark:bg-[#1a1a1a] rounded-xl border border-dashed border-[#D4AF37]/30">
                        <User className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
                        <p className="text-[#5c4d3c] dark:text-[#a89f91]">Nenhum cliente encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map(client => (
                            <Card key={client.id} className="hover:border-[#D4AF37] transition-all duration-300 group border-[#D4AF37]/10">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#D4AF37] font-bold text-xl border border-[#D4AF37]/50">
                                                {client.nome ? client.nome[0].toUpperCase() : 'C'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-[#1a1a1a] dark:text-[#f4ecd8] font-display">{client.nome}</h3>
                                                <p className="text-xs text-[#5c4d3c] dark:text-[#a89f91]">Cliente desde {new Date().getFullYear()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => openClientModal(client)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDeleteClient(client.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {client.whatsapp && (
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Phone className="w-4 h-4 text-[#D4AF37]" />
                                                <span>{client.whatsapp}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Mail className="w-4 h-4 text-[#D4AF37]" />
                                                <span>{client.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#D4AF37]/10 flex justify-between items-center">
                                        <span className="text-xs font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">
                                            VIP
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white border-none h-8 px-3"
                                            onClick={() => {
                                                const phone = client.whatsapp?.replace(/\D/g, '');
                                                if (phone) window.open(`https://wa.me/55${phone}`, '_blank');
                                                else toast.error("Sem WhatsApp");
                                            }}
                                        >
                                            <Phone className="w-3 h-3 mr-1" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal */}
                <Modal
                    isOpen={clientModalOpen}
                    onClose={closeClientModal}
                    title={editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
                >
                    <form onSubmit={handleSaveClient} className="space-y-4">
                        <Input
                            label="Nome Completo *"
                            value={clientFormData.nome}
                            onChange={e => setClientFormData({ ...clientFormData, nome: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="WhatsApp / Telefone"
                                value={clientFormData.whatsapp}
                                onChange={e => setClientFormData({ ...clientFormData, whatsapp: e.target.value })}
                            />
                            <Input
                                label="CPF"
                                value={clientFormData.cpf}
                                onChange={e => setClientFormData({ ...clientFormData, cpf: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Email"
                            type="email"
                            value={clientFormData.email}
                            onChange={e => setClientFormData({ ...clientFormData, email: e.target.value })}
                        />
                        <Input
                            label="Endereço"
                            value={clientFormData.endereco}
                            onChange={e => setClientFormData({ ...clientFormData, endereco: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                            <textarea
                                value={clientFormData.observacoes}
                                onChange={e => setClientFormData({ ...clientFormData, observacoes: e.target.value })}
                                className="flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-[#D4AF37] outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closeClientModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
