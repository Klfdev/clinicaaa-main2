-- Adiciona coluna de valor aos prontuários para automação financeira
ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS valor NUMERIC DEFAULT 0;
