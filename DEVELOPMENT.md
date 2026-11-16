# 👨‍💻 Development Guide

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/jozeller/ebaugesuche_ZH-map.git
cd ebaugesuche_ZH-map

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:8080
```

---

## Project Structure

```
ebaugesuche_ZH-map/
├── frontend/
│   └── index.html              # Main app (Mapbox GL)
├── scripts/
│   ├── scraper.js              # Offizielle Portal-API
│   ├── geocoder.js             # OSM geocoding
│   ├── build.js                # Build orchestration
│   └── server.js               # Dev/prod HTTP server
├── data/
│   ├── baugesuche.json         # Final GeoJSON (committed)
│   ├── gesuche-raw.json        # Raw scraped data (not committed)
│   └── gesuche-geocoded.json   # With coordinates (not committed)
├── .github/workflows/
│   └── daily-update.yml        # GitHub Actions workflow
├── README.md                   # Project overview
├── DEPLOYMENT.md               # Deployment guide
├── DEVELOPMENT.md              # This file
├── package.json
└── .gitignore
```

---

## Available Scripts

### Development
```bash
npm run dev          # Start local server on :8080
npm start            # Same as dev

npm run build        # Full: scrape + geocode + compile
npm run scrape       # Scrape portal only
npm run geocode      # Geocode raw data only
```

### Production
```bash
npm run update       # Alias for 'build' (used in CI/CD)
```

---

## Workflow: Local Development

### 1. Test with Sample Data (Quick)

```bash
npm run dev
# Visit http://localhost:8080
# Uses data/baugesuche.json (sample data included)
```

### 2. Full Build Cycle (with real scraping)

```bash
# Run complete build (all configured municipalities)
npm run build

# Or rebuild selected municipalities only:
npm run build -- bassersdorf stäfa

# This runs:
# 1. scripts/scraper.js
#    → Fetches /api/public/publications/v1/commune/{gemeinde}
#    → Saves to data/gesuche-raw-{gemeinde}.json
#
# 2. scripts/geocoder.js
#    → Geocodes addresses with OSM Nominatim
#    → Saves to data/gesuche-geocoded-{gemeinde}.json
#
# 3. scripts/build.js
#    → Combines data
#    → Exports GeoJSON to data/baugesuche_{gemeinde}.json

npm run dev
# Visit http://localhost:8080 with new data
```

---

## Debugging

### View Server Logs
```bash
# Terminal 1: Start server with debug output
DEBUG=* npm run dev

# Terminal 2: In another terminal, test endpoints
curl -v http://localhost:8080/
curl -v http://localhost:8080/data/baugesuche.json
```

### Browser Console
1. Open http://localhost:8080
2. Press F12 → Console
3. Check for errors
4. Common issues:
   - CORS errors (server should handle)
   - Missing data file
   - Mapbox GL initialization failed

### Scraper Debugging

```bash
# Run scraper only
node scripts/scraper.js

# View raw output
cat data/gesuche-raw.json | jq '.[:5]'

# Count results
cat data/gesuche-raw.json | jq 'length'
```

### Geocoder Debugging

```bash
# Run geocoder only
node scripts/geocoder.js

# Check success rate
cat data/gesuche-geocoded.json | jq '[.[] | select(.lat != null)] | length'
```

---

## Frontend Development

### Modifying the Map

Edit `frontend/index.html`:

**Change map style/tiles:**
```javascript
// In the initMap() function
const style = {
  // ... modify style definition
  // Try different tile providers
};
```

**Add custom markers:**
```javascript
// In addMarker() function
// Modify marker appearance, popup content, etc.
```

**Add custom controls:**
```javascript
// In map.on('load', ...)
// Add buttons, filters, info panels
```

### Styling

- Inline CSS in `<style>` tag (keep it simple)
- Responsive breakpoints at 768px
- Color scheme: Blue (#1976d2) + neutral

### Testing Map Features

1. **Zoom & Pan**: Click zoom buttons or scroll
2. **Marker Popups**: Click marker → should open popup
3. **Sidebar**: Click marker → sidebar should appear
4. **Geolocation**: Click "My Location" button
5. **Refresh**: Click "Refresh" button
6. **Fullscreen**: Click fullscreen button

---

## Modifying Data Flow

### 1. Scraper Changes

Edit `scripts/scraper.js`:

```javascript
// Change URL (different Gemeinde)
const PORTAL_URL = 'https://portal.ebaugesuche.zh.ch/eauflage/different-town';

