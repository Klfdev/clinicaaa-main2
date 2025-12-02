import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Search, User, Phone, Mail, MapPin, ChevronDown, ChevronRight, PawPrint, Calendar, Weight, Info, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Pacientes() {
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [expandedTutors, setExpandedTutors] = useState(new Set());

    // Tutor Form State
    const [tutorModalOpen, setTutorModalOpen] = useState(false);
    const [editingTutorId, setEditingTutorId] = useState(null);
    const [tutorFormData, setTutorFormData] = useState({
        nome: '',
        cpf: '',
        whatsapp: '',
        email: '',
        endereco: ''
    });

    // Patient Form State
    const [patientModalOpen, setPatientModalOpen] = useState(false);
    const [editingPatientId, setEditingPatientId] = useState(null);
    const [selectedTutorId, setSelectedTutorId] = useState(null);
    const [patientFormData, setPatientFormData] = useState({
        nome: '',
        especie: '',
        raca: '',
        sexo: '',
        data_nascimento: '',
        idade: '',
        peso: '',
        pelagem: '',
        observacoes: ''
    });

    // Ficha (View) State
    const [fichaOpen, setFichaOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedPatientTutor, setSelectedPatientTutor] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tutores')
                .select(`
                    *,
                    pacientes (*)
                `)
                .order('nome', { ascending: true });

            if (error) throw error;
            setTutores(data || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };

    // --- Tutor Actions ---

    const handleSaveTutor = async (e) => {
        e.preventDefault();
        if (!tutorFormData.nome) {
            toast.error("Nome do Tutor é obrigatório.");
            return;
        }

        try {
            if (editingTutorId) {
                const { error } = await supabase
                    .from('tutores')
                    .update(tutorFormData)
                    .eq('id', editingTutorId);
                if (error) throw error;
                toast.success('Tutor atualizado!');
            } else {
                const { error } = await supabase
                    .from('tutores')
                    .insert([tutorFormData]);
                if (error) throw error;
                toast.success('Tutor cadastrado!');
            }
            closeTutorModal();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar tutor:", error);
            toast.error('Erro ao salvar tutor.');
        }
    };

    const handleDeleteTutor = async (id) => {
        if (window.confirm('Tem certeza? Isso removerá o tutor e TODOS os seus animais.')) {
            try {
                const { error } = await supabase.from('tutores').delete().eq('id', id);
                if (error) throw error;
                setTutores(tutores.filter(t => t.id !== id));
                toast.success('Tutor removido!');
            } catch (error) {
                console.error("Erro ao deletar tutor:", error);
                toast.error('Erro ao remover tutor.');
            }
        }
    };

    const openTutorModal = (tutor = null) => {
        if (tutor) {
            setEditingTutorId(tutor.id);
            setTutorFormData({
                nome: tutor.nome,
                cpf: tutor.cpf || '',
                whatsapp: tutor.whatsapp || '',
                email: tutor.email || '',
                endereco: tutor.endereco || ''
            });
        } else {
            setEditingTutorId(null);
            setTutorFormData({ nome: '', cpf: '', whatsapp: '', email: '', endereco: '' });
        }
        setTutorModalOpen(true);
    };

    const closeTutorModal = () => {
        setTutorModalOpen(false);
        setEditingTutorId(null);
    };

    // --- Patient Actions ---

    const handleSavePatient = async (e) => {
        e.preventDefault();
        if (!patientFormData.nome || !selectedTutorId) {
            toast.error("Nome do Pet e Tutor são obrigatórios.");
            return;
        }

        const payload = {
            ...patientFormData,
            tutor_id: selectedTutorId
        };

        // Clean up empty strings to null for better DB hygiene (optional but good)
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') payload[key] = null;
        });

        try {
            if (editingPatientId) {
                const { error } = await supabase
                    .from('pacientes')
                    .update(payload)
                    .eq('id', editingPatientId);
                if (error) throw error;
                toast.success('Paciente atualizado!');

                // If we were viewing the ficha, update the selected patient view too
                if (fichaOpen && selectedPatient?.id === editingPatientId) {
                    setSelectedPatient({ ...selectedPatient, ...payload });
                }
            } else {
                const { error } = await supabase
                    .from('pacientes')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Paciente adicionado!');
            }
            closePatientModal();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar paciente:", error);
            toast.error('Erro ao salvar paciente. Verifique se rodou a migração.');
        }
    };

    const handleDeletePatient = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este paciente?')) {
            try {
                const { error } = await supabase.from('pacientes').delete().eq('id', id);
                if (error) throw error;
                carregarDados();
                if (fichaOpen) closeFicha();
                toast.success('Paciente removido!');
            } catch (error) {
                console.error("Erro ao deletar paciente:", error);
                toast.error('Erro ao remover paciente.');
            }
        }
    };

    const openPatientModal = (tutorId, patient = null) => {
        setSelectedTutorId(tutorId);
        if (patient) {
            setEditingPatientId(patient.id);
            setPatientFormData({
                nome: patient.nome,
                especie: patient.especie || '',
                raca: patient.raca || '',
                sexo: patient.sexo || '',
                data_nascimento: patient.data_nascimento || '',
                idade: patient.idade || '',
                peso: patient.peso || '',
                pelagem: patient.pelagem || '',
                observacoes: patient.observacoes || ''
            });
        } else {
            setEditingPatientId(null);
            setPatientFormData({
                nome: '', especie: '', raca: '', sexo: '',
                data_nascimento: '', idade: '', peso: '', pelagem: '', observacoes: ''
            });
        }
        setPatientModalOpen(true);
    };

    const closePatientModal = () => {
        setPatientModalOpen(false);
        setEditingPatientId(null);
        setSelectedTutorId(null);
    };

    // --- Ficha Actions ---

    const openFicha = (tutor, patient) => {
        setSelectedPatient(patient);
        setSelectedPatientTutor(tutor);
        setFichaOpen(true);
    };

    const closeFicha = () => {
        setFichaOpen(false);
        setSelectedPatient(null);
        setSelectedPatientTutor(null);
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'Idade não informada';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        if (age === 0) {
            const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
            return `${months} meses`;
        }
        return `${age} anos`;
    };

    // --- UI Helpers ---

    const toggleTutorExpand = (tutorId) => {
        const newExpanded = new Set(expandedTutors);
        if (newExpanded.has(tutorId)) {
            newExpanded.delete(tutorId);
        } else {
            newExpanded.add(tutorId);
        }
        setExpandedTutors(newExpanded);
    };

    const filteredTutores = tutores.filter(t =>
        t.nome.toLowerCase().includes(filter.toLowerCase()) ||
        (t.pacientes && t.pacientes.some(p => p.nome.toLowerCase().includes(filter.toLowerCase())))
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-8 h-8 text-purple-600" /> Tutores e Pacientes
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Gerencie cadastros de tutores e seus animais.</p>
                    </div>
                    <Button onClick={() => openTutorModal()}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Tutor
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 relative">
                        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Buscar por tutor ou paciente..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">Carregando dados...</div>
                    ) : filteredTutores.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">Nenhum registro encontrado.</div>
                    ) : (
                        filteredTutores.map((tutor) => (
                            <Card key={tutor.id} className="overflow-hidden">
                                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-800">
                                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTutorExpand(tutor.id)}>
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                            {expandedTutors.has(tutor.id) ? <ChevronDown className="w-5 h-5 text-purple-600" /> : <ChevronRight className="w-5 h-5 text-purple-600" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{tutor.nome}</h3>
                                            <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {tutor.cpf && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {tutor.cpf}</span>}
                                                {tutor.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {tutor.whatsapp}</span>}
                                                {tutor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {tutor.email}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openPatientModal(tutor.id)}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Pet
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openTutorModal(tutor)}>
                                            <Edit2 className="w-4 h-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTutor(tutor.id)}>
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Patients List (Expanded) */}
                                {expandedTutors.has(tutor.id) && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 p-4 pl-4 md:pl-16">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <PawPrint className="w-4 h-4" /> Animais ({tutor.pacientes?.length || 0})
                                        </h4>

                                        {tutor.pacientes && tutor.pacientes.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {tutor.pacientes.map(pet => (
                                                    <div
                                                        key={pet.id}
                                                        onClick={() => openFicha(tutor, pet)}
                                                        className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-start shadow-sm cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 transition-colors">{pet.nome}</p>
                                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                                <p>{pet.especie || 'Espécie não inf.'} • {pet.raca || 'Raça não inf.'}</p>
                                                                <p>{pet.sexo || 'Sexo não inf.'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openPatientModal(tutor.id, pet); }}
                                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Nenhum animal cadastrado para este tutor.</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Ficha Modal (View Only) */}
                <Modal
                    isOpen={fichaOpen}
                    onClose={closeFicha}
                    title="Ficha do Paciente"
                    className="max-w-2xl"
                >
                    {selectedPatient && selectedPatientTutor && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                                    <PawPrint className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPatient.nome}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        {selectedPatient.especie} • {selectedPatient.raca}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tutor Info */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <User className="w-4 h-4 text-purple-500" /> Dados do Tutor
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium text-lg">{selectedPatientTutor.nome}</p>
                                        {selectedPatientTutor.cpf && (
                                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <FileText className="w-3 h-3" /> CPF: {selectedPatientTutor.cpf}
                                            </p>
                                        )}
                                        {selectedPatientTutor.whatsapp && (
                                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <Phone className="w-3 h-3" /> {selectedPatientTutor.whatsapp}
                                            </p>
                                        )}
                                        {selectedPatientTutor.email && (
                                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <Mail className="w-3 h-3" /> {selectedPatientTutor.email}
                                            </p>
                                        )}
                                        {selectedPatientTutor.endereco && (
                                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                <MapPin className="w-3 h-3" /> {selectedPatientTutor.endereco}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Patient Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Sexo</p>
                                            <p className="font-medium">{selectedPatient.sexo || '-'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Idade</p>
                                            <p className="font-medium">
                                                {selectedPatient.idade ? selectedPatient.idade : calculateAge(selectedPatient.data_nascimento)}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Peso</p>
                                            <p className="font-medium">{selectedPatient.peso || '-'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Pelagem</p>
                                            <p className="font-medium">{selectedPatient.pelagem || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observations */}
                            {selectedPatient.observacoes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-500 flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4" /> Observações
                                    </h3>
                                    <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">
                                        {selectedPatient.observacoes}
                                    </p>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Button variant="outline" onClick={() => {
                                    openPatientModal(selectedPatientTutor.id, selectedPatient);
                                    // Keep ficha open? Or close it? Let's keep it open so when they save it updates.
                                    // Actually, let's rely on the update logic in handleSavePatient
                                }}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Editar Dados
                                </Button>
                                <Button onClick={closeFicha}>
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Tutor Modal */}
                <Modal
                    isOpen={tutorModalOpen}
                    onClose={closeTutorModal}
                    title={editingTutorId ? 'Editar Tutor' : 'Novo Tutor'}
                >
                    <form onSubmit={handleSaveTutor} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nome do Tutor *"
                                value={tutorFormData.nome}
                                onChange={e => setTutorFormData({ ...tutorFormData, nome: e.target.value })}
                                required
                            />
                            <Input
                                label="CPF"
                                value={tutorFormData.cpf}
                                onChange={e => setTutorFormData({ ...tutorFormData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="WhatsApp"
                                value={tutorFormData.whatsapp}
                                onChange={e => setTutorFormData({ ...tutorFormData, whatsapp: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={tutorFormData.email}
                                onChange={e => setTutorFormData({ ...tutorFormData, email: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Endereço"
                            value={tutorFormData.endereco}
                            onChange={e => setTutorFormData({ ...tutorFormData, endereco: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closeTutorModal}>Cancelar</Button>
                            <Button type="submit">Salvar Tutor</Button>
                        </div>
                    </form>
                </Modal>

                {/* Patient Modal (Edit/Create) */}
                <Modal
                    isOpen={patientModalOpen}
                    onClose={closePatientModal}
                    title={editingPatientId ? 'Editar Paciente' : 'Novo Paciente'}
                    className="max-w-xl"
                >
                    <form onSubmit={handleSavePatient} className="space-y-4">
                        <Input
                            label="Nome do Pet *"
                            value={patientFormData.nome}
                            onChange={e => setPatientFormData({ ...patientFormData, nome: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Espécie"
                                placeholder="Ex: Canina"
                                value={patientFormData.especie}
                                onChange={e => setPatientFormData({ ...patientFormData, especie: e.target.value })}
                            />
                            <Input
                                label="Raça"
                                placeholder="Ex: Vira-lata"
                                value={patientFormData.raca}
                                onChange={e => setPatientFormData({ ...patientFormData, raca: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={patientFormData.sexo}
                                    onChange={e => setPatientFormData({ ...patientFormData, sexo: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Macho">Macho</option>
                                    <option value="Fêmea">Fêmea</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Idade (Ex: 2 anos)"
                                value={patientFormData.idade}
                                onChange={e => setPatientFormData({ ...patientFormData, idade: e.target.value })}
                            />
                            <Input
                                label="Data de Nascimento"
                                type="date"
                                value={patientFormData.data_nascimento}
                                onChange={e => setPatientFormData({ ...patientFormData, data_nascimento: e.target.value })}
                            />
                            <Input
                                label="Peso (Ex: 10kg)"
                                value={patientFormData.peso}
                                onChange={e => setPatientFormData({ ...patientFormData, peso: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Pelagem/Cor"
                            value={patientFormData.pelagem}
                            onChange={e => setPatientFormData({ ...patientFormData, pelagem: e.target.value })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                            <textarea
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                                value={patientFormData.observacoes}
                                onChange={e => setPatientFormData({ ...patientFormData, observacoes: e.target.value })}
                                placeholder="Alergias, comportamento, histórico..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closePatientModal}>Cancelar</Button>
                            <Button type="submit">Salvar Pet</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout >
    );
}
