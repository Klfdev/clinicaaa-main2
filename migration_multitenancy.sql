-- 1. Create Organizations Table
create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Profiles Table (Links User -> Org)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  role text default 'admin',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Default Organization for Migration
-- We insert a default org to migrate existing data to it.
do $$
declare
  default_org_id uuid;
begin
  -- Check if we already have an org, if not create one
  if not exists (select 1 from public.organizations limit 1) then
    insert into public.organizations (name, slug)
    values ('Minha Clínica', 'minha-clinica')
    returning id into default_org_id;
  else
    select id into default_org_id from public.organizations limit 1;
  end if;

  -- 4. Add organization_id to ALL tables and migrate data
  -- Helper macro-like block for each table
  
  -- Tutores
  if not exists (select 1 from information_schema.columns where table_name = 'tutores' and column_name = 'organization_id') then
    alter table public.tutores add column organization_id uuid references public.organizations(id);
    update public.tutores set organization_id = default_org_id where organization_id is null;
    alter table public.tutores alter column organization_id set not null;
  end if;

  -- Pacientes
  if not exists (select 1 from information_schema.columns where table_name = 'pacientes' and column_name = 'organization_id') then
    alter table public.pacientes add column organization_id uuid references public.organizations(id);
    update public.pacientes set organization_id = default_org_id where organization_id is null;
    alter table public.pacientes alter column organization_id set not null;
  end if;

  -- Agendamentos
  if not exists (select 1 from information_schema.columns where table_name = 'agendamentos' and column_name = 'organization_id') then
    alter table public.agendamentos add column organization_id uuid references public.organizations(id);
    update public.agendamentos set organization_id = default_org_id where organization_id is null;
    alter table public.agendamentos alter column organization_id set not null;
  end if;

  -- Prontuarios
  if not exists (select 1 from information_schema.columns where table_name = 'prontuarios' and column_name = 'organization_id') then
    alter table public.prontuarios add column organization_id uuid references public.organizations(id);
    update public.prontuarios set organization_id = default_org_id where organization_id is null;
    alter table public.prontuarios alter column organization_id set not null;
  end if;

  -- Vacinas
  if not exists (select 1 from information_schema.columns where table_name = 'vacinas' and column_name = 'organization_id') then
    alter table public.vacinas add column organization_id uuid references public.organizations(id);
    update public.vacinas set organization_id = default_org_id where organization_id is null;
    alter table public.vacinas alter column organization_id set not null;
  end if;

  -- Estoque
  if not exists (select 1 from information_schema.columns where table_name = 'estoque' and column_name = 'organization_id') then
    alter table public.estoque add column organization_id uuid references public.organizations(id);
    update public.estoque set organization_id = default_org_id where organization_id is null;
    alter table public.estoque alter column organization_id set not null;
  end if;

  -- Servicos
  if not exists (select 1 from information_schema.columns where table_name = 'servicos' and column_name = 'organization_id') then
    alter table public.servicos add column organization_id uuid references public.organizations(id);
    update public.servicos set organization_id = default_org_id where organization_id is null;
    alter table public.servicos alter column organization_id set not null;
  end if;

  -- Financeiro
  if not exists (select 1 from information_schema.columns where table_name = 'financeiro' and column_name = 'organization_id') then
    alter table public.financeiro add column organization_id uuid references public.organizations(id);
    update public.financeiro set organization_id = default_org_id where organization_id is null;
    alter table public.financeiro alter column organization_id set not null;
  end if;

  -- Vendas
  if not exists (select 1 from information_schema.columns where table_name = 'vendas' and column_name = 'organization_id') then
    alter table public.vendas add column organization_id uuid references public.organizations(id);
    update public.vendas set organization_id = default_org_id where organization_id is null;
    alter table public.vendas alter column organization_id set not null;
  end if;

  -- Medicamentos
  if not exists (select 1 from information_schema.columns where table_name = 'medicamentos' and column_name = 'organization_id') then
    alter table public.medicamentos add column organization_id uuid references public.organizations(id);
    update public.medicamentos set organization_id = default_org_id where organization_id is null;
    alter table public.medicamentos alter column organization_id set not null;
  end if;

  -- Internacoes
  if not exists (select 1 from information_schema.columns where table_name = 'internacoes' and column_name = 'organization_id') then
    alter table public.internacoes add column organization_id uuid references public.organizations(id);
    update public.internacoes set organization_id = default_org_id where organization_id is null;
    alter table public.internacoes alter column organization_id set not null;
  end if;

  -- Evolucoes
  if not exists (select 1 from information_schema.columns where table_name = 'evolucoes' and column_name = 'organization_id') then
    alter table public.evolucoes add column organization_id uuid references public.organizations(id);
    update public.evolucoes set organization_id = default_org_id where organization_id is null;
    alter table public.evolucoes alter column organization_id set not null;
  end if;

  -- CRC Tables
  if not exists (select 1 from information_schema.columns where table_name = 'produtos' and column_name = 'organization_id') then
    alter table public.produtos add column organization_id uuid references public.organizations(id);
    update public.produtos set organization_id = default_org_id where organization_id is null;
    alter table public.produtos alter column organization_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'internacao' and column_name = 'organization_id') then
    alter table public.internacao add column organization_id uuid references public.organizations(id);
    update public.internacao set organization_id = default_org_id where organization_id is null;
    alter table public.internacao alter column organization_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'tratamentos' and column_name = 'organization_id') then
    alter table public.tratamentos add column organization_id uuid references public.organizations(id);
    update public.tratamentos set organization_id = default_org_id where organization_id is null;
    alter table public.tratamentos alter column organization_id set not null;
  end if;

