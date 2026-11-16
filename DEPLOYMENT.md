# Deployment

## GitHub Pages

The production map is the repository-root `index.html`; data is read from the
repository-root `data/` directory. In repository settings, enable Pages from
the `main` branch and the `/(root)` folder.

The workflow in `.github/workflows/daily-update.yml` refreshes portal data
daily at 06:00 UTC and commits changes to the data files. It can also be run
manually from the Actions tab. Confirm that the Actions token has permission
to write repository contents. The workflow uses Node.js 24 and `npm ci` with
the committed lockfile; it does not download a browser.

GitHub documents that commits pushed with `GITHUB_TOKEN` may not trigger a
branch-based Pages build. On 2026-11-16, this repository's update run did
trigger a Pages build, and the published data matched the new commit. Check
the Pages deployment and live data after updates if publication stops.

## Other static hosts

Deploy the repository root, not the `frontend/` directory, so the production
`index.html` and `data/` files are both published. No frontend build command
is needed. To refresh data before deploying, run `npm run update` in an
environment with Node.js and network access to the portal and geo.admin.ch.

## Self-hosting

```bash
npm install
npm start
```

The local server serves `frontend/index.html` and the files in `data/` on port
8080. Set `PORT` to change the port. Run the server behind a reverse proxy for
public access.

## Troubleshooting

- **Missing municipality data:** check the relevant `data/baugesuche_<slug>.json`
  file and that the municipality exists in `data/gemeinden.json`.
- **Some records have no marker:** these cases had no exact address match.
  They remain visible in the unlocated-record list; no municipality-center
  coordinate is substituted.
- **Aerial imagery does not load:** verify that the browser can access the
  SwissTopo WMS layer `ch.swisstopo.swissimage`.
- **Update workflow cannot push:** grant the GitHub Actions token permission
  to write repository contents in the repository's Actions settings.
