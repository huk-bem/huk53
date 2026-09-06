-- HUK — Editable site copy ("site_content") + admin access
-- Run once in the Supabase SQL editor (or applied automatically if you're
-- using the Supabase MCP tooling this project was set up with).

create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Public (anon) may READ all content — the live pages fetch these values
-- at load time to override their built-in default text.
alter table site_content enable row level security;

create policy "site_content_select_all" on site_content
  for select using (true);

-- Only the site owner (signed in via Supabase Auth magic link with this
-- exact email) may write. Nobody else — including any other authenticated
-- user, should one ever exist — can change content.
create policy "site_content_write_owner_only" on site_content
  for all
  using ((auth.jwt() ->> 'email') = 'huk53@kloeppis.de')
  with check ((auth.jwt() ->> 'email') = 'huk53@kloeppis.de');

-- Seed with the text currently hard-coded in the pages, so the admin
-- editor starts pre-filled with exactly what's live. `on conflict do
-- nothing` makes this safe to re-run without clobbering later edits.
insert into site_content (key, value) values
  ('hub.kicker', 'Music Studio'),
  ('hub.title', 'Two Sound Worlds. One Studio.'),
  ('hub.lede', 'Electronic music between the dance floor and improvisation — produced with a clear head. Two areas, one origin.'),
  ('hub.edm.teaser', 'Clean beats, precise production — dance, EDM and crossover from the studio. Six tracks to explore, each linked directly to Spotify and Apple Music.'),
  ('hub.edm.cta', 'Listen to the tracks →'),
  ('hub.jazz.teaser', 'Jazz harmony meets electronic texture — four tracks from the Moments and Moods release. Press play, then follow through to Spotify and Apple Music.'),
  ('hub.jazz.cta', 'Listen to the tracks →'),
  ('hub.mix.teaser', 'A virtual two-deck DJ mixer — load an EDM Fusion and a Jazz Fusion track side by side, blend them with the crossfader, and shape each with volume, EQ, and speed.'),
  ('hub.mix.cta', 'Open the mixer →'),
  ('edm.hero.tagline', 'Dance and EDM productions from the HUK53 studio — with crossover and fusion elements.'),
  ('edm.hero.cta', '🎧 Listen to tracks'),
  ('edm.songs.heading', 'Fresh tracks from the studio.'),
  ('edm.songs.intro', 'Dance, EDM, and everything in between — the latest cuts from the HUK53 studio. Tune in, drop a like, and let us know what you hear.'),
  ('edm.about.heading', 'HUK FUSION EDM combines clean dance energy with crossover elements.'),
  ('edm.about.p1', 'HUK FUSION EDM stands for dance and EDM productions from the HUK53 studio: danceable core structures, enriched with elements from crossover and fusion.'),
  ('edm.about.p2', 'From the first idea to the finished mix, the music takes shape right here in the studio — with an eye for detail and an ear for unusual sound combinations.'),
  ('jazz.hero.tagline', 'Jazz harmony meets electronic texture. Four tracks from the studio — each plays a 30-second preview, then links straight through to Apple Music and Spotify.')
on conflict (key) do nothing;
