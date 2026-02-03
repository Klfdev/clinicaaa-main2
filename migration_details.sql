-- Add detailed fields to Pacientes
alter table public.pacientes add column if not exists data_nascimento date;
alter table public.pacientes add column if not exists peso text;
alter table public.pacientes add column if not exists pelagem text;
alter table public.pacientes add column if not exists observacoes text;
