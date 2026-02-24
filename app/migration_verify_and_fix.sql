-- SCRIPT DE CORREÇÃO TOTAL E VERIFICAÇÃO
-- Execute este script no Supabase SQL Editor para garantir que o banco está 100% correto.

BEGIN;

-- 1. Garantir permissões nas tabelas (caso RLS esteja bloqueando algo estranho)
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- 2. Recriar função get_user_profile com permissões explícitas
DROP FUNCTION IF EXISTS public.get_user_profile;
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result json;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(p) INTO result
  FROM public.profiles p
  WHERE p.id = current_user_id;

  RETURN result;
END;
$$;

-- Garantir que o usuário logado pode executar
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile TO service_role;

-- 3. Recriar função create_tenant com permissões explícitas e lógica de UPSERT
DROP FUNCTION IF EXISTS public.create_tenant;
CREATE OR REPLACE FUNCTION public.create_tenant(
  clinic_name text,
  user_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  new_slug text;
  current_user_id uuid;
  existing_profile_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verifica se já existe perfil
  SELECT id INTO existing_profile_id FROM public.profiles WHERE id = current_user_id;

  -- Gera slug único
  new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

  IF existing_profile_id IS NOT NULL THEN
    -- Se já existe, cria a org e ATUALIZA o perfil
    INSERT INTO public.organizations (name, slug)
    VALUES (clinic_name, new_slug)
    RETURNING id INTO new_org_id;

    UPDATE public.profiles
    SET organization_id = new_org_id,
        full_name = user_full_name,
        role = 'admin'
    WHERE id = current_user_id;
  ELSE
    -- Se não existe, cria tudo novo
    INSERT INTO public.organizations (name, slug)
    VALUES (clinic_name, new_slug)
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, role, full_name)
    VALUES (current_user_id, new_org_id, 'admin', user_full_name);
  END IF;

  RETURN json_build_object('id', new_org_id, 'slug', new_slug);
END;
$$;

-- Garantir que o usuário logado pode executar
GRANT EXECUTE ON FUNCTION public.create_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant TO service_role;

COMMIT;

-- FIM DO SCRIPT
