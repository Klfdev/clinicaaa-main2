import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, FileText, Upload, Download, X, Paperclip, File, Activity, Syringe, Calendar, Clock } from 'lucide-react';
import { pdfService } from '../lib/pdfService';
import toast, { Toaster } from 'react-hot-toast';

export default function Prontuarios() {
    const [prontuarios, setProntuarios] = useState([]);
    const [vacinas, setVacinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'cards'
    const [selectedPet, setSelectedPet] = useState(''); // Filter by Pet for Timeline

    // Form State
    const [formData, setFormData] = useState({
        nomePet: '',
        data: new Date().toISOString().split('T')[0],
        tipoAtendimento: 'Consulta',
        diagnostico: '',
        tratamento: '',
        observacoes: '',
        anexos: [] // Array of { name, url, path }
    });

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
                .select('*')
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

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nome_pet: formData.nomePet,
                data: formData.data,
                tipo_atendimento: formData.tipoAtendimento,
                diagnostico: formData.diagnostico,
                tratamento: formData.tratamento,
                observacoes: formData.observacoes,
                anexos: formData.anexos
            };

            const { error } = await supabase
                .from('prontuarios')
                .insert([payload]);

            if (error) throw error;

            toast.success('Prontuário salvo com sucesso!');
            setModalOpen(false);
            setFormData({
                nomePet: '',
                data: new Date().toISOString().split('T')[0],
                tipoAtendimento: 'Consulta',
                diagnostico: '',
                tratamento: '',
                observacoes: '',
                anexos: []
            });
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar prontuário.');
        }
    };

    const handleDelete = async (id, anexos) => {
        if (window.confirm('Tem certeza que deseja excluir este prontuário?')) {
            try {
                // Delete attachments from storage first
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
                if (error) console.error("Erro ao remover do storage:", error);
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
            await pdfService.generate({
                title: 'Prontuário Médico',
                config: config,
                fileName: `prontuario_${prontuario.nome_pet || 'documento'}.pdf`,
                content: [
                    {
                        type: 'info',
                        data: {
                            'Paciente': prontuario.nome_pet || prontuario.nomePet,
                            'Data': new Date(prontuario.data).toLocaleDateString('pt-BR'),
                            'Tipo': prontuario.tipo_atendimento,
                            'ID': prontuario.id.slice(0, 8).toUpperCase()
                        }
                    },
                    {
                        type: 'section',
                        title: 'Diagnóstico'
                    },
                    {
                        type: 'text',
                        value: prontuario.diagnostico
                    },
                    prontuario.tratamento ? {
                        type: 'section',
                        title: 'Tratamento Prescrito'
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
                ].filter(Boolean)
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

    const filteredTimeline = selectedPet
        ? timelineData.filter(item => (item.nome_pet || item.nomePet || '').toLowerCase().includes(selectedPet.toLowerCase()))
        : timelineData;

    // Extract unique pets for filter
    const uniquePets = [...new Set(timelineData.map(item => item.nome_pet || item.nomePet))].filter(Boolean).sort();

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
                        <Button onClick={() => setModalOpen(true)}>
                            <Plus className="w-5 h-5 mr-2" /> Novo Prontuário
                        </Button>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Pet:</span>
                    <select
                        value={selectedPet}
                        onChange={(e) => setSelectedPet(e.target.value)}
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
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${item.type === 'vacina' ? 'bg-green-500' : 'bg-purple-600'}`}></div>

                                {/* Content */}
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
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.nome_pet || item.nomePet}</h3>
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
                    // Cards View (Legacy)
                    <div className="grid grid-cols-1 gap-6">
                        {prontuarios.map((p) => (
                            <Card key={p.id}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.nome_pet}</h3>
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

                                            {p.anexos && p.anexos.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {p.anexos.map((anexo, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={anexo.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                        >
                                                            <Paperclip className="w-3 h-3" /> {anexo.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
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
                    className="max-w-3xl"
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Nome do Pet *"
                                value={formData.nomePet}
                                onChange={e => setFormData({ ...formData, nomePet: e.target.value })}
                                required
                            />
                            <Input
                                label="Data *"
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData({ ...formData, data: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Diagnóstico *</label>
                            <textarea
                                value={formData.diagnostico}
                                onChange={e => setFormData({ ...formData, diagnostico: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tratamento / Prescrição</label>
                            <textarea
                                value={formData.tratamento}
                                onChange={e => setFormData({ ...formData, tratamento: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
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

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={uploading}>Salvar Prontuário</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
