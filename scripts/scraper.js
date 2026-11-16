const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PORTAL_URL = 'https://portal.ebaugesuche.zh.ch';
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

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function mapPublication(publication, gemeinde) {
  const municipality = publication.activity?.construction?.commune?.name;
  const street = publication.streetConstruction?.trim();
  const number = publication.streetNumberConstruction?.trim();
  const address = [street, number && !street?.split(/\s+/).includes(number) ? number : null,
    publication.zipCodeConstruction, publication.cityConstruction]
    .filter(Boolean)
    .join(' ');

  if (!publication.id || !municipality || !address) {
    throw new Error(`Invalid publication record returned for ${gemeinde}`);
  }

  return {
    nummer: String(publication.id),
    adresse: address,
    gemeinde: municipality,
    bautyp: publication.title || '',
    datum: publication.publicationFrom
      ? new Date(publication.publicationFrom).toISOString().slice(0, 10)
      : '',
    detailUrl: `${PORTAL_URL}/eauflage/detail/${publication.id}`
  };
}

async function scrapeGesuche(gemeinde = 'stäfa') {
  const url = `${PORTAL_URL}/api/public/publications/v1/commune/${encodeURIComponent(gemeinde)}`;
  console.log(`🔄 Fetching portal API for ${gemeinde}: ${url}`);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    timeout: 30000
  });

  if (!response.ok) {
    throw new Error(`Portal API returned HTTP ${response.status} for ${gemeinde}`);
  }

  const publications = await response.json();
  if (!Array.isArray(publications)) {
    throw new Error(`Portal API returned an invalid response for ${gemeinde}`);
  }

  const gesuche = publications.map(publication => mapPublication(publication, gemeinde));
  const outputPath = path.join(DATA_DIR, `gesuche-raw-${gemeinde}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(gesuche, null, 2));
  console.log(`✅ Retrieved ${gesuche.length} Baugesuche for ${gemeinde}`);
  console.log(`📁 Saved to: ${outputPath}`);

  return gesuche;
}

function parseGemeinden(args) {
  if (args.length === 0) return GEMEINDEN;
  const unknown = args.filter(gemeinde => !GEMEINDEN.includes(gemeinde));
  if (unknown.length > 0) {
    throw new Error(`Unknown Gemeinde(s): ${unknown.join(', ')}`);
  }
  return args;
}

if (require.main === module) {
  (async () => {
    const gemeinden = parseGemeinden(process.argv.slice(2));
    for (const gemeinde of gemeinden) {
      await scrapeGesuche(gemeinde);
    }
  })().catch(error => {
    console.error('❌ Scraping failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { scrapeGesuche, mapPublication, GEMEINDEN, parseGemeinden };
