-- FIX: CREATE PROFILES FOR EXISTING USERS
-- Execute este script no SQL Editor do Supabase para corrigir o acesso de usuários antigos.

do $$
declare
  user_record record;
  default_org_id uuid;
begin
  -- 1. Obter a organização padrão (Minha Clínica)
  select id into default_org_id from public.organizations limit 1;

  if default_org_id is null then
    raise exception 'Nenhuma organização encontrada. Por favor, execute o script de migração anterior primeiro.';
  end if;

  -- 2. Percorrer todos os usuários autenticados
  for user_record in select * from auth.users loop
    -- 3. Verificar se o usuário já tem perfil
    if not exists (select 1 from public.profiles where id = user_record.id) then
      
      -- 4. Criar perfil vinculado à organização padrão
      insert into public.profiles (id, organization_id, role, full_name)
      values (
        user_record.id, 
        default_org_id, 
        'admin', 
        -- Tenta pegar o nome dos metadados ou usa o email
        coalesce(user_record.raw_user_meta_data->>'full_name', user_record.email)
      );
      
    end if;
  end loop;
end $$;
