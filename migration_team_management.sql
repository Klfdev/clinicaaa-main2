-- TEAM MANAGEMENT MIGRATION
-- This script updates RLS policies to allow Admins to manage other profiles in their organization.

-- 1. Drop existing restrictive policy
drop policy if exists "Users can view/edit own profile" on public.profiles;

-- 2. Create new policies

-- Policy: Users can view their own profile
create policy "Users can view own profile" on public.profiles
for select using (
  auth.uid() = id
);

-- Policy: Admins can view ALL profiles in their organization
create policy "Admins can view org profiles" on public.profiles
for select using (
  organization_id = (select organization_id from public.profiles where id = auth.uid() limit 1)
  AND
  (select role from public.profiles where id = auth.uid() limit 1) = 'admin'
);

-- Policy: Users can update their own profile (e.g. name)
create policy "Users can update own profile" on public.profiles
for update using (
  auth.uid() = id
);

-- Policy: Admins can update ANY profile in their organization (to change roles)
create policy "Admins can update org profiles" on public.profiles
for update using (
  organization_id = (select organization_id from public.profiles where id = auth.uid() limit 1)
  AND
  (select role from public.profiles where id = auth.uid() limit 1) = 'admin'
);
