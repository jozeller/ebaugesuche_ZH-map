/**
 * eBaugesuche ZH - Modern Interactive Map
 * Main Application Logic
 */

class BaugesucheApp {
  constructor() {
    this.map = null;
    this.gesuche = [];
    this.markers = [];
    this.gemeinden = [];
    this.currentGemeinde = 'alle';
    this.currentLayer = 'swissimage';
    this.loadSequence = 0;

    this.mapLayers = {
      'pixelkarte': {
        'swisstopo-raster': {
          type: 'raster',
          tiles: ['https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.swisstopo.pixelkarte-farbe-pk25.noscale&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png'],
          tileSize: 256,
          attribution: '© swisstopo',
          minzoom: 0,
          maxzoom: 28
        }
      },
      'swissimage': {
        'swisstopo-raster': {
          type: 'raster',
          tiles: ['https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.swisstopo.swissimage&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg'],
          tileSize: 256,
          attribution: '© swisstopo',
          minzoom: 0,
          maxzoom: 28
        }
      },
      'avwms': {
        'av-raster': {
          type: 'raster',
          tiles: ['https://wms.zh.ch/AVfarbigZHWMS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=av&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png'],
          tileSize: 256,
          attribution: '© Kanton Zürich',
          minzoom: 0,
          maxzoom: 28
        }
      }
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initMap();
  }

  setupEventListeners() {
    // Header & Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobilDrawer = document.getElementById('mobile-drawer');
    const mobileOverlay = document.getElementById('mobile-overlay');

    mobileMenuBtn?.addEventListener('click', () => this.toggleMobileMenu());
    mobileOverlay?.addEventListener('click', () => this.closeMobileMenu());
    document.getElementById('mobile-drawer')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeMobileMenu();
    });

    // Desktop Sidebar
    document.getElementById('gemeinde-select')?.addEventListener('change', (e) => {
      this.currentGemeinde = e.target.value;
      this.loadGesuche();
    });

    document.getElementById('layer-select')?.addEventListener('change', (e) => {
      this.changeMapLayer(e.target.value);
    });

    // Mobile Drawer Filters
    document.getElementById('gemeinde-select-mobile')?.addEventListener('change', (e) => {
      document.getElementById('gemeinde-select').value = e.target.value;
      this.currentGemeinde = e.target.value;
    });

    document.getElementById('layer-select-mobile')?.addEventListener('change', (e) => {
      document.getElementById('layer-select').value = e.target.value;
      this.changeMapLayer(e.target.value);
    });

    // Filter Apply Buttons
    document.getElementById('apply-filter')?.addEventListener('click', () => this.loadGesuche());
    document.getElementById('apply-filter-mobile')?.addEventListener('click', () => {
      this.loadGesuche();
      this.closeMobileMenu();
    });

    // Results Panel Toggle
    document.getElementById('results-toggle-btn')?.addEventListener('click', () => this.toggleResultsPanel());
    document.getElementById('results-close-btn')?.addEventListener('click', () => this.closeResultsPanel());

    // Modal Close
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', () => this.closeModal());

    // Keyboard: ESC closes modal/menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-overlay');
    
