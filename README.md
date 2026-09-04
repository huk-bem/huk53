# HUK FUSION EDM

Künstlerseite für **HUK FUSION EDM** — Dance- und EDM-Produktionen aus dem
HUK53-Studio, mit Crossover- und Fusion-Elementen. One-Pager mit sechs
Tracks (Player, Likes, Kommentare) und Studio-Info. Die Seite selbst ist
vollständig statisch (Vanilla HTML/CSS/JS, GitHub Pages) — Likes und
Kommentare sind über ein kleines, direkt angebundenes Supabase-Projekt
persistent und für alle Besucher:innen sichtbar (siehe unten).

Veröffentlicht via GitHub Pages: https://huk-bem.github.io/huk53/

## Struktur

```
index.html              Startseite (Hero, Songs, About, Footer)
impressum.html          Impressum (Platzhalter für Firmendaten, siehe unten)
datenschutz.html        Datenschutzerklärung
jazz.html                Jazz-Seite — aktuell ausgeblendet, siehe unten
assets/css/style.css    Design (Dark/Neon, minimal & poppig)
assets/css/legal.css    Zusatzstyles für Impressum/Datenschutz
assets/css/intro.css    Zusatzstyles für Intro-Modus (Settings-Bar, Sound-Button)
assets/css/jazz.css     Zusatzstyles für die (ausgeblendete) Jazz-Seite
assets/css/consent.css  Zusatzstyles für den Cookie-Consent-Banner
assets/js/main.js       Player, Likes/Kommentare (Supabase), Animationen
assets/js/consent.js    Cookie-Banner + Supabase-Client + Besuchskennung
assets/js/intro.js      Intro-Modus: Hintergrund-Motiv + Autoplay-Soundtrack
assets/js/jazz.js       Jazz-Player (nur relevant, falls die Seite reaktiviert wird)
assets/audio/           MP3-Dateien (siehe README dort für Status pro Track)
```

## Songs austauschen

Track-Titel, Genre, BPM sowie die Startwerte für Likes/Kommentare stehen
im `SONGS`-Array oben in `assets/js/main.js`. Aktuell live, alle sechs
mit echter Audiodatei:

- Back on Track (`back-on-track.mp3`)
- Sonar (`sonar.mp3`)
- Pocket of Rain (`pocket-of-rain.mp3`)
- Jump (`jump.mp3`)
- New World (`new-world.mp3`)
- Pulp Random Roll It Out (`pulp-random-roll-it-out.mp3`)

`bpm`/`genre` sind grobe Schätzwerte — bei Bedarf in `main.js` auf die
echten Werte anpassen. Weitere Tracks lassen sich genauso ergänzen: Datei
nach `assets/audio/` legen und einen neuen Eintrag im `SONGS`-Array
anlegen (auf eindeutige `id`/Titel achten, um Dopplungen zu vermeiden).

**30-Sekunden-Vorschau + Streaming-Links:** Jeder Track lässt sich pro
Seitenaufruf einmal anspielen — nach 30 Sekunden (oder früher, falls die
Datei kürzer ist) stoppt die Wiedergabe endgültig und zwei Buttons
erscheinen: „Apple Music" und „Spotify". Da Apple Music und Spotify für
HUK Fusion aktuell nur eine Artist-Seite anbieten (keine einzelnen
Song-Deeplinks), verlinken beide Buttons auf dieselben zwei Artist-Links,
oben im `main.js` als `APPLE_MUSIC_URL`/`SPOTIFY_URL` gepflegt:

- Apple Music: https://music.apple.com/de/artist/huk-fusion/6803407059
- Spotify: https://open.spotify.com/artist/5V0AuyekqjEpdtGwjL6m85

Sollten später einzelne Song-Links verfügbar sein, lässt sich das leicht
umstellen: pro Track im `SONGS`-Array ein `appleUrl`/`spotifyUrl`-Feld
ergänzen und in `songCardTemplate`/`initSongCard` statt der globalen
Konstanten verwenden.

## Jazz-Seite (ausgeblendet)

`jazz.html` ist aktuell **komplett ausgeblendet** — kein Link mehr im Nav
irgendeiner Seite, kein Promo-Banner auf der Startseite mehr. Die Datei
und ihr Code (`assets/js/jazz.js`, `assets/css/jazz.css`) existieren
weiterhin unverändert im Repo, sind aber nur noch über die direkte URL
erreichbar (`/jazz.html`) und tauchen nirgends mehr verlinkt auf. Soll die
Seite komplett entfernt statt nur ausgeblendet werden, einfach Bescheid
geben.

## Intro-Modus (Hintergrund-Motiv + Autoplay-Soundtrack)

Auf `index.html` (und `jazz.html`, falls reaktiviert) kann ein
„Intro-Modus" aktiviert werden: die animierte Hero-Hintergrundgrafik (das
bewegte „Motiv") läuft dann zusammen mit einem automatisch startenden,
loopenden Soundtrack. Details in `assets/js/intro.js` (ausführlich
kommentiert):

- **Standardmäßig AN** für alle Besucher:innen (`INTRO_ENABLED_DEFAULT =
  true`). Umschalten: Konstante in `assets/js/intro.js` ändern und neu
  deployen — ohne Backend ist das der einzige Weg, die Einstellung für
  alle statt nur lokal zu ändern.