// Modify selectors for different HTML structure
const rows = document.querySelectorAll('table tbody tr, .custom-row-class');

// Extract different fields
const addressField = cells[1];  // Adjust index based on HTML
```

### 2. Geocoder Changes

Edit `scripts/geocoder.js`:

```javascript
// Change rate limit (slower = safer, faster = riskier)
const DELAY_MS = 500;  // 0.5 seconds between requests

// Change search parameters
const params = new URLSearchParams({
  q: searchString,
  format: 'json',
  limit: 5,  // Get top 5 results instead of 1
  countrycodes: 'ch'
});
```

### 3. Data Format Changes

Edit `scripts/build.js`:

```javascript
// Modify GeoJSON structure
const finalData = {
  metadata: {
    // Add new fields here
    customField: 'value'
  },
  features: geocoded.map(g => ({
    // Modify feature structure
    geometry: { ... },
    properties: { ... }
  }))
};
```

Then update `frontend/index.html` to read new fields:

```javascript
// In addMarker() or showSidebar()
document.getElementById('custom-field').textContent = props.customField;
```

---

## Adding Multi-Gemeinde Support

### Step 1: Update Scraper
```javascript
const GEMEINDEN = [
  'stäfa',
  'meilen',
  'horgen',
  // Add more...
];

for (const gemeinde of GEMEINDEN) {
  const url = `https://portal.ebaugesuche.zh.ch/eauflage/${gemeinde}`;
  // Scrape each gemeinde
}
```

### Step 2: Filter in UI
```javascript
// In frontend/index.html
// Add gemeinde filter dropdown
// Filter markers by selected gemeinde
```

### Step 3: Update Workflow
- Modify `.github/workflows/daily-update.yml`
- Ensure data file stays manageable (> 10MB may cause issues)

---

## Testing

### Manual Testing Checklist
- [ ] Server starts without errors
- [ ] Sample data loads in browser
- [ ] Map displays with correct center/zoom
- [ ] Markers appear on map
- [ ] Clicking marker shows popup
- [ ] Clicking marker shows sidebar
- [ ] Links to detail pages work
- [ ] Geolocation button works
- [ ] Refresh button reloads data
- [ ] No console errors in F12
- [ ] Mobile responsive (F12 → mobile view)

### Automated Testing (Future)
```bash
npm install --save-dev jest puppeteer

# Create test files in tests/
# Run: npm test
```

---

## Performance Profiling

### Scraper Performance
```bash
time npm run scrape
# Check: ~1-2 sec per page, depends on network

time npm run geocode
# Check: ~1 hour for 100+ addresses (rate limited)
```

### Frontend Performance
- Open DevTools → Performance tab
- Check:
  - Time to load map
  - Time to render markers
  - Network requests (should cache)

### Optimization Tips
- Reduce data file size if > 1MB
- Lazy-load markers instead of rendering all at once
- Cache data locally (localStorage)
- Use Web Workers for geocoding

---

## Common Issues & Solutions

### Issue: "Cannot find module 'puppeteer'"
```bash
npm install puppeteer
```

### Issue: Scraper times out
- Increase timeout in `scraper.js`:
  ```javascript
  page.setDefaultNavigationTimeout(120000);  // 2 minutes
  ```
- Check if portal is down or slow

### Issue: "No data in map"
- Check if `data/baugesuche.json` exists
- Check if coordinates are valid (lat: 47.x, lon: 8.x for ZH)
- Open F12 Console for errors

### Issue: Geocoding returns no results
- Check address format
- Try manual search on OpenStreetMap.org
- Add logging to see which addresses fail

### Issue: Map doesn't load
- Check Mapbox GL CDN is accessible
- Try switching to OSM tiles
- Check browser console for errors

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/my-feature

# After review, merge to main
```

### Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (no logic change)
- `refactor:` - Refactoring
- `perf:` - Performance improvement
- `chore:` - Maintenance, dependency updates
- `ci:` - CI/CD changes

---

## Resources

- **Puppeteer Docs**: https://pptr.dev
- **Mapbox GL Docs**: https://docs.mapbox.com/mapbox-gl-js
- **Nominatim API**: https://nominatim.org/
- **GeoJSON Spec**: https://geojson.org
- **SwissTopo Tiles**: https://tile.osm.ch

---

## Need Help?

1. Check logs in terminal
2. View browser console (F12)
3. Search GitHub Issues
4. Open a new Issue with details:
   - Error message
   - Steps to reproduce
   - Environment (Node version, OS)
   - Logs output

---

**Happy coding!** 🚀
