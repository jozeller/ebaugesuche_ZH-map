#!/usr/bin/env node
/**
 * Master build script for all 66 ZH municipalities
 * Scrapes, geocodes, and builds the complete dataset
 */

const fs = require('fs');
const path = require('path');
const { scrapeGesuche } = require('./scraper');
const { geocodeGesuche } = require('./geocoder');

const DATA_DIR = path.join(__dirname, '..', 'data');

// All 66 municipalities in the portal
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
  'erlenbach',
  'fällanden',
  'glattfelden',
  'gossau',
  'greifensee',
  'herrliberg',
  'hettlingen',
  'hinwil',
  'hochfelden',
  'hombrechtikon',
  'horgen',
  'illnau-effretikon',
  'kilchberg',
  'küsnacht',
  'langnauamalbis',
  'maur',
  'meilen',
  'männedorf',
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
  'rüschlikon',
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

console.log('🏗️  Master Build Script - All 66 ZH Municipalities\n');
console.log('═══════════════════════════════════════════════════════\n');

async function buildGemeinde(gemeinde, index) {
  const progress = `[${index}/${GEMEINDEN.length}]`;
  console.log(`${progress} Processing: ${gemeinde.padEnd(20)} `, '');
  
  try {
    // Step 1: Scrape
    console.log('scraping... ');
    const scrapedData = await scrapeGesuche(gemeinde);
    
    // Step 2: Geocode
    console.log('geocoding... ');
    const geocoded = await geocodeGesuche(gemeinde);
    
    // Step 3: Build final data
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
    
    console.log(`✅ done (${finalData.features.length} entries)\n`);
    return finalData;
  } catch (error) {
    console.log(`❌ failed: ${error.message}\n`);
    return null;
  }
}

async function buildAll() {
  console.log(`Starting build for ${GEMEINDEN.length} municipalities...\n`);
  
  const results = {};
  const failures = [];
  const startTime = Date.now();

  for (let i = 0; i < GEMEINDEN.length; i++) {
    const result = await buildGemeinde(GEMEINDEN[i], i + 1);
    if (result) {
      results[GEMEINDEN[i]] = result;
    } else {
      failures.push(GEMEINDEN[i]);
    }
  }

  const duration = (Date.now() - startTime) / 1000;

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 BUILD SUMMARY\n');
  
  const totalEntries = Object.values(results).reduce((sum, r) => sum + r.metadata.count, 0);
  const totalMapped = Object.values(results).reduce((sum, r) => sum + r.features.length, 0);
  
  console.log(`✅ Successful: ${Object.keys(results).length}/${GEMEINDEN.length} municipalities`);
  console.log(`📍 Total entries: ${totalEntries}`);
  console.log(`🗺️  Mapped entries: ${totalMapped}`);
  console.log(`⏱️  Duration: ${(duration/60).toFixed(1)} minutes\n`);

  if (failures.length > 0) {
    console.log(`❌ Failed: ${failures.join(', ')}\n`);
  }

  // Create main baugesuche.json for Stäfa (default)
  if (results['stäfa']) {
    const stäfaPath = path.join(DATA_DIR, 'baugesuche.json');
    fs.writeFileSync(stäfaPath, JSON.stringify(results['stäfa'], null, 2));
    console.log(`📌 Default Stäfa data written to: ${stäfaPath}`);
  }

  console.log('\n✨ Build complete!\n');
  
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  buildAll().catch(error => {
    console.error('❌ Critical error:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildAll, GEMEINDEN };
