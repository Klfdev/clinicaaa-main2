-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Tabela de Produtos (Para a IA consultar estoque/preços)
create table if not exists public.produtos (
    id uuid default uuid_generate_v4() primary key,
    nome text not null,
    categoria text, -- Ração, Medicamento, Acessório
    preco numeric(10,2),
    estoque integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Internação (Para status em tempo real)
create table if not exists public.internacao (
    id uuid default uuid_generate_v4() primary key,
    paciente_id uuid references public.pacientes(id) on delete cascade,
    status text, -- Estável, Em observação, Crítico, Alta
    observacoes text,
    ultima_atualizacao timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Vacinas (Para controle de carteirinha)
create table if not exists public.vacinas (
    id uuid default uuid_generate_v4() primary key,
    paciente_id uuid references public.pacientes(id) on delete cascade,
    vacina text not null,
    data_aplicacao date,
    proxima_dose date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Tratamentos (Histórico clínico simplificado)
create table if not exists public.tratamentos (
    id uuid default uuid_generate_v4() primary key,
    paciente_id uuid references public.pacientes(id) on delete cascade,
    descricao text,
    data date default current_date,
    status text, -- Em andamento, Concluído
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index para busca rápida por telefone (essencial para o n8n achar o cliente)
create index if not exists idx_tutores_whatsapp on public.tutores(whatsapp);

-- RLS Policies (Permitir leitura pública ou autenticada conforme necessidade - aqui deixando permissivo para facilitar o n8n por enquanto, mas ideal é usar chave de serviço)
alter table public.produtos enable row level security;
create policy "Public read access" on public.produtos for select using (true);
create policy "Admin write access" on public.produtos for all using (true); -- Ajuste conforme auth

alter table public.internacao enable row level security;
create policy "Public read access" on public.internacao for select using (true);
create policy "Admin write access" on public.internacao for all using (true);

alter table public.vacinas enable row level security;
create policy "Public read access" on public.vacinas for select using (true);
create policy "Admin write access" on public.vacinas for all using (true);

alter table public.tratamentos enable row level security;
create policy "Public read access" on public.tratamentos for select using (true);
create policy "Admin write access" on public.tratamentos for all using (true);
