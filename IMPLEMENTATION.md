# GUI Redesign - Implementierungs-Übersicht

## 📐 Komponenten-Struktur

```
┌─────────────────────────────────────────────────────────────────┐
│                           HEADER (64px)                          │
│  Logo  │ Info Button │ Notifications │ Portal │ GitHub │ Menu☰ │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────┬─────────────────────────────────┬──────────────┐
│                  │                                 │              │
│    SIDEBAR       │         MAP CONTAINER           │   RESULTS    │
│   (280px)        │        (100% × 100%)            │  PANEL       │
│                  │                                 │  (320px)     │
│ • Gemeinde       │      🗺️ MapLibre GL Map        │              │
│ • Kartenlayer    │                                 │  📍 Marker   │
│ • Filter Apply   │      📍 📍 📍 📍                │   List       │
│                  │      📍    📍  📍  📍             │              │
└──────────────────┴─────────────────────────────────┴──────────────┘

MODAL (bei Klick auf Marker/Result):
┌──────────────────────────────────┐
│ Detail  [X]                      │
├──────────────────────────────────┤
│                                  │
│ 🔵 Gemeinde-Badge                │
│                                  │
│ 📍 Adresse                       │
│ Feldstrasse 63, 8180 Bülach      │
│                                  │
│ 🏢 Projekt                       │
│ Einbau Klimaanlage...            │
│                                  │
│ 📅 Datum                         │
│ 2026-11-20                       │
│                                  │
│ [→ Details im Portal]            │
└──────────────────────────────────┘
```

## 📱 Mobile Layout (< 640px)

```
┌──────────────────────┐
│  Logo   ☰ [!] 9 Portal
├──────────────────────┤
│                      │
│    🗺️ MAP (100%)     │
│                      │
│    📍 📍 📍           │
│    📍  📍  📍         │
│                      │
└──────────────────────┘

Drawer (Slide-in von links):
┌─────────────┐
│ ☰ Menu      │
│             │
│ Gemeinde▼   │
│ Kartenlayer │
│             │
│ [Filter]    │
└─────────────┘

Results Panel (Slide-in von unten/rechts):
┌──────────────────────┐
│ 9 Baugesuche         │
├──────────────────────┤
│ 📍 Feldstr. 63...    │
│    Bülach            │
│    → Zum Baugesuch   │
├──────────────────────┤
│ 📍 Rohrwis/Userriet  │
│    Fällanden         │
│    → Zum Baugesuch   │
└──────────────────────┘
```

## 🎨 Design System

### Farben
```
Primary:        #E8A43E (Orange)
Secondary:      #2D7CB9 (Blau)
Text:           #2C3E50 (Dark)
Background:     #FFFFFF (Weiß)
Border:         #E0E6ED (Light Gray)

Dark Mode:
Text:           #F5F5F5
Background:     #1A1A1A
```

### Spacing (8px Grid)
```
xs: 4px   | sm: 8px   | md: 16px  | lg: 24px  | xl: 32px
```

### Responsive Breakpoints
```
Mobile:    < 640px
Tablet:    640px - 1024px
Desktop:   > 1024px
```

## 🔄 Datenfluss

```
1. App Init
   ↓
2. Load Gemeinden (gemeinden.json)
   ↓
3. Populate Selects
   ↓
4. Load Baugesuche (baugesuche_*.json)
   ↓
5. Add Markers to Map
   ↓
6. Update Results List
   ↓
7. Ready for Interaction
   ↓
   User klickt Marker/Result
   ↓
8. Show Detail Modal
   ↓
9. User schließt Modal (ESC oder X)
   ↓
10. Back to Step 7
```

## 📦 Datei-Struktur

```
frontend/
├── index.html          (Semantic HTML structure)
├── styles.css          (Design tokens + responsive CSS)
└── app.js              (Application logic)

Root (served von server):
├── index.html          (Original - nicht geändert)
├── styles.css          (Kopie)
├── app.js              (Kopie)
└── index-new.html      (Neue Version zum Vergleich)

data/
├── gemeinden.json      (Gemeindeliste)
├── baugesuche_xxxx.json (Pro Gemeinde)
└── ...
```

## 🔗 Abhängigkeiten

### External Libraries
- **MapLibre GL 3.6.2** - Kartendarstellung
- **Vanilla JS** - Keine Framework-Dependencies!

### Browser Support
- Chrome/Edge (latest 2)
- Firefox (latest 2)
- Safari (latest 2)
- Chrome Android (latest)
- Safari iOS (latest)

## 🎯 Key Features

✅ **Responsive** - Works on all devices
✅ **Dark Mode** - Automatic via system preference
✅ **Accessible** - WCAG 2.1 AA ready
✅ **Performance** - Optimized MapLibre rendering
✅ **Mobile-First** - Desktop enhancement not Mobile degradation
✅ **Keyboard Nav** - Full ESC, Tab support
✅ **Touch-Friendly** - Large tap targets (44px min)

## 🚀 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ✅ |
| FID (First Input Delay) | < 100ms | ✅ |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ |
| Lighthouse Performance | > 85 | 🧪 Testing |
| Bundle Size | < 50KB (JS+CSS) | ✅ |

## 🔐 Security

- No external CSS frameworks (Tailwind, Bootstrap)
- Sanitized user inputs
- CSP-ready structure
- CORS headers on server

## 🧪 Testing

Branch: `feature/gui-redesign`  
Live: http://localhost:8080  
See TESTING.md for detailed test checklist
