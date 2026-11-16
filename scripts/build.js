const { buildAll, buildGemeinde } = require('./build-optimized');

if (require.main === module) {
  const requested = process.argv.slice(2);
  const knownGemeinden = require('../data/gemeinden.json').map(({ slug }) => slug);
  const unknown = requested.filter(gemeinde => !knownGemeinden.includes(gemeinde));

  if (unknown.length) {
    console.error(`Unknown Gemeinde(s): ${unknown.join(', ')}`);
    process.exitCode = 1;
  } else {
    const build = requested.length
      ? Promise.all(requested.map(buildGemeinde))
      : buildAll();
    build.catch(error => {
      console.error('❌ Build failed:', error.message);
      process.exitCode = 1;
    });
  }
}

module.exports = { buildAll, buildGemeinde };
