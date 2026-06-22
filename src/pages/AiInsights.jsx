import { useState } from 'react';
import Layout from '../components/Layout'; // Adjust path if needed
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'; // Adjust path if needed
import Button from '../components/ui/Button'; // Adjust path if needed
import { Brain, MessageSquare, Sparkles, Zap, Copy, Check } from 'lucide-react';

export default function AiInsights() {
    const [prompt, setPrompt] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateMarketingText = () => {
        setLoading(true);
        // Simulate AI generation
        setTimeout(() => {
            const responses = [
                `Fala galera! 💈✂️\n\nPromoção imperdível pra essa semana na barbearia! \n${prompt ? `Sobre: ${prompt}` : 'Corte e barba com 20% de desconto!'}\n\nAgende já seu horário pelo link e garanta o visual:\n[Link da Barbearia]\n\n#barbearia #estilo #promoção`,
                `E aí, beleza? 😎\n\n${prompt ? `Novidade: ${prompt}` : 'Tá na hora de dar aquele tapa no visual!'}\n\nVenha conferir nossos serviços e tomar aquela cerveja gelada. 🍻\n\nReserve aqui: [Link]\n\n#barberlife #corte #barba`,
                 `Atenção clientes! 🚨\n\n${prompt || 'Horários disponíveis para o fim de semana!'} \n\nNão deixe para a última hora. ⏳\n\nAgende agora: [Link]`,
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setGeneratedText(randomResponse);
            setLoading(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-[#f4ecd8] font-display flex items-center gap-3">
                            <Brain className="w-8 h-8 text-purple-600" />
                            Assistente de IA
                        </h1>
                        <p className="text-[#5c4d3c] dark:text-[#a89f91] mt-1">
                            Automação e criatividade para impulsionar seu negócio.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Marketing Generator */}
                    <Card className="border-purple-200 dark:border-purple-900 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Sparkles className="w-32 h-32 text-purple-600" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                <MessageSquare className="w-5 h-5" />
                                Gerador de Texto para Marketing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sobre o que é a postagem?
                                </label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-[#1a1a1a] dark:border-gray-700 dark:text-white p-3"
                                    rows="3"
                                    placeholder="Ex: Promoção de dia dos pais, novo serviço de platinado..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={generateMarketingText}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Zap className="w-4 h-4 animate-spin" /> Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" /> Gerar Texto
                                    </>
                                )}
                            </Button>

                            {generatedText && (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">
                                        {generatedText}
                                    </pre>
                                    <button
                                        onClick={handleCopy}
                                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-600"
                                        title="Copiar"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Insights / Future Features */}
                    <div className="space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Insights Rápidos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg">
                                        <h4 className="font-medium text-green-800 dark:text-green-400">Retenção Alta</h4>
                                        <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                                            Sua taxa de retorno de clientes aumentou 15% este mês. Continue assim!
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-400">Horário de Pico</h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                                            Sexta-feira às 18h é seu horário mais disputado. Considere abrir mais vagas neste horário.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="opacity-75 relative">
                             <div className="absolute inset-0 bg-gray-100/50 dark:bg-black/50 z-10 flex items-center justify-center rounded-xl">
                                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider rounded-full">
                                    Em Breve
                                </span>
                             </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-gray-400" />
                                    Previsão de Demanda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500">
                                    Nossa IA analisará seus dados históricos para prever quantos atendimentos você terá na próxima semana.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
