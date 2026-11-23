# Baugesuche Zürich

> **🤖 KI-Hinweis:** Dieses Projekt wurde mit GitHub Copilot KI-generiert –
> einschliesslich Code und Dokumentation. Bitte prüfe den Code vor einem
> produktiven Einsatz und beachte die Nutzungsbedingungen des eAuflage-Portals.
> [Weitere Informationen zur KI-Generierung](./AI-GENERATED.md).

Interaktive Karte öffentlicher Baugesuche aus dem eAuflage-Portal des Kantons
Zürich. Die Portal-Liste in `data/gemeinden.json` ist die gemeinsame Quelle
für die aktuell 65 Gemeinden.

Die produktive GitHub-Pages-Seite verwendet [`index.html`](./index.html). Der
lokale Server (`npm start`) liefert [`frontend/index.html`](./frontend/index.html).
Beide Karten starten mit dem SwissTopo-Luftbild und zeigen die vollständige
Gemeindeliste; Stäfa ist die Startgemeinde.

## Daten und Koordinaten

Der Scraper lädt Veröffentlichungen aus dem offiziellen Portal. Adressen
werden mit dem geo.admin.ch SearchServer geprüft. Nur Treffer mit passender
Strasse, Hausnummer und Gemeinde erhalten einen Kartenpunkt. Nicht exakt
verortbare Fälle bleiben in den Daten und werden ohne falschen Ersatzpunkt
angezeigt. Details stehen in [GEOCODING.md](./GEOCODING.md).

## Lokal starten

```bash
npm install
npm start
```

Danach `http://localhost:8080` öffnen.

## Daten aktualisieren und Tests ausführen

```bash
npm run update
npm test
```

`npm run update` fragt das Portal für alle Gemeinden im Katalog ab und
aktualisiert die GeoJSON-Dateien. Die GitHub-Actions-Datei führt diesen
Aktualisierungslauf täglich aus und committet geänderte Datendateien.

## Wichtige Dateien

- `data/gemeinden.json`: Portal-Gemeindekatalog mit Slugs und Anzeigenamen
- `data/baugesuche_<slug>.json`: Veröffentlichungen je Gemeinde
- `data/baugesuche.json`: zusätzliche Startdatei für Stäfa
- `scripts/scraper.js`, `scripts/geocoder.js`: Portalimport und Adressprüfung
- `scripts/build-optimized.js`: gemeinsamer Datenaufbau
- `index.html`, `frontend/index.html`: produktive und lokale Kartenansicht
