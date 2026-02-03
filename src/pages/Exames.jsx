import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Trash2, Search, FileText, Upload, Download, Eye, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Exames() {
    const [exames, setExames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pacientes, setPacientes] = useState([]);

    // Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        paciente_id: '',
        nome_exame: '',
        data_exame: new Date().toISOString().split('T')[0],
        observacoes: '',
        resultado_url: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Fetch Exams
            const { data: examesData, error: examesError } = await supabase
                .from('exames')
                .select(`
                    *,
                    pacientes (nome, tutores(nome))
                `)
                .order('data_exame', { ascending: false });

            if (examesError) throw examesError;
            setExames(examesData || []);

            // Fetch Patients for dropdown
            const { data: pacientesData, error: pacientesError } = await supabase
                .from('pacientes')
                .select('id, nome, tutores(nome)')
                .order('nome');

            if (pacientesError) throw pacientesError;
            setPacientes(pacientesData || []);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar exames.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const uploadFile = async () => {
        if (!selectedFile) return null;

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('exames-results')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage
                .from('exames-results')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error("Erro no upload:", error);
            throw error;
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.paciente_id || !formData.nome_exame) {
            toast.error("Paciente e Nome do Exame são obrigatórios.");
            return;
        }

        setUploading(true);
        try {
            let publicUrl = formData.resultado_url;

            if (selectedFile) {
                publicUrl = await uploadFile();
            }

            const payload = {
                paciente_id: formData.paciente_id,
                nome_exame: formData.nome_exame,
                data_exame: formData.data_exame,
                observacoes: formData.observacoes,
                resultado_url: publicUrl
            };

            const { error } = await supabase
                .from('exames')
                .insert([payload]);

            if (error) throw error;

            toast.success('Exame registrado com sucesso!');
            closeModal();
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar exame. Verifique se o Bucket 'exames-results' existe.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, url) => {
        if (window.confirm('Tem certeza que deseja remover este exame?')) {
            try {
                // Delete record
                const { error } = await supabase
                    .from('exames')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Optional: Delete file from storage if needed
                // For now, we keep it simple and just delete the record reference

                setExames(exames.filter(e => e.id !== id));
                toast.success('Exame removido!');
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao remover exame.');
            }
        }
    };

    const openModal = () => {
        setFormData({
            paciente_id: '',
            nome_exame: '',
            data_exame: new Date().toISOString().split('T')[0],
            observacoes: '',
            resultado_url: ''
        });
        setSelectedFile(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const filteredExames = exames.filter(e =>
        e.nome_exame.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.pacientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.pacientes?.tutores?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-8 h-8 text-blue-600" /> Gestão de Exames
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Arquive e consulte resultados de exames.</p>
                    </div>
                    <Button onClick={openModal}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Exame
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <div className="p-4 relative">
                        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Buscar por exame, paciente ou tutor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>

                {/* List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <p className="text-center py-8 text-gray-500">Carregando exames...</p>
                    ) : filteredExames.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">Nenhum exame encontrado.</p>
                    ) : (
                        filteredExames.map((exame) => (
                            <Card key={exame.id} className="hover:shadow-md transition-shadow">
                                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{exame.nome_exame}</h3>
                                            <p className="text-sm text-gray-500">
                                                {exame.pacientes?.nome} <span className="text-xs">({exame.pacientes?.tutores?.nome})</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(exame.data_exame).toLocaleDateString('pt-BR')}
                                            </p>
                                            {exame.observacoes && (
                                                <p className="text-xs text-gray-500 max-w-[200px] truncate" title={exame.observacoes}>
                                                    {exame.observacoes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {exame.resultado_url && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(exame.resultado_url, '_blank')}
                                                    title="Ver Resultado"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(exame.id, exame.resultado_url)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title="Novo Exame"
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                            <select
                                value={formData.paciente_id}
                                onChange={e => setFormData({ ...formData, paciente_id: e.target.value })}
                                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">Selecione o Paciente</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} ({p.tutores?.nome})</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Nome do Exame *"
                            placeholder="Ex: Hemograma Completo"
                            value={formData.nome_exame}
                            onChange={e => setFormData({ ...formData, nome_exame: e.target.value })}
                            required
                        />

                        <Input
                            label="Data do Exame *"
                            type="date"
                            value={formData.data_exame}
                            onChange={e => setFormData({ ...formData, data_exame: e.target.value })}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo do Resultado (PDF/Imagem)</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*,.pdf"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedFile ? selectedFile.name : "Clique ou arraste para enviar"}
                                    </p>
                                </div>
                            </div>
                            {selectedFile && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="text-xs text-red-500 mt-1 flex items-center gap-1 hover:underline"
                                >
                                    <X className="w-3 h-3" /> Remover arquivo
                                </button>
                            )}
                        </div>

                        <Input
                            label="Observações"
                            value={formData.observacoes}
                            onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? 'Salvando...' : 'Salvar Exame'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
