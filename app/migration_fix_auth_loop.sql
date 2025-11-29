-- FIX AUTH LOOP & PROFILE CREATION
-- Run this in the Supabase SQL Editor to fix the issue where users are stuck in the onboarding loop.

-- 1. Drop existing functions to ensure clean slate
drop function if exists public.get_user_profile();
drop function if exists public.create_tenant(text, text);

-- 2. Recreate get_user_profile with explicit search_path and error handling
create or replace function public.get_user_profile()
returns json
language plpgsql
security definer
set search_path = public
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

-- 3. Recreate create_tenant with robust upsert logic
create or replace function public.create_tenant(
  clinic_name text,
  user_full_name text
)
returns json
language plpgsql
security definer
set search_path = public
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

  -- Generate slug
  new_slug := lower(regexp_replace(clinic_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(md5(random()::text), 1, 6);

  if existing_profile_id is not null then
    -- Profile exists! Create Org and Link.
    
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

-- 4. Ensure Permissions
grant execute on function public.get_user_profile() to authenticated;
grant execute on function public.create_tenant(text, text) to authenticated;
grant execute on function public.get_user_profile() to service_role;
grant execute on function public.create_tenant(text, text) to service_role;

-- 5. Ensure RLS Policies on Profiles (just in case)
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using ( auth.uid() = id );

-- Policy: Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Policy: Service Role has full access (implicit, but good to know)
