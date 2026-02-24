-- 1. Create Tutores table
create table public.tutores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  whatsapp text,
  email text,
  endereco text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS for Tutores
alter table public.tutores enable row level security;
create policy "Enable all access for authenticated users" on public.tutores for all using (true);

-- 3. Modify Pacientes table
-- First, add the new columns
alter table public.pacientes add column tutor_id uuid references public.tutores(id) on delete cascade;
alter table public.pacientes add column especie text;
alter table public.pacientes add column raca text;
alter table public.pacientes add column sexo text;

-- 4. (Optional) Data Migration - Best Effort
-- This attempts to create tutors from existing patients and link them.
-- WARNING: This is a simple migration and might duplicate tutors if names vary slightly.
do $$
declare
    r record;
    new_tutor_id uuid;
begin
    for r in select distinct tutor, whatsapp, email, endereco from public.pacientes where tutor is not null loop
        insert into public.tutores (nome, whatsapp, email, endereco)
        values (r.tutor, r.whatsapp, r.email, r.endereco)
        returning id into new_tutor_id;

        update public.pacientes
        set tutor_id = new_tutor_id
        where tutor = r.tutor;
    end loop;
end $$;

-- 5. Remove old columns from Pacientes
-- Only run this AFTER verifying the migration worked!
-- alter table public.pacientes drop column tutor;
-- alter table public.pacientes drop column whatsapp;
-- alter table public.pacientes drop column email;
-- alter table public.pacientes drop column endereco;
