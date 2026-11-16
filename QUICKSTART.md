# 🚀 Quick Start Guide

## What you've got

✅ **Complete Baugesuche Map Application**

```
Frontend:          Interactive Mapbox GL map with Swiss topo tiles
Scraper:           Puppeteer-based web scraper for ebaugesuche.zh.ch
Geocoding:         OSM Nominatim address → coordinates
Build Pipeline:    Automated scrape → geocode → compile
CI/CD:             GitHub Actions (daily updates)
Deployment:        Ready for GitHub Pages, Vercel, Netlify, or self-hosted
```

---

## 🎯 Next Steps

### 1. **Enable GitHub Pages** (5 min)

```bash
# In your GitHub repo:
Settings → Pages
├─ Source: Deploy from a branch
├─ Branch: main + /(root)
└─ Save

# Your site will be live at:
# https://jozeller.github.io/ebaugesuche_ZH-map
```

### 2. **Test Locally** (2 min)

```bash
npm install        # Already done
npm run dev        # Start server on localhost:8080

# Open http://localhost:8080 in browser
# You'll see sample data loaded on map
```

### 3. **Run First Full Build** (10-15 min)

```bash
npm run build

# This will:
# 1. Scrape ebaugesuche.zh.ch portal (Puppeteer)
# 2. Geocode addresses with OSM (takes time, rate-limited)
# 3. Generate data/baugesuche.json
# 4. Commit & push changes

npm run dev        # See live data
```

### 4. **Automate Daily Updates** (✅ Already configured!)

- GitHub Actions runs daily at **06:00 UTC** (08:00 CEST)
- Automatically scrapes, geocodes, and commits new data
- Can manually trigger from Actions tab anytime
- Workflow file: `.github/workflows/daily-update.yml`

---

## 📊 Workflow

```
┌─────────────────────────────────────────┐
│  GitHub Actions (Daily or Manual)       │
│  .github/workflows/daily-update.yml     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  npm run update                         │
│  (= npm run build)                      │
└─────────────────────────────────────────┘
           ↓
    ┌──────┴──────────────────┬─────────────┐
    ↓                         ↓             ↓
┌─────────────┐      ┌──────────────┐   ┌─────────────────┐
│   Scraper   │      │   Geocoder   │   │   Builder       │
│  (Puppeteer)│      │ (OSM Nominat)│   │ (GeoJSON gen)   │
└─────────────┘      └──────────────┘   └─────────────────┘
    ↓                 ↓                   ↓
 gesuche-raw.json  geocoded.json   baugesuche.json
                                        ↓
                                  ┌─────────────────┐
                                  │  Frontend       │
                                  │ (Mapbox GL)     │
                                  │ Gets data from: │
                                  │ /data/bau...json│
                                  └─────────────────┘
                                        ↓
                                   🗺️  Map with
                                       markers
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/index.html` | Main interactive map (Mapbox GL + SwissTopo) |
| `scripts/scraper.js` | Scrapes baugesuche.zh.ch portal |
| `scripts/geocoder.js` | Converts addresses to coordinates |
| `scripts/build.js` | Orchestrates entire pipeline |
| `data/baugesuche.json` | Final GeoJSON (served to frontend) |
| `.github/workflows/daily-update.yml` | GitHub Actions automation |

---

## 🔍 Testing Checklist

- [ ] Clone repo + npm install
- [ ] `npm run dev` → Server starts
- [ ] Visit http://localhost:8080 → Map loads
- [ ] Click marker → Popup appears
- [ ] Click marker → Sidebar shows details
- [ ] "📍 Mein Standort" → Geolocation works
- [ ] "🔄 Aktualisieren" → Data refreshes
- [ ] Mobile view (F12) → Responsive
- [ ] No console errors (F12 → Console)

---

## 🚀 Deployment Options

### **Option A: GitHub Pages** (Free ⭐ Recommended)
```bash
# Just enable in Settings → Pages
# Site auto-deploys on every push
# No extra cost
# URL: https://jozeller.github.io/ebaugesuche_ZH-map
```

### **Option B: Vercel** (Fast ⚡)
- Connect GitHub repo to vercel.com
- Auto-deploy on every push
- Free tier available
- Custom domain support

### **Option C: Netlify** (Easy)
- Connect GitHub repo to netlify.com
- Auto-deploy, scheduled functions
- Free tier

### **Option D: Self-Hosted** (Full control)
- VPS + Node.js + Nginx
- See `DEPLOYMENT.md` for detailed guide

---

## 🔧 Customization

### Change Scrape Target
```javascript
// scripts/scraper.js line 7
const PORTAL_URL = 'https://portal.ebaugesuche.zh.ch/eauflage/different-town';
```

### Modify Map Style
```javascript
// frontend/index.html line 180
// Change tile provider, colors, controls
```

### Add More Fields to Display
```javascript
// Add to properties in scripts/build.js
// Display in frontend/index.html
```

### Expand to Multiple Gemeinden
```javascript
// Modify scraper to loop through multiple URLs
// Geocode and combine results
// See DEVELOPMENT.md for details
```

---

## 📚 Documentation

- **README.md** - Project overview
- **DEPLOYMENT.md** - Detailed deployment guide (5+ options)
- **DEVELOPMENT.md** - Development workflow & debugging
- **GitHub Issues** - For bugs & feature requests

---

## 🐛 Troubleshooting

### "Server won't start"
```bash
# Make sure no other process uses port 8080
lsof -i :8080
# Kill it if needed: kill -9 <PID>
```

### "Build fails during scraping"
- Portal might be temporarily down
- Check internet connection
- Try again later
- See DEVELOPMENT.md for debugging

### "Map doesn't load"
- Check browser console (F12)
- Ensure data/baugesuche.json exists
- Try sample data: already included!

### "No markers appear"
- Check that coordinates are valid (lat ~47.2, lon ~8.6)
- Open F12 Console → check for geocoding errors
- See DEVELOPMENT.md for debugging

---

## 📞 Support

1. **Check documentation** → README.md, DEPLOYMENT.md, DEVELOPMENT.md
2. **View browser console** → F12 → Console tab
3. **Check GitHub Actions logs** → Actions tab → workflow run
4. **Open GitHub Issue** → Include error message & steps to reproduce

---

## ✨ What's Working

✅ Scraper (Puppeteer) - Extracts baugesuche data  
✅ Geocoder (OSM Nominatim) - Gets coordinates  
✅ Frontend Map (Mapbox GL) - Displays markers  
✅ Tooltips & Sidebar - Shows details  
✅ Links - Opens detail pages  
✅ Geolocation - "My Location" button  
✅ GitHub Actions - Daily automation  
✅ Sample data - For testing  
✅ Dev server - Local testing  
✅ Documentation - Complete guides  

---

## 🎯 Future Enhancements

- [ ] Expand to all ZH Gemeinden
- [ ] Add filters (date range, building type)
- [ ] Add statistics dashboard
- [ ] Search by address
- [ ] Export to CSV/GeoJSON
- [ ] Real-time updates (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Dark mode theme
- [ ] Analytics (view counts)
- [ ] Notifications (new baugesuche nearby)

---

## 🚀 You're all set!

**Next:** 
1. Enable GitHub Pages
2. Run `npm run build` to get real data
3. Share the link! 🎉

---

**Questions?** Check the docs or create an issue! 😊
