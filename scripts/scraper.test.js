const test = require('node:test');
const assert = require('node:assert/strict');
const { mapPublication } = require('./scraper');

test('maps a portal publication to the scraper data shape', () => {
  const result = mapPublication({
    id: 3349540,
    activity: { construction: { commune: { name: 'Bassersdorf' } } },
    streetConstruction: 'Grundhaldenstrasse',
    streetNumberConstruction: '28',
    zipCodeConstruction: '8303',
    cityConstruction: 'Bassersdorf',
    title: 'Erstellung unbeheizter Wintergarten',
    publicationFrom: '2026-11-05T00:00:00.000+00:00'
  }, 'bassersdorf');

  assert.deepEqual(result, {
    nummer: '3349540',
    adresse: 'Grundhaldenstrasse 28 8303 Bassersdorf',
    gemeinde: 'Bassersdorf',
    bautyp: 'Erstellung unbeheizter Wintergarten',
    datum: '2026-11-05',
    detailUrl: 'https://portal.ebaugesuche.zh.ch/eauflage/detail/3349540'
  });
});

test('does not duplicate a house number already included in the portal street', () => {
  const result = mapPublication({
    id: 3302326,
    activity: { construction: { commune: { name: 'Stäfa' } } },
    streetConstruction: 'Rainstrasse 67',
    streetNumberConstruction: null,
    zipCodeConstruction: '8712',
    cityConstruction: 'Stäfa'
  }, 'stäfa');

  assert.equal(result.adresse, 'Rainstrasse 67 8712 Stäfa');
});

test('omits invalid zero postal codes from geocoding addresses', () => {
  const result = mapPublication({
    id: 3356137,
    activity: { construction: { commune: { name: 'Wetzikon (ZH)' } } },
    streetConstruction: 'Guyer-Zeller-Strasse',
    streetNumberConstruction: '2',
    zipCodeConstruction: '0',
    cityConstruction: '0 Unterwetzikon'
  }, 'wetzikon');

  assert.equal(result.adresse, 'Guyer-Zeller-Strasse 2 Unterwetzikon');
});

test('rejects portal records without municipality identity', () => {
  assert.throws(() => mapPublication({
    id: 1,
    streetConstruction: 'Rainstrasse',
    streetNumberConstruction: '1',
    zipCodeConstruction: '8712',
    cityConstruction: 'Stäfa'
  }, 'stäfa'), /Invalid publication record/);
});
