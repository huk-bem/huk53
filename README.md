# HUK FUSION EDM

Künstlerseite für **HUK FUSION EDM** — Dance- und EDM-Produktionen aus dem
HUK53-Studio, mit Crossover- und Fusion-Elementen. One-Pager mit sechs
Tracks (Player, Likes, Kommentare) und Studio-Info. Vollständig
clientseitig (Vanilla HTML/CSS/JS), keine Backend-Abhängigkeiten.

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
assets/js/main.js       Player, Likes/Kommentare (localStorage), Animationen
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
Seite. Die technischen Abschnitte in `datenschutz.html` (Hosting via
GitHub Pages, Google Fonts, localStorage für Likes/Kommentare) beschreiben
bereits korrekt, wie die Seite tatsächlich funktioniert. **Vor dem echten
Livegang unbedingt ausfüllen:** alle `[Platzhalter]`-Stellen in beiden
Dateien mit den rechtsverbindlichen Angaben des Studios (Name/Rechtsform,
Anschrift, Kontakt) — ein unvollständiges Impressum ist in Deutschland
abmahnfähig.

## Feedback-Spalte (Likes & Kommentare)

Likes und Kommentare pro Song werden aktuell **lokal im Browser der
jeweiligen Besucher:in** gespeichert (`localStorage`) — es gibt bewusst
keinen Server. Für ein Feedback-Board, das für alle Besucher:innen
gemeinsam sichtbar ist, muss `assets/js/main.js` an ein Backend oder
einen Formular-Service (z. B. eine kleine API, Supabase, Firebase o. Ä.)
angebunden werden.

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
