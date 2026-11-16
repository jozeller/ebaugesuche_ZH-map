# Development

## Setup

```bash
npm install
npm start
```

The local server listens on port 8080 by default; set `PORT` to use another
port. It serves `frontend/index.html` and the contents of `data/`.

## Data pipeline

- `data/gemeinden.json` defines the current portal municipalities.
- `scripts/scraper.js` fetches portal publications and stores raw records.
- `scripts/geocoder.js` accepts only exact address matches in the requested
  municipality from the geo.admin.ch SearchServer.
- `scripts/build-optimized.js` writes one GeoJSON file per municipality and
  refreshes `data/baugesuche.json` as the Stäfa start file.

Run the complete refresh with `npm run update`. Do not substitute municipality
centers for missing address coordinates: records without exact matches use
`geometry: null` and remain visible in the unlocated-record list.

## Tests and checks

```bash
npm test
```

The tests cover address matching and portal-record parsing. When changing map
data or layer configuration, verify both map pages and confirm that the
municipality catalog, GeoJSON files, and SwissTopo WMS layer are still served.

See [GEOCODING.md](./GEOCODING.md) for address matching and
[STATUS.md](./STATUS.md) for the latest verified data snapshot.
