#!/usr/bin/env node

/**
 * Theme Token Verification Script
 * 
 * This script scans all SCSS files to find hard-coded colors
 * and ensures all components use the centralized theme tokens.
 * 
 * Usage: node verify-theme-tokens.js
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect hard-coded colors
const COLOR_PATTERNS = [
  // Hex colors
  /#[0-9a-fA-F]{3,8}\b/g,
  // RGB/RGBA
  /rgba?\([^)]+\)/g,
  // HSL/HSLA
  /hsla?\([^)]+\)/g,
  // Named colors (common ones)
  /\b(white|black|red|blue|green|yellow|purple|orange|pink|gray|grey)\b/gi
];

// Allowed exceptions (these are OK to have)
const ALLOWED_EXCEPTIONS = [
  '#fff',
  '#ffffff',
  '#000',
  '#000000',
  'transparent',
  'currentColor',
  'inherit',
  'initial',
  'unset',
  // Allowed in specific contexts
  'rgba(0, 0, 0,',
  'rgba(255, 255, 255,',
  'color-mix(',
  // Comments
  '//',
  '/*',
  '*/'
];

// Files to skip
const SKIP_FILES = [
  '_tokens.scss',
  'light.scss',
  'dark.scss',
  '_backgrounds.scss',
  'verify-theme-tokens.js'
];

const issues = [];
let filesScanned = 0;
let filesWithIssues = 0;

/**
 * Check if a line contains an allowed exception
 */
function isAllowedException(line) {
  return ALLOWED_EXCEPTIONS.some(exception => 
    line.toLowerCase().includes(exception.toLowerCase())
  );
}

/**
 * Check if a line is a comment
 */
function isComment(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || 
         trimmed.startsWith('/*') || 
         trimmed.startsWith('*');
}

/**
 * Scan a file for hard-coded colors
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];

  lines.forEach((line, index) => {
    // Skip comments
    if (isComment(line)) return;
    
    // Check each color pattern
    COLOR_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's an allowed exception
          if (isAllowedException(line)) return;
          
          // Skip if it's in a var() or uses a token
          if (line.includes('var(--') || line.includes('$')) return;
          
          fileIssues.push({
            line: index + 1,
            content: line.trim(),
            match: match
          });
        });
      }
    });
  });

  if (fileIssues.length > 0) {
    filesWithIssues++;
    issues.push({
      file: filePath,
      issues: fileIssues
    });
  }
}

/**
 * Recursively scan directory for SCSS files
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (entry.name === 'node_modules' || entry.name === 'build') return;
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.scss')) {
      // Skip allowed files
      if (SKIP_FILES.some(skip => entry.name.includes(skip))) return;
      
      filesScanned++;
      scanFile(fullPath);
    }
  });
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n='.repeat(70));
  console.log('THEME TOKEN VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`\nFiles scanned: ${filesScanned}`);
  console.log(`Files with issues: ${filesWithIssues}`);
  console.log(`Total issues found: ${issues.reduce((sum, f) => sum + f.issues.length, 0)}`);

  if (issues.length === 0) {
    console.log('\n✅ SUCCESS! All files use theme tokens correctly.');
    console.log('\nNo hard-coded colors found. The theme system is properly implemented.');
    return true;
  }

  console.log('\n⚠️  ISSUES FOUND\n');
  console.log('The following files contain hard-coded colors:');
  console.log('Please replace them with theme tokens from _tokens.scss\n');

  issues.forEach(({ file, issues: fileIssues }) => {
    console.log(`\n📄 ${file}`);
    console.log('-'.repeat(70));
    
    fileIssues.forEach(({ line, content, match }) => {
      console.log(`  Line ${line}: ${match}`);
      console.log(`    ${content}`);
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));
  console.log(`
Replace hard-coded colors with theme tokens:

  ❌ background: #ffffff;
  ✅ background: var(--surface-1);

  ❌ color: #000000;
  ✅ color: var(--on-surface-1);

  ❌ border: 1px solid #e5e7eb;
  ✅ border: 1px solid var(--border-soft);

See THEME_SYSTEM_UNIFIED.md for complete token reference.
`);

  return false;
}

// Run the scan
console.log('Scanning SCSS files for hard-coded colors...\n');

const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  scanDirectory(srcDir);
} else {
  console.error('Error: src directory not found');
  process.exit(1);
}

const success = generateReport();
process.exit(success ? 0 : 1);