    if (drawer?.classList.contains('open')) {
      this.closeMobileMenu();
    } else {
      drawer?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileMenu() {
    document.getElementById('mobile-drawer')?.classList.remove('open');
    document.getElementById('mobile-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    this.map = new maplibregl.Map({
      container: 'map',
      style: this.createStyle(this.currentLayer),
      center: [8.680557, 47.244037],
      zoom: 13,
      attributionControl: true,
      performanceMetricsCollection: false
    });

    this.map.on('load', () => this.loadGemeinden());

    // Add Controls
    this.map.addControl(new maplibregl.NavigationControl(), 'top-left');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }), 'bottom-right');
  }

  createStyle(layer = 'swissimage') {
    const sourceId = layer === 'avwms' ? 'av-raster' : 'swisstopo-raster';
    const sources = this.mapLayers[layer];

    return {
      version: 8,
      sources: sources,
      layers: [{
        id: 'base-layer',
        type: 'raster',
        source: sourceId,
        minzoom: 0,
        maxzoom: 28
      }]
    };
  }

  async loadGemeinden() {
    try {
      const response = await fetch('../data/gemeinden.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.gemeinden = await response.json();
      if (!Array.isArray(this.gemeinden) || this.gemeinden.length === 0) {
        throw new Error('Gemeindeliste ist leer');
      }

      this.populateSelects();
      await this.loadGesuche();
    } catch (error) {
      console.error('Fehler beim Laden der Gemeinden:', error);
      this.showError(`Gemeinden konnten nicht geladen werden: ${error.message}`);
    }
  }

  populateSelects() {
    const selects = [
      document.getElementById('gemeinde-select'),
      document.getElementById('gemeinde-select-mobile')
    ];

    selects.forEach(select => {
      if (!select) return;
      select.replaceChildren();

      const allOption = document.createElement('option');
      allOption.value = 'alle';
      allOption.textContent = `Alle Gemeinden (${this.gemeinden.length})`;
      select.appendChild(allOption);

      this.gemeinden.forEach(gemeinde => {
        const option = document.createElement('option');
        option.value = gemeinde.slug;
        option.textContent = gemeinde.name;
        select.appendChild(option);
      });

      select.value = 'alle';
    });

    this.currentGemeinde = 'alle';
  }

  changeMapLayer(layer) {
    if (!this.mapLayers[layer]) {
      this.showError(`Unbekannter Kartenlayer: ${layer}`);
      return;
    }

    this.currentLayer = layer;
    if (this.map) {
      this.map.setStyle(this.createStyle(layer));
    }
  }

  async loadGesuche() {
    const request = ++this.loadSequence;

    try {
      this.showLoading(true);

      const slugs = this.currentGemeinde === 'alle'
        ? this.gemeinden.map(g => g.slug)
        : [this.currentGemeinde];

      const datasets = await Promise.all(
        slugs.map(async slug => {
          const response = await fetch(`../data/baugesuche_${slug}.json`);
          if (!response.ok) throw new Error(`${slug}: HTTP ${response.status}`);
          return response.json();
        })
      );

      if (request !== this.loadSequence) return;

      this.gesuche = datasets.flatMap(d => d.features || []);

      this.clearMarkers();
      this.addAllMarkers();
      this.updateResultsList();
      this.focusMap();

      this.showLoading(false);
    } catch (error) {
      if (request !== this.loadSequence) return;
      console.error('Fehler beim Laden:', error);
      this.showLoading(false);
      this.showError(`Fehler: ${error.message}`);
    }
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  addAllMarkers() {
    this.gesuche.forEach(feature => {
      if (feature.geometry?.type === 'Point') {
        this.addMarker(feature);
      }
    });

    const unlocatedCount = this.gesuche.filter(f => !f.geometry).length;
    this.updateNotificationBadge(unlocatedCount);
  }

  addMarker(feature) {
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker';
    markerEl.innerHTML = '📍';
    markerEl.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({
      element: markerEl,
      anchor: 'center'
    })
      .setLngLat(feature.geometry.coordinates)
      .addTo(this.map);

    markerEl.addEventListener('click', () => this.showDetail(feature));
    this.markers.push(marker);
  }

  updateResultsList() {
    const count = this.gesuche.length;
    document.getElementById('results-count').textContent = `${count} Baugesuch${count !== 1 ? 'e' : ''}`;

    const list = document.getElementById('results-list');
    list.replaceChildren();

    this.gesuche.forEach(feature => {
      const props = feature.properties;
      const item = document.createElement('li');
      item.className = 'result-item';
      
      const html = `
        <div class="result-address">
          <span>📍</span>
          <span>${props.adresse}</span>
        </div>
        <div class="result-gemeinde">${props.gemeinde}</div>
        <a href="${props.detailUrl}" target="_blank" rel="noopener" class="result-link">→ Zum Baugesuch</a>
      `;

      item.innerHTML = html;
      item.addEventListener('click', () => this.showDetail(feature));
      list.appendChild(item);
    });
  }

  updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    const countEl = document.getElementById('notification-count');

    if (count > 0) {
      badge.style.display = 'inline-flex';
      countEl.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }

  focusMap() {
    const located = this.gesuche.filter(f => f.geometry?.type === 'Point');

    if (located.length === 1) {
      this.map.flyTo({
        center: located[0].geometry.coordinates,
        zoom: 14,
        duration: 1000
      });
    } else if (located.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      located.forEach(f => bounds.extend(f.geometry.coordinates));
      this.map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 1000 });
    }
  }

  showDetail(feature) {
    const props = feature.properties;
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    const overlay = document.getElementById('modal-overlay');

    const html = `
      <div class="detail-gemeinde">${props.gemeinde}</div>
      
      <div class="detail-section">
        <span class="detail-label">📍 Adresse</span>
        <div class="detail-value">${props.adresse}</div>
      </div>

      ${props.bautyp ? `
      <div class="detail-section">
        <span class="detail-label">🏢 Projekt</span>
        <div class="detail-value">${props.bautyp}</div>
      </div>
      ` : ''}

      ${props.datum ? `
      <div class="detail-section">
        <span class="detail-label">📅 Eingangsdatum</span>
        <div class="detail-value">${props.datum}</div>
      </div>
      ` : ''}

      <a href="${props.detailUrl}" target="_blank" rel="noopener" class="detail-cta">
        → Zu den Details im eBaugesuche-Portal
      </a>
    `;

    document.getElementById('modal-title').textContent = `Baugesuch ${props.nummer}`;
    body.innerHTML = html;
    modal?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    document.getElementById('detail-modal')?.classList.remove('open');
    document.getElementById('modal-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggleResultsPanel() {
    const panel = document.getElementById('results-panel');
    panel?.classList.toggle('open');
  }

  closeResultsPanel() {
    const panel = document.getElementById('results-panel');
    panel?.classList.remove('open');
  }

  showLoading(show) {
    // Loading is implicit with the data updates
  }

  showError(message) {
    console.error(message);
    // Could implement a toast notification here
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BaugesucheApp();
});
