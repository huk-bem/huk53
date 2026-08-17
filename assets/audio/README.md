# Audio-Dateien

Referenziert in `assets/js/main.js` → `SONGS[].audioSrc`:

- ✅ `back-on-track.mp3` — live (Track „Back on Track")
- ✅ `sonar.mp3` — live (Track „Sonar")
- ⏳ `night-pulse.mp3` — noch nicht vorhanden → spielt automatisch eine kurze
  synthetisierte Vorschau-Loop im angegebenen BPM, bis eine echte Datei mit
  diesem Namen hier abgelegt wird.

Solange eine Datei hier fehlt, funktioniert der Player trotzdem (Demo-Loop
statt echtem Song). Sobald eine MP3 mit dem richtigen Dateinamen hier liegt,
wird sie beim nächsten Laden automatisch statt der Demo-Loop verwendet.

Empfehlung: MP3, 128–192 kbps, möglichst < 8 MB pro Track (schnelle
Ladezeit auf der Startseite). Die aktuell hinterlegten Dateien liegen bei
64 kbps — für bessere Klangqualität gerne durch eine höher aufgelöste
Version ersetzen (gleicher Dateiname reicht).
