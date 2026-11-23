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
    this.resizeTimeout = null;
    this.controlsInitialized = false;

    this.mapLayers = {
      'pixelkarte': {
        'swisstopo-raster': {
          type: 'raster',
          tiles: ['https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.swisstopo.pixelkarte-farbe-pk25.noscale&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png'],
          tileSize: 256,
          attribution: '© swisstopo',
          minzoom: 0,
          maxzoom: 24
        }
      },
      'swissimage': {
        'swisstopo-raster': {
          type: 'raster',
          tiles: ['https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.swisstopo.swissimage&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg'],
          tileSize: 256,
          attribution: '© swisstopo',
          minzoom: 0,
          maxzoom: 24
        }
      },
      'avwms': {
        'av-raster': {
          type: 'raster',
          tiles: ['https://wms.zh.ch/AVfarbigZHWMS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=AVfarbigZHWMS&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png'],
          tileSize: 256,
          attribution: '© Kanton Zürich',
          minzoom: 0,
          maxzoom: 24
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

    // Mobile Drawer Close Button
    document.getElementById('mobile-drawer')?.querySelector('.mobile-drawer-close')?.addEventListener('click', () => this.closeMobileMenu());

    // Desktop Sidebar
    document.getElementById('gemeinde-select')?.addEventListener('change', (e) => {
      this.currentGemeinde = e.target.value;
      document.getElementById('gemeinde-select-mobile').value = e.target.value;
      this.loadGesuche();
    });

    document.getElementById('layer-select')?.addEventListener('change', (e) => {
      document.getElementById('layer-select-mobile').value = e.target.value;
      this.changeMapLayer(e.target.value);
    });

    // Gemeinde Search (Desktop)
    document.getElementById('gemeinde-search')?.addEventListener('input', (e) => {
      this.filterGemeindeSelect('gemeinde-select', e.target.value);
    });

    // Mobile Drawer Filters
    document.getElementById('gemeinde-select-mobile')?.addEventListener('change', (e) => {
      document.getElementById('gemeinde-select').value = e.target.value;
      this.currentGemeinde = e.target.value;
      this.loadGesuche(); // Auto-load without needing to click filter button
    });

    document.getElementById('layer-select-mobile')?.addEventListener('change', (e) => {
      document.getElementById('layer-select').value = e.target.value;
      this.changeMapLayer(e.target.value);
    });

    // Gemeinde Search (Mobile)
    document.getElementById('gemeinde-search-mobile')?.addEventListener('input', (e) => {
      this.filterGemeindeSelect('gemeinde-select-mobile', e.target.value);
    });

    // Show/hide search fields when dropdown is focused
    document.getElementById('gemeinde-select')?.addEventListener('focus', () => {
      this.toggleGemeindeSearch('gemeinde-search', true);
    });
    document.getElementById('gemeinde-select')?.addEventListener('blur', () => {
      this.toggleGemeindeSearch('gemeinde-search', false);
    });

    document.getElementById('gemeinde-select-mobile')?.addEventListener('focus', () => {
      this.toggleGemeindeSearch('gemeinde-search-mobile', true);
    });
    document.getElementById('gemeinde-select-mobile')?.addEventListener('blur', () => {
      this.toggleGemeindeSearch('gemeinde-search-mobile', false);
    });

    // Filter Apply Buttons
    document.getElementById('apply-filter')?.addEventListener('click', () => this.loadGesuche());

    // Results Panel Toggle
    document.getElementById('results-toggle-btn')?.addEventListener('click', () => this.toggleResultsPanel());
    document.getElementById('results-close-btn')?.addEventListener('click', () => this.closeResultsPanel());

    // Notification Badge - Show unlocated Baugesuche
    document.getElementById('notification-badge')?.addEventListener('click', () => this.showUnlocatedGesuche());

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
      center: [8.5, 47.5],
      zoom: 9,
      attributionControl: true,
      performanceMetricsCollection: false
    });

    this.map.on('load', () => {
      this.loadGemeinden();
      this.setupMapClickHandlers();
      this.setupMapControls(); // Initial setup after map loads
    });

    // Debounced resize listener
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.setupMapControls(), 250);
    });
  }

  setupMapControls() {
    if (!this.map) return;
    
    const isMobile = window.innerWidth <= 640;
    
    // Check if controls already exist
    const hasNavControl = this.map._controls?.some(c => c instanceof maplibregl.NavigationControl);
    const hasFullscreenControl = this.map._controls?.some(c => c instanceof maplibregl.FullscreenControl);
    const hasScaleControl = this.map._controls?.some(c => c instanceof maplibregl.ScaleControl);

    // Handle NavigationControl - only on desktop
    if (isMobile && hasNavControl) {
      // Remove from mobile
      const navCtrl = this.map._controls.find(c => c instanceof maplibregl.NavigationControl);
      if (navCtrl) this.map.removeControl(navCtrl);
    } else if (!isMobile && !hasNavControl) {
      // Add to desktop
      this.map.addControl(new maplibregl.NavigationControl(), 'top-left');
    }

    // Add Fullscreen if not exists
    if (!hasFullscreenControl) {
      this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    // Add Scale if not exists
    if (!hasScaleControl) {
      this.map.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }), 'bottom-right');
    }
  }

  setupMapClickHandlers() {
    this.map.on('click', 'gesuche-layer', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.showDetail(feature);
      }
    });

    this.map.on('mouseenter', 'gesuche-layer', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'gesuche-layer', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  createStyle(layer = 'swissimage') {
    const sourceId = layer === 'avwms' ? 'av-raster' : 'swisstopo-raster';
    const sources = this.mapLayers[layer];

    return {
      version: 8,
      sources: {
        ...sources,
        'gesuche-source': {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        }
      },
      layers: [
        {
          id: 'base-layer',
          type: 'raster',
          source: sourceId,
          minzoom: 0,
          maxzoom: 24
        },
        {
          id: 'gesuche-layer',
          type: 'circle',
          source: 'gesuche-source',
          paint: {
            'circle-radius': 6,
            'circle-color': '#FF6B6B',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
          }
        }
      ]
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
      this.applyUrlParameters();
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

  applyUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const gemeinde = params.get('gemeinde');
    
    if (gemeinde) {
      // Check if the requested gemeinde exists
      const exists = this.gemeinden.some(g => g.slug === gemeinde);
      if (exists) {
        this.currentGemeinde = gemeinde;
        document.getElementById('gemeinde-select').value = gemeinde;
        document.getElementById('gemeinde-select-mobile').value = gemeinde;
      }
    }
  }

  filterGemeindeSelect(selectId, searchText) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const searchLower = searchText.toLowerCase().trim();
    const options = select.querySelectorAll('option');
    
    options.forEach(option => {
      if (option.value === 'alle') {
        option.style.display = '';
      } else {
        const matches = option.textContent.toLowerCase().includes(searchLower);
        option.style.display = matches ? '' : 'none';
      }
    });
  }

  toggleGemeindeSearch(searchId, show) {
    const searchInput = document.getElementById(searchId);
    if (!searchInput) return;
    
    if (show) {
      searchInput.style.display = '';
      searchInput.focus();
    } else {
      searchInput.style.display = 'none';
      searchInput.value = '';
      
      // Reset filter to show all options
      const selectId = searchId.replace('search', 'select');
      const select = document.getElementById(selectId);
      if (select) {
        select.querySelectorAll('option').forEach(option => {
          option.style.display = '';
        });
      }
    }
  }

  updateResultsListMobile() {
    this.loadGesuche();
    
    setTimeout(() => {
      const resultsList = document.getElementById('results-list-mobile');
      if (resultsList && resultsList.children.length > 0) {
        resultsList.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  changeMapLayer(layer) {
    if (!this.mapLayers[layer]) {
      this.showError(`Unbekannter Kartenlayer: ${layer}`);
      return;
    }

    this.currentLayer = layer;
    if (this.map) {
      this.map.setStyle(this.createStyle(layer));
      
      // Wait for style to fully load before re-adding markers
      const onStyleData = () => {
        // Only proceed when style is fully loaded (not just loaded)
        if (!this.map.isStyleLoaded()) return;
        
        this.map.off('styledata', onStyleData);
        this.setupMapControls();
        this.setupMapClickHandlers();
        
        // Re-add markers after style is fully ready
        if (this.gesuche && this.gesuche.length > 0) {
          this.addAllMarkers();
        }
      };
      
      this.map.on('styledata', onStyleData);
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
    this.markers = [];
  }

  addAllMarkers() {
    const features = this.gesuche.filter(f => f.geometry?.type === 'Point');
    
    this.markers = features;
    
    if (!this.map) return;
    
    try {
      const sourceExists = this.map.getSource('gesuche-source');
      const layerExists = this.map.getLayer('gesuche-layer');
      
      // Add source if it doesn't exist
      if (!sourceExists) {
        this.map.addSource('gesuche-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          }
        });
      } else {
        // Update data if source exists
        this.map.getSource('gesuche-source').setData({
          type: 'FeatureCollection',
          features: features
        });
      }
      
      // Add layer if it doesn't exist
      if (!layerExists) {
        this.map.addLayer({
          id: 'gesuche-layer',
          type: 'circle',
          source: 'gesuche-source',
          paint: {
            'circle-radius': 6,
            'circle-color': '#FF6B6B',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
          }
        });
      }

      const unlocatedCount = this.gesuche.filter(f => !f.geometry).length;
      this.updateNotificationBadge(unlocatedCount);
    } catch (error) {
      console.error('Error adding markers:', error);
    }
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

  showUnlocatedGesuche() {
    const unlocated = this.gesuche.filter(f => !f.geometry);
    
    if (unlocated.length === 0) {
      this.showError('Keine nicht zugeordneten Baugesuche gefunden.');
      return;
    }

    this.updateResultsList(unlocated);
    this.toggleResultsPanel();
  }

  updateResultsList(gesuche = this.gesuche) {
    const count = gesuche.length;
    document.getElementById('results-count').textContent = `${count} Baugesuch${count !== 1 ? 'e' : ''}`;

    const list = document.getElementById('results-list');
    list.replaceChildren();

    gesuche.forEach(feature => {
      const item = document.createElement('li');
      item.className = 'result-item';

      const props = feature.properties;
      item.innerHTML = `
        <div class="result-address">
          <span>📍 ${props.adresse}</span>
        </div>
        <div class="result-gemeinde">${props.gemeinde}</div>
        <a href="${props.detailUrl}" target="_blank" rel="noopener" class="result-link">Details</a>
      `;

      item.addEventListener('click', () => this.showDetail(feature));
      list.appendChild(item);
    });
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
