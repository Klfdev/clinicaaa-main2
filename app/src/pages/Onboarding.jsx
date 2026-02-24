import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import { Building2, AlertCircle } from 'lucide-react';

export default function Onboarding() {
    const [clinicName, setClinicName] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, fetchProfile } = useAuth();
    const navigate = useNavigate();

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!user) throw new Error("Usuário não autenticado.");

            // 1. Create Tenant via RPC (Org + Profile)
            const { data: tenantData, error: tenantError } = await supabase
                .rpc('create_tenant', {
                    clinic_name: clinicName,
                    user_full_name: fullName
                });

            if (tenantError) throw tenantError;

            // 3. Refresh Auth Context
            await fetchProfile(user.id);

            // Success!
            navigate('/');

        } catch (err) {
            console.error(err);
            setError(err.message || 'Falha ao criar clínica.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 mb-4">
                        <span className="text-white font-bold text-3xl">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo(a)!</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Para começar, configure sua clínica.</p>
                </div>

                <Card className="border-t-4 border-t-purple-600">
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Nome</label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: Dr. Silva"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Clínica</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                        <Input
                                            type="text"
                                            placeholder="Ex: PetCare Center"
                                            value={clinicName}
                                            onChange={(e) => setClinicName(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                isLoading={loading}
                            >
                                Concluir Configuração
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
