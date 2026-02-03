import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Shield, UserCog, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Equipe() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // Fetch profiles. Note: We can't fetch emails directly from auth.users via client client easily without a secure function,
            // so we will rely on what's in the profiles table. Ideally, we should sync email to profiles or use an Edge Function.
            // For now, we show Name and Role.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error("Erro ao carregar equipe:", error);
            toast.error("Erro ao carregar membros da equipe.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Função atualizada para ${newRole}!`);

            // Update local state
            setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));

        } catch (error) {
            console.error("Erro ao atualizar função:", error);
            toast.error("Erro ao atualizar função.");
        }
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-purple-600" /> Gestão de Equipe
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie quem tem acesso ao sistema e suas permissões.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5" /> Membros da Organização
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 font-semibold">Nome</th>
                                        <th className="p-4 font-semibold">Função Atual</th>
                                        <th className="p-4 font-semibold">Alterar Permissão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr><td colSpan="3" className="p-8 text-center text-gray-500">Carregando equipe...</td></tr>
                                    ) : members.length === 0 ? (
                                        <tr><td colSpan="3" className="p-8 text-center text-gray-500">Nenhum membro encontrado.</td></tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {member.full_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name || 'Usuário sem nome'}</p>
                                                            <p className="text-xs text-gray-500">ID: {member.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                            member.role === 'veterinario' ? 'bg-green-100 text-green-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 outline-none"
                                                    >
                                                        <option value="admin">Admin (Acesso Total)</option>
                                                        <option value="veterinario">Veterinário (Saúde)</option>
                                                        <option value="recepcionista">Recepcionista (Operacional)</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
