import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import { Calendar, Clock, User, Phone, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PublicScheduling() {
    const { slug } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [clinicName, setClinicName] = useState('Carregando...');

    const [formData, setFormData] = useState({
        service: '',
        date: '',
        time: '',
        tutorName: '',
        tutorPhone: '',
        petName: ''
    });

    useEffect(() => {
        // Optional: Fetch clinic details to show correct name
        // For now we just capitalize the slug or show a generic name
        if (slug) {
            setClinicName(slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
    }, [slug]);

    const services = [
        { id: 'Consulta', name: 'Consulta Veterinária', icon: '🩺' },
        { id: 'Vacina', name: 'Aplicação de Vacina', icon: '💉' },
        { id: 'Banho', name: 'Banho e Tosa', icon: '🛁' },
        { id: 'Exame', name: 'Exames Laboratoriais', icon: '🔬' }
    ];

    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('public_schedule_appointment', {
                clinic_slug: slug,
                tutor_name: formData.tutorName,
                tutor_phone: formData.tutorPhone,
                pet_name: formData.petName,
                appointment_date: formData.date,
                appointment_time: formData.time,
                service_name: formData.service
            });

            if (error) throw error;

            if (data && data.success) {
                setSuccess(true);
            } else {
                throw new Error(data?.message || 'Erro ao agendar.');
            }

        } catch (error) {
            console.error('Erro no agendamento:', error);
            toast.error(error.message || 'Erro ao realizar agendamento.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-10">
                <Card className="border-t-4 border-green-500">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Agendamento Solicitado!</h2>
                        <p className="text-gray-600">
                            Recebemos sua solicitação para <strong>{formData.petName}</strong>.
                            <br />
                            A clínica <strong>{clinicName}</strong> entrará em contato pelo WhatsApp <strong>{formData.tutorPhone}</strong> para confirmar.
                        </p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                            Novo Agendamento
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Toaster position="top-center" />

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{clinicName}</h1>
                <p className="text-gray-500">Agendamento Online</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {/* Progress Steps */}
                    <div className="flex justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* STEP 1: Service */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-semibold mb-4">Qual serviço você precisa?</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {services.map((svc) => (
                                        <div
                                            key={svc.id}
                                            onClick={() => setFormData({ ...formData, service: svc.id })}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.service === svc.id
                                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <span className="text-2xl">{svc.icon}</span>
                                            <span className="font-medium">{svc.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end mt-6">
                                    <Button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        disabled={!formData.service}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Date & Time */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-semibold">Quando seria melhor?</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Data Preferida</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Horário Preferido</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                        {timeSlots.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, time })}
                                                className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${formData.time === time
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                                    <Button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={!formData.date || !formData.time}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Contact Info */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-semibold">Seus Dados</h2>

                                <Input
                                    label="Seu Nome Completo"
                                    placeholder="Ex: Maria Silva"
                                    value={formData.tutorName}
                                    onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                                    required
                                />

                                <Input
                                    label="WhatsApp para Contato"
                                    placeholder="(00) 00000-0000"
                                    value={formData.tutorPhone}
                                    onChange={(e) => setFormData({ ...formData, tutorPhone: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Nome do Pet"
                                    placeholder="Ex: Rex"
                                    value={formData.petName}
                                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                                    required
                                />

                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 flex gap-2 items-start">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>Ao confirmar, a clínica receberá sua solicitação e entrará em contato para confirmar a disponibilidade.</p>
                                </div>

                                <div className="flex justify-between mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
                                    <Button type="submit" isLoading={loading} size="lg">
                                        Confirmar Agendamento
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
