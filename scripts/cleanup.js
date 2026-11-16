#!/usr/bin/env node
/**
 * Cleanup script - removes temporary geocoded and raw files
 * Keeps only final baugesuche_*.json files
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

console.log('🧹 Cleaning up temporary files...\n');

const patterns = [
  'gesuche-raw-*.json',
  'gesuche-geocoded-*.json'
];

let deletedCount = 0;

for (const file of fs.readdirSync(DATA_DIR)) {
  const filePath = path.join(DATA_DIR, file);
  
  // Check if file matches temporary patterns
  if (file.startsWith('gesuche-raw-') || file.startsWith('gesuche-geocoded-')) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Error deleting ${file}:`, error.message);
    }
  }
}

console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} temporary files`);
console.log(`   Remaining files: ${fs.readdirSync(DATA_DIR).length}`);
console.log(`\n✨ Final data ready in data/ directory`);
