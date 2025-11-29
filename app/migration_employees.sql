-- EMPLOYEE MANAGEMENT MIGRATION
-- Adds HR details to profiles table

alter table public.profiles
add column if not exists cpf text,
add column if not exists telefone text,
add column if not exists cargo text, -- Job Title (e.g. "Veterinário Chefe")
add column if not exists data_admissao date,
add column if not exists salario numeric(10,2),
add column if not exists pix_chave text;

-- Ensure RLS policies cover these new columns (they should, as they cover the whole row, but good to verify)
-- The existing "Admins can update org profiles" policy covers updates to these columns.
