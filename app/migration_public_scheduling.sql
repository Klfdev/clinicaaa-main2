-- PUBLIC SCHEDULING MIGRATION
-- This script enables public scheduling via a secure RPC function.

-- 1. Create a function to handle public appointments
create or replace function public.public_schedule_appointment(
  clinic_slug text,
  tutor_name text,
  tutor_phone text,
  pet_name text,
  appointment_date date,
  appointment_time time,
  service_name text
)
returns json
language plpgsql
security definer -- Runs with elevated privileges to bypass RLS for the insert
as $$
declare
  target_org_id uuid;
  new_appointment_id uuid;
begin
  -- 1. Find Organization by Slug
  select id into target_org_id
  from public.organizations
  where slug = clinic_slug
  limit 1;

  if target_org_id is null then
    return json_build_object('success', false, 'message', 'Clínica não encontrada');
  end if;

  -- 2. Insert Appointment (Agendamento)
  -- We insert with status 'Solicitado' so the clinic can approve later
  insert into public.agendamentos (
    organization_id,
    data,
    horario,
    "nomeTutor", -- Using the text fallback columns for now
    "nomePet",
    telefone,
    servico,
    status
  )
  values (
    target_org_id,
    appointment_date,
    appointment_time,
    tutor_name,
    pet_name,
    tutor_phone,
    service_name,
    'Solicitado' -- New status for online requests
  )
  returning id into new_appointment_id;

  return json_build_object('success', true, 'id', new_appointment_id, 'message', 'Agendamento solicitado com sucesso');

exception when others then
  return json_build_object('success', false, 'message', SQLERRM);
end;
$$;

-- 2. Grant permission to public (anon) and authenticated users
grant execute on function public.public_schedule_appointment to anon;
grant execute on function public.public_schedule_appointment to authenticated;
grant execute on function public.public_schedule_appointment to service_role;

-- 3. Ensure 'Solicitado' is a valid status (if you have a check constraint, otherwise this is just a comment)
-- If you have an enum or check constraint on 'status', you might need to alter it. 
-- Assuming text column based on previous file analysis.
