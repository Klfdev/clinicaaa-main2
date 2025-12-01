import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Settings, Save, Building, Phone, MapPin, Palette, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Configuracoes() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configId, setConfigId] = useState(null);

    const [formData, setFormData] = useState({
        nome_clinica: '',
        endereco: '',
        telefone: '',
        cor_primaria: '#9333ea',
        logo_url: ''
    });

    useEffect(() => {
        carregarConfiguracoes();
    }, []);

    const carregarConfiguracoes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('configuracoes')
                .select('*')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

            if (data) {
                setConfigId(data.id);
                setFormData({
                    nome_clinica: data.nome_clinica,
                    endereco: data.endereco || '',
                    telefone: data.telefone || '',
                    cor_primaria: data.cor_primaria || '#9333ea',
                    logo_url: data.logo_url || ''
                });
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            toast.error("Erro ao carregar configurações.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('anexos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('anexos')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            toast.success('Logo carregada!');
        } catch (error) {
            console.error('Erro no upload da logo:', error);
            toast.error('Erro ao carregar logo.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (configId) {
                // Update
                const { error } = await supabase
                    .from('configuracoes')
                    .update(formData)
                    .eq('id', configId);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('configuracoes')
                    .insert([formData]);
                if (error) throw error;
                // Reload to get ID
                carregarConfiguracoes();
            }

            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <Toaster position="top-right" />
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-8 h-8 text-purple-600" /> Configurações da Clínica
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Personalize os dados que aparecerão nos documentos e no sistema.</p>
                </div>

                <Card>
                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Building className="w-5 h-5 text-gray-400" /> Identidade
                                </h3>
                                <Input
                                    label="Nome da Clínica"
                                    value={formData.nome_clinica}
                                    onChange={e => setFormData({ ...formData, nome_clinica: e.target.value })}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo da Clínica</label>
                                    <div className="flex items-center gap-4">
                                        {formData.logo_url && (
                                            <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white flex items-center justify-center">
                                                <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                            <Upload className="w-4 h-4" /> Escolher Logo
                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={loading} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor Primária</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.cor_primaria}
                                            onChange={e => setFormData({ ...formData, cor_primaria: e.target.value })}
                                            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">{formData.cor_primaria}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-gray-400" /> Contato e Endereço
                                </h3>
                                <Input
                                    label="Telefone / WhatsApp"
                                    value={formData.telefone}
                                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    placeholder="(00) 0000-0000"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço Completo</label>
                                    <textarea
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none min-h-[120px]"
                                        placeholder="Rua, Número, Bairro, Cidade - UF"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <Button type="submit" disabled={saving || loading}>
                                <Save className="w-5 h-5 mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
