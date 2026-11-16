#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scrapeGesuche, GEMEINDEN } = require('./scraper');
const { geocodeGesuche } = require('./geocoder');

const DATA_DIR = path.join(__dirname, '..', 'data');

function toFeature(gesuch) {
  const located = Number.isFinite(gesuch.lat) && Number.isFinite(gesuch.lon);
  return {
    type: 'Feature',
    geometry: located
      ? { type: 'Point', coordinates: [gesuch.lon, gesuch.lat] }
      : null,
    properties: {
      nummer: gesuch.nummer,
      adresse: gesuch.adresse,
      gemeinde: gesuch.gemeinde,
      bautyp: gesuch.bautyp,
      datum: gesuch.datum,
      detailUrl: gesuch.detailUrl,
      displayName: gesuch.displayName
    }
  };
}

async function buildGemeinde(gemeinde) {
  await scrapeGesuche(gemeinde);
  const gesuche = await geocodeGesuche(gemeinde);
  const features = gesuche.map(toFeature);
  const successCount = features.filter(feature => feature.geometry).length;

  const data = {
    metadata: {
      updated: new Date().toISOString(),
      count: features.length,
      successCount,
      unmappedCount: features.length - successCount,
      gemeinde,
      source: 'https://portal.ebaugesuche.zh.ch/',
      geocodingSource: 'SwissTopo SearchServer (exact address matches only)'
    },
    features
  };

  const outputPath = path.join(DATA_DIR, `baugesuche_${gemeinde}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ ${gemeinde}: ${features.length} records, ${successCount} exact address matches`);
  return data;
}

async function buildAll() {
  const failed = [];
  let totalRecords = 0;
  let totalLocated = 0;

  console.log(`🏗️ Building data for ${GEMEINDEN.length} portal municipalities`);
  for (const gemeinde of GEMEINDEN) {
    try {
      const data = await buildGemeinde(gemeinde);
      totalRecords += data.metadata.count;
      totalLocated += data.metadata.successCount;
      if (gemeinde === 'stäfa') {
        fs.writeFileSync(path.join(DATA_DIR, 'baugesuche.json'), JSON.stringify(data, null, 2));
      }
    } catch (error) {
      failed.push({ gemeinde, error: error.message });
      console.error(`❌ ${gemeinde}: ${error.message}`);
    }
  }

  console.log(`\nBuild summary: ${GEMEINDEN.length - failed.length}/${GEMEINDEN.length} communes completed`);
  console.log(`Records: ${totalRecords}; exact address matches: ${totalLocated}`);
  if (failed.length) {
    throw new Error(`Build failed for ${failed.map(item => item.gemeinde).join(', ')}`);
  }
}

if (require.main === module) {
  buildAll().catch(error => {
    console.error('❌ Build failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildAll, buildGemeinde, toFeature };
