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

## Jazz-Seite (`jazz.html`)

Referenziert in `assets/js/jazz.js` → `JAZZ_TRACKS[].audioSrc`. Alle fünf
noch als Platzhalter (Demo-Loop), bis die echten Dateien hier liegen:

- ⏳ `jazz-blue-hour.mp3` — „Blue Hour"
- ⏳ `jazz-midnight-sax.mp3` — „Midnight Sax"
- ⏳ `jazz-velvet-keys.mp3` — „Velvet Keys"
- ⏳ `jazz-smoky-room.mp3` — „Smoky Room"
- ⏳ `jazz-autumn-stroll.mp3` — „Autumn Stroll"

Wichtig: Die Vorschau ist dort hart auf **30 Sekunden gedeckelt** (danach
stoppt die Wiedergabe endgültig und die Apple-Music-/Spotify-Buttons
erscheinen) — auch wenn die echte MP3-Datei länger ist, spielt sie nur die
ersten 30 Sekunden.

Empfehlung: MP3, 128–192 kbps, möglichst < 8 MB pro Track (schnelle
Ladezeit auf der Startseite). Die aktuell hinterlegten Dateien liegen bei
64 kbps — für bessere Klangqualität gerne durch eine höher aufgelöste
Version ersetzen (gleicher Dateiname reicht).
