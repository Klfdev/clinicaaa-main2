import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Calendar as CalendarIcon, Clock, User, Phone, Scissors, Trash2, Plus, Check, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Agendamentos() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [pacientes, setPacientes] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        data: '',
        horario: '',
        paciente_id: '',
        nomePet: '', // Fallback or display
        nomeTutor: '',
        telefone: '',
        servico: '',
        status: 'Agendado'
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Load Appointments
            const { data: agendamentos, error: errorAgend } = await supabase
                .from('agendamentos')
                .select(`
                    *,
                    pacientes (
                        nome,
                        tutores (nome, whatsapp)
                    )
                `);

            if (errorAgend) throw errorAgend;

            // Load Patients for dropdown
            const { data: pacData, error: errorPac } = await supabase
                .from('pacientes')
                .select(`
                    id, 
                    nome, 
                    tutores (nome, whatsapp)
                `);

            if (errorPac) throw errorPac;
            setPacientes(pacData || []);

            const formattedEvents = (agendamentos || []).map(doc => {
                let color = '#9333ea'; // Default Purple (Agendado)
                if (doc.status === 'Confirmado') color = '#16a34a'; // Green
                if (doc.status === 'Concluído') color = '#2563eb'; // Blue
                if (doc.status === 'Cancelado') color = '#dc2626'; // Red

                // Use linked patient data if available, otherwise fallback
                const title = doc.pacientes
                    ? `${doc.pacientes.nome} (${doc.pacientes.tutores?.nome})`
                    : `${doc.nomePet} - ${doc.servico}`;

                return {
                    id: doc.id,
                    title: title,
                    start: `${doc.data}T${doc.horario}`,
                    backgroundColor: color,
                    borderColor: color,
                    extendedProps: {
                        ...doc,
                        nomePet: doc.pacientes?.nome || doc.nomePet,
                        nomeTutor: doc.pacientes?.tutores?.nome || doc.nomeTutor,
                        telefone: doc.pacientes?.tutores?.whatsapp || doc.telefone
                    }
                };
            });
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Erro ao carregar agenda:", error);
            toast.error("Erro ao carregar agenda.");
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (arg) => {
        setFormData({
            data: arg.dateStr,
            horario: '09:00',
            paciente_id: '',
            nomePet: '',
            nomeTutor: '',
            telefone: '',
            servico: '',
            status: 'Agendado'
        });
        setSelectedEvent(null);
        setModalOpen(true);
    };

    const handleEventClick = (info) => {
        const props = info.event.extendedProps;
        setSelectedEvent({
            id: info.event.id,
            ...props
        });
        // Populate form for editing
        setFormData({
            data: props.data,
            horario: props.horario,
            paciente_id: props.paciente_id || '',
            nomePet: props.nomePet,
            nomeTutor: props.nomeTutor,
            telefone: props.telefone,
            servico: props.servico,
            status: props.status || 'Agendado'
        });
        setModalOpen(true);
    };

    const handleEventDrop = async (info) => {
        const { event } = info;
        const newDate = event.start.toISOString().split('T')[0];
        const newTime = event.start.toTimeString().split(' ')[0].substring(0, 5);

        try {
            const { error } = await supabase
                .from('agendamentos')
                .update({ data: newDate, horario: newTime })
                .eq('id', event.id);

            if (error) throw error;
            toast.success('Agendamento movido!');
            carregarDados(); // Refresh to ensure consistency
        } catch (error) {
            console.error("Erro ao mover:", error);
            toast.error("Erro ao mover agendamento.");
            info.revert(); // Revert UI change
        }
    };

    const handlePatientSelect = (e) => {
        const pid = e.target.value;
        if (!pid) {
            setFormData(prev => ({ ...prev, paciente_id: '', nomePet: '', nomeTutor: '', telefone: '' }));
            return;
        }
        const p = pacientes.find(p => p.id === pid);
        if (p) {
            setFormData(prev => ({
                ...prev,
                paciente_id: pid,
                nomePet: p.nome,
                nomeTutor: p.tutores?.nome,
                telefone: p.tutores?.whatsapp || ''
            }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validation: Need either a linked patient OR a manual name
        if (!formData.data || !formData.horario || (!formData.paciente_id && !formData.nomePet)) {
            toast.error("Preencha os campos obrigatórios.");
            return;
        }

        try {
            const payload = {
                data: formData.data,
                horario: formData.horario,
                paciente_id: formData.paciente_id || null,
                "nomePet": formData.nomePet, // Legacy/Fallback
                "nomeTutor": formData.nomeTutor,
                telefone: formData.telefone,
                servico: formData.servico,
                status: formData.status
            };

            if (selectedEvent) {
                const { error } = await supabase
                    .from('agendamentos')
                    .update(payload)
                    .eq('id', selectedEvent.id);
                if (error) throw error;
                toast.success('Agendamento atualizado!');
            } else {
                const { error } = await supabase
                    .from('agendamentos')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Agendamento criado!');
            }

            setModalOpen(false);
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar agendamento.');
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (window.confirm('Cancelar este agendamento?')) {
            try {
                const { error } = await supabase
                    .from('agendamentos')
                    .delete()
                    .eq('id', selectedEvent.id);

                if (error) throw error;

                toast.success('Agendamento excluído!');
                setModalOpen(false);
                setSelectedEvent(null);
                carregarDados();
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error('Erro ao excluir agendamento.');
            }
        }
    };

    // Filter for upcoming events (next 7 days)
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-8 h-8 text-purple-600" /> Agenda Inteligente
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Arraste para reagendar. Clique para detalhes.</p>
                    </div>
                    <Button onClick={() => {
                        setFormData({
                            data: new Date().toISOString().split('T')[0],
                            horario: '09:00',
                            paciente_id: '',
                            nomePet: '',
                            nomeTutor: '',
                            telefone: '',
                            servico: '',
                            status: 'Agendado'
                        });
                        setSelectedEvent(null);
                        setModalOpen(true);
                    }}>
                        <Plus className="w-5 h-5 mr-2" /> Novo Agendamento
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Section */}
                    <div className="lg:col-span-2">
                        <Card className="p-4 bg-white dark:bg-gray-800 h-full">
                            <div className="calendar-container notranslate" translate="no">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                    }}
                                    locale={ptBrLocale}
                                    events={events}
                                    dateClick={handleDateClick}
                                    eventClick={handleEventClick}
                                    editable={true} // Enable Drag & Drop
                                    eventDrop={handleEventDrop} // Handle Drop
                                    height="auto"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Upcoming List Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" /> Próximos 7 Dias
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                    Sem agendamentos próximos.
                                </p>
                            ) : (
                                upcomingEvents.map(evt => (
                                    <Card key={evt.id} className="p-3 hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: evt.backgroundColor }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{evt.extendedProps.nomePet}</p>
                                                <p className="text-xs text-gray-500">{evt.extendedProps.nomeTutor}</p>
                                            </div>
                                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                {new Date(evt.start).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })} • {evt.extendedProps.horario.substring(0, 5)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                                                {evt.extendedProps.servico || 'Consulta'}
                                            </span>
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white border-none flex items-center justify-center"
                                                title="Enviar Lembrete WhatsApp"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const phone = evt.extendedProps.telefone?.replace(/\D/g, '');
                                                    if (!phone) return toast.error("Sem telefone.");

                                                    const date = new Date(evt.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                                                    const message = `Olá ${evt.extendedProps.nomeTutor}, lembrete: ${evt.extendedProps.nomePet} às ${date}. Confirmado? 🐾`;

                                                    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                }}
                                            >
                                                <Phone className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedEvent ? 'Editar Agendamento' : 'Novo Agendamento'}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Status & Date Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="Agendado">Agendado (Roxo)</option>
                                    <option value="Confirmado">Confirmado (Verde)</option>
                                    <option value="Concluído">Concluído (Azul)</option>
                                    <option value="Cancelado">Cancelado (Vermelho)</option>
                                </select>
                            </div>
                            <Input
                                label="Data *"
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData({ ...formData, data: e.target.value })}
                                required
                            />
                            <Input
                                label="Horário *"
                                type="time"
                                value={formData.horario}
                                onChange={e => setFormData({ ...formData, horario: e.target.value })}
                                required
                            />
                        </div>

                        {/* Patient Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paciente (Opcional)</label>
                            <select
                                value={formData.paciente_id}
                                onChange={handlePatientSelect}
                                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">-- Selecione ou Digite Abaixo --</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} ({p.tutores?.nome})</option>
                                ))}
                            </select>
                        </div>

                        {/* Manual Fields (Auto-filled but editable) */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nome do Pet"
                                value={formData.nomePet}
                                onChange={e => setFormData({ ...formData, nomePet: e.target.value })}
                                placeholder="Ou digite manualmente"
                            />
                            <Input
                                label="Nome do Tutor"
                                value={formData.nomeTutor}
                                onChange={e => setFormData({ ...formData, nomeTutor: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Serviço"
                                value={formData.servico}
                                onChange={e => setFormData({ ...formData, servico: e.target.value })}
                                placeholder="Ex: Banho e Tosa"
                            />
                            <Input
                                label="Telefone / WhatsApp"
                                value={formData.telefone}
                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            {selectedEvent && (
                                <Button
                                    type="button"
                                    className="bg-green-500 hover:bg-green-600 text-white border-none"
                                    onClick={() => {
                                        const phone = formData.telefone?.replace(/\D/g, '');
                                        if (!phone) return toast.error("Telefone não cadastrado.");

                                        const date = new Date(formData.data + 'T' + formData.horario).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                                        const message = `Olá ${formData.nomeTutor}, lembrete da consulta do(a) ${formData.nomePet} agendada para ${date}. Confirmado? 🐾`;

                                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                >
                                    <Phone className="w-4 h-4 mr-2" /> WhatsApp
                                </Button>
                            )}

                            <div className="flex gap-3 ml-auto">
                                {selectedEvent && (
                                    <Button type="button" variant="danger" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Salvar Agendamento</Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
