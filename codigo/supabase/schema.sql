-- Ampla · esquema do banco (Supabase / Postgres)
-- Rode no SQL Editor do Supabase. Idempotente onde possível.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Perfis (um por usuário)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 80),
  sexo        char(1) not null check (sexo in ('F','M')),
  nascimento  int check (nascimento between 1900 and 2100),
  cabelo      text not null default '#3b2a20',
  cor         text not null default '#2f6fde',
  consentiu_em timestamptz,           -- consentimento LGPD (dados sensíveis)
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Exames (uma coleta / um laudo enviado)
-- ------------------------------------------------------------------
create table if not exists public.exams (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null references public.profiles(id) on delete cascade,
  coletado_em   date,
  laboratorio   text,
  arquivo_path  text,                 -- caminho no bucket "laudos": <owner>/<arquivo>
  status        text not null default 'enviado'
                check (status in ('enviado','lendo','conferir','confirmado','erro')),
  erro          text,
  created_at    timestamptz not null default now()
);
create index if not exists exams_owner_idx on public.exams(owner, coletado_em desc);

-- ------------------------------------------------------------------
-- Resultados (um parâmetro de um exame)
-- ------------------------------------------------------------------
create table if not exists public.results (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams(id) on delete cascade,
  owner        uuid not null references public.profiles(id) on delete cascade,
  codigo       text not null,          -- código canônico, ex.: 'ldl', 'tsh'
  nome         text not null,          -- como aparece no laudo
  valor        numeric,
  valor_texto  text,                   -- resultados qualitativos ("Não reagente")
  unidade      text,
  ref_min      numeric,
  ref_max      numeric,
  sistema      text not null default 'outros',
  created_at   timestamptz not null default now()
);
create index if not exists results_owner_codigo_idx on public.results(owner, codigo);

-- ------------------------------------------------------------------
-- Conexões entre pessoas
--   nivel_a = o que A mostra para B; nivel_b = o que B mostra para A
-- ------------------------------------------------------------------
create table if not exists public.connections (
  id        uuid primary key default gen_random_uuid(),
  a         uuid not null references public.profiles(id) on delete cascade,
  b         uuid not null references public.profiles(id) on delete cascade,
  nivel_a   text not null default 'resumo' check (nivel_a in ('nada','resumo','tudo')),
  nivel_b   text not null default 'resumo' check (nivel_b in ('nada','resumo','tudo')),
  created_at timestamptz not null default now(),
  check (a <> b)
);
create unique index if not exists connections_par_idx
  on public.connections (least(a,b), greatest(a,b));

-- ------------------------------------------------------------------
-- Convites
-- ------------------------------------------------------------------
create table if not exists public.invites (
  code        text primary key,
  owner       uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null default now() + interval '14 days',
  used_by     uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Funções de apoio
-- ------------------------------------------------------------------

-- Nível que "pessoa" compartilha com o usuário atual
create or replace function public.nivel_compartilhado(pessoa uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when pessoa = auth.uid() then 'tudo'
    else coalesce((
      select case when c.a = pessoa then c.nivel_a else c.nivel_b end
      from connections c
      where (c.a = pessoa and c.b = auth.uid()) or (c.b = pessoa and c.a = auth.uid())
      limit 1), 'nada')
  end;
$$;

create or replace function public.conectado(pessoa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from connections c
    where (c.a = pessoa and c.b = auth.uid()) or (c.b = pessoa and c.a = auth.uid()));
$$;

-- Cria um convite e devolve o código
create or replace function public.criar_convite()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  c := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  insert into invites(code, owner) values (c, auth.uid());
  return c;
end $$;

-- Aceita um convite: cria a conexão (o convite é o consentimento de quem convidou)
create or replace function public.aceitar_convite(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invites; cid uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into inv from invites where code = upper(p_code) for update;
  if inv.code is null then raise exception 'convite inválido'; end if;
  if inv.used_by is not null then raise exception 'convite já usado'; end if;
  if inv.expires_at < now() then raise exception 'convite expirado'; end if;
  if inv.owner = auth.uid() then raise exception 'convite próprio'; end if;
  insert into connections(a, b) values (inv.owner, auth.uid())
    on conflict do nothing returning id into cid;
  update invites set used_by = auth.uid() where code = inv.code;
  return cid;
end $$;

-- Cada lado escolhe só o próprio nível
create or replace function public.definir_nivel(p_conexao uuid, p_nivel text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_nivel not in ('nada','resumo','tudo') then raise exception 'nível inválido'; end if;
  update connections set nivel_a = p_nivel where id = p_conexao and a = auth.uid();
  update connections set nivel_b = p_nivel where id = p_conexao and b = auth.uid();
end $$;

-- Resumo agregado (para nível "resumo"): contagem por status, sem valores
create or replace function public.resumo_pessoa(pessoa uuid)
returns table (total int, fora int, ultima_coleta date)
language sql stable security definer set search_path = public as $$
  select count(*)::int,
         count(*) filter (where (r.ref_max is not null and r.valor > r.ref_max)
                           or (r.ref_min is not null and r.valor < r.ref_min))::int,
         max(e.coletado_em)
  from results r join exams e on e.id = r.exam_id
  where r.owner = pessoa and e.status = 'confirmado'
    and public.nivel_compartilhado(pessoa) in ('resumo','tudo');
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.exams       enable row level security;
alter table public.results     enable row level security;
alter table public.connections enable row level security;
alter table public.invites     enable row level security;

drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select
  using (id = auth.uid() or public.conectado(id));
drop policy if exists profiles_ins on public.profiles;
create policy profiles_ins on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_del on public.profiles;
create policy profiles_del on public.profiles for delete using (id = auth.uid());

drop policy if exists exams_own on public.exams;
create policy exams_own on public.exams for all
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists exams_shared on public.exams;
create policy exams_shared on public.exams for select
  using (status = 'confirmado' and public.nivel_compartilhado(owner) = 'tudo');

drop policy if exists results_own on public.results;
create policy results_own on public.results for all
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists results_shared on public.results;
create policy results_shared on public.results for select
  using (public.nivel_compartilhado(owner) = 'tudo'
         and exists (select 1 from exams e where e.id = exam_id and e.status = 'confirmado'));

drop policy if exists connections_sel on public.connections;
create policy connections_sel on public.connections for select
  using (a = auth.uid() or b = auth.uid());
drop policy if exists connections_del on public.connections;
create policy connections_del on public.connections for delete
  using (a = auth.uid() or b = auth.uid());
-- inserção e alteração só pelas funções criar/aceitar convite e definir_nivel

drop policy if exists invites_own on public.invites;
create policy invites_own on public.invites for select using (owner = auth.uid());

-- ------------------------------------------------------------------
-- Storage: bucket privado "laudos", uma pasta por usuário
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('laudos', 'laudos', false) on conflict (id) do nothing;

drop policy if exists laudos_sel on storage.objects;
create policy laudos_sel on storage.objects for select
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists laudos_ins on storage.objects;
create policy laudos_ins on storage.objects for insert
  with check (bucket_id = 'laudos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists laudos_del on storage.objects;
create policy laudos_del on storage.objects for delete
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = auth.uid()::text);
