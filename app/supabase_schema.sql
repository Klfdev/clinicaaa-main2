-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tutores
create table public.tutores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  whatsapp text,
  email text,
  endereco text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pacientes
create table public.pacientes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  tutor_id uuid references public.tutores(id) on delete cascade,
  especie text,
  raca text,
  sexo text,
  data_nascimento date,
  peso text,
  pelagem text,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agendamentos
create table public.agendamentos (
  id uuid default uuid_generate_v4() primary key,
  data date not null,
  horario time not null,
  "nomePet" text, -- Mantendo para compatibilidade ou agendamentos avulsos
  "nomeTutor" text,
  telefone text,
  servico text,
  paciente_id uuid references public.pacientes(id) on delete set null,
  status text default 'Agendado', -- Agendado, Confirmado, Concluído, Cancelado
  google_event_id text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Prontuarios
create table public.prontuarios (
  id uuid default uuid_generate_v4() primary key,
  nome_pet text not null,
  data date not null,
  tipo_atendimento text,
  diagnostico text not null,
  tratamento text,
  observacoes text,
  anexos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vacinas
-- Vacinas (CRC / AI Agent)
create table public.vacinas (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.pacientes(id) on delete cascade,
  vacina text not null,
  data_aplicacao date,
  proxima_dose date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Estoque
create table public.estoque (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  "precoVenda" numeric not null,
  quantidade integer default 0,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Servicos
create table public.servicos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  "precoVenda" numeric not null,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financeiro
create table public.financeiro (
  id uuid default uuid_generate_v4() primary key,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric not null,
  data date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vendas
create table public.vendas (
  id uuid default uuid_generate_v4() primary key,
  cliente_nome text not null,
  forma_pagamento text,
  itens jsonb default '[]'::jsonb,
  data_venda timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Bucket for Attachments
insert into storage.buckets (id, name, public) values ('anexos', 'anexos', true);

-- RLS Policies (Open for now as per request for simplicity, but ideally should be restricted)
alter table public.pacientes enable row level security;
create policy "Enable all access for authenticated users" on public.pacientes for all using (true);

alter table public.tutores enable row level security;
create policy "Enable all access for authenticated users" on public.tutores for all using (true);

alter table public.agendamentos enable row level security;
create policy "Enable all access for authenticated users" on public.agendamentos for all using (true);

alter table public.prontuarios enable row level security;
create policy "Enable all access for authenticated users" on public.prontuarios for all using (true);

alter table public.vacinas enable row level security;
create policy "Enable all access for authenticated users" on public.vacinas for all using (true);

alter table public.estoque enable row level security;
create policy "Enable all access for authenticated users" on public.estoque for all using (true);

alter table public.servicos enable row level security;
create policy "Enable all access for authenticated users" on public.servicos for all using (true);

alter table public.financeiro enable row level security;
create policy "Enable all access for authenticated users" on public.financeiro for all using (true);

alter table public.vendas enable row level security;
create policy "Enable all access for authenticated users" on public.vendas for all using (true);

-- Medicamentos
create table public.medicamentos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  principio_ativo text,
  concentracao text,
  forma_farmaceutica text, -- Comprimido, Xarope, Injetável
  apresentacao text, -- Caixa com 10, Frasco 100ml
  instrucoes_padrao text, -- "Dar 1 comp a cada 12h"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Internações
create table public.internacoes (
  id uuid default uuid_generate_v4() primary key,
  paciente_id uuid references public.pacientes(id) on delete cascade,
  data_entrada timestamp with time zone default timezone('utc'::text, now()) not null,
  data_alta timestamp with time zone,
  motivo text not null,
  status text default 'Internado', -- Internado, Alta, Óbito
  veterinario_responsavel text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Evoluções (Diário de Internação)
create table public.evolucoes (
  id uuid default uuid_generate_v4() primary key,
  internacao_id uuid references public.internacoes(id) on delete cascade,
  data_hora timestamp with time zone default timezone('utc'::text, now()) not null,
  temperatura text,
  frequencia_cardiaca text,
  frequencia_respiratoria text,
  alimentacao text, -- Comeu bem, Anorexia, Sonda
  medicacao_administrada text,
  observacoes text,
  responsavel text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Internações and Evoluções
alter table public.internacoes enable row level security;
create policy "Enable all access for authenticated users" on public.internacoes for all using (true);

alter table public.evolucoes enable row level security;
create policy "Enable all access for authenticated users" on public.evolucoes for all using (true);

-- CRC / AI Agent Tables

-- Produtos
create table public.produtos (
    id uuid default uuid_generate_v4() primary key,
    nome text not null,
    categoria text,
    preco numeric(10,2),
    estoque integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Internacao (Status simplificado para AI)
create table public.internacao (
    id uuid default uuid_generate_v4() primary key,
    paciente_id uuid references public.pacientes(id) on delete cascade,
    status text,
    observacoes text,
    ultima_atualizacao timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tratamentos
create table public.tratamentos (
    id uuid default uuid_generate_v4() primary key,
    paciente_id uuid references public.pacientes(id) on delete cascade,
    descricao text,
    data date default current_date,
    status text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for CRC Tables
alter table public.produtos enable row level security;
create policy "Enable all access for authenticated users" on public.produtos for all using (true);

alter table public.internacao enable row level security;
create policy "Enable all access for authenticated users" on public.internacao for all using (true);

alter table public.tratamentos enable row level security;
create policy "Enable all access for authenticated users" on public.tratamentos for all using (true);
