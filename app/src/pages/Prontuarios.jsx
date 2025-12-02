import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, FileText, Upload, Download, X, Paperclip, File, Activity, Syringe, Calendar, User, Search, PawPrint, Phone, MapPin, Mail } from 'lucide-react';
import { pdfService } from '../lib/pdfService';
import toast, { Toaster } from 'react-hot-toast';

export default function Prontuarios() {
    const [prontuarios, setProntuarios] = useState([]);
    const [vacinas, setVacinas] = useState([]);
    const [pacientes, setPacientes] = useState([]); // List of patients for selection
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('timeline');
    const [selectedPetFilter, setSelectedPetFilter] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        paciente_id: '',
        nomePet: '', // Fallback or display name
        data: new Date().toISOString().split('T')[0],
        tipoAtendimento: 'Consulta',
        diagnostico: '',
        tratamento: '',
        observacoes: '',
        peso: '',
        idade: '',
        anexos: []
    });

    // Selected Patient Data (for auto-fill display)
    const [selectedPatientData, setSelectedPatientData] = useState(null);

    const [config, setConfig] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Fetch Prontuarios
            const { data: prontuariosData, error: prontuariosError } = await supabase
                .from('prontuarios')
                .select(`
                    *,
                    pacientes (
                        *,
                        tutores (*)
                    )
                `)
                .order('data', { ascending: false });

            if (prontuariosError) throw prontuariosError;
            setProntuarios(prontuariosData || []);

            // Fetch Vacinas
            const { data: vacinasData, error: vacinasError } = await supabase
                .from('vacinas')
                .select('*')
                .order('data_aplicacao', { ascending: false });

            if (vacinasError) throw vacinasError;
            setVacinas(vacinasData || []);

            // Fetch Patients for Form
            const { data: pacientesData, error: pacientesError } = await supabase
                .from('pacientes')
                .select(`
                    *,
                    tutores (*)
                `)
                .order('nome');

            if (pacientesError) throw pacientesError;
            setPacientes(pacientesData || []);

            // Fetch Config
            const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).single();
            setConfig(configData);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar histórico.");
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        if (!patientId) {
            setFormData(prev => ({ ...prev, paciente_id: '', nomePet: '', peso: '', idade: '' }));
            setSelectedPatientData(null);
            return;
        }

        const patient = pacientes.find(p => p.id === patientId);
        if (patient) {
            setFormData(prev => ({
                ...prev,
                paciente_id: patient.id,
                nomePet: patient.nome,
                peso: patient.peso || '',
                idade: patient.idade || calculateAge(patient.data_nascimento)
            }));
            setSelectedPatientData(patient);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return '';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age.toString();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                paciente_id: formData.paciente_id || null,
                nome_pet: formData.nomePet,
                data: formData.data,
                tipo_atendimento: formData.tipoAtendimento,
                diagnostico: formData.diagnostico,
                tratamento: formData.tratamento,
                observacoes: formData.observacoes,
                peso: formData.peso,
                idade: formData.idade,
                anexos: formData.anexos
            };

            const { error } = await supabase
                .from('prontuarios')
                .insert([payload]);

            if (error) throw error;

            toast.success('Prontuário salvo com sucesso!');
            setModalOpen(false);
            resetForm();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar prontuário. Verifique se rodou a migração.');
        }
    };

    const resetForm = () => {
        setFormData({
            paciente_id: '',
            nomePet: '',
            data: new Date().toISOString().split('T')[0],
            tipoAtendimento: 'Consulta',
            diagnostico: '',
            tratamento: '',
            observacoes: '',
            peso: '',
            idade: '',
            anexos: []
        });
        setSelectedPatientData(null);
    };

    const handleDelete = async (id, anexos) => {
        if (window.confirm('Tem certeza que deseja excluir este prontuário?')) {
            try {
                if (anexos && anexos.length > 0) {
                    const paths = anexos.map(a => a.path).filter(Boolean);
                    if (paths.length > 0) {
                        await supabase.storage.from('anexos').remove(paths);
                    }
                }

                const { error } = await supabase
                    .from('prontuarios')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success('Prontuário excluído!');
                carregarDados();
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao excluir prontuário.');
            }
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);

        try {
            const newAnexos = [];
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('anexos')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('anexos')
                    .getPublicUrl(filePath);

                newAnexos.push({
                    name: file.name,
                    url: publicUrl,
                    path: filePath
                });
            }

            setFormData(prev => ({
                ...prev,
                anexos: [...prev.anexos, ...newAnexos]
            }));
            toast.success('Arquivos anexados!');
        } catch (error) {
            console.error('Erro no upload:', error);
            toast.error('Erro ao enviar arquivos.');
        } finally {
            setUploading(false);
        }
    };

    const removeAnexo = async (index) => {
        const anexo = formData.anexos[index];
        try {
            if (anexo.path) {
                const { error } = await supabase.storage
                    .from('anexos')
                    .remove([anexo.path]);
            }

            const newAnexos = [...formData.anexos];
            newAnexos.splice(index, 1);
            setFormData(prev => ({ ...prev, anexos: newAnexos }));
            toast.success('Anexo removido.');
        } catch (error) {
            console.error("Erro ao remover anexo:", error);
            toast.error("Erro ao remover anexo.");
        }
    };

    const gerarPDF = async (prontuario) => {
        try {
            // Use linked patient data if available, otherwise fallback to stored text
            const pData = prontuario.pacientes;
            const tData = pData?.tutores;

            const content = [
                {
                    type: 'info',
                    data: {
                        'Data do Atendimento': new Date(prontuario.data).toLocaleDateString('pt-BR'),
                        'Tipo': prontuario.tipo_atendimento,
                        'ID': prontuario.id.slice(0, 8).toUpperCase()
                    }
                },
                {
                    type: 'section',
                    title: 'Dados do Tutor'
                },
                {
                    type: 'info',
                    data: {
                        'Nome': tData?.nome || 'Não informado',
                        'CPF': tData?.cpf || 'Não informado',
                        'Telefone': tData?.whatsapp || 'Não informado',
                        'Endereço': tData?.endereco || 'Não informado'
                    }
                },
                {
                    type: 'section',
                    title: 'Dados do Paciente'
                },
                {
                    type: 'info',
                    data: {
                        'Nome': pData?.nome || prontuario.nome_pet || prontuario.nomePet,
                        'Espécie': pData?.especie || 'Não informado',
                        'Raça': pData?.raca || 'Não informado',
                        'Sexo': pData?.sexo || 'Não informado',
                        'Peso': `${prontuario.peso || pData?.peso || '-'} kg`,
                        'Idade': `${prontuario.idade || pData?.idade || '-'} anos`
                    }
                },
                {
                    type: 'section',
                    title: 'Anamnese / Diagnóstico'
                },
                {
                    type: 'text',
                    value: prontuario.diagnostico
                },
                prontuario.tratamento ? {
                    type: 'section',
                    title: 'Tratamento / Medicação'
                } : null,
                prontuario.tratamento ? {
                    type: 'text',
                    value: prontuario.tratamento
                } : null,
                prontuario.observacoes ? {
                    type: 'section',
                    title: 'Observações'
                } : null,
                prontuario.observacoes ? {
                    type: 'text',
                    value: prontuario.observacoes
                } : null
            ].filter(Boolean);

            await pdfService.generate({
                title: 'Prontuário Médico Veterinário',
                config: config,
                fileName: `prontuario_${pData?.nome || prontuario.nome_pet || 'documento'}.pdf`,
                content: content
            });
            toast.success('PDF gerado com sucesso!');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar PDF.");
        }
    };

    // Timeline Data Preparation
    const timelineData = [
        ...prontuarios.map(p => ({ ...p, type: 'prontuario', dateObj: new Date(p.data) })),
        ...vacinas.map(v => ({ ...v, type: 'vacina', dateObj: new Date(v.data_aplicacao) }))
    ].sort((a, b) => b.dateObj - a.dateObj);

    const filteredTimeline = selectedPetFilter
        ? timelineData.filter(item => {
            const name = item.pacientes?.nome || item.nome_pet || item.nomePet || '';
            return name.toLowerCase().includes(selectedPetFilter.toLowerCase());
        })
        : timelineData;

    const uniquePets = [...new Set(timelineData.map(item => item.pacientes?.nome || item.nome_pet || item.nomePet))].filter(Boolean).sort();

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-8 h-8 text-purple-600" /> Histórico Clínico
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Timeline completa de saúde dos pacientes.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                Cards
                            </button>
                        </div>
                        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
                            <Plus className="w-5 h-5 mr-2" /> Novo Prontuário
                        </Button>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Pet:</span>
                    <select
                        value={selectedPetFilter}
                        onChange={(e) => setSelectedPetFilter(e.target.value)}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Todos os Pets</option>
                        {uniquePets.map(pet => (
                            <option key={pet} value={pet}>{pet}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 py-12">Carregando histórico...</p>
                ) : filteredTimeline.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">Nenhum registro encontrado.</p>
                ) : viewMode === 'timeline' ? (
                    <div className="relative border-l-2 border-purple-200 dark:border-purple-900 ml-4 space-y-8 pb-8">
                        {filteredTimeline.map((item, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${item.type === 'vacina' ? 'bg-green-500' : 'bg-purple-600'}`}></div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'vacina' ? (
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <Syringe className="w-3 h-3" /> Vacina
                                                </span>
                                            ) : (
                                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> {item.tipo_atendimento}
                                                </span>
                                            )}
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                {item.pacientes?.nome || item.nome_pet || item.nomePet}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            {item.dateObj.toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    {item.type === 'vacina' ? (
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">{item.nome_vacina}</p>
                                            <p className="text-sm text-gray-500">Lote: {item.lote || 'N/A'} • Revacina: {item.data_revacina ? new Date(item.data_revacina).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Diagnóstico:</span> {item.diagnostico}</p>
                                            {item.tratamento && <p className="text-gray-600 dark:text-gray-400 text-sm"><span className="font-semibold">Tratamento:</span> {item.tratamento}</p>}

                                            {/* Display Weight/Age if available */}
                                            {(item.peso || item.idade) && (
                                                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                                    {item.peso && <span>Peso: {item.peso}kg</span>}
                                                    {item.idade && <span>Idade: {item.idade} anos</span>}
                                                </div>
                                            )}

                                            {item.anexos && item.anexos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {item.anexos.map((anexo, i) => (
                                                        <a key={i} href={anexo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                            <Paperclip className="w-3 h-3" /> {anexo.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => gerarPDF(item)} className="h-8 text-xs">
                                                    <Download className="w-3 h-3 mr-1" /> PDF
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.anexos)} className="h-8 text-xs text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Cards View
                    <div className="grid grid-cols-1 gap-6">
                        {prontuarios.map((p) => (
                            <Card key={p.id}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {p.pacientes?.nome || p.nome_pet || p.nomePet}
                                                </h3>
                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                                                    {p.tipo_atendimento}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(p.data).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-gray-600 dark:text-gray-300">
                                                <p><span className="font-semibold">Diagnóstico:</span> {p.diagnostico}</p>
                                                {p.tratamento && <p><span className="font-semibold">Tratamento:</span> {p.tratamento}</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col gap-2 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => gerarPDF(p)}>
                                                <Download className="w-4 h-4 mr-2" /> PDF
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.anexos)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Novo Prontuário"
                    className="max-w-4xl"
                >
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* 1. Seleção de Paciente */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                            <label className="block text-sm font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Selecionar Paciente Cadastrado
                            </label>
                            <select
                                value={formData.paciente_id}
                                onChange={handlePatientSelect}
                                className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">Selecione um paciente...</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome} (Tutor: {p.tutores?.nome})
                                    </option>
                                ))}
                            </select>
                            {!formData.paciente_id && (
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                                    * Selecione um paciente para preencher os dados automaticamente.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Coluna Esquerda: Dados do Tutor e Pet (Read-only) */}
                            <div className="space-y-6">
                                {/* Dados do Tutor */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                        <User className="w-4 h-4 text-blue-500" /> Dados do Tutor
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-1 gap-1">
                                            <label className="text-xs text-gray-500">Nome Completo</label>
                                            <p className="font-medium">{selectedPatientData?.tutores?.nome || '-'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">CPF</label>
                                                <p className="font-medium">{selectedPatientData?.tutores?.cpf || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Telefone</label>
                                                <p className="font-medium">{selectedPatientData?.tutores?.whatsapp || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Endereço</label>
                                            <p className="font-medium">{selectedPatientData?.tutores?.endereco || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dados do Pet */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                        <PawPrint className="w-4 h-4 text-green-500" /> Dados do Pet
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Nome do Pet</label>
                                                <Input
                                                    value={formData.nomePet}
                                                    onChange={e => setFormData({ ...formData, nomePet: e.target.value })}
                                                    placeholder="Digite se não selecionado"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Espécie</label>
                                                <p className="font-medium mt-2">{selectedPatientData?.especie || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Raça</label>
                                                <p className="font-medium mt-1">{selectedPatientData?.raca || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Sexo</label>
                                                <p className="font-medium mt-1">{selectedPatientData?.sexo || '-'}</p>
                                            </div>
                                        </div>

                                        {/* Campos Editáveis de Peso e Idade */}
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <Input
                                                label="Peso (kg)"
                                                value={formData.peso}
                                                onChange={e => setFormData({ ...formData, peso: e.target.value })}
                                                placeholder="Ex: 15.5"
                                            />
                                            <Input
                                                label="Idade (anos)"
                                                value={formData.idade}
                                                onChange={e => setFormData({ ...formData, idade: e.target.value })}
                                                placeholder="Ex: 3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coluna Direita: Dados Clínicos */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-red-500" /> Dados Clínicos
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Data do Atendimento *"
                                        type="date"
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Atendimento</label>
                                        <select
                                            value={formData.tipoAtendimento}
                                            onChange={e => setFormData({ ...formData, tipoAtendimento: e.target.value })}
                                            className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option>Consulta</option>
                                            <option>Retorno</option>
                                            <option>Exame</option>
                                            <option>Cirurgia</option>
                                            <option>Vacinação</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Anamnese / Diagnóstico *</label>
                                    <textarea
                                        value={formData.diagnostico}
                                        onChange={e => setFormData({ ...formData, diagnostico: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px]"
                                        placeholder="Descreva a queixa principal e diagnóstico..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tratamento / Medicação</label>
                                    <textarea
                                        value={formData.tratamento}
                                        onChange={e => setFormData({ ...formData, tratamento: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                        placeholder="Medicações prescritas e procedimentos..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações</label>
                                    <textarea
                                        value={formData.observacoes}
                                        onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[60px]"
                                    />
                                </div>

                                {/* File Upload */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Anexos (Exames, Fotos)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                            <Upload className="w-4 h-4" /> Escolher Arquivos
                                            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                        {uploading && <span className="text-sm text-purple-600 animate-pulse">Enviando...</span>}
                                    </div>

                                    {formData.anexos.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {formData.anexos.map((anexo, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                    <span className="text-sm truncate flex items-center gap-2">
                                                        <File className="w-4 h-4 text-gray-400" /> {anexo.name}
                                                    </span>
                                                    <button type="button" onClick={() => removeAnexo(idx)} className="text-red-500 hover:text-red-700">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={uploading}>Salvar Prontuário</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
