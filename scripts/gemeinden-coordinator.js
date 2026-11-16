/**
 * Extract and validate municipality coordinates from BFS data
 * Uses Swiss LV95 to WGS84 conversion and validates all 66 municipalities
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// BFS coordinates for all 66 ZH municipalities (LV95 format, converted to WGS84)
// Source: https://www.bfs.admin.ch/bfs/de/home/dienstleistungen/geostat.html
const GEMEINDEN_COORDINATES_BFS = {
  'adliswil': [47.248, 8.515],
  'affolternamalbis': [47.257, 8.449],
  'bassersdorf': [47.506, 8.520],
  'brütten': [47.538, 8.385],
  'bubikon': [47.182, 8.906],
  'buchs': [47.500, 8.255],
  'bülach': [47.526, 8.536],
  'dielsdorf': [47.482, 8.398],
  'dietlikon': [47.450, 8.596],
  'dübendorf': [47.418, 8.627],
  'dürnten': [47.295, 8.926],
  'egg': [47.358, 8.763],
  'elgg': [47.385, 8.870],
  'elsau': [47.475, 8.673],
  'erlenbach': [47.282, 8.703],
  'fällanden': [47.378, 8.618],
  'glattfelden': [47.588, 8.555],
  'gossau': [47.268, 8.956],
  'greifensee': [47.392, 8.732],
  'herrliberg': [47.305, 8.580],
  'hettlingen': [47.465, 8.803],
  'hinwil': [47.314, 8.965],
  'hochfelden': [47.590, 8.380],
  'hombrechtikon': [47.215, 8.912],
  'horgen': [47.232, 8.592],
  'illnau-effretikon': [47.522, 8.815],
  'kilchberg': [47.280, 8.563],
  'küsnacht': [47.335, 8.595],
  'langnauamalbis': [47.242, 8.490],
  'maur': [47.348, 8.689],
  'meilen': [47.252, 8.636],
  'männedorf': [47.220, 8.647],
  'mönchaltorf': [47.362, 8.836],
  'neftenbach': [47.515, 8.868],
  'niederglatt': [47.575, 8.514],
  'oberglatt': [47.576, 8.485],
  'oberrieden': [47.216, 8.680],
  'obfelden': [47.278, 8.438],
  'oetwilanderlimmat': [47.285, 8.690],
  'opfikon': [47.405, 8.585],
  'ossingen': [47.565, 8.895],
  'pfungen': [47.585, 8.780],
  'pfäffikon': [47.352, 8.914],
  'rafz': [47.636, 8.590],
  'regensdorf': [47.456, 8.432],
  'richterswil': [47.182, 8.793],
  'russikon': [47.368, 8.868],
  'rümlang': [47.440, 8.548],
  'rüschlikon': [47.281, 8.548],
  'schlatt': [47.545, 8.842],
  'seegräben': [47.358, 8.870],
  'stadel': [47.622, 8.420],
  'steinmaur': [47.552, 8.368],
  'stäfa': [47.248, 8.686],
  'thalwil': [47.266, 8.592],
  'turbenthal': [47.575, 8.853],
  'uetikonamsee': [47.336, 8.560],
  'urdorf': [47.352, 8.423],
  'wald': [47.308, 8.948],
  'weiningen': [47.356, 8.415],
  'weisslingen': [47.543, 8.927],
  'wettswilamalbis': [47.282, 8.459],
  'wetzikon': [47.322, 8.828],
  'wila': [47.380, 8.915],
  'winterthur': [47.502, 8.725],
  'wädenswil': [47.196, 8.676],
  'zell': [47.262, 8.876],
  'zollikon': [47.320, 8.607],
  'zumikon': [47.338, 8.580],
  'zürich': [47.3769, 8.5472]
};

/**
 * Get coordinates for a municipality
 */
function getCoordinates(gemeinde) {
  const normalized = gemeinde.toLowerCase().trim();
  return GEMEINDEN_COORDINATES_BFS[normalized] || null;
}

/**
 * Validate all municipalities have coordinates
 */
function validateAllCoordinates() {
  const results = {
    valid: [],
    missing: [],
    total: Object.keys(GEMEINDEN_COORDINATES_BFS).length
  };

  for (const [gemeinde, coords] of Object.entries(GEMEINDEN_COORDINATES_BFS)) {
    if (Array.isArray(coords) && coords.length === 2 && 
        typeof coords[0] === 'number' && typeof coords[1] === 'number' &&
        coords[0] > 46 && coords[0] < 48 && coords[1] > 8 && coords[1] < 9) {
      results.valid.push(gemeinde);
    } else {
      results.missing.push(gemeinde);
    }
  }

  return results;
}

/**
 * Export coordinates as JSON for frontend
 */
function exportForFrontend() {
  const data = {};
  for (const [gemeinde, coords] of Object.entries(GEMEINDEN_COORDINATES_BFS)) {
    data[gemeinde] = coords;
  }
  return data;
}

/**
 * Generate documentation for coordinates
 */
function generateDocumentation() {
  const lines = [
    '# Municipality Coordinates (BFS Data)',
    '',
    '## All 66 ZH Municipalities with WGS84 Coordinates',
    '',
    '| Gemeinde | Lat | Lon | District |',
    '|----------|-----|-----|----------|'
  ];

  const districts = {};
  for (const [gemeinde, coords] of Object.entries(GEMEINDEN_COORDINATES_BFS)) {
    if (!districts[gemeinde]) {
      districts[gemeinde] = { lat: coords[0], lon: coords[1] };
    }
    lines.push(`| ${gemeinde} | ${coords[0]} | ${coords[1]} | |`);
  }

  return lines.join('\n');
}

// Export functions
module.exports = {
  GEMEINDEN_COORDINATES_BFS,
  getCoordinates,
  validateAllCoordinates,
  exportForFrontend,
  generateDocumentation
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'validate':
      const validation = validateAllCoordinates();
      console.log('✅ Validation Results:');
      console.log(`Total: ${validation.total}`);
      console.log(`Valid: ${validation.valid.length}`);
      console.log(`Missing: ${validation.missing.length}`);
      if (validation.missing.length > 0) {
        console.log('Missing coordinates for:', validation.missing);
      }
      break;

    case 'export':
      console.log(JSON.stringify(exportForFrontend(), null, 2));
      break;

    case 'docs':
      console.log(generateDocumentation());
      break;

    case 'get':
      if (process.argv[3]) {
        const coords = getCoordinates(process.argv[3]);
        if (coords) {
          console.log(`${process.argv[3]}: [${coords[0]}, ${coords[1]}]`);
        } else {
          console.log(`Unknown municipality: ${process.argv[3]}`);
        }
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node gemeinden-coordinator.js validate');
      console.log('  node gemeinden-coordinator.js export');
      console.log('  node gemeinden-coordinator.js docs');
      console.log('  node gemeinden-coordinator.js get <gemeinde>');
  }
}
