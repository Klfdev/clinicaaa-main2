-- Adicionar colunas para SPO2 e Pressão Arterial na tabela de evoluções
ALTER TABLE evolucoes
ADD COLUMN spo2 text, -- Saturação de Oxigênio (ex: 98%)
ADD COLUMN pressao_arterial text; -- Pressão Arterial (ex: 120/80)

-- Comentários nas colunas
COMMENT ON COLUMN evolucoes.spo2 IS 'Saturação de Oxigênio (%)';
COMMENT ON COLUMN evolucoes.pressao_arterial IS 'Pressão Arterial (mmHg)';
