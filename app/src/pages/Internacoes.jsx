import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Plus, Activity, HeartPulse, Thermometer, Wind, Utensils, Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Internacoes() {
    const [internacoes, setInternacoes] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);
    const [selectedInternacao, setSelectedInternacao] = useState(null);
    const [evolucoes, setEvolucoes] = useState([]);

    // Admission Form
    const [formData, setFormData] = useState({
        paciente_id: '',
        motivo: '',
        veterinario_responsavel: ''
    });

    // Evolution Form
    const [evoData, setEvoData] = useState({
        temperatura: '',
        frequencia_cardiaca: '',
        frequencia_respiratoria: '',
        alimentacao: '',
        medicacao_administrada: '',
        observacoes: '',
        responsavel: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Load Active Internations
            const { data: intData, error: intError } = await supabase
                .from('internacoes')
                .select(`
                    *,
                    pacientes (
                        nome,
                        tutores (nome)
                    )
                `)
                .eq('status', 'Internado')
                .order('data_entrada', { ascending: false });

            if (intError) throw intError;
            setInternacoes(intData || []);

            // Load Patients for selection
            const { data: pacData } = await supabase
                .from('pacientes')
                .select(`
                    id, 
                    nome, 
                    tutores (nome)
                `);
            setPacientes(pacData || []);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar internações.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdmit = async (e) => {
        e.preventDefault();
        if (!formData.paciente_id || !formData.motivo) {
            toast.error("Selecione o paciente e o motivo.");
            return;
        }

        try {
            const { error } = await supabase
                .from('internacoes')
                .insert([formData]);

            if (error) throw error;

            toast.success('Paciente internado!');
            setModalOpen(false);
            setFormData({ paciente_id: '', motivo: '', veterinario_responsavel: '' });
            carregarDados();
        } catch (error) {
            console.error("Erro ao internar:", error);
            toast.error('Erro ao registrar internação.');
        }
    };

    const handleDischarge = async (id) => {
        if (window.confirm('Confirmar alta do paciente?')) {
            try {
                const { error } = await supabase
                    .from('internacoes')
                    .update({ status: 'Alta', data_alta: new Date().toISOString() })
                    .eq('id', id);

                if (error) throw error;

                toast.success('Alta registrada!');
                carregarDados();
            } catch (error) {
                console.error("Erro na alta:", error);
                toast.error('Erro ao dar alta.');
            }
        }
    };

    const openEvolution = async (internacao) => {
        setSelectedInternacao(internacao);
        setEvoData({
            temperatura: '',
            frequencia_cardiaca: '',
            frequencia_respiratoria: '',
            alimentacao: '',
            medicacao_administrada: '',
            observacoes: '',
            responsavel: internacao.veterinario_responsavel || ''
        });

        // Load history
        const { data } = await supabase
            .from('evolucoes')
            .select('*')
            .eq('internacao_id', internacao.id)
            .order('data_hora', { ascending: false });

        setEvolucoes(data || []);
        setEvolutionModalOpen(true);
    };

    const saveEvolution = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('evolucoes')
                .insert([{
                    internacao_id: selectedInternacao.id,
                    ...evoData
                }]);

            if (error) throw error;

            toast.success('Evolução registrada!');

            // Refresh list
            const { data } = await supabase
                .from('evolucoes')
                .select('*')
                .eq('internacao_id', selectedInternacao.id)
                .order('data_hora', { ascending: false });
            setEvolucoes(data || []);

            // Clear form but keep responsible
            setEvoData(prev => ({
                ...prev,
                temperatura: '',
                frequencia_cardiaca: '',
                frequencia_respiratoria: '',
                alimentacao: '',
                medicacao_administrada: '',
                observacoes: ''
            }));

        } catch (error) {
            console.error("Erro ao salvar evolução:", error);
            toast.error('Erro ao salvar evolução.');
        }
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <HeartPulse className="w-8 h-8 text-red-500" /> Internação
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Monitoramento de pacientes hospitalizados.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white border-none">
                        <Plus className="w-5 h-5 mr-2" /> Nova Internação
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center text-gray-500 py-12">Carregando internações...</p>
                    ) : internacoes.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhum paciente internado no momento.</p>
                        </div>
                    ) : (
                        internacoes.map((int) => (
                            <Card key={int.id} className="border-l-4 border-l-red-500">
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{int.pacientes?.nome}</h3>
                                            <p className="text-sm text-gray-500">{int.pacientes?.tutores?.nome}</p>
                                        </div>
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                            INTERNADO
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm space-y-1">
                                        <p><span className="font-semibold">Entrada:</span> {new Date(int.data_entrada).toLocaleString('pt-BR')}</p>
                                        <p><span className="font-semibold">Motivo:</span> {int.motivo}</p>
                                        <p><span className="font-semibold">Vet:</span> {int.veterinario_responsavel}</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" className="flex-1" onClick={() => openEvolution(int)}>
                                            <Activity className="w-4 h-4 mr-2" /> Evolução
                                        </Button>
                                        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDischarge(int.id)}>
                                            <CheckCircle className="w-4 h-4 mr-1" /> Alta
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Admission Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Nova Internação"
                >
                    <form onSubmit={handleAdmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paciente *</label>
                            <select
                                value={formData.paciente_id}
                                onChange={e => setFormData({ ...formData, paciente_id: e.target.value })}
                                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            >
                                <option value="">Selecione...</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} ({p.tutores?.nome})</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Motivo da Internação *"
                            value={formData.motivo}
                            onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                            required
                        />
                        <Input
                            label="Veterinário Responsável"
                            value={formData.veterinario_responsavel}
                            onChange={e => setFormData({ ...formData, veterinario_responsavel: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white border-none">Confirmar Internação</Button>
                        </div>
                    </form>
                </Modal>

                {/* Evolution Modal */}
                <Modal
                    isOpen={evolutionModalOpen}
                    onClose={() => setEvolutionModalOpen(false)}
                    title={`Evolução: ${selectedInternacao?.pacientes?.nome}`}
                    className="max-w-4xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Form */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Novo Registro
                            </h3>
                            <form onSubmit={saveEvolution} className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <Input
                                        label="Temp (ºC)"
                                        value={evoData.temperatura}
                                        onChange={e => setEvoData({ ...evoData, temperatura: e.target.value })}
                                        placeholder="38.5"
                                    />
                                    <Input
                                        label="FC (bpm)"
                                        value={evoData.frequencia_cardiaca}
                                        onChange={e => setEvoData({ ...evoData, frequencia_cardiaca: e.target.value })}
                                        placeholder="120"
                                    />
                                    <Input
                                        label="FR (mpm)"
                                        value={evoData.frequencia_respiratoria}
                                        onChange={e => setEvoData({ ...evoData, frequencia_respiratoria: e.target.value })}
                                        placeholder="30"
                                    />
                                </div>
                                <Input
                                    label="Alimentação"
                                    value={evoData.alimentacao}
                                    onChange={e => setEvoData({ ...evoData, alimentacao: e.target.value })}
                                    placeholder="Comeu ração úmida..."
                                />
                                <Input
                                    label="Medicação Administrada"
                                    value={evoData.medicacao_administrada}
                                    onChange={e => setEvoData({ ...evoData, medicacao_administrada: e.target.value })}
                                    placeholder="Dipirona, Antibiótico..."
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações</label>
                                    <textarea
                                        value={evoData.observacoes}
                                        onChange={e => setEvoData({ ...evoData, observacoes: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                    />
                                </div>
                                <Input
                                    label="Responsável pelo registro"
                                    value={evoData.responsavel}
                                    onChange={e => setEvoData({ ...evoData, responsavel: e.target.value })}
                                />
                                <Button type="submit" className="w-full">Salvar Evolução</Button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="border-l border-gray-200 dark:border-gray-700 pl-6 max-h-[500px] overflow-y-auto">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Histórico
                            </h3>
                            <div className="space-y-6">
                                {evolucoes.map((evo) => (
                                    <div key={evo.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {new Date(evo.data_hora).toLocaleString('pt-BR')} • {evo.responsavel}
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                                            <div className="flex gap-4 text-gray-700 dark:text-gray-300 font-medium">
                                                <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {evo.temperatura || '-'}</span>
                                                <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3" /> {evo.frequencia_cardiaca || '-'}</span>
                                                <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {evo.frequencia_respiratoria || '-'}</span>
                                            </div>
                                            {evo.alimentacao && <p><span className="font-semibold">Alim:</span> {evo.alimentacao}</p>}
                                            {evo.medicacao_administrada && <p><span className="font-semibold">Med:</span> {evo.medicacao_administrada}</p>}
                                            {evo.observacoes && <p className="text-gray-600 dark:text-gray-400 italic">"{evo.observacoes}"</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}
