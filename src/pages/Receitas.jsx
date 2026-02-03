import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Search, Plus, Trash2, FileText, Printer, Download, Pill } from 'lucide-react';
import { pdfService } from '../lib/pdfService';
import toast, { Toaster } from 'react-hot-toast';

export default function Receitas() {
    const [step, setStep] = useState(1); // 1: Select Patient, 2: Add Meds, 3: Preview/Print
    const [loading, setLoading] = useState(false);

    // Data
    const [pacientes, setPacientes] = useState([]);
    const [medicamentosDb, setMedicamentosDb] = useState([]);

    // Search States
    const [patientSearch, setPatientSearch] = useState('');
    const [medSearch, setMedSearch] = useState('');

    // Selection
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedMeds, setSelectedMeds] = useState([]); // { nome, concentracao, instrucoes, qtd }

    // Custom Med Form
    const [customMed, setCustomMed] = useState({
        nome: '',
        concentracao: '',
        instrucoes: '',
        qtd: ''
    });

    const [config, setConfig] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { data: pacData } = await supabase.from('pacientes').select('*, tutores(nome)').order('nome');
            const { data: medData } = await supabase.from('medicamentos').select('*').order('nome');
            const { data: configData } = await supabase.from('configuracoes').select('*').limit(1).single();

            setPacientes(pacData || []);
            setMedicamentosDb(medData || []);
            setConfig(configData);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPacientes = pacientes.filter(p =>
        p.nome.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.tutores?.nome?.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const filteredMeds = medicamentosDb.filter(m =>
        m.nome.toLowerCase().includes(medSearch.toLowerCase())
    );

    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        setStep(2);
    };

    const addMed = (med) => {
        setSelectedMeds([...selectedMeds, { ...med, qtd: 1, instrucoes: '' }]);
        setMedSearch('');
    };

    const addMedFromDb = (med) => {
        addMed(med);
    };

    const addCustomMed = () => {
        if (!customMed.nome) return toast.error("Nome do medicamento é obrigatório");
        addMed(customMed);
        setCustomMed({ nome: '', concentracao: '', instrucoes: '', qtd: '' });
    };

    const removeMed = (index) => {
        setSelectedMeds(selectedMeds.filter((_, i) => i !== index));
    };

    const updateMed = (index, field, value) => {
        const newMeds = [...selectedMeds];
        newMeds[index] = { ...newMeds[index], [field]: value };
        setSelectedMeds(newMeds);
    };

    const gerarPDF = async () => {
        try {
            await pdfService.generate({
                title: 'Receituário Médico Veterinário',
                config: config,
                fileName: `receita_${selectedPatient.nome}.pdf`,
                content: [
                    {
                        type: 'info',
                        data: {
                            'Paciente': selectedPatient.nome,
                            'Tutor': selectedPatient.tutores?.nome,
                            'Data': new Date().toLocaleDateString('pt-BR')
                        }
                    },
                    {
                        type: 'table',
                        head: ['#', 'Medicamento', 'Concentração', 'Qtd', 'Instruções'],
                        body: selectedMeds.map((med, index) => [
                            index + 1,
                            med.nome,
                            med.concentracao || '-',
                            med.qtd,
                            med.instrucoes
                        ])
                    }
                ]
            });
            toast.success('Receita gerada com sucesso!');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar PDF.");
        }
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-8 h-8 text-purple-600" /> Gerador de Receitas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Crie receitas profissionais em PDF.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-purple-600 bg-purple-100' : 'border-gray-300'}`}>1</div>
                        Paciente
                    </div>
                    <div className="h-0.5 w-10 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-purple-600 bg-purple-100' : 'border-gray-300'}`}>2</div>
                        Medicamentos
                    </div>
                    <div className="h-0.5 w-10 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-purple-600 bg-purple-100' : 'border-gray-300'}`}>3</div>
                        Imprimir
                    </div>
                </div>

                {/* Step 1: Select Patient */}
                {step === 1 && (
                    <Card>
                        <div className="p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selecione o Paciente</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Buscar paciente ou tutor..."
                                    value={patientSearch}
                                    onChange={e => setPatientSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredPacientes.map(p => (
                                    <div key={p.id} onClick={() => selectPatient(p)} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{p.nome}</p>
                                            <p className="text-sm text-gray-500">Tutor: {p.tutores?.nome}</p>
                                        </div>
                                        <Button size="sm" variant="ghost">Selecionar</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Step 2: Add Medicines */}
                {step === 2 && selectedPatient && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Search & Add */}
                        <div className="space-y-6">
                            <Card>
                                <div className="p-6 space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar Medicamento</h2>

                                    {/* DB Search */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar do Banco de Dados</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                placeholder="Nome do remédio..."
                                                value={medSearch}
                                                onChange={e => setMedSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        {medSearch && (
                                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto shadow-lg">
                                                {filteredMeds.map(m => (
                                                    <div key={m.id} onClick={() => addMedFromDb(m)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm">
                                                        <span className="font-medium">{m.nome}</span> <span className="text-gray-500">({m.concentracao})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OU DIGITE MANUALMENTE</span>
                                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                    </div>

                                    {/* Manual Form */}
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Nome do Medicamento"
                                            value={customMed.nome}
                                            onChange={e => setCustomMed({ ...customMed, nome: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Concentração (ex: 50mg)"
                                                value={customMed.concentracao}
                                                onChange={e => setCustomMed({ ...customMed, concentracao: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Qtd (ex: 1 cx)"
                                                value={customMed.qtd}
                                                onChange={e => setCustomMed({ ...customMed, qtd: e.target.value })}
                                            />
                                        </div>
                                        <textarea
                                            placeholder="Instruções de uso..."
                                            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                            value={customMed.instrucoes}
                                            onChange={e => setCustomMed({ ...customMed, instrucoes: e.target.value })}
                                        />
                                        <Button onClick={addCustomMed} className="w-full">
                                            <Plus className="w-4 h-4 mr-2" /> Adicionar à Receita
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right: Preview List */}
                        <div className="space-y-6">
                            <Card className="h-full">
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Receita Atual</h2>
                                            <p className="text-sm text-gray-500">Paciente: {selectedPatient.nome}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">Trocar Paciente</Button>
                                    </div>

                                    <div className="flex-1 space-y-4 overflow-y-auto min-h-[300px]">
                                        {selectedMeds.length === 0 ? (
                                            <div className="text-center text-gray-400 py-10">
                                                <Pill className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>Nenhum medicamento adicionado.</p>
                                            </div>
                                        ) : (
                                            selectedMeds.map((med, idx) => (
                                                <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 group relative">
                                                    <button onClick={() => removeMed(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <div className="flex justify-between font-bold text-gray-900 dark:text-white mb-1">
                                                        <span>{idx + 1}. {med.nome} {med.concentracao}</span>
                                                        <span className="text-sm bg-white dark:bg-gray-700 px-2 rounded border border-gray-200 dark:border-gray-600">
                                                            <input
                                                                value={med.qtd}
                                                                onChange={e => updateMed(idx, 'qtd', e.target.value)}
                                                                className="w-16 bg-transparent text-right outline-none"
                                                            />
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        value={med.instrucoes}
                                                        onChange={e => updateMed(idx, 'instrucoes', e.target.value)}
                                                        className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-300 resize-none outline-none border-b border-transparent focus:border-purple-300"
                                                        rows={2}
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button onClick={gerarPDF} className="w-full" disabled={selectedMeds.length === 0}>
                                            <Printer className="w-5 h-5 mr-2" /> Gerar PDF e Imprimir
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
