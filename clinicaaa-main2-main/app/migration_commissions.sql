-- COMMISSIONS & DASHBOARD MIGRATION

-- 1. Add Commission % to Profiles
alter table public.profiles
add column if not exists comissao_percentual numeric(5,2) default 0;

-- 2. Add Seller ID to Sales
alter table public.vendas
add column if not exists vendedor_id uuid references public.profiles(id);

-- 3. Ensure RLS policies cover these new columns
-- (Existing policies usually cover all columns, but good to be aware)

-- 4. Add indexes for performance on dashboard queries
create index if not exists idx_vendas_data_venda on public.vendas(data_venda);
create index if not exists idx_vendas_vendedor_id on public.vendas(vendedor_id);
