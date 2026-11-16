const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function pageScript(file) {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  return { html, script: scripts.map(match => match[1]).find(source => source.trim()) };
}

test('production map starts with aerial imagery and uses the clickable default pin', () => {
  const { html, script } = pageScript('index.html');
  const controls = new Map();
  const markers = [];
  let mapOptions;

  class MapMock {
    constructor(options) { mapOptions = options; }
    on() {}
    addControl() {}
  }
  class MarkerMock {
    constructor(...args) {
      this.args = args;
      this.element = { addEventListener: (event, handler) => { this[event] = handler; } };
      markers.push(this);
    }
    setLngLat() { return this; }
    setPopup() { return this; }
    addTo() { return this; }
    getElement() { return this.element; }
  }
  class PopupMock {
    setHTML() { return this; }
  }
  const context = vm.createContext({
    window: { addEventListener() {} },
    document: {
      getElementById(id) {
        if (!controls.has(id)) controls.set(id, { addEventListener() {} });
        return controls.get(id);
      },
      createElement() { return { className: '', addEventListener() {} }; }
    },
    maplibregl: {
      Map: MapMock,
      Marker: MarkerMock,
      Popup: PopupMock,
      NavigationControl: class {},
      FullscreenControl: class {},
      ScaleControl: class {}
    }
  });
  vm.runInContext(script, context);
  context.initMap();
  context.addMarker({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [8.7, 47.2] },
    properties: { nummer: '1', adresse: 'Test', gemeinde: 'Stäfa', detailUrl: '#' }
  });

  assert.match(html, /<option value="swissimage" selected>/);
  assert.match(mapOptions.style.sources['swisstopo-raster'].tiles[0], /LAYERS=ch\.swisstopo\.swissimage&/);
  assert.equal(markers.length, 1);
  assert.equal(markers[0].args.length, 0);
  assert.equal(typeof markers[0].click, 'function');
});

test('local map starts with the aerial layer', () => {
  const { script } = pageScript('frontend/index.html');
  const addedLayers = [];
  const tileLayer = (url, options) => ({
    addTo() { addedLayers.push({ url, options }); return this; }
  });
  tileLayer.wms = tileLayer;
  const control = () => ({ addTo() { return this; } });
  control.layers = control;
  control.scale = control;
  const context = vm.createContext({
    window: { addEventListener() {} },
    document: { getElementById() { return { addEventListener() {} }; } },
    L: {
      map() { return { setView() { return this; } }; },
      tileLayer,
      control,
      CRS: { EPSG3857: {} }
    }
  });
  vm.runInContext(script, context);
  context.initMap();

  assert.equal(addedLayers.length, 1);
  assert.equal(addedLayers[0].options.layers, 'ch.swisstopo.swissimage');
});

for (const file of ['index.html', 'frontend/index.html']) {
  test(`${file}: unlocated cases stay in the closed header notice`, () => {
    const { html, script } = pageScript(file);
    const elements = new Map();
    const summary = { setAttribute(name, value) { this[name] = value; } };
    const makeElement = () => ({
      children: [],
      textContent: '',
      replaceChildren() { this.children = []; this.textContent = ''; },
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); }
    });
    const notices = { open: true, hidden: true, querySelector() { return summary; } };
    elements.set('unlocated-notices', notices);
    for (const id of ['unlocated-count', 'unlocated-heading', 'unlocated-list']) {
      elements.set(id, makeElement());
    }
    const context = vm.createContext({
      window: { addEventListener() {} },
      document: {
        getElementById(id) { return elements.get(id) || makeElement(); },
        createElement() { return makeElement(); }
      }
    });
    // The local page attaches its select listener as the script loads.
    const getElementById = context.document.getElementById;
    context.document.getElementById = id => {
      if (id === 'gemeinde-select') return { addEventListener() {} };
      return getElementById(id);
    };
    vm.runInContext(script, context);

    assert.match(html, /<details id="unlocated-notices" hidden>/);
    const features = Array.from({ length: 25 }, (_, i) => ({
      properties: { adresse: `Adresse ${i}`, detailUrl: `https://example.com/${i}` }
    }));
    context.showUnlocatedCases(features);
    assert.equal(notices.open, false);
    assert.equal(notices.hidden, false);
    assert.equal(elements.get('unlocated-count').textContent, 25);
    assert.equal(summary['aria-label'], '25 Gesuche ohne exakte Adresskoordinate');
    assert.equal(elements.get('unlocated-list').children.length, 25);
    assert.equal(elements.get('unlocated-list').children[0].children[0].textContent, 'Adresse 0');

    notices.open = true;
    context.showUnlocatedCases([]);
    assert.equal(notices.open, false);
    assert.equal(notices.hidden, true);
    assert.equal(elements.get('unlocated-count').textContent, 0);
    assert.equal(elements.get('unlocated-list').children.length, 0);
    assert.match(elements.get('unlocated-list').textContent, /Keine Gesuche/);
    context.showUnlocatedCases(features.slice(0, 1));
    assert.equal(notices.hidden, false);
    assert.equal(elements.get('unlocated-count').textContent, 1);
  });
}
