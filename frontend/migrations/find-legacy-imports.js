/**
 * Detect legacy imports still referencing old paths post-refactor.
 * Usage: Scan all .ts/.tsx files and flag any imports using deprecated old paths.
 * 
 * Exit code: 0 if no legacy imports found, 1 if any are found.
 */

const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, 'frontend-path-mapping.csv');
const FRONTEND_ROOT = path.join(__dirname, '..');

// Parse CSV mapping to extract old paths
function getOldPaths() {
  const oldPaths = new Set();
  const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
  const lines = content.trim().split('\n').slice(1); // Skip header
  
  lines.forEach(line => {
    const [oldPath] = line.split(',').map(s => s.trim());
    if (oldPath) {
      oldPaths.add(oldPath.replace(/\.tsx?$/, '').replace(/^frontend\//, '@/'));
    }
  });
  
  return oldPaths;
}

// Scan a file for legacy imports
function findLegacyImports(filePath, oldPaths) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = [];
  
  oldPaths.forEach(oldPath => {
    const pattern = new RegExp(`from ['"]${oldPath}['"]`, 'g');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push(oldPath);
    }
  });
  
  return matches;
}

// Walk files and collect legacy import reports
function scanAllFiles(oldPaths) {
  const results = new Map();
  const extensions = ['.ts', '.tsx'];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip node_modules, .next, migrations, __tests__
      if (file.startsWith('.') || ['node_modules', '.next', 'migrations'].includes(file)) {
        return;
      }
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const legacyImports = findLegacyImports(filePath, oldPaths);
        if (legacyImports.length > 0) {
          results.set(path.relative(FRONTEND_ROOT, filePath), legacyImports);
        }
      }
    });
  }
  
  walkDir(FRONTEND_ROOT);
  return results;
}

// Main
function main() {
  console.log('Scanning for legacy imports...\n');
  const oldPaths = getOldPaths();
  console.log(`Checking against ${oldPaths.size} old paths from mapping...\n`);
  
  const results = scanAllFiles(oldPaths);
  
  if (results.size === 0) {
    console.log('✅ No legacy imports detected! Migration is clean.\n');
    return 0;
  }
  
  console.log(`❌ Found ${results.size} files with legacy imports:\n`);
  results.forEach((imports, filePath) => {
    console.log(`  ${filePath}`);
    imports.forEach(imp => {
      console.log(`    - ${imp}`);
    });
  });
  
  console.log('\n⚠️  Legacy imports detected. Update to use new path aliases.\n');
  return 1;
}

const exitCode = main();
process.exit(exitCode);
