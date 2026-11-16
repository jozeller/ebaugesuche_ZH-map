# 🚀 Deployment Guide

## Option 1: GitHub Pages (Recommended ⭐)

### Prerequisites
- GitHub repository
- GitHub Actions enabled (default)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` + `/(root)`
   - Save

3. **GitHub Actions Setup**
   - Workflow already configured in `.github/workflows/daily-update.yml`
   - Runs automatically daily at 06:00 UTC
   - Can also manually trigger from Actions tab

4. **Access your site**
   - URL: `https://<username>.github.io/ebaugesuche_ZH-map`
   - Or set custom domain in Settings → Pages

---

## Option 2: Vercel (Fast ⚡)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository

### Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

2. **Configure Build**
   - Framework Preset: None
   - Build Command: `npm run update`
   - Output Directory: `frontend`

3. **Environment Setup (Optional)**
   - No env vars needed for basic setup

4. **Automatic Deployment**
   - Every push to main triggers rebuild
   - For daily updates, use Vercel Cron or GitHub Actions

5. **Custom Domain (Optional)**
   - Settings → Domains
   - Add your domain

---

## Option 3: Netlify

### Prerequisites
- Netlify account
- GitHub repository

### Steps

1. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and choose repository

2. **Configure Build**
   - Build command: `npm run update`
   - Publish directory: `frontend`
   - Save and deploy

3. **Scheduled Functions (for daily updates)**
   - Add `netlify.toml` to enable scheduled functions:
   ```toml
   [build]
   command = "npm run update"
   publish = "frontend"
   
   [functions]
   directory = "netlify/functions"
   ```

---

## Option 4: Self-Hosted (VPS/Server)

### Prerequisites
- Server with Node.js 18+
- SSH access
- Domain name (optional)

### Steps

1. **Setup Server**
   ```bash
   # SSH into server
   ssh user@server.com
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clone repo
   git clone https://github.com/jozeller/ebaugesuche_ZH-map.git
   cd ebaugesuche_ZH-map
   npm install
   ```

2. **Setup Daily Cron Job**
   ```bash
   crontab -e
   
   # Add this line (runs daily at 8:00 AM):
   0 8 * * * cd /path/to/ebaugesuche_ZH-map && npm run update && git push
   ```

3. **Run Web Server**
   ```bash
   # Option A: Using PM2 (recommended for production)
   npm install -g pm2
   pm2 start scripts/server.js --name "baugesuche-map"
   pm2 startup
   pm2 save
   
   # Option B: Using systemd service
   sudo nano /etc/systemd/system/baugesuche-map.service
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
     listen 80;
     server_name example.com;

     location / {
       proxy_pass http://localhost:8080;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

5. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com
   ```

---

## Option 5: Docker

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
```

### Build & Run

```bash
# Build image
docker build -t ebaugesuche-map .

# Run container
docker run -p 8080:8080 ebaugesuche-map

# Or with Docker Compose
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    restart: always
    environment:
      - PORT=8080
```

---

## Performance Optimization

### 1. CDN Setup
- Use CloudFlare for free CDN + DDoS protection
- Cache static files with long TTL
- Cache `/data/baugesuche.json` with shorter TTL (1 hour)

### 2. Image Optimization
- SwissTopo tiles are already optimized
- Mapbox GL handles lazy loading

### 3. Database (Optional, for future)
- Consider Supabase or Firebase for real-time updates
- Cache geospatial queries

---

## Monitoring & Alerting

### GitHub Actions
- Check workflow runs in Actions tab
- Get email notifications on failures

### Sentry (Error Tracking)
```bash
npm install --save @sentry/node
```

Configure in `build.js` for error reporting.

### Uptime Monitoring
- Use UptimeRobot, StatusPage, or Pingdom
- Monitor `https://your-domain.com/data/baugesuche.json`

---

## Troubleshooting

### Build Fails in GitHub Actions
- Check logs in Actions tab
- Ensure Puppeteer has required dependencies
- Increase timeout in workflow (currently 30min)

### Geocoding is Slow
- Reduce batch size or increase delay between requests
- Consider caching previous results

### Tiles Don't Load
- Check SwissTopo tile URL (may change)
- Fallback to OpenStreetMap in code

### CORS Issues
- Server adds CORS headers by default
- For production, configure properly in `server.js`

---

## Next Steps

1. ✅ Deploy frontend to GitHub Pages
2. ✅ Run GitHub Actions to update data
3. 🔄 Monitor first few updates
4. 📊 Add analytics (Google Analytics, Plausible)
5. 🌍 Expand to other Gemeinden

---

**Questions?** Check logs or open an issue!
