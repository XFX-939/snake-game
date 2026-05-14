create extension if not exists pgcrypto;

create table if not exists public.snake_scores (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null unique,
  player_name text not null,
  score integer not null check (score >= 0 and score <= 99999),
  difficulty text not null check (difficulty in ('normal', 'hard', 'hell')),
  snake_length integer not null default 3 check (snake_length >= 3),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint player_name_length_check
    check (char_length(btrim(player_name)) between 1 and 12)
);

create index if not exists snake_scores_rank_idx
on public.snake_scores (score desc, created_at asc);

alter table public.snake_scores enable row level security;

grant usage on schema public to anon;
grant select, insert on public.snake_scores to anon;

drop policy if exists "Allow public read snake scores" on public.snake_scores;
drop policy if exists "Allow public insert snake scores" on public.snake_scores;

create policy "Allow public read snake scores"
on public.snake_scores
for select
to anon
using (true);

create policy "Allow public insert snake scores"
on public.snake_scores
for insert
to anon
with check (
  char_length(btrim(player_name)) between 1 and 12
  and score >= 0
  and score <= 99999
  and difficulty in ('normal', 'hard', 'hell')
  and snake_length >= 3
  and duration_seconds >= 0
);
