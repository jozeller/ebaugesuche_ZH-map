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
│    Holt echte Daten vom Portal-API:                 │
│    /api/public/publications/v1/commune/{gemeinde}   │
│    Output: gesuche-raw-{gemeinde}.json              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. GEOCODER (OSM/Nominatim)                         │
│    Geocodiert jede Adresse:                         │
│    Input:  "Rainstrasse 67, 8712 Stäfa"             │
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
# Scrape von Portal (eine oder mehrere Gemeinden)
npm run scrape -- bassersdorf stäfa

# Geocode geraspelte Daten (eine Gemeinde)
npm run geocode  # geocoder.js

# Alles automatisch für ausgewählte Gemeinden
npm run build -- bassersdorf stäfa

# Ohne Argumente werden alle konfigurierten Gemeinden verarbeitet.
npm run build

# Im Production
npm run update  # = npm run build
```

## OSM/Nominatim-Limitierungen

- **Rate Limit**: 1 Request/Sekunde (eingebaut)
- **Accuracy**: ±100m (häufig genauer)
- **Coverage**: ~99% in der Schweiz
- **Lizenz**: ODbL (Open Data)
- **Gemeindeprüfung**: Ergebnisse ohne passenden Orts-/Gemeindenamen werden nicht als Marker übernommen.

## Datenstatus

Der Scraper lädt veröffentlichte Einträge aus der offiziellen eAuflage-API. Nicht
gefundene oder einer anderen Gemeinde zugeordnete Geocoding-Ergebnisse werden
nicht als Kartenmarker ausgegeben.

Gezielter Neuaufbau:
```bash
npm run build -- bassersdorf stäfa
```

## Adress-Validierung

Vor der Geocodierung wird die Gemeinde aus dem Portal-Datensatz übernommen. Die
Nominatim-Antwort muss zusätzlich einen passenden Orts- oder Gemeindenamen und
gültige Koordinaten enthalten.

Nicht-geocodierbare Adressen:
- Werden mit `lat: null, lon: null` gespeichert
- Erscheinen nicht auf der Karte
- Werden in der Ausgabe protokolliert
