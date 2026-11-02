# Ausgaben

Minimalistischer Ausgaben- und Einnahmentracker als PWA. Eine einzige HTML-Datei, keine Abhängigkeiten. Alle Daten bleiben lokal im Browser.

## Lokal starten

```bash
node serve.mjs
```

Dann `http://localhost:5173` in Chrome öffnen. Über das Installieren-Symbol in der Adressleiste lässt sich die App installieren.

## Dateien

- `index.html`: die komplette App
- `sw.js`: Service Worker für Offline-Betrieb (bei Änderungen `VERSION` hochzählen)
- `manifest.webmanifest`, `icon*.png`, `icon.svg`: PWA-Manifest und Icons
- `tools/gen-icons.mjs`: erzeugt die Icons neu
- `serve.mjs`: kleiner lokaler Server zum Entwickeln
