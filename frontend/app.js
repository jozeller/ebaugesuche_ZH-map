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
    this.showingUnlocated = false;
    this.markerClickHandler = e => {
      if (e.features.length > 0) this.showDetail(e.features[0]);
    };
    this.markerEnterHandler = () => {
      this.map.getCanvas().style.cursor = 'pointer';
    };
    this.markerLeaveHandler = () => {
      this.map.getCanvas().style.cursor = '';
    };

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

    document.getElementById('layer-select')?.addEventListener('change', (e) => {
      document.getElementById('layer-select-mobile').value = e.target.value;
      this.changeMapLayer(e.target.value);
    });

    document.getElementById('layer-select-mobile')?.addEventListener('change', (e) => {
      document.getElementById('layer-select').value = e.target.value;
      this.changeMapLayer(e.target.value);
    });

    ['gemeinde-search', 'gemeinde-search-mobile'].forEach(inputId => {
      const input = document.getElementById(inputId);
      const options = document.getElementById(inputId.replace('search', 'options'));

      input?.addEventListener('focus', () => this.openGemeindePicker(inputId));
      input?.addEventListener('click', () => this.openGemeindePicker(inputId));
      input?.addEventListener('input', () => this.filterGemeindePicker(inputId));
      input?.addEventListener('keydown', e => this.handleGemeindePickerKeydown(e, inputId));
      input?.addEventListener('blur', () => {
        setTimeout(() => {
          if (!input.closest('.gemeinde-picker').contains(document.activeElement)) {
            this.closeGemeindePicker(inputId);
          }
        });
      });

      options?.addEventListener('mousedown', e => {
        if (e.target.closest('[role="option"]')) e.preventDefault();
      });
      options?.addEventListener('click', e => {
        const option = e.target.closest('[role="option"]');
        if (option) this.selectGemeinde(option.dataset.gemeinde);
      });
    });

    document.addEventListener('pointerdown', e => {
      if (!e.target.closest?.('.gemeinde-picker')) this.closeGemeindePickers();
    });

    // Results Panel Toggle
    document.getElementById('results-toggle-btn')?.addEventListener('click', () => this.toggleResultsPanel());
    document.getElementById('results-close-btn')?.addEventListener('click', () => this.closeResultsPanel());

    // Notification Badge - Show unlocated Baugesuche
    document.getElementById('notification-badge')?.addEventListener('click', () => this.showUnlocatedGesuche());
    document.getElementById('notification-badge-mobile')?.addEventListener('click', () => this.showUnlocatedGesuche());
    document.getElementById('results-reset-mobile')?.addEventListener('click', () => this.resetResultsList());

    const infoDialog = document.getElementById('info-dialog');
    ['info-btn', 'info-btn-mobile'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => infoDialog.showModal());
    });
    document.getElementById('info-close')?.addEventListener('click', () => infoDialog.close());
    const qrDialog = document.getElementById('donation-qr-dialog');
    ['donation-qr-open', 'donation-qr-enlarge'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => qrDialog.showModal());
    });
    document.getElementById('donation-qr-close')?.addEventListener('click', () => qrDialog.close());

    // Modal Close
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', () => this.closeModal());

    // Keyboard: ESC closes modal/menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (qrDialog.open) {
          qrDialog.close();
          e.preventDefault();
          return;
        }
        if (infoDialog.open) {
          infoDialog.close();
          e.preventDefault();
          return;
        }
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
      const menuButton = document.getElementById('mobile-menu-btn');
      menuButton?.setAttribute('aria-expanded', 'true');
      menuButton?.setAttribute('aria-label', 'Menü schließen');
      menuButton?.setAttribute('title', 'Menü schließen');
    }
  }

  closeMobileMenu() {
    document.getElementById('mobile-drawer')?.classList.remove('open');
    document.getElementById('mobile-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
    const menuButton = document.getElementById('mobile-menu-btn');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Menü öffnen');
    menuButton?.setAttribute('title', 'Menü');
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
    this.map.off('click', 'gesuche-layer', this.markerClickHandler);
    this.map.off('mouseenter', 'gesuche-layer', this.markerEnterHandler);
    this.map.off('mouseleave', 'gesuche-layer', this.markerLeaveHandler);
    this.map.on('click', 'gesuche-layer', this.markerClickHandler);
    this.map.on('mouseenter', 'gesuche-layer', this.markerEnterHandler);
    this.map.on('mouseleave', 'gesuche-layer', this.markerLeaveHandler);
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
            features: this.gesuche.filter(f => f.geometry?.type === 'Point')
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

      this.populateGemeindePickers();
      this.applyUrlParameters();
      await this.loadGesuche();
    } catch (error) {
      console.error('Fehler beim Laden der Gemeinden:', error);
      this.showError(`Gemeinden konnten nicht geladen werden: ${error.message}`);
    }
  }

  populateGemeindePickers() {
    ['gemeinde-options', 'gemeinde-options-mobile'].forEach(optionsId => {
      const options = document.getElementById(optionsId);
      if (!options) return;
      options.replaceChildren();

      const municipalities = [
        { slug: 'alle', name: `Alle Gemeinden (${this.gemeinden.length})` },
        ...this.gemeinden
      ];

      municipalities.forEach(gemeinde => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'gemeinde-option';
        option.setAttribute('role', 'option');
        option.dataset.gemeinde = gemeinde.slug;
        option.dataset.label = gemeinde.name;
        option.setAttribute('aria-selected', 'false');
        option.textContent = gemeinde.name;
        options.appendChild(option);
      });

      const noResults = document.createElement('div');
      noResults.className = 'gemeinde-no-results';
      noResults.setAttribute('role', 'status');
      noResults.textContent = 'Keine Gemeinde gefunden.';
      noResults.hidden = true;
      options.appendChild(noResults);
    });

    this.currentGemeinde = 'alle';
    this.syncGemeindePickers();
  }

  applyUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const gemeinde = params.get('gemeinde');
    
    if (gemeinde) {
      // Check if the requested gemeinde exists
      const exists = this.gemeinden.some(g => g.slug === gemeinde);
      if (exists) {
        this.currentGemeinde = gemeinde;
        this.syncGemeindePickers();
      }
    }
  }

  syncGemeindePickers() {
    const selected = this.currentGemeinde === 'alle'
      ? `Alle Gemeinden (${this.gemeinden.length})`
      : this.gemeinden.find(g => g.slug === this.currentGemeinde)?.name;

    ['gemeinde-search', 'gemeinde-search-mobile'].forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) input.value = selected || '';
    });

    ['gemeinde-options', 'gemeinde-options-mobile'].forEach(optionsId => {
      document.getElementById(optionsId)?.querySelectorAll('[role="option"]').forEach(option => {
        option.setAttribute('aria-selected', String(option.dataset.gemeinde === this.currentGemeinde));
      });
    });
  }

  openGemeindePicker(inputId) {
    const input = document.getElementById(inputId);
    const options = document.getElementById(inputId.replace('search', 'options'));
    if (!input || !options || input.getAttribute('aria-expanded') === 'true') return;

    input.value = '';
    input.setAttribute('aria-expanded', 'true');
    options.hidden = false;
    this.filterGemeindePicker(inputId);
  }

  closeGemeindePicker(inputId) {
    const input = document.getElementById(inputId);
    const options = document.getElementById(inputId.replace('search', 'options'));
    if (!input || !options) return;

    input.setAttribute('aria-expanded', 'false');
    options.hidden = true;
    this.syncGemeindePickers();
  }

  closeGemeindePickers() {
    this.closeGemeindePicker('gemeinde-search');
    this.closeGemeindePicker('gemeinde-search-mobile');
  }

  filterGemeindePicker(inputId) {
    const input = document.getElementById(inputId);
    const options = document.getElementById(inputId.replace('search', 'options'));
    if (!input || !options) return;

    const query = input.value.trim().toLocaleLowerCase('de');
    let visibleCount = 0;
    options.querySelectorAll('[role="option"]').forEach(option => {
      const matches = option.dataset.label.toLocaleLowerCase('de').includes(query);
      option.hidden = !matches;
      visibleCount += Number(matches);
    });
    const noResults = options.querySelector('.gemeinde-no-results');
    if (noResults) noResults.hidden = visibleCount > 0;
  }

  handleGemeindePickerKeydown(event, inputId) {
    const options = document.getElementById(inputId.replace('search', 'options'));
    if (!options) return;

    if (event.key === 'Escape') {
      this.closeGemeindePicker(inputId);
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      const firstOption = options.querySelector('[role="option"]:not([hidden])');
      if (firstOption) {
        firstOption.focus();
        event.preventDefault();
      }
    } else if (event.key === 'Enter' && inputId) {
      const firstOption = options.querySelector('[role="option"]:not([hidden])');
      if (firstOption) {
        this.selectGemeinde(firstOption.dataset.gemeinde);
        event.preventDefault();
      }
    }
  }

  selectGemeinde(gemeinde) {
    this.currentGemeinde = gemeinde;
    this.closeGemeindePickers();
    this.loadGesuche();
  }

  changeMapLayer(layer) {
    if (!this.mapLayers[layer]) {
      this.showError(`Unbekannter Kartenlayer: ${layer}`);
      return;
    }

    this.currentLayer = layer;
    if (this.map) {
      this.map.once('style.load', () => {
        this.setupMapControls();
        this.setupMapClickHandlers();
        this.addAllMarkers();
      });
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
      this.showingUnlocated = false;

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
      this.map.moveLayer('gesuche-layer');

      const unlocatedCount = this.gesuche.filter(f => !f.geometry).length;
      this.updateNotificationBadge(unlocatedCount);
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }

  updateNotificationBadge(count) {
    [
      ['notification-badge', 'notification-count'],
      ['notification-badge-mobile', 'notification-count-mobile']
    ].forEach(([badgeId, countId]) => {
      const badge = document.getElementById(badgeId);
      const countEl = document.getElementById(countId);
      if (!badge || !countEl) return;

      badge.hidden = count === 0;
      countEl.textContent = count;
    });
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
    const toggleButton = document.getElementById('results-toggle-btn');
    if (panel?.classList.contains('closed')) {
      panel.classList.remove('closed');
      toggleButton?.classList.add('hidden');
      toggleButton?.setAttribute('aria-expanded', 'true');
    } else {
      this.closeResultsPanel();
    }
  }

  closeResultsPanel() {
    const panel = document.getElementById('results-panel');
    panel?.classList.add('closed');
    const toggleButton = document.getElementById('results-toggle-btn');
    toggleButton?.classList.remove('hidden');
    toggleButton?.setAttribute('aria-expanded', 'false');
    if (this.showingUnlocated) this.resetResultsList();
  }

  showUnlocatedGesuche() {
    const unlocated = this.gesuche.filter(f => !f.geometry);
    
    if (unlocated.length === 0) {
      this.showError('Keine nicht zugeordneten Baugesuche gefunden.');
      return;
    }

    this.showingUnlocated = true;
    this.updateResultsList(unlocated);
    document.getElementById('results-panel')?.classList.remove('closed');
    document.getElementById('results-toggle-btn')?.classList.add('hidden');
    document.getElementById('results-toggle-btn')?.setAttribute('aria-expanded', 'true');
  }

  updateResultsList(gesuche = this.gesuche) {
    const count = gesuche.length;
    const countLabel = `${count} Baugesuch${count !== 1 ? 'e' : ''}`;
    document.getElementById('results-count').textContent = countLabel;
    document.getElementById('results-count-mobile').textContent = countLabel;
    document.getElementById('results-reset-mobile').hidden = !this.showingUnlocated;

    ['results-list', 'results-list-mobile'].forEach(listId => {
      const list = document.getElementById(listId);
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
    });
  }

  resetResultsList() {
    this.showingUnlocated = false;
    this.updateResultsList();
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
