-- MIGRATION: CREATE FUNCIONARIOS TABLE
-- Cria tabela dedicada para RH com suporte a multi-tenancy

-- 1. Create Table
create table if not exists public.funcionarios (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) not null,
  user_id uuid references auth.users(id), -- Opcional: Link se o funcionário tiver login
  nome text not null,
  cargo text,
  cpf text,
  telefone text,
  email text,
  data_admissao date,
  salario numeric(10,2),
  comissao_percentual numeric(5,2) default 0,
  pix_chave text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.funcionarios enable row level security;

-- 3. Create RLS Policy
create policy "Org Isolation" on public.funcionarios
for all
using (organization_id = public.get_current_org_id())
with check (organization_id = public.get_current_org_id());

-- 4. Trigger for Auto-Organization ID
create trigger set_org_id_trigger
before insert on public.funcionarios
for each row execute function public.set_org_id();

-- 5. Migrate Existing Profiles to Funcionarios (Optional but recommended)
-- Copia usuários existentes para a tabela de funcionários para não começar vazio
insert into public.funcionarios (organization_id, user_id, nome, cargo, telefone)
select 
  organization_id, 
  id as user_id, 
  full_name as nome, 
  case when role = 'admin' then 'Administrador' 
       when role = 'veterinario' then 'Veterinário' 
       else 'Recepcionista' end as cargo,
  null as telefone -- Profiles não tem telefone hoje
from public.profiles
where organization_id is not null;
