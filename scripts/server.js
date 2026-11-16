#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');
const DATA_DIR = path.join(__dirname, '..', 'data');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch (error) {
    res.writeHead(400);
    res.end('Invalid URL path');
    return;
  }

  // Handle root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle data requests
  if (pathname.startsWith('/data/')) {
    const filename = path.basename(pathname);
    const filepath = path.join(DATA_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
      return;
    }
  }

  // Handle static files
  let filepath = path.join(PUBLIC_DIR, pathname);

  // Security: prevent directory traversal
  if (!filepath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try exact file
  if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
    const ext = path.extname(filepath);
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filepath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return;
  }

  // Not found
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log(`📂 Serving from: ${PUBLIC_DIR}`);
  console.log(`📊 Data from: ${DATA_DIR}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Server stopped');
  process.exit(0);
});
