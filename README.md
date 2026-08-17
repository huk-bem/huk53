# HUK53

Künstler-/Studio-One-Pager für **HUK53** — gig-geladene, schnelle Dance-Tracks.
Startseite mit drei Songs (Player, Likes, Kommentare), Studio-Info und
Booking. Vollständig clientseitig (Vanilla HTML/CSS/JS), keine
Backend-Abhängigkeiten.

Veröffentlicht via GitHub Pages: https://huk-bem.github.io/huk53/

## Struktur

```
index.html              Startseite (Hero, Songs, About, Booking, Footer)
impressum.html          Impressum (Platzhalter für Firmendaten, siehe unten)
datenschutz.html        Datenschutzerklärung
assets/css/style.css    Design (Dark/Neon, minimal & poppig)
assets/css/legal.css    Zusatzstyles für Impressum/Datenschutz
assets/js/main.js       Player, Likes/Kommentare (localStorage), Animationen
assets/audio/           MP3-Dateien (siehe README dort für Status pro Track)
```

## Songs austauschen

Track-Titel, Genre, BPM sowie die Startwerte für Likes/Kommentare stehen
im `SONGS`-Array oben in `assets/js/main.js`. Aktuell live: **„Back on
Track"** und **„Sonar"** (`assets/audio/back-on-track.mp3` /
`sonar.mp3`). Der dritte Slot „Night Pulse" ist noch ein Platzhalter und
spielt bis zum Hochladen einer echten Datei eine kurze synthetisierte
Vorschau-Loop im Track-BPM ab. `bpm`/`genre` der beiden echten Tracks sind
grobe Schätzwerte — bei Bedarf in `main.js` auf die echten Werte anpassen.

## Impressum & Datenschutz

`impressum.html` und `datenschutz.html` sind verlinkt im Footer jeder
Seite. Die technischen Abschnitte in `datenschutz.html` (Hosting via
GitHub Pages, Google Fonts, localStorage für Likes/Kommentare, mailto-
Booking-Formular) beschreiben bereits korrekt, wie die Seite tatsächlich
funktioniert. **Vor dem echten Livegang unbedingt ausfüllen:** alle
`[Platzhalter]`-Stellen in beiden Dateien mit den rechtsverbindlichen
Angaben des Studios (Name/Rechtsform, Anschrift, Kontakt) — ein
unvollständiges Impressum ist in Deutschland abmahnfähig.

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
