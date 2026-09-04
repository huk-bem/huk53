# HUK

Musikprojekt mit zwei Bereichen: **EDM** (Dance/EDM/Crossover, mit Player,
Likes & Kommentaren) und **Jazz Fusion** (aktuell in Vorbereitung). Die
Startseite (`index.html`) ist eine kühle, minimalistische Verteilerseite,
die auf die beiden Unterseiten verteilt — bewusst dezenter als das
bisherige Dance/EDM-Design (siehe „Vorherige Version" unten). Vollständig
statisch (Vanilla HTML/CSS/JS, GitHub Pages); Likes/Kommentare laufen über
ein kleines, direkt angebundenes Supabase-Projekt.

Veröffentlicht via GitHub Pages: https://huk-bem.github.io/huk53/

**Sprache:** Alle Seiteninhalte (Texte, Buttons, Formulare, Impressum/
Datenschutz) sind auf **Englisch**. Diese README bleibt zur Pflege auf
Deutsch.

## Vorherige Version (archiviert)

Die bisherige, reißerischere One-Pager-Version (großer Hero, Neon-Farben,
alle sechs Songs direkt auf der Startseite) ist **nicht gelöscht**,
sondern auf dem Branch [`archive/edm-fusion-v1`](https://github.com/huk-bem/huk53/tree/archive/edm-fusion-v1)
gesichert — für später, falls sie wieder gebraucht wird. Um sie
wiederherzustellen: diesen Branch auschecken bzw. per PR nach `main`
zurückführen.

## Struktur

```
index.html              Startseite — kühle Verteilerseite (Hub) für EDM/Jazz Fusion
edm.html                 EDM-Unterseite — Player, Songs, Likes/Kommentare, Studio-Info
jazz.html                Jazz-Fusion-Unterseite — Player, vier "Moments and Moods"-Tracks
impressum.html          Legal Notice (Impressum)
datenschutz.html        Privacy Policy (Datenschutzerklärung)
assets/css/hub.css      Design der Startseite + Impressum/Datenschutz (schwarz-weiß, dezent)
assets/css/style.css    Design der EDM-Seite (Dark/Neon, wie bisher) — auch von jazz.html genutzt
assets/css/intro.css    Zusatzstyles für Intro-Modus (nur auf edm.html)
assets/css/consent.css  Zusatzstyles für den Cookie-Consent-Banner (nur auf edm.html)
assets/css/jazz.css     Zusatzstyles für die Jazz-Fusion-Seite (Gold-Akzent, Hero mit Cover)
assets/js/main.js       Gemeinsame Basis (Nav, Hero-Canvas) + EDM: Player, Likes/Kommentare (Supabase)
assets/js/consent.js    Cookie-Banner + Supabase-Client + Besuchskennung (nur auf edm.html)
assets/js/intro.js      Intro-Modus: Hintergrund-Motiv + Autoplay-Soundtrack (nur auf edm.html)
assets/js/jazz.js       Jazz-Fusion-Player (4 Tracks, 30s-Vorschau + Streaming-Buttons)
assets/img/edm-teaser.gif   Cover-Motiv für die EDM-Kachel auf der Startseite
assets/img/jazz-teaser.jpg  Cover-Motiv ("Moments and Moods") für Jazz-Fusion-Kachel + Hero
assets/audio/           MP3-Dateien (siehe README dort für Status pro Track)
```

## Startseite (Hub)

`index.html` zeigt nur einen kurzen, sachlichen Intro-Text und zwei
gleichwertige Kacheln — **EDM** (verlinkt zu `edm.html`, mit dem
bereitgestellten Cover-Motiv als Bild) und **Jazz Fusion** (verlinkt zu
`jazz.html`, mit einem ruhigen, statischen Monochrom-Grafik-Platzhalter
statt eines animierten Motivs). Kein Intro-Sound, kein bewegter
Hintergrund, keine Cookies auf dieser Seite — bewusst reduziert.

## EDM-Seite

Inhaltlich unverändert gegenüber der vorherigen Startseite: sechs Tracks
im `SONGS`-Array in `assets/js/main.js`, mit Player, Likes, Kommentaren
(Supabase) und Studio-Info. Track-Titel, Genre, BPM stehen im
`SONGS`-Array — `bpm`/`genre` sind grobe Schätzwerte, bei Bedarf anpassen.
Weitere Tracks: Datei nach `assets/audio/` legen, neuen Eintrag im
`SONGS`-Array anlegen (eindeutige `id`/Titel, um Dopplungen zu vermeiden).

**30-Sekunden-Vorschau + Streaming-Links:** Jeder Track lässt sich pro
Seitenaufruf einmal anspielen — nach 30 Sekunden (oder früher, falls die
Datei kürzer ist) stoppt die Wiedergabe endgültig und zwei Buttons
erscheinen: „Open directly in Spotify" und „Open directly in the Apple
Music Store" (Website-Texte sind jetzt komplett auf Englisch, siehe
unten). Da Apple Music und Spotify für HUK Fusion aktuell nur eine
Artist-Seite anbieten (keine einzelnen Song-Deeplinks), verlinken beide
Buttons auf dieselben zwei Artist-Links, oben im `main.js` als
`APPLE_MUSIC_URL`/`SPOTIFY_URL` gepflegt:

- Apple Music: https://music.apple.com/de/artist/huk-fusion/6803407059
- Spotify: https://open.spotify.com/artist/5V0AuyekqjEpdtGwjL6m85

Sollten später einzelne Song-Links verfügbar sein, lässt sich das leicht
umstellen: pro Track im `SONGS`-Array ein `appleUrl`/`spotifyUrl`-Feld
ergänzen und in `songCardTemplate`/`initSongCard` statt der globalen
Konstanten verwenden.

## Jazz-Fusion-Seite

`jazz.html` ist jetzt eine vollständige Player-Seite wie `edm.html` —
vier echte Tracks aus der Reihe **„Moments and Moods"**, mit demselben
30-Sekunden-Hard-Cap-Vorschauverhalten (danach dauerhaft Stopp + zwei
Streaming-Buttons). Konfiguriert im `JAZZ_TRACKS`-Array in
`assets/js/jazz.js`:

- Echo (`echo.mp3`)
- Fading Light (`fading-light.mp3`)
- Sunday Feeling (`sunday-feeling.mp3`)
- End of Summer (`end-of-summer.mp3`)

Titel wurden aus den hochgeladenen Dateinamen abgeleitet (Versions-Suffixe
wie `_2`/`_3` entfernt) — kurz gegenprüfen, falls das nicht die
gewünschten offiziellen Titel sind.

**Streaming-Links, ehrlich benannt:** Wie bei den EDM-Tracks bieten Apple
Music und Spotify für HUK Fusion aktuell nur eine Artist-Seite an, keine
einzelnen Song-Links — alle vier Jazz-Tracks verlinken deshalb vorerst auf
dieselben zwei Artist-URLs (in `jazz.js` oben als `APPLE_MUSIC_URL`/
`SPOTIFY_URL` gepflegt, identisch zu `main.js`). Sobald du die vier
einzelnen Song-Links hast, einfach schicken — dann trage ich sie pro
Track ein (`appleUrl`/`spotifyUrl`-Feld existiert schon je Track).

Keine Likes/Kommentare auf dieser Seite (bewusst wie ursprünglich
geplant, kein Supabase/Cookie nötig) — nur Player + Streaming-Buttons.
Das Cover-Motiv „Moments and Moods" erscheint jetzt im Hero neben dem
Text.

## Intro-Modus (nur auf der EDM-Seite)

Auf `edm.html` kann ein „Intro-Modus" aktiviert werden: die animierte
Hero-Hintergrundgrafik läuft dann zusammen mit einem automatisch
startenden, loopenden Soundtrack. Details in `assets/js/intro.js`
(ausführlich kommentiert):

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
- **Soundtrack-Datei:** über `window.HUK53_INTRO_TRACK` direkt im
  `<script>`-Tag von `edm.html` gesetzt (aktuell `back-on-track.mp3`).
  Fehlt die Datei, läuft nur das Hintergrund-Motiv, ohne Ton.
- **Browser-Autoplay-Regeln:** Browser blockieren automatisch startenden
  Ton mit Sound in vielen Fällen, solange noch keine Interaktion mit der
  Seite stattfand — echtes „sofortiges" Abspielen lässt sich technisch
  nicht erzwingen. `intro.js` versucht es beim Laden; schlägt das fehl,
  startet die Wiedergabe automatisch beim ersten Klick/Tastendruck
  irgendwo auf der Seite (sofern nicht zwischenzeitlich stummgeschaltet).

## Legal Notice & Privacy Policy (Impressum & Datenschutz)

Dateinamen bleiben unverändert (`impressum.html`, `datenschutz.html`),
Inhalt und Überschriften sind jetzt auf Englisch: „Legal Notice" bzw.
„Privacy Policy". Beide sind **nur noch im Footer** jeder Seite verlinkt
(nicht mehr zusätzlich im Header-Nav) und im dezenten Hub-Design gehalten.
Beide sind mit den echten Studio-Angaben ausgefüllt (siehe `impressum.html`
für die offen gebliebenen Kleinigkeiten wie USt-ID). `datenschutz.html`
beschreibt Hosting (GitHub Pages + Supabase), Google Fonts sowie das
Cookie und die Datenbank-Speicherung für Likes/Kommentare — und weist
klar darauf hin, dass das nur den EDM-Bereich betrifft (Startseite und
Jazz-Fusion-Seite setzen kein Cookie).

## Feedback-Spalte (Likes & Kommentare, Supabase, nur auf der EDM-Seite)

Likes und Kommentare sind **echt, persistent und für alle Besucher:innen
sichtbar** — gespeichert in einem kleinen Supabase-Projekt (Postgres-
Datenbank), direkt aus dem Browser angebunden (kein eigener API-Server
nötig). Abgesichert über Supabase Row Level Security (RLS) statt über ein
Passwort im Code: der eingebettete „anon public"-Key ist bewusst öffentlich
— er darf laut Supabase-Design im Client-Code stehen, weil die RLS-Regeln
in der Datenbank selbst festlegen, was damit erlaubt ist (siehe
`supabase-setup.sql`). Zusätzlich serverseitig (per DB-Trigger)
abgesichert: Eingabe-Längen-Limits und ein einfaches Rate-Limit gegen Spam.

Zugangsdaten stehen bereits (fest verdrahtet) in `edm.html`:

```html
<script>
  window.HUK53_SUPABASE_URL = "https://vmjivwfieyfnlcejkktu.supabase.co";
  window.HUK53_SUPABASE_ANON_KEY = "sb_publishable_...";
</script>
```

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

## Lokal ansehen

Kein Build nötig — einfach `index.html` öffnen, oder z. B.:

```
npx serve .
```

## Deployment

Push auf `main` deployt automatisch via `.github/workflows/deploy-pages.yml`
auf GitHub Pages. Damit das funktioniert, muss in den Repo-Settings unter
**Pages** die Quelle einmalig auf „GitHub Actions“ gestellt werden.
