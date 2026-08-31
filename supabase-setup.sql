-- HUK FUSION EDM — Supabase Setup (Likes, Kommentare, Cookie-Consent-Log)
-- Einmal komplett im Supabase SQL Editor ausführen ("Run").

create table if not exists comments (
  id bigserial primary key,
  track_id text not null check (char_length(track_id) between 1 and 60),
  name text not null check (char_length(name) between 1 and 30),
  body text not null check (char_length(body) between 1 and 240),
  visitor_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_track_idx on comments (track_id, created_at desc);

create table if not exists likes (
  track_id text not null check (char_length(track_id) between 1 and 60),
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (track_id, visitor_id)
);

create table if not exists consent_log (
  id bigserial primary key,
  visitor_id uuid,
  granted boolean not null,
  page text,
  created_at timestamptz not null default now()
);

-- Rate limit: max. 5 Kommentare pro Besucher:in innerhalb 10 Minuten
create or replace function enforce_comment_rate_limit() returns trigger as $$
begin
  if (select count(*) from comments where visitor_id = new.visitor_id and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate limit exceeded';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_rate_limit on comments;
create trigger comments_rate_limit before insert on comments
  for each row execute function enforce_comment_rate_limit();

-- Rate limit: max. 20 Like-Aktionen pro Besucher:in pro Minute
create or replace function enforce_like_rate_limit() returns trigger as $$
begin
  if (select count(*) from likes where visitor_id = new.visitor_id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate limit exceeded';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists likes_rate_limit on likes;
create trigger likes_rate_limit before insert on likes
  for each row execute function enforce_like_rate_limit();

-- Row Level Security: definiert, was der öffentliche ("anon") Zugriff
-- aus dem Browser heraus darf. Ohne diese Regeln wäre die Tabelle für
-- den Public-Key komplett gesperrt.
alter table comments enable row level security;
alter table likes enable row level security;
alter table consent_log enable row level security;

create policy "comments_select_all" on comments for select using (true);
create policy "comments_insert_all" on comments for insert with check (true);
-- Bewusst kein update/delete für anon — Moderation (Kommentar löschen)
-- machst du direkt im Supabase Table Editor mit deinem eigenen Login.

create policy "likes_select_all" on likes for select using (true);
create policy "likes_insert_all" on likes for insert with check (true);
create policy "likes_delete_all" on likes for delete using (true);
-- Hinweis: Ohne echte Nutzerkonten kann RLS nicht zwischen "eigenem" und
-- "fremdem" Like unterscheiden — jede:r kann grundsätzlich jede Like-Zeile
-- togglen. Praktischer Schaden minimal (kein Zugriff auf andere Daten),
-- aber transparent genannt statt verschwiegen.

create policy "consent_insert_all" on consent_log for insert with check (true);
-- Bewusst kein select-Recht für anon — niemand kann fremde
-- Consent-Einträge auslesen, nur du selbst über den Table Editor.
