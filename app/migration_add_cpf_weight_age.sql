-- Adicionar CPF na tabela de tutores
ALTER TABLE tutores 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar Peso e Idade na tabela de pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS peso TEXT,
ADD COLUMN IF NOT EXISTS idade TEXT;
