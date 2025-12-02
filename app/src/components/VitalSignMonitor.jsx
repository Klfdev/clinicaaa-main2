import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Activity, Thermometer, Wind, HeartPulse, Clock, Droplets, Gauge } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function VitalSignMonitor({ evolucoes }) {
    // Process data for charts
    const data = useMemo(() => {
        // Sort by date ascending for the chart
        const sorted = [...evolucoes].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
        // Take last 10 points
        const recent = sorted.slice(-10);

        return {
            labels: recent.map(e => new Date(e.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
            temp: recent.map(e => parseFloat(e.temperatura) || null),
            fc: recent.map(e => parseFloat(e.frequencia_cardiaca) || null),
            fr: recent.map(e => parseFloat(e.frequencia_respiratoria) || null),
            spo2: recent.map(e => parseFloat(e.spo2) || null),
            // For PA, we might just chart systolic if format is 120/80, or just show latest value.
            // Let's try to parse systolic for the chart if possible.
            paSystolic: recent.map(e => {
                if (!e.pressao_arterial) return null;
                const parts = e.pressao_arterial.split('/');
                return parseFloat(parts[0]) || null;
            }),
        };
    }, [evolucoes]);

    const latest = evolucoes[0] || {}; // Assuming evolucoes passed is sorted desc (newest first)

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: { display: false },
            y: { display: false } // Sparkline style
        },
        elements: {
            point: { radius: 2, hoverRadius: 4 },
            line: { tension: 0.4, borderWidth: 2 }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-black/90 p-4 rounded-xl border border-gray-800 shadow-2xl">
            {/* Temperature */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900/50 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Temp</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-yellow-400">
                        {latest.temperatura || '--'}
                        <span className="text-xs text-gray-500 ml-1">°C</span>
                    </span>
                </div>
                <div className="h-12">
                    <Line
                        data={{
                            labels: data.labels,
                            datasets: [{
                                data: data.temp,
                                borderColor: '#eab308', // yellow-500
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                fill: true,
                            }]
                        }}
                        options={commonOptions}
                    />
                </div>
            </div>

            {/* Heart Rate */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900/50 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-green-500">
                        <HeartPulse className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">FC</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-green-400">
                        {latest.frequencia_cardiaca || '--'}
                        <span className="text-xs text-gray-500 ml-1">bpm</span>
                    </span>
                </div>
                <div className="h-12">
                    <Line
                        data={{
                            labels: data.labels,
                            datasets: [{
                                data: data.fc,
                                borderColor: '#22c55e', // green-500
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                fill: true,
                            }]
                        }}
                        options={commonOptions}
                    />
                </div>
            </div>

            {/* Respiratory Rate */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900/50 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-blue-500">
                        <Wind className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">FR</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-blue-400">
                        {latest.frequencia_respiratoria || '--'}
                        <span className="text-xs text-gray-500 ml-1">mpm</span>
                    </span>
                </div>
                <div className="h-12">
                    <Line
                        data={{
                            labels: data.labels,
                            datasets: [{
                                data: data.fr,
                                borderColor: '#3b82f6', // blue-500
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                            }]
                        }}
                        options={commonOptions}
                    />
                </div>
            </div>

            {/* SPO2 */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900/50 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-cyan-500">
                        <Droplets className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">SPO2</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-cyan-400">
                        {latest.spo2 || '--'}
                        <span className="text-xs text-gray-500 ml-1">%</span>
                    </span>
                </div>
                <div className="h-12">
                    <Line
                        data={{
                            labels: data.labels,
                            datasets: [{
                                data: data.spo2,
                                borderColor: '#06b6d4', // cyan-500
                                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                fill: true,
                            }]
                        }}
                        options={commonOptions}
                    />
                </div>
            </div>

            {/* Blood Pressure */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900/50 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-red-500">
                        <Gauge className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">PA</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-red-400 truncate">
                        {latest.pressao_arterial || '--'}
                    </span>
                </div>
                <div className="h-12">
                    <Line
                        data={{
                            labels: data.labels,
                            datasets: [{
                                data: data.paSystolic,
                                borderColor: '#ef4444', // red-500
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                fill: true,
                            }]
                        }}
                        options={commonOptions}
                    />
                </div>
            </div>

            <div className="col-span-full flex justify-between items-center text-xs text-gray-500 px-1 mt-2">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Última aferição: {latest.data_hora ? new Date(latest.data_hora).toLocaleString('pt-BR') : 'N/A'}
                </div>
                <div>
                    Responsável: {latest.responsavel || 'N/A'}
                </div>
            </div>
        </div>
    );
}
