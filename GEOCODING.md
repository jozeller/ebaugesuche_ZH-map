# Geocodierung - Adressen via OSM

## Status

Die Anwendung hat einen **vollständigen Workflow** für echte Geocodierung:

### Aktuell (Test-Daten)
- ✓ Adressen: Fantasie-Daten (Testdaten)
- ✓ Koordinaten: Manuell gesetzt, realistisch verteilt in den Gemeinden
- ✓ Format: GeoJSON mit [Longitude, Latitude]

### Echter Workflow (wenn aktiviert)

```
┌─────────────────────────────────────────────────────┐
│ 1. SCRAPER                                          │
│    Holt echte Daten von:                            │
│    https://portal.ebaugesuche.zh.ch/eauflage/{gemeinde} │
│    Output: gesuche-raw-{gemeinde}.json              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. GEOCODER (OSM/Nominatim)                         │
│    Geocodiert jede Adresse:                         │
│    Input:  "Hauptstrasse 42, Stäfa, Zurich"        │
│    Output: {lat: 47.244, lon: 8.681}                │
│    Rate-Limited: 1 req/sec                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. BUILD                                            │
│    Erstellt GeoJSON mit echten Koordinaten:         │
│    Output: baugesuche_{gemeinde}.json               │
│    Format: [longitude, latitude]  (GeoJSON-Standard)│
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 4. WEBAPP (MapLibre GL)                             │
│    Zeigt Marker auf der Karte:                      │
│    - Popup mit Adresse + Link zum Portal            │
│    - Sidebar mit Details                            │
└─────────────────────────────────────────────────────┘
```

## Adress-Format für OSM/Nominatim

```javascript
// Nominatim erwartet:
"Hauptstrasse 42, Stäfa, Zurich, Switzerland"

// Returns:
{
  "lat": "47.2445123",
  "lon": "8.6816234",
  "display_name": "Hauptstrasse, 42, Stäfa, Bezirk Meilen, Zurich, 8712, Switzerland"
}

// Wir speichern dann als GeoJSON (Standard):
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [8.6816234, 47.2445123]  // [LON, LAT] !!!
  },
  "properties": {
    "adresse": "Hauptstrasse 42, Stäfa",
    "displayName": "Hauptstrasse, 42, Stäfa, ..."
  }
}
```

## Koordinaten-Format

**WICHTIG: GeoJSON standard ist [Longitude, Latitude]**

```
❌ FALSCH: [47.244, 8.681]  (Lat, Lon)
✓ RICHTIG: [8.681, 47.244]  (Lon, Lat)
```

MapLibre GL erwartet immer [Lon, Lat]:
```javascript
marker.setLngLat([8.6816, 47.2445])  // ✓ Correct
```

## Scripts für echte Daten

```bash
# Scrape von Portal (eine Gemeinde)
npm run scrape  # scraper.js

# Geocode geraspelte Daten (eine Gemeinde)
npm run geocode  # geocoder.js

# Alles automatisch für alle Gemeinden
npm run build  # build.js (scrape + geocode + GeoJSON)

# Im Production
npm run update  # = npm run build
```

## OSM/Nominatim-Limitierungen

- **Rate Limit**: 1 Request/Sekunde (eingebaut)
- **Accuracy**: ±100m (häufig genauer)
- **Coverage**: ~99% in der Schweiz
- **Lizenz**: ODbL (Open Data)

## Aktuelle Test-Daten

Die aktuellen Daten sind **Fantasie-Adressen mit realistischen Koordinaten**:
- ✓ Echte Gemeinde-Zentren (Bundesamt für Landestopographie)
- ✓ Realistische Verteilung (±500m von Zentrum)
- ✓ Keine Marker im See
- ✓ Format korrekt

Zum Aktivieren von echten Daten:
```bash
npm run build
```

## Adress-Validierung

Vor Geocodierung wird geprüft:
1. Adresse nicht leer
2. Enthält Straße + Nummer
3. Gemeinde bekannt

Nicht-geocodierbare Adressen:
- Werden mit `lat: null, lon: null` gespeichert
- Erscheinen nicht auf der Karte
- Logged in der Build-Summary
