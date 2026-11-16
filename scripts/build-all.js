const { buildAll, buildGemeinde } = require('./build-optimized');

if (require.main === module) {
  buildAll().catch(error => {
    console.error('❌ Build failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildAll, buildGemeinde };
