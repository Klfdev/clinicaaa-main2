-- COMPREHENSIVE FIX SCRIPT
-- Run this to fix both the "Profile Visibility" issue and the "Duplicate Key (409)" issue.

-- 1. Fix: Function to see your own profile (bypasses RLS)
create or replace function public.get_user_profile()
returns json
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  result json;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    return null;
  end if;

  select row_to_json(p) into result
  from public.profiles p
  where p.id = current_user_id;

  return result;
end;
$$;

-- 2. Fix: Function to create Tenant (Org + Profile) with "Upsert" logic
-- This fixes the 409 Error if you already have a profile but it was "hidden".
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
  -- Get current user ID
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if profile already exists
  select id into existing_profile_id from public.profiles where id = current_user_id;

  if existing_profile_id is not null then
    -- Profile exists! We just need to make sure it's linked to an Org.
    -- For simplicity in this "rescue" mode, we will create the new Org and UPDATE the profile.
    
    -- Generate slug
    new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

    -- Create Org
    insert into public.organizations (name, slug)
    values (clinic_name, new_slug)
    returning id into new_org_id;

    -- Update Profile
    update public.profiles
    set organization_id = new_org_id,
        full_name = user_full_name,
        role = 'admin'
    where id = current_user_id;

    return json_build_object('id', new_org_id, 'slug', new_slug, 'status', 'updated');
  else
    -- Profile does NOT exist. Create everything.
    
    -- Generate slug
    new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

    -- Create Org
    insert into public.organizations (name, slug)
    values (clinic_name, new_slug)
    returning id into new_org_id;

    -- Create Profile
    insert into public.profiles (id, organization_id, role, full_name)
    values (current_user_id, new_org_id, 'admin', user_full_name);

    return json_build_object('id', new_org_id, 'slug', new_slug, 'status', 'created');
  end if;
end;
$$;
