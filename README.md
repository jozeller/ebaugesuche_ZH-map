# 🗺️ Baugesuche ZH - Interaktive Karte

Interaktive Karte der öffentlichen Baugesuche des Kantons Zürich, aktuell für Stäfa. Mit SwissTopo-Hintergrund, täglicher automatischer Aktualisierung und Links zu den offiziellen Baugesuch-Details.

**Live Demo:** [ebaugesuche-zh.github.io](https://jozeller.github.io/ebaugesuche_ZH-map)

> 🤖 **Dieses Projekt wurde vollständig von AI (GitHub Copilot) generiert.** Siehe [AI-GENERATED.md](./AI-GENERATED.md) für Details.

## 🚀 Features

- **Interaktive Karte** mit Mapbox GL / Leaflet
- **SwissTopo Kartenhintergrund** für präzise Lokalisierung
- **Tägliche Aktualisierung** via GitHub Actions
- **OSM Nominatim Geocoding** - Adressen → Koordinaten
- **Tooltips & Links** zu Baugesuch-Details
- **Responsive Design** - Desktop & Mobile
- **Offline-Ready** - Daten werden gecacht

## 📋 Anforderungen

- Node.js 18+
- npm

## 🛠️ Installation & Setup

```bash
# 1. Repository klonen
git clone https://github.com/jozeller/ebaugesuche_ZH-map.git
cd ebaugesuche_ZH-map

# 2. Dependencies installieren
npm install

# 3. Build starten (scrape + geocode + build)
npm run build
```

## 📊 Datenfluss

```
1. Scraper (Puppeteer)
   └─> Lädt https://portal.ebaugesuche.zh.ch/eauflage/stäfa
   └─> Extrakt: Nummer, Adresse, Bautyp, Datum

2. Geocoder (OSM Nominatim)
   └─> Konvertiert Adressen zu Koordinaten (lat/lon)
   └─> Rate-Limited: 1 req/sec

3. Builder
   └─> Kombiniert Daten
   └─> Exportiert als GeoJSON
   └─> Speichert in: data/baugesuche.json

4. Frontend (Mapbox GL)
   └─> Lädt baugesuche.json
   └─> Zeigt Marker auf Karte
   └─> Tooltips mit Details
```

## 🔄 Manuelle Aktualisierung

```bash
# Kompletter Build (scrape + geocode)
npm run build

# Nur scrapen
npm run scrape

# Nur geocoden
npm run geocode
```

## 📁 Dateistruktur

```
ebaugesuche_ZH-map/
├── frontend/
│   └── index.html          # Karten-Interface (Mapbox GL)
├── scripts/
│   ├── scraper.js          # Puppeteer: Portal scrapen
│   ├── geocoder.js         # OSM Geocoding
│   └── build.js            # Orchestrierung
├── data/
│   ├── gesuche-raw.json    # Ungefilterte Scrape-Daten
│   ├── gesuche-geocoded.json  # Mit Koordinaten
│   └── baugesuche.json     # GeoJSON (für Frontend)
├── .github/workflows/
│   └── daily-update.yml    # GitHub Actions Workflow
└── package.json
```

## 🗺️ Frontend

Die Frontend-Seite (`frontend/index.html`) zeigt:
- **Interaktive Karte** mit SwissTopo-Tiles
- **Marker** für jedes Baugesuch
- **Sidebar** mit Details beim Klick
- **Popup-Tooltips** bei Hover
- **Links** zu offiziellen Baugesuch-Seiten

### Features:
- 🔄 Manuelles Refresh der Daten
- 📍 Geolocation ("Mein Standort")
- 📱 Responsive auf Mobile
- ⏰ Zeitstempel der letzten Aktualisierung

## 🔄 Automatische Aktualisierung

GitHub Actions läuft täglich um **06:00 UTC** (08:00 CEST):
- Scrape, Geocoding, Build
- Committed Änderungen nach `data/baugesuche.json`
- Workflow kann manuell getriggert werden

Trigger im `.github/workflows/daily-update.yml`:
```yaml
on:
  schedule:
    - cron: '0 6 * * *'  # Täglich 06:00 UTC
  workflow_dispatch:     # Manuell triggerbar
```

## 🌍 Multi-Gemeinde Support (Zukunft)

Aktuell nur Stäfa, aber erweiterbar auf:
- Alle ZH Gemeinden
- Konfigurierbar via URL-Parameter

## 🔐 API Keys

- **Mapbox GL**: Optional (kostenlos bis zu einem Limit)
- **OSM Nominatim**: Kostenlos (rate-limited, ~1 req/sec)
- **SwissTopo**: Kostenlos (Bildkacheln)

## 📝 Lizenz

MIT

## 🤝 Beitragen

Gerne PRs für:
- Weitere Gemeinden
- Bessere Geocoding-Strategie
- UI/UX Verbesserungen
- Performance-Optimierungen

## 📧 Kontakt

Issues & Requests via GitHub Issues

---

**Hinweis**: Dieses Projekt scrape Daten vom offiziellen Portal `ebaugesuche.zh.ch` - respektiert deren ToS und rate limits.