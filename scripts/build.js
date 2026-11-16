const fs = require('fs');
const path = require('path');
const { scrapeGesuche } = require('./scraper');
const { geocodeGesuche } = require('./geocoder');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GEMEINDEN = [
  'adliswil',
  'affolternamalbis',
  'bassersdorf',
  'brütten',
  'bubikon',
  'buchs',
  'bülach',
  'dielsdorf',
  'dietlikon',
  'dübendorf',
  'dürnten',
  'egg',
  'elgg',
  'elsau',
  'fällanden',
  'glattfelden',
  'gossau',
  'greifensee',
  'hettlingen',
  'hinwil',
  'hochfelden',
  'horgen',
  'illnau-effretikon',
  'kilchberg',
  'küsnacht',
  'langnauamalbis',
  'maur',
  'meilen',
  'mönchaltorf',
  'neftenbach',
  'niederglatt',
  'oberglatt',
  'oberrieden',
  'obfelden',
  'oetwilanderlimmat',
  'opfikon',
  'ossingen',
  'pfungen',
  'pfäffikon',
  'rafz',
  'regensdorf',
  'richterswil',
  'russikon',
  'rümlang',
  'schlatt',
  'seegräben',
  'stadel',
  'steinmaur',
  'stäfa',
  'thalwil',
  'turbenthal',
  'uetikonamsee',
  'urdorf',
  'wald',
  'weiningen',
  'weisslingen',
  'wettswilamalbis',
  'wetzikon',
  'wila',
  'winterthur',
  'wädenswil',
  'zell',
  'zollikon',
  'zumikon',
  'zürich'
];

async function buildGemeinde(gemeinde) {
  console.log(`\n🏘️  Building for: ${gemeinde}`);
  console.log('═══════════════════════════════════════\n');

  try {
    // Step 1: Scrape
    console.log('Step 1: Scraping Baugesuche');
    const gesuche = await scrapeGesuche(gemeinde);

    if (gesuche.length === 0) {
      console.log(`⚠️  No Baugesuche found for ${gemeinde}`);
      return null;
    }

    // Step 2: Geocode
    console.log('Step 2: Geocoding Addresses');
    const geocoded = await geocodeGesuche(gemeinde);

    // Step 3: Prepare final data
    console.log('Step 3: Preparing Final Data');

    const finalData = {
      metadata: {
        updated: new Date().toISOString(),
        count: geocoded.length,
        successCount: geocoded.filter(g => g.lat !== null).length,
        gemeinde: gemeinde,
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

    const outputPath = path.join(DATA_DIR, `baugesuche_${gemeinde}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));

    console.log(`✅ Build complete for ${gemeinde}!`);
    console.log(`   📊 Total entries: ${geocoded.length}`);
    console.log(`   📍 Mapped entries: ${finalData.features.length}`);
    console.log(`   📁 Output: ${outputPath}`);

    return finalData;

  } catch (error) {
    console.error(`❌ Build failed for ${gemeinde}:`, error);
    return null;
  }
}

async function build() {
  console.log('🚀 Starting build process for all Gemeinden...\n');

  try {
    const results = {};
    
    for (const gemeinde of GEMEINDEN) {
      try {
        const result = await buildGemeinde(gemeinde);
        if (result) {
          results[gemeinde] = result;
        }
      } catch (error) {
        console.error(`❌ Error building ${gemeinde}:`, error.message);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 BUILD SUMMARY');
    console.log('═══════════════════════════════════════\n');
    
    for (const [gemeinde, data] of Object.entries(results)) {
      console.log(`✅ ${gemeinde}: ${data.features.length} entries`);
    }

    console.log(`\n🎉 Build complete! Processed ${Object.keys(results).length} Gemeinden\n`);
    return results;

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
