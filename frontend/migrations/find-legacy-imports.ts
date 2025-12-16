/**
 * Detect legacy imports still referencing old paths post-refactor.
 * Usage: Scan all .ts/.tsx files and flag any imports using deprecated old paths.
 * 
 * Exit code: 0 if no legacy imports found, 1 if any are found.
 */

import fs from 'fs'
import path from 'path'

const MAPPING_FILE = path.join(__dirname, 'frontend-path-mapping.csv')
const FRONTEND_ROOT = path.join(__dirname, '..')

// Parse CSV mapping to extract old paths
function getOldPaths(): Set<string> {
  const oldPaths = new Set<string>()
  const content = fs.readFileSync(MAPPING_FILE, 'utf-8')
  const lines = content.trim().split('\n').slice(1) // Skip header
  
  lines.forEach(line => {
    const [oldPath] = line.split(',').map(s => s.trim())
    if (oldPath) {
      oldPaths.add(oldPath.replace(/\.tsx?$/, '').replace(/^frontend\//, '@/'))
    }
  })
  
  return oldPaths
}

// Scan a file for legacy imports
function findLegacyImports(filePath: string, oldPaths: Set<string>): string[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const matches: string[] = []
  
  oldPaths.forEach(oldPath => {
    const pattern = new RegExp(`from ['"]${oldPath}['"]`, 'g')
    let match
    while ((match = pattern.exec(content)) !== null) {
      matches.push(oldPath)
    }
  })
  
  return matches
}

// Walk files and collect legacy import reports
function scanAllFiles(oldPaths: Set<string>): Map<string, string[]> {
  const results = new Map<string, string[]>()
  const extensions = ['.ts', '.tsx']
  
  function walkDir(dir: string) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      // Skip node_modules, .next, migrations
      if (file.startsWith('.') || ['node_modules', '.next', 'migrations'].includes(file)) {
        return
      }
      
      if (stat.isDirectory()) {
        walkDir(filePath)
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const legacyImports = findLegacyImports(filePath, oldPaths)
        if (legacyImports.length > 0) {
          const relPath = path.relative(FRONTEND_ROOT, filePath)
          results.set(relPath, legacyImports)
        }
      }
    })
  }
  
  walkDir(FRONTEND_ROOT)
  return results
}

// Main
async function main() {
  console.log('Parsing old paths from mapping file:', MAPPING_FILE)
  const oldPaths = getOldPaths()
  console.log(`Checking for ${oldPaths.size} old paths\n`)
  
  console.log('Scanning all .ts/.tsx files for legacy imports...')
  const results = scanAllFiles(oldPaths)
  
  if (results.size === 0) {
    console.log('✓ No legacy imports found')
    process.exit(0)
  }
  
  console.log(`\n✗ Found legacy imports in ${results.size} file(s):\n`)
  results.forEach((imports, filePath) => {
    console.log(`  ${filePath}`)
    imports.forEach(imp => {
      console.log(`    - from '${imp}'`)
    })
  })
  
  process.exit(1)
}

main().catch(err => {
  console.error('Scan failed:', err)
  process.exit(1)
})
