const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DELAY_MS = 1000; // Rate limit: 1 request per second

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address, gemeinde = 'Stäfa') {
  try {
    // Build search string with city context
    const searchString = `${address}, ${gemeinde}, Zürich, Switzerland`;
    
    const params = new URLSearchParams({
      q: searchString,
      format: 'json',
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
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name
    };

  } catch (error) {
    console.error(`  ❌ Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function geocodeGesuche(gesuchePath = null) {
  const inputFile = gesuchePath || path.join(DATA_DIR, 'gesuche-raw.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    console.log('   Run "npm run scrape" first');
    process.exit(1);
  }

  console.log('🔍 Loading Baugesuche from:', inputFile);
  const gesuche = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  console.log(`📍 Geocoding ${gesuche.length} addresses...\n`);

  const geocoded = [];
  for (let i = 0; i < gesuche.length; i++) {
    const g = gesuche[i];
    console.log(`[${i + 1}/${gesuche.length}] ${g.adresse || 'N/A'}`);

    const coords = await geocodeAddress(g.adresse, g.gemeinde);

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
  const outputPath = path.join(DATA_DIR, 'gesuche-geocoded.json');
  fs.writeFileSync(outputPath, JSON.stringify(geocoded, null, 2));

  const successCount = geocoded.filter(g => g.lat !== null).length;
  console.log(`\n✅ Geocoding complete`);
  console.log(`   ✓ Successfully geocoded: ${successCount}/${gesuche.length}`);
  console.log(`   📁 Saved to: ${outputPath}`);

  return geocoded;
}

if (require.main === module) {
  geocodeGesuche();
}

module.exports = { geocodeGesuche, geocodeAddress };
