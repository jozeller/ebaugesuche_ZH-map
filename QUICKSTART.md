# Quick start

## Run the map locally

```bash
npm install
npm start
```

Open `http://localhost:8080`. The local server serves `frontend/index.html`
and the files under `data/`.

## Refresh portal data

```bash
npm run update
```

This fetches the municipalities listed in `data/gemeinden.json`, checks
addresses with the geo.admin.ch SearchServer, and rebuilds per-municipality
GeoJSON. Records without an exact address match remain in the data without a
map point. See [GEOCODING.md](./GEOCODING.md) for the matching rules.

## Run tests

```bash
npm test
```

The production GitHub Pages page is the repository-root `index.html`. The
development server uses `frontend/index.html`.