end $$;

-- 5. Helper Function for RLS
create or replace function public.get_current_org_id()
returns uuid as $$
  select organization_id from public.profiles
  where id = auth.uid()
  limit 1;
$$ language sql security definer;

-- 6. Enable RLS and Create Policies
-- We need to drop existing policies to avoid conflicts or security holes
-- NOTE: This assumes we want to STRICTLY enforce org isolation.

-- Macro for RLS Policy
do $$
declare
  t text;
  tables text[] := array[
    'tutores', 'pacientes', 'agendamentos', 'prontuarios', 'vacinas', 
    'estoque', 'servicos', 'financeiro', 'vendas', 'medicamentos', 
    'internacoes', 'evolucoes', 'produtos', 'internacao', 'tratamentos'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    
    -- Drop existing "Enable all access" policies if they exist
    execute format('drop policy if exists "Enable all access for authenticated users" on public.%I', t);
    
    -- Create new isolation policy
    execute format('create policy "Org Isolation" on public.%I for all using (organization_id = get_current_org_id()) with check (organization_id = get_current_org_id())', t);
  end loop;
end $$;

-- Policies for Organizations and Profiles
alter table public.organizations enable row level security;
create policy "Users can view their own org" on public.organizations for select using (
  id = get_current_org_id()
);
create policy "Users can insert orgs" on public.organizations for insert with check (true); -- Needed for sign up

alter table public.profiles enable row level security;
create policy "Users can view/edit own profile" on public.profiles for all using (
  id = auth.uid()
);

-- 7. Trigger to Auto-set Organization ID on Insert
create or replace function public.set_org_id()
returns trigger as $$
begin
  if new.organization_id is null then
    new.organization_id := public.get_current_org_id();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Apply Trigger to all tables
do $$
declare
  t text;
  tables text[] := array[
    'tutores', 'pacientes', 'agendamentos', 'prontuarios', 'vacinas', 
    'estoque', 'servicos', 'financeiro', 'vendas', 'medicamentos', 
    'internacoes', 'evolucoes', 'produtos', 'internacao', 'tratamentos'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_org_id_trigger on public.%I', t);
    execute format('create trigger set_org_id_trigger before insert on public.%I for each row execute function public.set_org_id()', t);
  end loop;
end $$;
