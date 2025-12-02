import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import VitalSignMonitor from '../components/VitalSignMonitor';
import { Plus, Activity, HeartPulse, Thermometer, Wind, Utensils, Clock, User, FileText, CheckCircle, XCircle, Monitor } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { pdfService } from '../lib/pdfService';

export default function Internacoes() {
    const { organization } = useAuth();
    const [internacoes, setInternacoes] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);

    // Discharge Modal State
    const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
    const [selectedForDischarge, setSelectedForDischarge] = useState(null);
    const [generatePdf, setGeneratePdf] = useState(true);

    const [selectedInternacao, setSelectedInternacao] = useState(null);
    const [evolucoes, setEvolucoes] = useState([]);
    const [allEvolucoes, setAllEvolucoes] = useState({}); // Map: internacao_id -> [evolucoes]

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
        spo2: '',
        pressao_arterial: '',
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

            // Load Evolutions for Active Internations
            if (intData && intData.length > 0) {
                const ids = intData.map(i => i.id);
                const { data: evoData, error: evoError } = await supabase
                    .from('evolucoes')
                    .select('*')
                    .in('internacao_id', ids)
                    .order('data_hora', { ascending: false }); // Newest first

                if (evoError) throw evoError;

                // Group by internacao_id
                const grouped = {};
                evoData?.forEach(evo => {
                    if (!grouped[evo.internacao_id]) {
                        grouped[evo.internacao_id] = [];
                    }
                    grouped[evo.internacao_id].push(evo);
                });
                setAllEvolucoes(grouped);
            } else {
                setAllEvolucoes({});
            }

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

    const handleDischargeClick = (internacao) => {
        setSelectedForDischarge(internacao);
        setGeneratePdf(true); // Default to true
        setDischargeModalOpen(true);
    };

    const confirmDischarge = async () => {
        if (!selectedForDischarge) return;

        try {
            // 1. Generate PDF if requested
            if (generatePdf) {
                const history = allEvolucoes[selectedForDischarge.id] || [];

                // Prepare content for PDF
                const content = [
                    {
                        type: 'info',
                        data: {
                            'Paciente': selectedForDischarge.pacientes?.nome,
                            'Tutor': selectedForDischarge.pacientes?.tutores?.nome,
                            'Data Entrada': new Date(selectedForDischarge.data_entrada).toLocaleDateString('pt-BR'),
                            'Data Alta': new Date().toLocaleDateString('pt-BR'),
                            'Motivo': selectedForDischarge.motivo
                        }
                    },
                    {
                        type: 'section',
                        title: 'Histórico de Evoluções'
                    },
                    {
                        type: 'table',
                        head: ['Data/Hora', 'Temp', 'FC', 'FR', 'SPO2', 'PA', 'Obs', 'Resp.'],
                        body: history.map(h => [
                            new Date(h.data_hora).toLocaleString('pt-BR'),
                            h.temperatura || '-',
                            h.frequencia_cardiaca || '-',
                            h.frequencia_respiratoria || '-',
                            h.spo2 || '-',
                            h.pressao_arterial || '-',
                            h.observacoes || '-',
                            h.responsavel || '-'
                        ])
                    }
                ];

                await pdfService.generate({
                    title: 'Relatório de Alta / Histórico de Internação',
                    config: organization,
                    content: content,
                    fileName: `Alta_${selectedForDischarge.pacientes?.nome}_${new Date().toISOString().split('T')[0]}.pdf`
                });

                toast.success("PDF gerado com sucesso!");
            }

            // 2. Update Status in DB
            const { error } = await supabase
                .from('internacoes')
                .update({ status: 'Alta', data_alta: new Date().toISOString() })
                .eq('id', selectedForDischarge.id);

            if (error) throw error;

            toast.success('Alta registrada!');
            setDischargeModalOpen(false);
            setSelectedForDischarge(null);
            carregarDados();

        } catch (error) {
            console.error("Erro na alta:", error);
            toast.error('Erro ao processar alta.');
        }
    };

    const openEvolution = async (internacao) => {
        setSelectedInternacao(internacao);
        setEvoData({
            temperatura: '',
            frequencia_cardiaca: '',
            frequencia_respiratoria: '',
            spo2: '',
            pressao_arterial: '',
            alimentacao: '',
            medicacao_administrada: '',
            observacoes: '',
            responsavel: internacao.veterinario_responsavel || ''
        });

        // Use already fetched data if available, otherwise fetch
        const existingEvos = allEvolucoes[internacao.id] || [];
        setEvolucoes(existingEvos);

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

            // Refresh all data to update charts immediately
            carregarDados();

            // Also update local list for the modal
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
                spo2: '',
                pressao_arterial: '',
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
                            <Monitor className="w-8 h-8 text-green-500" /> UTI Digital
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Monitoramento intensivo em tempo real.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/30">
                        <Plus className="w-5 h-5 mr-2" /> Nova Internação
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center text-gray-500 py-12">Carregando monitores...</p>
                    ) : internacoes.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhum paciente na UTI no momento.</p>
                        </div>
                    ) : (
                        internacoes.map((int) => (
                            <Card key={int.id} className="border-none shadow-xl bg-gray-900 text-white overflow-hidden">
                                {/* Monitor Header */}
                                <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                                            🐶
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{int.pacientes?.nome}</h3>
                                            <p className="text-xs text-gray-400">{int.pacientes?.tutores?.nome}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-xs font-mono text-green-400">MONITORANDO</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Entrada: {new Date(int.data_entrada).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>

                                {/* Vital Signs Component */}
                                <div className="p-4 bg-black">
                                    <VitalSignMonitor evolucoes={allEvolucoes[int.id] || []} />
                                </div>

                                {/* Actions Footer */}
                                <div className="bg-gray-800 p-3 flex gap-2 border-t border-gray-700">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 border-none text-white"
                                        onClick={() => openEvolution(int)}
                                    >
                                        <Activity className="w-4 h-4 mr-2" /> Lançar Evolução
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                                        onClick={() => handleDischargeClick(int)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Alta
                                    </Button>
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
                            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white border-none">Confirmar Internação</Button>
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
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="SPO2 (%)"
                                        value={evoData.spo2}
                                        onChange={e => setEvoData({ ...evoData, spo2: e.target.value })}
                                        placeholder="98"
                                    />
                                    <Input
                                        label="PA (mmHg)"
                                        value={evoData.pressao_arterial}
                                        onChange={e => setEvoData({ ...evoData, pressao_arterial: e.target.value })}
                                        placeholder="120/80"
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
                                            {evo.spo2 && <p><span className="font-semibold">SPO2:</span> {evo.spo2}%</p>}
                                            {evo.pressao_arterial && <p><span className="font-semibold">PA:</span> {evo.pressao_arterial}</p>}
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

                {/* Discharge Confirmation Modal */}
                <Modal
                    isOpen={dischargeModalOpen}
                    onClose={() => setDischargeModalOpen(false)}
                    title="Confirmar Alta"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Atenção</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Você está prestes a dar alta para <strong>{selectedForDischarge?.pacientes?.nome}</strong>.
                                O monitoramento será encerrado.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setGeneratePdf(!generatePdf)}>
                            <input
                                type="checkbox"
                                checked={generatePdf}
                                onChange={(e) => setGeneratePdf(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Gerar Relatório de Alta
                                </p>
                                <p className="text-xs text-gray-500">Baixar PDF com histórico completo de evoluções.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setDischargeModalOpen(false)}>Cancelar</Button>
                            <Button onClick={confirmDischarge} className="bg-green-600 hover:bg-green-700 text-white border-none">
                                Confirmar Alta
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}
