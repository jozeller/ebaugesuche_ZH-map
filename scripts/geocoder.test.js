const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSearchQueries, selectExactAddress } = require('./geocoder');

const exactKuesnachtAddress = {
  attrs: {
    origin: 'address',
    detail: 'bahnhofstrasse 2a 8700 kuesnacht zh 154 kuesnacht _zh_ ch zh',
    label: 'Bahnhofstrasse 2a <b>8700 Küsnacht ZH</b>'
  }
};

test('selects an exact address in the requested municipality', () => {
  assert.equal(
    selectExactAddress(
      [exactKuesnachtAddress],
      'Bahnhofstrasse 2a 8700 Küsnacht (ZH)',
      'küsnacht'
    ),
    exactKuesnachtAddress
  );
});

test('does not accept a nearby but different house number', () => {
  const nearbyAddress = {
    attrs: {
      ...exactKuesnachtAddress.attrs,
      detail: 'bahnhofstrasse 2 8700 kuesnacht zh 154 kuesnacht _zh_ ch zh'
    }
  };

  assert.equal(
    selectExactAddress(
      [nearbyAddress],
      'Bahnhofstrasse 2a 8700 Küsnacht (ZH)',
      'küsnacht'
    ),
    null
  );
});

test('does not accept an address in another municipality', () => {
  const wrongMunicipality = {
    attrs: {
      ...exactKuesnachtAddress.attrs,
      detail: 'bahnhofstrasse 2a 8700 zollikon 161 zollikon _zh_ ch zh'
    }
  };

  assert.equal(
    selectExactAddress(
      [wrongMunicipality],
      'Bahnhofstrasse 2a 8700 Küsnacht (ZH)',
      'küsnacht'
    ),
    null
  );
});

test('tries individual addresses for a multi-building case', () => {
  const queries = buildSearchQueries(
    'Bohnackerstrasse 1 + 3 8157 Dielsdorf',
    { name: 'Dielsdorf' }
  );

  assert.ok(queries.includes('Bohnackerstrasse 1 8157 Dielsdorf'));
  assert.ok(queries.includes('Bohnackerstrasse 3 8157 Dielsdorf'));
});
