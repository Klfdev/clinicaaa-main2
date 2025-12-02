-- Adicionar colunas de snapshot para permitir edição livre e histórico preservado
ALTER TABLE prontuarios 
ADD COLUMN IF NOT EXISTS tutor_nome TEXT,
ADD COLUMN IF NOT EXISTS tutor_cpf TEXT,
ADD COLUMN IF NOT EXISTS tutor_telefone TEXT,
ADD COLUMN IF NOT EXISTS tutor_endereco TEXT,
ADD COLUMN IF NOT EXISTS pet_especie TEXT,
ADD COLUMN IF NOT EXISTS pet_raca TEXT,
ADD COLUMN IF NOT EXISTS pet_sexo TEXT;
