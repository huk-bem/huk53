# Audio-Dateien

Lege hier die drei echten Tracks ab, exakt unter diesen Dateinamen
(referenziert in `assets/js/main.js` → `SONGS[].audioSrc`):

- `night-pulse.mp3`
- `neon-rush.mp3`
- `overdrive.mp3`

Solange eine Datei hier fehlt, spielt die Seite automatisch eine kurze
synthetisierte Vorschau-Loop im passenden BPM ab (reines Demo-Feature,
kein echter Song) — der Player funktioniert also schon vor dem Upload.
Sobald eine MP3 mit dem richtigen Dateinamen hier liegt, wird sie beim
nächsten Laden automatisch statt der Demo-Loop verwendet.

Empfehlung: MP3, 128–192 kbps, möglichst < 8 MB pro Track (schnelle
Ladezeit auf der Startseite).
