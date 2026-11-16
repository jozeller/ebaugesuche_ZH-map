# Project status

The project scrapes public eAuflage records from the Canton of Zurich, checks
their addresses, and displays the results in an interactive map.

## Current data snapshot

- The supplied portal export lists 65 municipalities.
- The latest build contains 249 records across those municipalities.
- 237 records have exact address coordinates; 12 remain without a map point.
- `data/baugesuche.json` duplicates the Stäfa dataset as the start page's
  initial data file; it is not an additional municipality.
- The map starts in Stäfa and uses the SwissTopo `ch.swisstopo.swissimage`
  WMS layer for aerial imagery.

## Main components

- `data/gemeinden.json`: shared municipality catalog
- `scripts/scraper.js`: portal data retrieval
- `scripts/geocoder.js`: exact address matching through geo.admin.ch
- `scripts/build-optimized.js`: per-municipality GeoJSON generation
- `index.html`: production map
- `frontend/index.html`: map served by the local development server

## Commands

```bash
npm start       # serve the local map
npm run update  # refresh and rebuild data from the portal
npm test        # run unit tests
```

See [STATUS.md](./STATUS.md) for the dated snapshot and
[GEOCODING.md](./GEOCODING.md) for coordinate rules.
