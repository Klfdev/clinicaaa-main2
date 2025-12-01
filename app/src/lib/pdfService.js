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
