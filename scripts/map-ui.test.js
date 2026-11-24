const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readPage = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+$/gm, '');

test('GitHub Pages entry renders the same UI as the local frontend', () => {
  const productionHtml = readPage('index.html');
  const localHtml = readPage('frontend/index.html');

  assert.match(productionHtml, /<base href="\.\/frontend\/">/);
  assert.equal(
    productionHtml.replace('  <base href="./frontend/">\n', ''),
    localHtml
  );
  assert.match(productionHtml, /<link href="\.\/styles\.css" rel="stylesheet"/);
  assert.match(productionHtml, /<script src="\.\/app\.js"><\/script>/);
});

test('frontend data paths resolve to the repository data directory on GitHub Pages', () => {
  const pagesRoot = new URL('https://jozeller.github.io/ebaugesuche_ZH-map/');
  const frontendBase = new URL('./frontend/', pagesRoot);

  assert.equal(
    new URL('../data/gemeinden.json', frontendBase).href,
    'https://jozeller.github.io/ebaugesuche_ZH-map/data/gemeinden.json'
  );
});

test('mobile drawer contains the searchable filter, layer selector, and results list', () => {
  const html = readPage('frontend/index.html');
  const drawerStart = html.indexOf('<div class="mobile-drawer"');
  const drawerEnd = html.indexOf('<!-- Mobile Overlay -->');
  const drawer = html.slice(drawerStart, drawerEnd);

  assert.notEqual(drawerStart, -1);
  assert.notEqual(drawerEnd, -1);
  assert.match(drawer, /id="gemeinde-search-mobile"[^>]*role="combobox"/);
  assert.match(drawer, /id="layer-select-mobile"/);
  assert.match(drawer, /id="results-list-mobile"/);
  assert.match(drawer, /id="notification-badge-mobile"/);
  assert.match(drawer, /id="results-reset-mobile"/);
});

test('donation QR image is available for preview and download', () => {
  const html = readPage('frontend/index.html');
  const qrImage = path.join(__dirname, '..', 'frontend', 'nemo-spenden-qr.png');

  assert.ok(fs.statSync(qrImage).isFile());
  assert.match(html, /<img src="\.\/nemo-spenden-qr\.png" alt="Schweizer QR-Code/);
  assert.match(html, /href="\.\/nemo-spenden-qr\.png" download=/);
});
