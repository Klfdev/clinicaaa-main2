-- Add fields for n8n/Google Calendar sync
alter table public.agendamentos add column if not exists google_event_id text;
alter table public.agendamentos add column if not exists last_synced_at timestamp with time zone;
