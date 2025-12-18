/**
 * Codemod: Rewrite imports from old to new paths post-refactor.
 * Usage: Parses the mapping CSV and applies replacements to src files.
 * 
 * Example:
 * - Old: import { useAdminPanel } from '@/hooks/useAdminPanel'
 * - New: import { useAdminPanel } from '@/domains/admin'
 */

const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, 'frontend-path-mapping.csv');
const FRONTEND_ROOT = path.join(__dirname, '..');

// Parse CSV mapping (old_path,new_path)
function parseMapping() {
  const mapping = new Map();
  const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
  const lines = content.trim().split('\n').slice(1); // Skip header
  
  lines.forEach(line => {
    const [oldPath, newPath] = line.split(',').map(s => s.trim());
    if (oldPath && newPath) {
      mapping.set(oldPath, newPath);
    }
  });
  
  return mapping;
}

// Convert file paths to import paths (strip extensions, handle barrels)
function toImportPath(filePath) {
  return filePath
    .replace(/\.tsx?$/, '') // Remove extension
    .replace(/\/index$/, '') // index.ts -> folder
    .replace(/^frontend\//, '@/'); // frontend/ -> @/
}

// Apply mapping to a source file's imports
function rewriteImports(filePath, mapping) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  mapping.forEach((newPath, oldPath) => {
    const oldImport = toImportPath(oldPath);
    const newImport = toImportPath(newPath);
    
    // Match import statements (both single and double quotes)
    const pattern = new RegExp(
      `from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
      'g'
    );
    
    if (pattern.test(content)) {
      console.log(`  Rewriting: ${oldImport} → ${newImport} in ${path.relative(FRONTEND_ROOT, filePath)}`);
      content = content.replace(pattern, `from '${newImport}'`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return content;
}

// Find all .ts/.tsx files and apply rewrites
function findAndRewriteFiles(mapping) {
  const extensions = ['.ts', '.tsx'];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip node_modules, .next, migrations, __tests__
      if (file.startsWith('.') || ['node_modules', '.next', 'migrations', '__tests__', '.next'].includes(file)) {
        return;
      }
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        rewriteImports(filePath, mapping);
      }
    });
  }
  
  walkDir(FRONTEND_ROOT);
}

// Main
async function main() {
  console.log('Parsing mapping file:', MAPPING_FILE);
  const mapping = parseMapping();
  console.log(`Loaded ${mapping.size} path mappings\n`);
  
  console.log('Rewriting imports in all .ts/.tsx files...');
  findAndRewriteFiles(mapping);
  
  console.log('\nCodemod complete!');
}

main().catch(err => {
  console.error('Codemod failed:', err);
  process.exit(1);
});
