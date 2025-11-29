import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import { Lock, Mail, AlertCircle, Building2, User } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
            // 1. Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // Check if session exists (Email Confirmation might be ON)
            if (!authData.session) {
                alert("Cadastro realizado com sucesso! Verifique seu email para confirmar a conta antes de fazer login.");
                navigate('/login');
                return;
            }

            const userId = authData.user.id;

            // 2. Create Tenant via RPC (Org + Profile)
            const { data: tenantData, error: tenantError } = await supabase
                .rpc('create_tenant', {
                    clinic_name: clinicName,
                    user_full_name: fullName
                });

            if (tenantError) throw tenantError;

            // Success!
            navigate('/');

        } catch (err) {
            console.error(err);
            setError(err.message || 'Falha no cadastro. Tente novamente.');
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Nova Clínica</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Comece a usar o sistema agora mesmo</p>
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
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Seu Nome Completo"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Nome da Clínica"
                                        value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="password"
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                isLoading={loading}
                            >
                                Criar Conta e Clínica
                            </Button>

                            <div className="text-center text-sm">
                                <span className="text-gray-500">Já tem uma conta? </span>
                                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                                    Fazer Login
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
