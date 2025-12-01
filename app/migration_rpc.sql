-- RPC to Create Tenant (Org + Profile) securely
-- This bypasses RLS issues where a user cannot see the Org they just created because they don't have a profile yet.

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
begin
  -- Get current user ID
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Generate slug (simple version)
  -- Remove accents/special chars and append random string
  new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

  -- Create Org
  insert into public.organizations (name, slug)
  values (clinic_name, new_slug)
  returning id into new_org_id;

  -- Create Profile
  insert into public.profiles (id, organization_id, role, full_name)
  values (current_user_id, new_org_id, 'admin', user_full_name);

  return json_build_object('id', new_org_id, 'slug', new_slug);
end;
$$;
