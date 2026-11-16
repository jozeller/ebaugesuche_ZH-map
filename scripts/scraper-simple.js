const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const GEMEINDEN = [
  'adliswil', 'affolternamalbis', 'bassersdorf', 'brütten', 'bubikon', 'buchs', 'bülach',
  'dielsdorf', 'dietlikon', 'dübendorf', 'dürnten', 'egg', 'elgg', 'elsau', 'fällanden',
  'glattfelden', 'gossau', 'greifensee', 'hettlingen', 'hinwil', 'hochfelden', 'horgen',
  'illnau-effretikon', 'kilchberg', 'küsnacht', 'langnauamalbis', 'maur', 'meilen',
  'mönchaltorf', 'neftenbach', 'niederglatt', 'oberglatt', 'oberrieden', 'obfelden',
  'oetwilanderlimmat', 'opfikon', 'ossingen', 'pfungen', 'pfäffikon', 'rafz', 'regensdorf',
  'richterswil', 'russikon', 'rümlang', 'schlatt', 'seegräben', 'stadel', 'steinmaur',
  'stäfa', 'thalwil', 'turbenthal', 'uetikonamsee', 'urdorf', 'wald', 'weiningen',
  'weisslingen', 'wettswilamalbis', 'wetzikon', 'wila', 'winterthur', 'wädenswil',
  'zell', 'zollikon', 'zumikon', 'zürich'
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function scrapeGemeindeAPI(gemeinde) {
  return new Promise((resolve) => {
    const url = `https://portal.ebaugesuche.zh.ch/api/public/v1/baugesuch?search_form=1&municipality=${gemeinde}&page=1&per_page=100`;
    
    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          console.error(`Error parsing JSON for ${gemeinde}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.error(`Error fetching ${gemeinde}:`, err.message);
      resolve(null);
    });
  });
}

async function createGeoJSON(gemeinde, data) {
  if (!data || !data.data) return null;
  
  const features = data.data.map(item => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [parseFloat(item.lng || 8.5), parseFloat(item.lat || 47.3)]
    },
    properties: {
      nummer: item.reference_number || '',
      adresse: item.address || '',
      gemeinde: item.municipality || gemeinde,
      bautyp: item.construction_type || '',
      datum: item.publication_date || '',
      detailUrl: item.url || `https://portal.ebaugesuche.zh.ch/baugesuch/${item.id}`,
      displayName: item.address || ''
    }
  }));

  return {
    metadata: {
      updated: new Date().toISOString(),
      count: data.data.length,
      successCount: features.length,
      gemeinde: gemeinde,
      source: 'https://portal.ebaugesuche.zh.ch/'
    },
    features: features
  };
}

async function build() {
  console.log('🚀 Starting scraper (simple mode)...\n');
  
  for (const gemeinde of GEMEINDEN) {
    try {
      console.log(`📍 Scraping ${gemeinde}...`);
      const data = await scrapeGemeindeAPI(gemeinde);
      
      if (data && data.data) {
        const geoJSON = await createGeoJSON(gemeinde, data);
        const outputPath = path.join(DATA_DIR, `baugesuche_${gemeinde}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
        console.log(`✅ ${gemeinde}: ${data.data.length} entries`);
      } else {
        console.log(`⚠️  ${gemeinde}: No data or API error`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error processing ${gemeinde}:`, error.message);
    }
  }
  
  console.log('\n✅ Scraping complete!');
}

build().catch(console.error);
