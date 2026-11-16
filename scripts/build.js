const fs = require('fs');
const path = require('path');
const { scrapeGesuche } = require('./scraper');
const { geocodeGesuche } = require('./geocoder');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function build() {
  console.log('🚀 Starting build process...\n');

  try {
    // Step 1: Scrape
    console.log('═══════════════════════════════════════');
    console.log('Step 1: Scraping Baugesuche');
    console.log('═══════════════════════════════════════\n');
    
    const gesuche = await scrapeGesuche();

    if (gesuche.length === 0) {
      console.log('⚠️  No Baugesuche found!');
      process.exit(1);
    }

    // Step 2: Geocode
    console.log('\n═══════════════════════════════════════');
    console.log('Step 2: Geocoding Addresses');
    console.log('═══════════════════════════════════════\n');
    
    const geocoded = await geocodeGesuche();

    // Step 3: Prepare final data
    console.log('\n═══════════════════════════════════════');
    console.log('Step 3: Preparing Final Data');
    console.log('═══════════════════════════════════════\n');

    const finalData = {
      metadata: {
        updated: new Date().toISOString(),
        count: geocoded.length,
        successCount: geocoded.filter(g => g.lat !== null).length,
        gemeinde: 'Stäfa',
        source: 'https://portal.ebaugesuche.zh.ch/'
      },
      features: geocoded
        .filter(g => g.lat !== null && g.lon !== null)
        .map(g => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [g.lon, g.lat]
          },
          properties: {
            nummer: g.nummer,
            adresse: g.adresse,
            gemeinde: g.gemeinde,
            bautyp: g.bautyp,
            datum: g.datum,
            detailUrl: g.detailUrl,
            displayName: g.displayName
          }
        }))
    };

    const outputPath = path.join(DATA_DIR, 'baugesuche.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));

    console.log(`✅ Build complete!`);
    console.log(`   📊 Total entries: ${geocoded.length}`);
    console.log(`   📍 Mapped entries: ${finalData.features.length}`);
    console.log(`   🗓️  Updated: ${finalData.metadata.updated}`);
    console.log(`   📁 Output: ${outputPath}\n`);

    return finalData;

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
