-- MIGRATION: FIX CONFIGURACOES ISOLATION (V2)
-- Execute este script no SQL Editor do Supabase para corrigir o vazamento de dados.

-- 1. Garantir que a coluna organization_id existe
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'configuracoes' and column_name = 'organization_id') then
    alter table public.configuracoes add column organization_id uuid references public.organizations(id);
  end if;
end $$;

-- 2. Limpar dados órfãos ou atribuir a uma organização padrão
-- Se houver configurações sem organization_id, vamos atribuí-las à primeira organização encontrada ou deletá-las se não houver orgs.
do $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.organizations limit 1;
  
  if default_org_id is not null then
    update public.configuracoes set organization_id = default_org_id where organization_id is null;
  else
    -- Se não houver organizações, deletar configurações órfãs para evitar vazamento global
    delete from public.configuracoes where organization_id is null;
  end if;
end $$;

-- 3. Habilitar e FORÇAR RLS
alter table public.configuracoes enable row level security;
-- Opcional: Forçar RLS até para o dono da tabela (boa prática para garantir)
alter table public.configuracoes force row level security;

-- 4. Recriar Políticas de Segurança
drop policy if exists "Enable all access for authenticated users" on public.configuracoes;
drop policy if exists "Org Isolation" on public.configuracoes;

create policy "Org Isolation" on public.configuracoes
for all
using (organization_id = public.get_current_org_id())
with check (organization_id = public.get_current_org_id());

-- 5. Trigger para preencher organization_id automaticamente
create or replace function public.set_org_id()
returns trigger as $$
begin
  if new.organization_id is null then
    new.organization_id := public.get_current_org_id();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_org_id_trigger on public.configuracoes;
create trigger set_org_id_trigger
before insert on public.configuracoes
for each row execute function public.set_org_id();

-- 6. Atualizar função create_tenant para garantir configurações iniciais
create or replace function public.create_tenant(
  clinic_name text,
  user_full_name text
)
returns json
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
  new_slug text;
  current_user_id uuid;
  existing_profile_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then raise exception 'Not authenticated'; end if;

  select id into existing_profile_id from public.profiles where id = current_user_id;

  -- Gerar slug único
  new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

  if existing_profile_id is not null then
    -- Usuário já existe, criar nova org e atualizar perfil
    insert into public.organizations (name, slug) values (clinic_name, new_slug) returning id into new_org_id;
    
    update public.profiles
    set organization_id = new_org_id, full_name = user_full_name, role = 'admin'
    where id = current_user_id;
  else
    -- Novo usuário
    insert into public.organizations (name, slug) values (clinic_name, new_slug) returning id into new_org_id;
    
    insert into public.profiles (id, organization_id, role, full_name)
    values (current_user_id, new_org_id, 'admin', user_full_name);
  end if;

  -- Criar configuração padrão para a nova organização
  insert into public.configuracoes (organization_id, nome_clinica)
  values (new_org_id, clinic_name);

  return json_build_object('id', new_org_id, 'slug', new_slug, 'status', 'success');
end;
$$;
