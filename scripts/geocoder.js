const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getCoordinates } = require('./gemeinden-coordinator');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DELAY_MS = 2000; // Rate limit: increased to 2 seconds to avoid 429 errors

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizePlace(place) {
  return place
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function geocodeAddress(address, gemeinde = 'Stäfa') {
  try {
    const searchString = `${address}, ${gemeinde}, Zürich, Switzerland`;
    
    const params = new URLSearchParams({
      q: searchString,
      format: 'json',
      addressdetails: '1',
      limit: 1,
      countrycodes: 'ch'
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'ebaugesuche-zh-map'
      }
    });

    if (!response.ok) {
      console.error(`  ❌ OSM API error: ${response.status}`);
      return null;
    }

    const results = await response.json();

    if (results.length === 0) {
      console.log(`  ⚠️  No results for: ${searchString}`);
      return null;
    }

    const result = results[0];
    const placeNames = Object.values(result.address || {})
      .filter(value => typeof value === 'string')
      .map(normalizePlace);
    if (!placeNames.includes(normalizePlace(gemeinde))) {
      console.error(`  ❌ Geocoding result is outside ${gemeinde}: ${result.display_name}`);
      return null;
    }

    const lat = Number(result.lat);
    const lon = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      console.error(`  ❌ Invalid coordinates for: ${searchString}`);
      return null;
    }

    return {
      lat,
      lon,
      displayName: result.display_name
    };

  } catch (error) {
    console.error(`  ❌ Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function geocodeGesuche(gemeinde = 'stäfa') {
  const inputFile = path.join(DATA_DIR, `gesuche-raw-${gemeinde}.json`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    console.log('   Run "npm run scrape" first');
    process.exit(1);
  }

  console.log('🔍 Loading Baugesuche from:', inputFile);
  const gesuche = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  console.log(`📍 Geocoding ${gesuche.length} addresses...\n`);

  // Get fallback coordinates from BFS
  const fallbackCoords = getCoordinates(gemeinde);

  const geocoded = [];
  let retryCount = 0;
  const maxRetries = 3;

  for (let i = 0; i < gesuche.length; i++) {
    const g = gesuche[i];
    console.log(`[${i + 1}/${gesuche.length}] ${g.adresse || 'N/A'}`);

    let coords = await geocodeAddress(g.adresse, g.gemeinde || gemeinde);

    // If geocoding fails and we have retries left, try again
    if (!coords && retryCount < maxRetries) {
      console.log(`  ⚠️  Retrying (${retryCount + 1}/${maxRetries})...`);
      retryCount++;
      await delay(3000); // longer delay before retry
      coords = await geocodeAddress(g.adresse, g.gemeinde || gemeinde);
      if (coords) retryCount = 0; // reset on success
    }

    // Fallback to BFS coordinates if Nominatim fails
    if (!coords && fallbackCoords) {
      console.log(`  📍 Using BFS fallback coordinates for ${gemeinde}`);
      coords = {
        lat: fallbackCoords[0],
        lon: fallbackCoords[1],
        displayName: `${gemeinde} (BFS center)`
      };
    }

    if (coords) {
      geocoded.push({
        ...g,
        lat: coords.lat,
        lon: coords.lon,
        displayName: coords.displayName
      });
    } else {
      geocoded.push({
        ...g,
        lat: null,
        lon: null,
        displayName: null
      });
    }

    // Rate limiting
    if (i < gesuche.length - 1) {
      await delay(DELAY_MS);
    }
  }

  // Save geocoded data
  const outputPath = path.join(DATA_DIR, `gesuche-geocoded-${gemeinde}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(geocoded, null, 2));

  const successCount = geocoded.filter(g => g.lat !== null).length;
  console.log(`\n✅ Geocoding complete for ${gemeinde}`);
  console.log(`   ✓ Successfully geocoded: ${successCount}/${gesuche.length}`);
  console.log(`   📁 Saved to: ${outputPath}`);

  return geocoded;
}

if (require.main === module) {
  geocodeGesuche();
}

module.exports = { geocodeGesuche, geocodeAddress };
