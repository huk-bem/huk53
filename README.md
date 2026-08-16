# HUK53

Künstler-/Studio-One-Pager für **HUK53** — gig-geladene, schnelle Dance-Tracks.
Startseite mit drei Songs (Player, Likes, Kommentare), Studio-Info und
Booking. Vollständig clientseitig (Vanilla HTML/CSS/JS), keine
Backend-Abhängigkeiten.

Veröffentlicht via GitHub Pages: https://huk-bem.github.io/huk53/

## Struktur

```
index.html              Seite (Hero, Songs, About, Booking, Footer)
assets/css/style.css    Design (Dark/Neon, minimal & poppig)
assets/js/main.js       Player, Likes/Kommentare (localStorage), Animationen
assets/audio/           Ablageort für die echten MP3-Dateien (siehe README dort)
```

## Songs austauschen

Track-Titel, Genre, BPM sowie die Startwerte für Likes/Kommentare stehen
im `SONGS`-Array oben in `assets/js/main.js`. Solange unter
`assets/audio/<name>.mp3` keine Datei liegt, spielt der Player automatisch
eine kurze synthetisierte Vorschau-Loop im Track-BPM ab — die Seite ist
also sofort funktionsfähig, auch ohne fertige Audiodateien.

## Feedback-Spalte (Likes & Kommentare)

Likes und Kommentare pro Song werden aktuell **lokal im Browser der
jeweiligen Besucher:in** gespeichert (`localStorage`) — es gibt bewusst
keinen Server. Für ein Feedback-Board, das für alle Besucher:innen
gemeinsam sichtbar ist, muss `assets/js/main.js` an ein Backend oder
einen Formular-Service (z. B. eine kleine API, Supabase, Firebase o. Ä.)
angebunden werden.

## Booking

Das Booking-Formular öffnet aktuell einen vorausgefüllten `mailto:`-Link
an `booking@huk53.de` (Platzhalter in `assets/js/main.js`, `bookingForm`
Handler) — bitte durch die echte Booking-Adresse ersetzen. Instagram/
SoundCloud/YouTube-Links im Booking-Bereich von `index.html` sind
ebenfalls Platzhalter.

## Lokal ansehen

Kein Build nötig — einfach `index.html` öffnen, oder z. B.:

```
npx serve .
```

## Deployment

Push auf `main` deployt automatisch via `.github/workflows/deploy-pages.yml`
auf GitHub Pages. Damit das funktioniert, muss in den Repo-Settings unter
**Pages** die Quelle einmalig auf „GitHub Actions“ gestellt werden.
