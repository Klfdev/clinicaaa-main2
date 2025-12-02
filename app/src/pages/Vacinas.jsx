import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Syringe, Search, Clock, Printer, FileText, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { pdfService } from '../lib/pdfService';

export default function Vacinas() {
    const [vacinas, setVacinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [config, setConfig] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'alerts'

    // Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nomePet: '',
        nomeVacina: '',
        dataAplicacao: '',
        dataRevacina: '',
        lote: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { data: vacinasData, error: vacinasError } = await supabase
                .from('vacinas')
                .select('*')
                .order('data_aplicacao', { ascending: false });

            if (vacinasError) throw vacinasError;
            setVacinas(vacinasData || []);

            const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).single();
            setConfig(configData);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar vacinas.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Patients for Dropdown and Phone Lookup
    const [pacientesMap, setPacientesMap] = useState({});
    const [pacientesList, setPacientesList] = useState([]);

    useEffect(() => {
        const fetchPacientes = async () => {
            const { data } = await supabase
                .from('pacientes')
                .select('id, nome, tutores(nome, whatsapp)')
                .order('nome');

            if (data) {
                setPacientesList(data);
                const map = {};
                data.forEach(p => {
                    if (p.nome) map[p.nome.toLowerCase()] = p.tutores?.whatsapp;
                });
                setPacientesMap(map);
            }
        };
        fetchPacientes();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.nomePet || !formData.nomeVacina) {
            toast.error("Nome do Pet e Vacina são obrigatórios.");
            return;
        }

        try {
            const payload = {
                nome_pet: formData.nomePet,
                nome_vacina: formData.nomeVacina,
                data_aplicacao: formData.dataAplicacao,
                data_revacina: formData.dataRevacina,
                lote: formData.lote
            };

            if (editingId) {
                const { error } = await supabase
                    .from('vacinas')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success('Vacina atualizada!');
            } else {
                const { error } = await supabase
                    .from('vacinas')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Vacina registrada!');
            }

            closeModal();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar vacina.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Remover este registro de vacina?')) {
            try {
                const { error } = await supabase
                    .from('vacinas')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setVacinas(vacinas.filter(v => v.id !== id));
                toast.success('Registro removido!');
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao remover vacina.');
            }
        }
    };

    const openModal = (vacina = null) => {
        if (vacina) {
            setEditingId(vacina.id);
            setFormData({
                nomePet: vacina.nome_pet,
                nomeVacina: vacina.nome_vacina,
                dataAplicacao: vacina.data_aplicacao,
                dataRevacina: vacina.data_revacina || '',
                lote: vacina.lote || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                nomePet: '',
                nomeVacina: '',
                dataAplicacao: new Date().toISOString().split('T')[0],
                dataRevacina: '',
            });
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const gerarCarteirinha = async (petName) => {
        const petVacinas = vacinas.filter(v => v.nome_pet === petName).sort((a, b) => new Date(a.data_aplicacao) - new Date(b.data_aplicacao));
        if (petVacinas.length === 0) return toast.error("Nenhuma vacina encontrada para este pet.");

        try {
            // Tentar buscar dados completos do paciente
            const { data: paciente } = await supabase
                .from('pacientes')
                .select('*, tutores(*)')
                .ilike('nome', petName)
                .maybeSingle();

            const cardData = {
                petName: petName,
                especie: paciente?.especie,
                raca: paciente?.raca,
                sexo: paciente?.sexo,
                tutorName: paciente?.tutores?.nome,
                tutorPhone: paciente?.tutores?.whatsapp,
                vacinas: petVacinas
            };

            await pdfService.generateVaccineCard(cardData, config);
            toast.success('Carteirinha gerada com sucesso!');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar PDF.");
        }
    };

    const filteredVacinas = vacinas.filter(v =>
        v.nome_pet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.nome_vacina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.lote && v.lote.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const uniquePets = [...new Set(vacinas.map(v => v.nome_pet))];
    const isVencida = (date) => new Date(date) < new Date();

    // Filtro de Alertas (Vencidas ou vencendo em 30 dias)
    const vacinasAlerta = vacinas.filter(v => {
        if (!v.data_revacina) return false;
        const hoje = new Date();
        const revacina = new Date(v.data_revacina);
        const diffTime = revacina - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // Vencidas (negativo) ou vencendo em 30 dias
    }).sort((a, b) => new Date(a.data_revacina) - new Date(b.data_revacina));

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Syringe className="w-8 h-8 text-green-600" /> Controle de Vacinas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Gerencie o histórico de imunização.</p>
                    </div>
                    <Button onClick={() => openModal()}>
                        <Plus className="w-5 h-5 mr-2" /> Nova Vacina
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Buscar por pet, vacina ou lote..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'list' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Todas as Vacinas
                    </button>
                    <button
                        onClick={() => setViewMode('alerts')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'alerts' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Alertas de Vencimento ({vacinasAlerta.length})
                    </button>
                </div>

                {/* Print Cards Section */}
                {uniquePets.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Imprimir Carteirinhas
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {uniquePets.map(pet => (
                                <button
                                    key={pet}
                                    onClick={() => gerarCarteirinha(pet)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors whitespace-nowrap border border-green-100 dark:border-green-800"
                                >
                                    <FileText className="w-3 h-3" /> {pet}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* List Content */}
                {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredVacinas.map((vacina) => (
                            <Card key={vacina.id} className="hover:shadow-md transition-shadow">
                                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                            <Syringe className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{vacina.nome_pet}</h3>
                                            <p className="text-sm text-gray-500">{vacina.nome_vacina} {vacina.lote && `(Lote: ${vacina.lote})`}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Aplicada: {new Date(vacina.data_aplicacao).toLocaleDateString('pt-BR')}
                                            </p>
                                            {vacina.data_revacina && (
                                                <p className={`text-xs font-medium flex items-center gap-1 justify-end ${isVencida(vacina.data_revacina) ? 'text-red-600' : 'text-orange-600'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    Revacina: {new Date(vacina.data_revacina).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(vacina)}>
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(vacina.id)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {filteredVacinas.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                Nenhuma vacina encontrada.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {vacinasAlerta.length === 0 ? (
                            <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Tudo em dia!</h3>
                                <p className="text-green-600 dark:text-green-400">Nenhuma vacina vencida ou vencendo nos próximos 30 dias.</p>
                            </div>
                        ) : (
                            vacinasAlerta.map((vacina) => {
                                const vencida = isVencida(vacina.data_revacina);
                                return (
                                    <Card key={vacina.id} className={`border-l-4 ${vencida ? 'border-red-500' : 'border-orange-500'}`}>
                                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-full ${vencida ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white">{vacina.nome_pet}</h3>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{vacina.nome_vacina}</p>
                                                    <p className={`text-xs font-bold mt-1 ${vencida ? 'text-red-600' : 'text-orange-600'}`}>
                                                        {vencida ? 'VENCIDA em ' : 'VENCE em '}
                                                        {new Date(vacina.data_revacina).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-green-500 hover:bg-green-600 text-white border-none w-full md:w-auto"
                                                onClick={() => {
                                                    const phone = pacientesMap[vacina.nome_pet.toLowerCase()]?.replace(/\D/g, '');
                                                    if (!phone) return toast.error("Telefone do tutor não encontrado.");

                                                    const date = new Date(vacina.data_revacina).toLocaleDateString('pt-BR');
                                                    const status = vencida ? "venceu" : "vence";
                                                    const clinicName = config?.nome_clinica || "Clínica Veterinária";

                                                    const message = `Olá, tudo bem? 🐾\n\nAqui é da *${clinicName}*.\n\nPassando para lembrar que a vacina *${vacina.nome_vacina}* do(a) *${vacina.nome_pet}* ${status} dia *${date}*.\n\nManter a imunização em dia é fundamental para a saúde do seu pet. Vamos agendar um horário?`;

                                                    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                }}
                                            >
                                                <Phone className="w-4 h-4 mr-2" /> Avisar Tutor no WhatsApp
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Modal */}
                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title={editingId ? 'Editar Vacina' : 'Nova Vacina'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Pet *</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                value={formData.nomePet}
                                onChange={e => setFormData({ ...formData, nomePet: e.target.value })}
                                required
                            >
                                <option value="">Selecione um paciente...</option>
                                {pacientesList.map(p => (
                                    <option key={p.id} value={p.nome}>
                                        {p.nome} {p.tutores?.nome ? `(Tutor: ${p.tutores.nome})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Nome da Vacina *"
                            value={formData.nomeVacina}
                            onChange={e => setFormData({ ...formData, nomeVacina: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Data Aplicação *"
                                type="date"
                                value={formData.dataAplicacao}
                                onChange={e => setFormData({ ...formData, dataAplicacao: e.target.value })}
                                required
                            />
                            <Input
                                label="Data Revacina"
                                type="date"
                                value={formData.dataRevacina}
                                onChange={e => setFormData({ ...formData, dataRevacina: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Lote"
                            value={formData.lote}
                            onChange={e => setFormData({ ...formData, lote: e.target.value })}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            </div >
        </Layout >
    );
}
