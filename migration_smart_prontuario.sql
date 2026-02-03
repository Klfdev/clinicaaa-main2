-- Adicionar colunas para vínculo com paciente e dados vitais na consulta
ALTER TABLE prontuarios 
ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES pacientes(id),
ADD COLUMN IF NOT EXISTS peso TEXT,
ADD COLUMN IF NOT EXISTS idade TEXT;
