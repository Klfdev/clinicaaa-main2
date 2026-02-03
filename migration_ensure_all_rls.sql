-- MIGRATION: ENSURE ALL RLS & DATA ISOLATION
-- Execute este script para garantir que TODAS as tabelas do sistema estejam isoladas corretamente.

-- 1. Função auxiliar para obter ID da organização atual
create or replace function public.get_current_org_id()
returns uuid as $$
  select organization_id from public.profiles
  where id = auth.uid()
  limit 1;
$$ language sql security definer;

-- 2. Função auxiliar para preencher organization_id automaticamente
create or replace function public.set_org_id()
returns trigger as $$
begin
  if new.organization_id is null then
    new.organization_id := public.get_current_org_id();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Bloco principal para aplicar mudanças em todas as tabelas
do $$
declare
  t text;
  -- Lista de todas as tabelas que precisam de isolamento
  tables text[] := array[
    'tutores', 'pacientes', 'agendamentos', 'prontuarios', 'vacinas', 
    'estoque', 'servicos', 'financeiro', 'vendas', 'medicamentos', 
    'internacoes', 'evolucoes', 'configuracoes'
  ];
  default_org_id uuid;
begin
  -- Tenta encontrar uma organização padrão para migrar dados órfãos
  select id into default_org_id from public.organizations limit 1;

  foreach t in array tables loop
    -- A. Adicionar coluna organization_id se não existir
    if not exists (select 1 from information_schema.columns where table_name = t and column_name = 'organization_id') then
      execute format('alter table public.%I add column organization_id uuid references public.organizations(id)', t);
    end if;

    -- B. Migrar dados órfãos (sem organization_id) para a org padrão
    if default_org_id is not null then
      execute format('update public.%I set organization_id = %L where organization_id is null', t, default_org_id);
    end if;

    -- C. Habilitar RLS
    execute format('alter table public.%I enable row level security', t);
    -- Opcional: Forçar RLS (descomente se quiser ser estrito)
    -- execute format('alter table public.%I force row level security', t);

    -- D. Criar/Atualizar Políticas de Isolamento
    execute format('drop policy if exists "Enable all access for authenticated users" on public.%I', t);
    execute format('drop policy if exists "Org Isolation" on public.%I', t);
    
    execute format('create policy "Org Isolation" on public.%I for all using (organization_id = public.get_current_org_id()) with check (organization_id = public.get_current_org_id())', t);

    -- E. Aplicar Trigger para auto-preenchimento
    execute format('drop trigger if exists set_org_id_trigger on public.%I', t);
    execute format('create trigger set_org_id_trigger before insert on public.%I for each row execute function public.set_org_id()', t);
    
  end loop;
end $$;