- **Sound-Button, sofort sichtbar:** Sobald Intro-Modus aktiv ist,
  erscheint unten links ein 🔊/🔇-Button — **direkt beim Laden**, nicht
  erst wenn der Ton tatsächlich läuft. Jede:r Besucher:in kann den Ton so
  jederzeit sofort ausschalten, auch bevor die Wiedergabe (wegen
  Browser-Autoplay-Regeln) überhaupt gestartet ist.
- **Versteckter Vorschau-Schalter (nur für dich):** Tippe irgendwo auf
  der Seite (außerhalb eines Textfelds) das Wort **„huk53"**, oder drücke
  **Strg+Umschalt+E** (Cmd+Shift+E auf dem Mac) — öffnet eine kleine,
  sonst unsichtbare Einstellungs-Leiste mit einem Ein/Aus-Schalter. Diese
  Einstellung wird nur **lokal in deinem Browser** gespeichert
  (`localStorage`) und ändert nichts für andere Besucher:innen.
- **Soundtrack-Datei:** pro Seite über `window.HUK53_INTRO_TRACK` direkt
  im `<script>`-Tag von `index.html` gesetzt (aktuell `back-on-track.mp3`).
  Fehlt die Datei, läuft nur das Hintergrund-Motiv, ohne Ton.
- **Browser-Autoplay-Regeln:** Browser blockieren automatisch startenden
  Ton mit Sound in vielen Fällen, solange noch keine Interaktion mit der
  Seite stattfand — echtes „sofortiges" Abspielen lässt sich technisch
  nicht erzwingen. `intro.js` versucht es beim Laden; schlägt das fehl,
  startet die Wiedergabe automatisch beim ersten Klick/Tastendruck
  irgendwo auf der Seite (sofern nicht zwischenzeitlich stummgeschaltet).

## Impressum & Datenschutz

`impressum.html` und `datenschutz.html` sind verlinkt im Footer jeder
Seite. Beide sind mit den echten Studio-Angaben ausgefüllt (siehe
`impressum.html` für die offen gebliebenen Kleinigkeiten wie USt-ID).
`datenschutz.html` beschreibt Hosting (GitHub Pages + Supabase), Google
Fonts, das Cookie für Likes/Kommentare und die Datenbank-Speicherung.

## Feedback-Spalte (Likes & Kommentare, Supabase)

Likes und Kommentare sind **echt, persistent und für alle Besucher:innen
sichtbar** — gespeichert in einem kleinen Supabase-Projekt (Postgres-
Datenbank), direkt aus dem Browser angebunden (kein eigener API-Server
nötig). Abgesichert über Supabase Row Level Security (RLS) statt über ein
Passwort im Code: der eingebettete „anon public"-Key ist bewusst öffentlich
— er darf laut Supabase-Design im Client-Code stehen, weil die RLS-Regeln
in der Datenbank selbst festlegen, was damit erlaubt ist (siehe
`supabase-setup.sql`, wird bei Bedarf erneut zur Verfügung gestellt).
Zusätzlich serverseitig (per DB-Trigger) abgesichert: Eingabe-Längen-
Limits und ein einfaches Rate-Limit gegen Spam.

**Einrichtung (einmalig, ca. 5 Minuten):**
1. Kostenloses Projekt auf [supabase.com](https://supabase.com/dashboard) anlegen
2. Im **SQL Editor** den Inhalt von [`supabase-setup.sql`](./supabase-setup.sql)
   ausführen (Tabellen `comments`, `likes`, `consent_log` + RLS-Policies +
   Rate-Limit-Trigger)
3. Unter **Project Settings → API**: „Project URL" und „anon public"-Key
   kopieren
4. Beide Werte in `index.html` eintragen:
   ```html
   <script>
     window.HUK53_SUPABASE_URL = "https://xxxxx.supabase.co";
     window.HUK53_SUPABASE_ANON_KEY = "eyJ...";
   </script>
   ```

Ohne diese beiden Werte (aktuell leer) läuft die Seite weiter normal,
Like-Button und Kommentarformular zeigen dann nur „Backend noch nicht
verbunden" statt zu funktionieren — kein Absturz, kein Datenverlust.

**Moderation:** Kommentare löschen/bearbeiten geht aktuell nur direkt im
Supabase **Table Editor** (mit deinem eigenen Login) — bewusst kein
öffentlicher Lösch-Endpunkt, damit niemand fremde Kommentare entfernen
kann.

**Wichtige Einschränkung, ehrlich benannt:** Ohne echte Nutzerkonten kann
die Datenbank technisch nicht zwischen „meinem eigenen" und „fremdem"
Like unterscheiden — jede:r könnte grundsätzlich jede Like-Zeile togglen.
Der praktische Schaden ist gering (kein Zugriff auf andere Daten), aber
das ist der Kompromiss der kontofreien Lösung, transparent statt
verschwiegen.

## Gig/Booking-Bereich

Der bisherige Booking-Bereich (Sektion, Nav-Link, Formular) wurde komplett
entfernt, ebenso alle „Gig"-Formulierungen im Text. Die Social-Media-Links
(Instagram/SoundCloud/YouTube) stehen jetzt im Footer. Soll später wieder
ein Kontakt-/Booking-Weg her, einfach Bescheid geben.

## Lokal ansehen

Kein Build nötig — einfach `index.html` öffnen, oder z. B.:

```
npx serve .
```

## Deployment

Push auf `main` deployt automatisch via `.github/workflows/deploy-pages.yml`
auf GitHub Pages. Damit das funktioniert, muss in den Repo-Settings unter
**Pages** die Quelle einmalig auf „GitHub Actions“ gestellt werden.
