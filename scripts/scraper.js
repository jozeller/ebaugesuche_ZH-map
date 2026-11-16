const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GEMEINDEN = [
  'adliswil',
  'affolternamalbis',
  'bassersdorf',
  'brütten',
  'bubikon',
  'buchs',
  'bülach',
  'dielsdorf',
  'dietlikon',
  'dübendorf',
  'dürnten',
  'egg',
  'elgg',
  'elsau',
  'fällanden',
  'glattfelden',
  'gossau',
  'greifensee',
  'hettlingen',
  'hinwil',
  'hochfelden',
  'horgen',
  'illnau-effretikon',
  'kilchberg',
  'küsnacht',
  'langnauamalbis',
  'maur',
  'meilen',
  'mönchaltorf',
  'neftenbach',
  'niederglatt',
  'oberglatt',
  'oberrieden',
  'obfelden',
  'oetwilanderlimmat',
  'opfikon',
  'ossingen',
  'pfungen',
  'pfäffikon',
  'rafz',
  'regensdorf',
  'richterswil',
  'russikon',
  'rümlang',
  'schlatt',
  'seegräben',
  'stadel',
  'steinmaur',
  'stäfa',
  'thalwil',
  'turbenthal',
  'uetikonamsee',
  'urdorf',
  'wald',
  'weiningen',
  'weisslingen',
  'wettswilamalbis',
  'wetzikon',
  'wila',
  'winterthur',
  'wädenswil',
  'zell',
  'zollikon',
  'zumikon',
  'zürich'
];

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function scrapeGesuche(gemeinde = 'stäfa') {
  const PORTAL_URL = `https://portal.ebaugesuche.zh.ch/eauflage/${gemeinde}`;
  console.log(`🔄 Starting scraper for ${gemeinde}:`, PORTAL_URL);

  let browser;
  const allGesuche = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    let pageNum = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const url = pageNum === 1 ? PORTAL_URL : `${PORTAL_URL}?page=${pageNum}`;
      console.log(`📄 Scraping page ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for content to load
        await page.waitForSelector('.ebau-gesuch-list, table, .gesuch-item', {
          timeout: 10000
        }).catch(() => {
          console.log('⚠️  Content selector not found, trying alternative selectors');
        });

        // Extract data using multiple possible selectors
        const pageData = await page.evaluate(() => {
          const gesuche = [];
          
          // Try multiple selectors
          const rows = document.querySelectorAll(
            'table tbody tr, .gesuch-row, .gesuch-item, [data-gesuch-id]'
          );

          rows.forEach((row) => {
            try {
              const cells = row.querySelectorAll('td, [data-field]');
              if (cells.length === 0) return;

              // Extract text from cells
              let nummer = '';
              let adresse = '';
              let gemeinde = '';
              let bautyp = '';
              let datum = '';
              let detailLink = '';

              // Try to find link to detail page
              const link = row.querySelector('a[href*="detail"]');
              if (link) {
                detailLink = link.href;
                const match = link.href.match(/\/detail\/(\d+)/);
                if (match) {
                  nummer = match[1];
                }
              }

              // Extract address info from cells
              cells.forEach((cell, idx) => {
                const text = cell.textContent.trim();
                if (idx === 0 && !nummer) nummer = text;
                if (idx === 1) adresse = text;
                if (idx === 2) gemeinde = text;
                if (idx === 3) bautyp = text;
                if (idx === 4) datum = text;
              });

              if (nummer || adresse) {
                gesuche.push({
                  nummer: nummer || '',
                  adresse: adresse || '',
                  gemeinde: gemeinde || 'Stäfa',
                  bautyp: bautyp || '',
                  datum: datum || '',
                  detailUrl: detailLink || ''
                });
              }
            } catch (err) {
              console.error('Error parsing row:', err.message);
            }
          });

          return gesuche;
        });

        console.log(`✅ Found ${pageData.length} entries on page ${pageNum}`);
        allGesuche.push(...pageData);

        // Check for next page
        const nextPageExists = await page.evaluate(() => {
          // Look for "next" button or pagination
          const nextBtn = document.querySelector(
            'a[rel="next"], .pagination .next, button:contains("Next")'
          );
          return nextBtn !== null;
        });

        hasMorePages = nextPageExists && allGesuche.length < 1000; // Safety limit
        pageNum++;

      } catch (error) {
        console.error(`❌ Error on page ${pageNum}:`, error.message);
        hasMorePages = false;
      }
    }

    await browser.close();

    // Save raw scraped data (per Gemeinde)
    const outputPath = path.join(DATA_DIR, `gesuche-raw-${gemeinde}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(allGesuche, null, 2));
    console.log(`\n✅ Scraped ${allGesuche.length} Baugesuche for ${gemeinde}`);
    console.log(`📁 Saved to: ${outputPath}`);

    return allGesuche;

  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    for (const gemeinde of GEMEINDEN) {
      try {
        await scrapeGesuche(gemeinde);
      } catch (error) {
        console.error(`❌ Failed to scrape ${gemeinde}:`, error.message);
      }
    }
    console.log('\n✅ All Gemeinden scraped!');
  })();
}

module.exports = { scrapeGesuche };
