const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEARCH_URL = 'https://api3.geo.admin.ch/rest/services/api/SearchServer';
const MUNICIPALITIES = require('../data/gemeinden.json');
const MUNICIPALITIES_BY_SLUG = new Map(
  MUNICIPALITIES.map(municipality => [municipality.slug, municipality])
);
const REQUEST_DELAY_MS = 250;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function selectExactAddress(results, address, gemeinde) {
  const municipality = MUNICIPALITIES_BY_SLUG.get(gemeinde);
  if (!municipality) return null;

  const zipMatch = address.match(/\b([1-9]\d{3})\b/);
  const addressPrefix = (zipMatch ? address.slice(0, zipMatch.index) : address)
    .replace(/^\s*(bei|nahe)\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
  const streetMatch = addressPrefix.match(/^(.+?)\s+(\d+(?:\.\d+)?[a-z]?)(?:\s|[+/,;-]|$)/i);
  const expectedStreet = normalize(streetMatch ? streetMatch[1] : addressPrefix);
  const expectedNumber = streetMatch ? normalize(streetMatch[2]) : null;
  const expectedZip = zipMatch?.[1];
  const expectedMunicipality = normalize(municipality.name);

  const exactMatches = results.filter(result => {
    const attrs = result.attrs || {};
    const rawDetail = String(attrs.detail || '').replace(/<[^>]*>/g, '');
    const detailZipMatch = rawDetail.match(/\b([1-9]\d{3})\b/);
    const candidateAddress = (detailZipMatch
      ? rawDetail.slice(0, detailZipMatch.index)
      : rawDetail).trim();
    const detail = normalize(rawDetail);
    if (attrs.origin !== 'address'
      || !detail.startsWith(expectedStreet)
      || !detail.includes(expectedMunicipality)) {
      return false;
    }

    const candidateMatch = candidateAddress.match(/^(.+?)\s+(\d+(?:\.\d+)?[a-z]?)$/i);
    if (expectedNumber) {
      return candidateMatch
        && normalize(candidateMatch[1]) === expectedStreet
        && normalize(candidateMatch[2]) === expectedNumber;
    }

    return normalize(candidateAddress) === expectedStreet;
  });

  return exactMatches.find(result => expectedZip && normalize(result.attrs.detail).includes(expectedZip))
    || exactMatches[0]
    || null;
}

function buildSearchQueries(address, municipality) {
  const zipMatch = address.match(/\b([1-9]\d{3})\b/);
  const prefix = (zipMatch ? address.slice(0, zipMatch.index) : address)
    .replace(/^\s*(bei|nahe)\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
  const suffix = zipMatch
    ? `${zipMatch[1]} ${address.slice(zipMatch.index + zipMatch[0].length).trim()}`
    : municipality.name;
  const queries = [address, `${prefix} ${suffix}`];
  const placeParts = prefix.split(/\s*\/\s*/).map(part => part.trim()).filter(Boolean);

  for (const part of placeParts) {
    const correctedSpelling = part.replace(/([a-z])\1{2,}/gi, '$1$1');
    const streetMatch = correctedSpelling.match(/^(.+?)\s+(\d+(?:\.\d+)?[a-z]?)(?:\s|[+/,;-]|$)/i);
    if (!streetMatch) {
      queries.push(`${correctedSpelling} ${suffix}`.trim());
      continue;
    }

    const street = streetMatch[1];
    const numbers = [...correctedSpelling.slice(street.length).matchAll(/\b(\d+(?:\.\d+)?[a-z]?)\b/gi)]
      .map(match => match[1]);
    for (const number of new Set(numbers)) {
      queries.push(`${street} ${number} ${suffix}`.trim());
    }
  }

  return [...new Set(queries)];
}

async function geocodeAddress(address, gemeinde) {
  const municipality = MUNICIPALITIES_BY_SLUG.get(gemeinde);
  if (!municipality) {
    throw new Error(`Unknown municipality: ${gemeinde}`);
  }

  for (const query of buildSearchQueries(address, municipality)) {
    const params = new URLSearchParams({
      searchText: query,
      type: 'locations',
      origins: 'address',
      limit: '10'
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await fetch(`${SEARCH_URL}?${params}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ebaugesuche-zh-map/1.1'
        },
        timeout: 15000
      });

      if (response.status === 429 || response.status >= 500) {
        if (attempt === 4) {
          throw new Error(`SwissTopo geocoder returned HTTP ${response.status}`);
        }
        await delay(attempt * 1000);
        continue;
      }

      if (response.status === 400) {
        console.warn(`  ⚠️ SwissTopo rejected the address query: ${query}`);
        break;
      }

      if (!response.ok) {
        throw new Error(`SwissTopo geocoder returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.results)) {
        throw new Error('SwissTopo geocoder returned an invalid response');
      }

      const match = selectExactAddress(data.results, query, gemeinde);
      if (match) {
        const lat = Number(match.attrs.lat);
        const lon = Number(match.attrs.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error(`SwissTopo geocoder returned invalid coordinates for "${address}"`);
        }

        return {
          lat,
          lon,
          displayName: String(match.attrs.label).replace(/<[^>]*>/g, '')
        };
      }
      break;
    }

    await delay(REQUEST_DELAY_MS);
  }

  return null;
}

async function geocodeGesuche(gemeinde) {
  const inputFile = path.join(DATA_DIR, `gesuche-raw-${gemeinde}.json`);
  if (!fs.existsSync(inputFile)) {
    throw new Error(`File not found: ${inputFile}. Run the scraper first.`);
  }

  const gesuche = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const geocoded = [];

  console.log(`📍 Checking ${gesuche.length} addresses for ${gemeinde}...`);
  for (let i = 0; i < gesuche.length; i++) {
    const gesuch = gesuche[i];
    const coords = await geocodeAddress(gesuch.adresse, gemeinde);
    geocoded.push({
      ...gesuch,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      displayName: coords?.displayName ?? null
    });

    if (!coords) {
      console.warn(`  ⚠️ No exact address match: ${gesuch.adresse}`);
    }
    if (i < gesuche.length - 1) await delay(REQUEST_DELAY_MS);
  }

  const outputPath = path.join(DATA_DIR, `gesuche-geocoded-${gemeinde}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(geocoded, null, 2));
  console.log(`✅ Exact address matches: ${geocoded.filter(g => g.lat !== null).length}/${gesuche.length}`);
  return geocoded;
}

if (require.main === module) {
  geocodeGesuche(process.argv[2] || 'stäfa').catch(error => {
    console.error('❌ Geocoding failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  geocodeGesuche,
  geocodeAddress,
  selectExactAddress,
  buildSearchQueries
};
