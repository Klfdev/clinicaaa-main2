import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Serviço centralizado para geração de PDFs
 */
export const pdfService = {
    /**
     * Gera um documento PDF padronizado
     * @param {Object} options - Opções de configuração
     * @param {string} options.title - Título do documento
     * @param {Object} options.config - Configurações da clínica (nome, logo, cores, endereço)
     * @param {Array} options.content - Array de objetos de conteúdo ({ type: 'info' | 'table' | 'text', ... })
     * @param {string} options.fileName - Nome do arquivo para download
     */
    generate: async ({ title, config, content, fileName = 'documento.pdf' }) => {
        const doc = new jsPDF();
        const primaryColor = config?.cor_primaria || '#9333ea'; // Roxo padrão
        const secondaryColor = config?.cor_secundaria || '#4b5563'; // Cinza

        const clinicName = config?.nome_clinica || 'Minha Clínica Veterinária';
        const clinicAddress = config?.endereco || '';
        const clinicPhone = config?.telefone || '';
        const logoUrl = config?.logo_url;

        let currentY = 0;

        // --- HEADER ---
        // Fundo colorido no topo
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        // Logo (se houver)
        if (logoUrl) {
            try {
                // Tenta carregar a imagem (pode falhar por CORS se não configurado, então usamos try/catch)
                const img = await loadImage(logoUrl);
                // Adiciona imagem circular ou quadrada
                doc.addImage(img, 'PNG', 10, 5, 30, 30, undefined, 'FAST');
            } catch (e) {
                console.warn('Erro ao carregar logo para PDF:', e);
            }
        }

        // Nome da Clínica
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(clinicName, 105, 20, { align: 'center' });

        // Título do Documento
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(title.toUpperCase(), 105, 32, { align: 'center' });

        currentY = 50;

        // --- CONTENT ---
        doc.setTextColor(0, 0, 0);

        for (const item of content) {
            // Verifica quebra de página
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }

            if (item.type === 'info') {
                // Bloco de Informações (ex: Paciente: Rex, Tutor: João)
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');

                const keys = Object.keys(item.data);
                let x = 14;

                keys.forEach((key, index) => {
                    const value = item.data[key];
                    doc.text(`${key}:`, x, currentY);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`${value}`, x + doc.getTextWidth(`${key}: `), currentY);
                    doc.setFont('helvetica', 'bold');

                    // Simples lógica de colunas (2 por linha)
                    if (index % 2 === 0) {
                        x = 110;
                    } else {
                        x = 14;
                        currentY += 8;
                    }
                });
                if (keys.length % 2 !== 0) currentY += 8; // Ajuste se terminar ímpar
                currentY += 5;

            } else if (item.type === 'table') {
                // Tabela
                autoTable(doc, {
                    startY: currentY,
                    head: [item.head],
                    body: item.body,
                    theme: 'grid',
                    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 10, cellPadding: 3 },
                    margin: { top: 10 },
                    didDrawPage: (data) => {
                        currentY = data.cursor.y;
                    },
                    ...item.options // Permite passar foot, columnStyles, etc.
                });
                currentY = doc.lastAutoTable.finalY + 10;

            } else if (item.type === 'section') {
                // Título de Seção
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text(item.title, 14, currentY);
                doc.setDrawColor(primaryColor);
                doc.line(14, currentY + 2, 196, currentY + 2);
                doc.setTextColor(0, 0, 0);
                currentY += 10;

            } else if (item.type === 'text') {
                // Texto corrido (Observações, etc)
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(item.value || '', 180);
                doc.text(splitText, 14, currentY);
                currentY += (splitText.length * 5) + 5;
            }
        }

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Linha divisória
            doc.setDrawColor(200, 200, 200);
            doc.line(10, 280, 200, 280);

            // Endereço e Contato
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const footerText = [clinicAddress, clinicPhone].filter(Boolean).join(' • ');
            doc.text(footerText, 105, 285, { align: 'center' });

            // Paginação
            doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
        }

        doc.save(fileName);
    },

    /**
     * Gera relatório financeiro específico
     */
    generateFinancialReport: async (lancamentos, resumo, config) => {
        const doc = new jsPDF();
        const primaryColor = config?.cor_primaria || '#9333ea';

        // Header simplificado
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório Financeiro', 105, 18, { align: 'center' });

        let currentY = 40;

        // Resumo
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Período: ${new Date().toLocaleDateString('pt-BR')}`, 14, currentY);
        currentY += 10;

        const summaryData = [
            ['Entradas', `R$ ${resumo.entradas.toFixed(2)}`],
            ['Saídas', `R$ ${resumo.saidas.toFixed(2)}`],
            ['Saldo', `R$ ${resumo.saldo.toFixed(2)}`]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Resumo', 'Valor']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
            tableWidth: 80
        });

        currentY = doc.lastAutoTable.finalY + 15;

        // Tabela de Lançamentos
        doc.text('Detalhamento de Lançamentos', 14, currentY);
        currentY += 5;

        const tableBody = lancamentos.map(l => [
            new Date(l.data).toLocaleDateString('pt-BR'),
            l.descricao,
            l.categoria || '-',
            l.tipo.toUpperCase(),
            `R$ ${l.valor.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            columnStyles: {
                3: { fontStyle: 'bold', textColor: (cell) => cell.raw === 'ENTRADA' ? [34, 197, 94] : [239, 68, 68] },
                4: { halign: 'right' }
            }
        });

        doc.save('relatorio_financeiro.pdf');
    },

    /**
     * Gera Carteira de Vacinação com visual moderno
     */
    generateVaccineCard: async (data, config) => {
        const doc = new jsPDF();
        const primaryColor = config?.cor_primaria || '#16a34a'; // Verde padrão para vacinas
        const secondaryColor = '#f0fdf4'; // Fundo claro

        // --- HEADER MODERNO ---
        // Faixa lateral colorida
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 15, 297, 'F');

        // Título e Logo
        doc.setTextColor(primaryColor);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CARTEIRA DE', 25, 25);
        doc.text('VACINAÇÃO', 25, 35);

        // Info da Clínica (Direita)
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const clinicName = config?.nome_clinica || 'Clínica Veterinária';
        doc.text(clinicName.toUpperCase(), 195, 25, { align: 'right' });
        if (config?.telefone) doc.text(config.telefone, 195, 30, { align: 'right' });
        if (config?.endereco) doc.text(config.endereco, 195, 35, { align: 'right' });

        // --- DADOS DO PACIENTE (CARD) ---
        doc.setFillColor(secondaryColor);
        doc.setDrawColor(primaryColor);
        doc.roundedRect(25, 45, 170, 40, 3, 3, 'FD');

        doc.setTextColor(primaryColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(data.petName.toUpperCase(), 30, 55);

        doc.setTextColor(60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Grid de dados
        const col1 = 30;
        const col2 = 90;
        const col3 = 140;
        const row1 = 65;
        const row2 = 75;

        doc.text(`Espécie: ${data.especie || '-'}`, col1, row1);
        doc.text(`Raça: ${data.raca || '-'}`, col2, row1);
        doc.text(`Sexo: ${data.sexo || '-'}`, col3, row1);

        doc.text(`Tutor: ${data.tutorName || '-'}`, col1, row2);
        doc.text(`Fone: ${data.tutorPhone || '-'}`, col2, row2);

        // --- TABELA DE VACINAS ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico de Imunização', 25, 100);

        const tableBody = data.vacinas.map(v => [
            new Date(v.data_aplicacao).toLocaleDateString('pt-BR'),
            v.nome_vacina,
            v.lote || '-',
            v.data_revacina ? new Date(v.data_revacina).toLocaleDateString('pt-BR') : 'Anual',
            '__________________' // Espaço para assinatura
        ]);

        autoTable(doc, {
            startY: 105,
            head: [['Data', 'Vacina', 'Lote', 'Próxima Dose', 'Assinatura Vet.']],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 6,
                lineColor: [220, 220, 220],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 25 },
                1: { fontStyle: 'bold' },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'center', cellWidth: 30, textColor: [220, 38, 38] }, // Vermelho para destaque
                4: { halign: 'center', textColor: [150, 150, 150] }
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            margin: { left: 25 }
        });

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Documento gerado eletronicamente.', 105, 290, { align: 'center' });
        }

        doc.save(`carteira_vacina_${data.petName}.pdf`);
    }
};

// Helper para carregar imagem via URL
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}
