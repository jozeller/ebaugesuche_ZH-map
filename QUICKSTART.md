# Quick Start

## 🚀 Run the map locally

```bash
npm install
npm run dev
```

Open **http://localhost:8080**

The server serves `frontend/index.html` and the files under `data/`.

**Note:** The GUI redesign is now live on the `feature/gui-redesign` branch!
See `TESTING.md` for detailed testing instructions.

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
